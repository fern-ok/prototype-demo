import type { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';
import { IncomingMessage } from 'http';
import formidable from 'formidable';
import extractZip from 'extract-zip';
import archiver from 'archiver';
import { allowedItemKeysByTab, scanEntries, type SidebarTreeTab } from './utils/entryScanner';
import { createSidebarTreeStore, type SidebarTreeNode, type ResourceOrderType } from './utils/sidebarTreeStore';
import { buildAttachmentContentDisposition } from './utils/contentDisposition';
import { ensureTemplatesDirMigrated, getTemplatesDir } from './utils/docUtils';
import { getInstallSkillTargetDir } from './utils/installSkillTargets';
import { runCommand, runCommandSync } from '../scripts/utils/command-runtime.mjs';

/**
 * 递归复制目录（用于 Windows 权限问题的备用方案）
 * 
 * 当 fs.renameSync() 因权限问题失败时（EPERM 错误），使用此函数作为 fallback。
 * 
 * 为什么 copy 比 rename 更可靠？
 * - rename：只修改文件系统元数据（inode），对权限和文件占用非常敏感
 * - copy：实际读取和写入数据，只要文件可读就能复制，绕过了很多权限限制
 * 
 * 常见触发场景：
 * - Windows 杀毒软件扫描导致文件被锁定
 * - 跨驱动器移动文件（rename 不支持）
 * - 文件索引服务占用文件句柄
 * - 路径包含中文字符导致的编码问题
 * 
 * @param src - 源目录路径
 * @param dest - 目标目录路径
 */
function copyDirRecursive(src: string, dest: string) {
  // 确保目标目录存在
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // 读取源目录的所有内容
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  // 逐个处理文件和子目录
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // 递归处理子目录
      copyDirRecursive(srcPath, destPath);
    } else {
      // 复制文件
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const IGNORED_EXTRACT_ENTRIES = new Set(['__MACOSX', '.DS_Store']);

function truncateName(name: string, maxLength: number) {
  return name.length > maxLength ? name.slice(0, maxLength) : name;
}

function sanitizeFolderName(name: string) {
  return name
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function buildSafeImportFolderName(
  candidates: Array<string | null | undefined>,
  fallbackPrefix: string,
  maxLength = 60,
) {
  for (const candidate of candidates) {
    const sanitized = truncateName(sanitizeFolderName(String(candidate || '')), maxLength);
    if (sanitized) {
      return sanitized;
    }
  }

  return `${fallbackPrefix}-${Date.now()}`;
}

function isSafeChildDir(baseDir: string, candidateDir: string) {
  const resolvedBaseDir = path.resolve(baseDir);
  const resolvedCandidateDir = path.resolve(candidateDir);
  return resolvedCandidateDir !== resolvedBaseDir
    && resolvedCandidateDir.startsWith(`${resolvedBaseDir}${path.sep}`);
}

function inferExtractedRootFolder(extractDir: string) {
  if (!fs.existsSync(extractDir)) {
    return { entryCount: 0, hasRootFolder: false, rootFolderName: '' };
  }

  const entries = fs
    .readdirSync(extractDir, { withFileTypes: true })
    .filter(entry => !IGNORED_EXTRACT_ENTRIES.has(entry.name));

  if (entries.length === 1 && entries[0].isDirectory()) {
    return { entryCount: entries.length, hasRootFolder: true, rootFolderName: entries[0].name };
  }

  return { entryCount: entries.length, hasRootFolder: false, rootFolderName: '' };
}

function sanitizeRelativePath(input: string) {
  const normalized = input.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(part => part && part !== '.' && part !== '..');
  return parts.join('/');
}

function deriveRootFolderName(paths: string[]) {
  const roots = new Set<string>();
  for (const rawPath of paths) {
    const cleaned = sanitizeRelativePath(rawPath);
    if (!cleaned) continue;
    const [root] = cleaned.split('/');
    if (root) roots.add(root);
  }
  return roots.size === 1 ? Array.from(roots)[0] : '';
}

function hasIgnoredEntry(relativePath: string) {
  return relativePath.split('/').some(segment => IGNORED_EXTRACT_ENTRIES.has(segment));
}

function moveFileWithFallback(srcPath: string, destPath: string) {
  try {
    fs.renameSync(srcPath, destPath);
  } catch {
    fs.copyFileSync(srcPath, destPath);
    fs.unlinkSync(srcPath);
  }
}

const SUPPORTED_UPLOAD_TARGET_TYPES = ['prototypes', 'components', 'themes'] as const;
const THEME_IMPORT_SUPPORTED_UPLOAD_TYPES = new Set(['local_axure', 'v0', 'google_aistudio', 'figma_make']);
const THEME_IMPORT_SUB_SKILL_DOCS = [
  '/skills/axure-prototype-workflow/theme-generation.md',
  '/skills/axure-prototype-workflow/doc-generation.md',
  '/skills/axure-prototype-workflow/data-generation.md',
  '/skills/web-page-workflow/theme-generation.md',
  '/skills/web-page-workflow/doc-generation.md',
  '/skills/web-page-workflow/data-generation.md',
];

function formatReferenceList(referencePaths: string[]) {
  return referencePaths.map((referencePath) => `- \`${referencePath}\``).join('\n');
}

/**
 * 文件系统 API 插件
 * 提供文件和目录的基本操作功能：删除、重命名、复制等
 */
export function fileSystemApiPlugin(): Plugin {
  return {
    name: 'filesystem-api',
    
    configureServer(server) {
      const projectRoot = process.cwd();
      const nodeCommand = process.execPath;
      const entriesPath = path.join(projectRoot, '.axhub', 'make', 'entries.json');
      const configPath = path.join(projectRoot, '.axhub', 'make', 'axhub.config.json');
      const DEFAULT_PROJECT_TITLE = '未命名项目';
      const SIDEBAR_TREE_VERSION = 1;
      const templateMigrationResult = ensureTemplatesDirMigrated(projectRoot);
      if (templateMigrationResult.conflicts.length > 0) {
        console.error(
          '[filesystem-api] Template migration conflicts detected:\n' +
          templateMigrationResult.conflicts
            .map((conflict) => `- ${conflict.relativePath}\n  legacy: ${conflict.legacyPath}\n  target: ${conflict.targetPath}`)
            .join('\n'),
        );
      }
      const sidebarTreeStore = createSidebarTreeStore(projectRoot, {
        version: SIDEBAR_TREE_VERSION,
        legacyEntriesPath: entriesPath,
      });

      const isSidebarTreeTab = (value: string): value is SidebarTreeTab => {
        return value === 'prototypes' || value === 'components' || value === 'docs' || value === 'canvas';
      };

      const getTabFromRequest = (req: any): SidebarTreeTab | null => {
        try {
          const url = new URL(req.url || '/', 'http://localhost');
          const tab = (url.searchParams.get('tab') || '').trim();
          if (!isSidebarTreeTab(tab)) return null;
          return tab;
        } catch {
          return null;
        }
      };

      const toDefaultTreeTitle = (itemKey: string) => {
        const name = itemKey.split('/').pop() || itemKey;
        return name
          .replace(/[-_]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim() || name;
      };

      const sanitizeNodeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-');

      const buildDefaultSidebarTree = (allowedItemKeys: Set<string>): SidebarTreeNode[] => {
        const keys = Array.from(allowedItemKeys).sort((a, b) => a.localeCompare(b));
        return keys.map((itemKey) => ({
          id: `item-${sanitizeNodeId(itemKey)}`,
          kind: 'item' as const,
          title: toDefaultTreeTitle(itemKey),
          itemKey,
        }));
      };

      const normalizeAndValidateSidebarTree = (
        tree: unknown,
        tab: SidebarTreeTab,
        allowedItemKeys: Set<string>,
      ): { valid: true; tree: SidebarTreeNode[] } | { valid: false; error: string } => {
        if (!Array.isArray(tree)) {
          return { valid: false, error: 'tree must be an array' };
        }

        const usedIds = new Set<string>();
        const seenItemKeys = new Set<string>();
        const makeUniqueId = (seed: string) => {
          let candidate = seed;
          let count = 1;
          while (usedIds.has(candidate)) {
            count += 1;
            candidate = `${seed}-${count}`;
          }
          usedIds.add(candidate);
          return candidate;
        };
        const normalizeNodes = (nodes: any[], depth: number): SidebarTreeNode[] | null => {
          if (depth > 32) {
            return null;
          }
          const normalized: SidebarTreeNode[] = [];
          for (const rawNode of nodes) {
            if (!rawNode || typeof rawNode !== 'object') {
              return null;
            }
            const id = typeof rawNode.id === 'string' ? rawNode.id.trim() : '';
            const kind = rawNode.kind;
            const title = typeof rawNode.title === 'string' ? rawNode.title.trim() : '';
            if (!id || !title) return null;
            if (kind !== 'folder' && kind !== 'item') {
              return null;
            }
            const nextId = makeUniqueId(id);

            if (kind === 'item') {
              const itemKey = typeof rawNode.itemKey === 'string' ? rawNode.itemKey.trim() : '';
              if (!itemKey || !itemKey.startsWith(`${tab}/`) || !allowedItemKeys.has(itemKey)) {
                return null;
              }
              if (seenItemKeys.has(itemKey)) {
                continue;
              }
              seenItemKeys.add(itemKey);
              normalized.push({
                id: nextId,
                kind: 'item',
                title,
                itemKey,
              });
              continue;
            }

            const rawChildren = Array.isArray(rawNode.children) ? rawNode.children : [];
            const children = normalizeNodes(rawChildren, depth + 1);
            if (!children) {
              return null;
            }
            const rawItemKey = typeof rawNode.itemKey === 'string' ? rawNode.itemKey.trim() : '';
            const itemKey = rawItemKey && rawItemKey.startsWith(`${tab}/`) && allowedItemKeys.has(rawItemKey)
              ? rawItemKey
              : undefined;
            if (itemKey) {
              seenItemKeys.add(itemKey);
            }
            normalized.push({
              id: nextId,
              kind: 'folder',
              title,
              ...(itemKey ? { itemKey } : {}),
              children,
            });
          }
          return normalized;
        };

        const normalizedTree = normalizeNodes(tree as any[], 0);
        if (!normalizedTree) {
          return { valid: false, error: 'Invalid tree payload' };
        }
        return { valid: true, tree: normalizedTree };
      };

      const reconcileSidebarTree = (
        tree: SidebarTreeNode[],
        tab: SidebarTreeTab,
        allowedItemKeys: Set<string>,
      ): SidebarTreeNode[] => {
        const usedIds = new Set<string>();
        const seenItemKeys = new Set<string>();
        const makeUniqueId = (seed: string) => {
          let candidate = seed;
          let count = 1;
          while (usedIds.has(candidate)) {
            count += 1;
            candidate = `${seed}-${count}`;
          }
          usedIds.add(candidate);
          return candidate;
        };

        const normalizeNodes = (nodes: SidebarTreeNode[], depth: number): SidebarTreeNode[] => {
          if (!Array.isArray(nodes) || depth > 32) return [];
          const result: SidebarTreeNode[] = [];
          for (const rawNode of nodes) {
            if (!rawNode || typeof rawNode !== 'object') continue;
            const title = typeof rawNode.title === 'string' ? rawNode.title.trim() : '';
            if (!title) continue;
            const rawId = typeof rawNode.id === 'string' ? rawNode.id.trim() : '';
            const id = makeUniqueId(rawId || `node-${Date.now()}`);
            if (rawNode.kind === 'item') {
              const itemKey = typeof rawNode.itemKey === 'string' ? rawNode.itemKey.trim() : '';
              if (!itemKey || !itemKey.startsWith(`${tab}/`) || !allowedItemKeys.has(itemKey)) {
                continue;
              }
              if (seenItemKeys.has(itemKey)) {
                continue;
              }
              seenItemKeys.add(itemKey);
              result.push({ id, kind: 'item', title, itemKey });
              continue;
            }
            if (rawNode.kind === 'folder') {
              const children = normalizeNodes(Array.isArray(rawNode.children) ? rawNode.children : [], depth + 1);
              const rawFolderItemKey = typeof rawNode.itemKey === 'string' ? rawNode.itemKey.trim() : '';
              const folderItemKey = rawFolderItemKey
                && rawFolderItemKey.startsWith(`${tab}/`)
                && allowedItemKeys.has(rawFolderItemKey)
                ? rawFolderItemKey
                : undefined;
              const folderNode: SidebarTreeNode = { id, kind: 'folder' as const, title, children };
              if (folderItemKey) {
                seenItemKeys.add(folderItemKey);
                folderNode.itemKey = folderItemKey;
              }
              result.push(folderNode);
            }
          }
          return result;
        };

        const normalizedTree = normalizeNodes(tree, 0);
        const missingItemKeys = Array.from(allowedItemKeys).filter((itemKey) => !seenItemKeys.has(itemKey));
        const nextMissingNodes = missingItemKeys.sort((a, b) => a.localeCompare(b)).map((itemKey) => ({
            id: makeUniqueId(`item-${sanitizeNodeId(itemKey)}`),
            kind: 'item' as const,
            title: toDefaultTreeTitle(itemKey),
            itemKey,
          }));
        return [...nextMissingNodes, ...normalizedTree];
      };

      const collectSidebarTreeIds = (nodes: SidebarTreeNode[]): Set<string> => {
        const ids = new Set<string>();
        const walk = (list: SidebarTreeNode[]) => {
          for (const node of list) {
            if (!node || typeof node !== 'object') continue;
            const id = typeof node.id === 'string' ? node.id.trim() : '';
            if (id) {
              ids.add(id);
            }
            if (Array.isArray(node.children) && node.children.length > 0) {
              walk(node.children);
            }
          }
        };
        walk(nodes);
        return ids;
      };

      const createUniqueFolderNodeId = (existingIds: Set<string>) => {
        let candidate = '';
        do {
          const randomSuffix = Math.random().toString(36).slice(2, 8);
          candidate = `folder-${Date.now()}-${randomSuffix}`;
        } while (existingIds.has(candidate));
        return candidate;
      };

      const createRootFolderTitle = (nodes: SidebarTreeNode[]) => {
        const rootFolderTitles = new Set<string>();
        for (const node of nodes) {
          if (node.kind !== 'folder') continue;
          const title = typeof node.title === 'string' ? node.title.trim() : '';
          if (!title) continue;
          rootFolderTitles.add(title);
        }

        const defaultTitle = '新建文件夹';
        if (!rootFolderTitles.has(defaultTitle)) {
          return defaultTitle;
        }
        let suffix = 2;
        while (rootFolderTitles.has(`${defaultTitle}-${suffix}`)) {
          suffix += 1;
        }
        return `${defaultTitle}-${suffix}`;
      };

      const readProjectTitle = (): string => {
        if (!fs.existsSync(configPath)) {
          return DEFAULT_PROJECT_TITLE;
        }
        try {
          const raw = fs.readFileSync(configPath, 'utf8');
          const parsed = JSON.parse(raw);
          const title = typeof parsed?.projectInfo?.name === 'string' ? parsed.projectInfo.name.trim() : '';
          return title || DEFAULT_PROJECT_TITLE;
        } catch {
          return DEFAULT_PROJECT_TITLE;
        }
      };

      const DOC_EXTENSIONS = new Set(['.md', '.csv', '.json', '.yaml', '.yml', '.txt']);
      const CANVAS_EXT = '.excalidraw';

      const collectDocItemKeys = (): Set<string> => {
        const docsDir = path.join(projectRoot, 'src', 'docs');
        const keys: string[] = [];
        if (!fs.existsSync(docsDir)) {
          return new Set();
        }

        const walk = (currentDir: string) => {
          const entries = fs.readdirSync(currentDir, { withFileTypes: true });
          for (const entry of entries) {
            const absolutePath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
              walk(absolutePath);
              continue;
            }
            if (!entry.isFile()) continue;
            const ext = path.extname(entry.name).toLowerCase();
            if (!DOC_EXTENSIONS.has(ext)) continue;
            const rel = normalizePath(path.relative(docsDir, absolutePath));
            keys.push(`docs/${rel}`);
          }
        };

        walk(docsDir);
        keys.sort((a, b) => a.localeCompare(b));
        return new Set(keys);
      };

      const collectCanvasItemKeys = (): Set<string> => {
        const canvasDir = path.join(projectRoot, 'src', 'canvas');
        const keys: string[] = [];
        if (!fs.existsSync(canvasDir)) {
          return new Set();
        }

        const entries = fs.readdirSync(canvasDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isFile() || !entry.name.endsWith(CANVAS_EXT)) continue;
          keys.push(`canvas/${entry.name}`);
        }

        keys.sort((a, b) => a.localeCompare(b));
        return new Set(keys);
      };

      const resolveAllowedItemKeys = (tab: SidebarTreeTab): Set<string> => {
        if (tab === 'docs') {
          return collectDocItemKeys();
        }
        if (tab === 'canvas') {
          return collectCanvasItemKeys();
        }
        const scanned = scanEntries(projectRoot);
        return allowedItemKeysByTab(scanned.entries.js, tab);
      };

      const isResourceOrderType = (value: string): value is ResourceOrderType => {
        return value === 'themes' || value === 'data' || value === 'templates';
      };

      const getResourceOrderTypeFromRequest = (req: any): ResourceOrderType | null => {
        try {
          const url = new URL(req.url || '/', 'http://localhost');
          const type = (url.searchParams.get('type') || '').trim();
          if (!isResourceOrderType(type)) return null;
          return type;
        } catch {
          return null;
        }
      };

      const collectThemeKeys = (): Set<string> => {
        const themesDir = path.join(projectRoot, 'src', 'themes');
        const keys = new Set<string>();
        if (!fs.existsSync(themesDir)) {
          return keys;
        }
        const entries = fs.readdirSync(themesDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          keys.add(entry.name);
        }
        return keys;
      };

      const collectDataTableKeys = (): Set<string> => {
        const databaseDir = path.join(projectRoot, 'src', 'database');
        const keys = new Set<string>();
        if (!fs.existsSync(databaseDir)) {
          return keys;
        }
        const entries = fs.readdirSync(databaseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
          const fileName = entry.name.replace(/\.json$/i, '');
          if (fileName) {
            keys.add(fileName);
          }
        }
        return keys;
      };

      const resolveAllowedResourceKeys = (type: ResourceOrderType): Set<string> => {
        if (type === 'themes') {
          return collectThemeKeys();
        }
        if (type === 'data') {
          return collectDataTableKeys();
        }
        const templatesDir = getTemplatesDir(projectRoot);
        const keys = new Set<string>();
        if (!fs.existsSync(templatesDir)) {
          return keys;
        }
        const walkTemplatesDir = (dirPath: string) => {
          const entries = fs.readdirSync(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            if (!entry || entry.name.startsWith('.')) continue;
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              walkTemplatesDir(fullPath);
              continue;
            }
            if (!entry.isFile()) continue;
            const relativePath = path.relative(templatesDir, fullPath).split(path.sep).join('/');
            if (relativePath) {
              keys.add(relativePath);
            }
          }
        };
        walkTemplatesDir(templatesDir);
        return keys;
      };

      const reconcileResourceOrder = (order: string[], allowedKeys: Set<string>): string[] => {
        const seen = new Set<string>();
        const nextOrder: string[] = [];

        for (const key of order) {
          if (!allowedKeys.has(key) || seen.has(key)) continue;
          seen.add(key);
          nextOrder.push(key);
        }

        const remaining = Array.from(allowedKeys).filter((key) => !seen.has(key));
        remaining.sort((a, b) => a.localeCompare(b));
        return [...remaining, ...nextOrder];
      };
      
      // Helper function to parse JSON body
      const parseBody = (req: any): Promise<any> => {
        return new Promise((resolve, reject) => {
          let body = '';
          req.on('data', (chunk: any) => body += chunk);
          req.on('end', () => {
            try {
              resolve(body ? JSON.parse(body) : {});
            } catch (e) {
              reject(new Error('Invalid JSON in request body'));
            }
          });
          req.on('error', reject);
        });
      };

      // Helper function to send JSON response
      const sendJSON = (res: any, statusCode: number, data: any) => {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
      };

      const normalizePath = (filePath: string) => filePath.split(path.sep).join('/');

      const isSafeSrcTargetPath = (targetPath: string) => {
        return Boolean(targetPath)
          && !targetPath.includes('..')
          && !targetPath.startsWith('/')
          && !path.isAbsolute(targetPath);
      };

      const countFilesRecursive = (dirPath: string): number => {
        if (!fs.existsSync(dirPath)) {
          return 0;
        }

        let total = 0;
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            total += countFilesRecursive(entryPath);
          } else if (entry.isFile()) {
            total += 1;
          }
        }
        return total;
      };

      const readJsonFileIfExists = (filePath: string) => {
        if (!fs.existsSync(filePath)) {
          return null;
        }
        try {
          return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
          console.warn('[文件系统 API] 读取 JSON 失败:', filePath, error);
          return null;
        }
      };

      const createDefaultMakeMeta = (baseName: string) => ({
        client_meta: {
          background_color: { r: 0.96, g: 0.96, b: 0.96, a: 1 },
          thumbnail_size: { width: 400, height: 300 },
          render_coordinates: { x: 0, y: 0, width: 1280, height: 960 },
        },
        file_name: baseName,
        developer_related_links: [],
        exported_at: new Date().toISOString(),
      });

      const analyzeMakeAssets = (itemDir: string, targetPath: string) => {
        const canvasFigPath = path.join(itemDir, 'canvas.fig');
        const metaJsonPath = path.join(itemDir, 'meta.json');
        const aiChatPath = path.join(itemDir, 'ai_chat.json');
        const thumbnailPath = path.join(itemDir, 'thumbnail.png');
        const manifestPath = path.join(itemDir, 'canvas.code-manifest.json');
        const imagesDir = path.join(itemDir, 'images');
        const rootIndexPath = path.join(itemDir, 'index.tsx');
        const rootStylePath = path.join(itemDir, 'style.css');
        const appTsxPath = path.join(itemDir, 'src', 'App.tsx');
        const indexCssPath = path.join(itemDir, 'src', 'index.css');
        const meta = readJsonFileIfExists(metaJsonPath);
        const baseName = path.basename(targetPath) || 'project';
        const rawFileName = typeof meta?.file_name === 'string' ? meta.file_name.trim() : '';
        const normalizedFileName = rawFileName || baseName;
        const imageCount = countFilesRecursive(imagesDir);
        const driftReasons: string[] = [];

        if (fs.existsSync(rootIndexPath) && fs.existsSync(appTsxPath)) {
          const rootIndexStat = fs.statSync(rootIndexPath);
          const appTsxStat = fs.statSync(appTsxPath);
          if (rootIndexStat.mtimeMs > appTsxStat.mtimeMs + 1000) {
            driftReasons.push('根目录 index.tsx 比 src/App.tsx 更新，Figma 导出壳子可能未同步最新页面逻辑。');
          }
        }

        if (fs.existsSync(rootStylePath) && fs.existsSync(indexCssPath)) {
          const rootStyleStat = fs.statSync(rootStylePath);
          const indexCssStat = fs.statSync(indexCssPath);
          if (rootStyleStat.mtimeMs > indexCssStat.mtimeMs + 1000) {
            driftReasons.push('根目录 style.css 比 src/index.css 更新，Figma 导出壳子的样式可能未同步。');
          }
        }

        return {
          hasCanvasFig: fs.existsSync(canvasFigPath),
          hasMetaJson: fs.existsSync(metaJsonPath),
          hasAiChat: fs.existsSync(aiChatPath),
          hasThumbnail: fs.existsSync(thumbnailPath),
          hasManifest: fs.existsSync(manifestPath),
          hasImagesDir: fs.existsSync(imagesDir),
          imageCount,
          hasMakeAssets: fs.existsSync(canvasFigPath),
          lastExportedAt: typeof meta?.exported_at === 'string' ? meta.exported_at : null,
          fileName: normalizedFileName.endsWith('.fig') ? normalizedFileName : `${normalizedFileName}.fig`,
          hasDriftRisk: driftReasons.length > 0,
          driftReasons,
          itemDir,
          canvasFigPath,
          metaJsonPath,
          aiChatPath,
          thumbnailPath,
          manifestPath,
          imagesDir,
          rootIndexPath,
          rootStylePath,
          appTsxPath,
          indexCssPath,
          meta,
        };
      };

      const ensureMakeMeta = (itemDir: string, targetPath: string) => {
        const snapshot = analyzeMakeAssets(itemDir, targetPath);
        const baseName = path.basename(targetPath) || 'project';
        const existingMeta = snapshot.meta && typeof snapshot.meta === 'object' ? snapshot.meta : {};
        const nextMeta = {
          ...createDefaultMakeMeta(baseName),
          ...existingMeta,
          client_meta: {
            ...createDefaultMakeMeta(baseName).client_meta,
            ...(existingMeta as any)?.client_meta,
          },
          developer_related_links: Array.isArray((existingMeta as any)?.developer_related_links)
            ? (existingMeta as any).developer_related_links
            : [],
          file_name: typeof (existingMeta as any)?.file_name === 'string' && (existingMeta as any).file_name.trim()
            ? (existingMeta as any).file_name.trim()
            : baseName,
          exported_at: new Date().toISOString(),
        };

        fs.writeFileSync(snapshot.metaJsonPath, JSON.stringify(nextMeta, null, 2), 'utf8');
        return nextMeta;
      };

      const ensureMakeAiChat = (itemDir: string) => {
        const aiChatPath = path.join(itemDir, 'ai_chat.json');
        if (!fs.existsSync(aiChatPath)) {
          fs.writeFileSync(aiChatPath, '{}\n', 'utf8');
        }
      };

      const buildMakeExportPrompt = (targetPath: string) => {
        const itemDir = path.join(projectRoot, 'src', targetPath);
        const snapshot = analyzeMakeAssets(itemDir, targetPath);
        const relativeItemDir = normalizePath(path.relative(projectRoot, itemDir));
        const relativeCanvasFig = normalizePath(path.relative(projectRoot, snapshot.canvasFigPath));
        const relativeMeta = normalizePath(path.relative(projectRoot, snapshot.metaJsonPath));
        const relativeManifest = normalizePath(path.relative(projectRoot, snapshot.manifestPath));
        const relativeAiChat = normalizePath(path.relative(projectRoot, snapshot.aiChatPath));
        const relativeImagesDir = normalizePath(path.relative(projectRoot, snapshot.imagesDir));
        const templateCanvasPath = 'scripts/templates/empty-canvas.fig';
        const sceneLabel = snapshot.hasCanvasFig ? '场景 A（已有 Figma 导出资产）' : '场景 B（原生 Axhub 页面，需要补齐导出壳子）';

        let prompt = `请将当前页面补齐为可导出的 Figma 资产结构，并确保最终可通过 \`/api/export-make?path=${targetPath}\` 下载产物 \`${snapshot.fileName}\`。\n\n`;
        prompt += `请先阅读以下技能文档：\n`;
        prompt += `- \`/skills/figma-make-exporter/SKILL.md\`\n`;
        prompt += `- \`/skills/figma-make-project-converter/SKILL.md\`\n\n`;
        prompt += `目标目录：\`${relativeItemDir}/\`\n`;
        prompt += `当前判定：${sceneLabel}\n`;
        prompt += `最终产物说明：接口最终下载的是原始 \`canvas.fig\`，文件名为 \`${snapshot.fileName}\`，不是 \`.make\` 压缩包。\n\n`;
        prompt += `当前资产状态：\n`;
        prompt += `- canvas.fig：${snapshot.hasCanvasFig ? '已存在' : '缺失'}\n`;
        prompt += `- meta.json：${snapshot.hasMetaJson ? '已存在' : '缺失'}\n`;
        prompt += `- ai_chat.json：${snapshot.hasAiChat ? '已存在' : '缺失'}\n`;
        prompt += `- thumbnail.png：${snapshot.hasThumbnail ? '已存在' : '缺失'}\n`;
        prompt += `- images/：${snapshot.hasImagesDir ? `已存在（${snapshot.imageCount} 个文件）` : '缺失'}\n\n`;
        if (snapshot.hasDriftRisk) {
          prompt += `当前检测到导出壳子可能未同步：\n`;
          snapshot.driftReasons.forEach((reason: string) => {
            prompt += `- ${reason}\n`;
          });
          prompt += `\n`;
        }
        prompt += `执行要求：\n`;
        prompt += `1. 不要删除已有业务源码，也不要删除任何已存在的 Figma 原始资产（如 \`canvas.fig\`、\`meta.json\`、\`ai_chat.json\`、\`thumbnail.png\`、\`images/\`）。\n`;
        prompt += `2. 先确保当前 Axhub 页面真实入口 \`index.tsx\` / \`style.css\` 的页面结果已经同步到导出壳子 \`src/App.tsx\` / \`src/index.css\` / \`src/components/**\`。\n`;
        prompt += `3. 目录结构按固定职责维护：根目录 \`index.tsx\` 仅做 Axhub runtime adapter，\`src/App.tsx\` 仅做 Figma export shell，真实页面主体优先放在 \`src/components/**\` / \`src/styles/**\`。\n`;
        prompt += `4. 同步时优先把 \`src/App.tsx\` 做成薄壳，尽量直接复用当前页面组件；不要再维护一份容易过时的旧页面副本。\n`;
        prompt += `5. 如果 \`src/index.css\` 与根目录 \`style.css\` 都存在，优先复用或同步根目录样式来源，避免导出样式与当前页面不一致。\n`;
        prompt += `6. 在 \`index.tsx\`、\`src/App.tsx\`、\`src/main.tsx\` 顶部补充职责注释，明确哪些文件只能做适配层/挂载层，防止后续继续漂移。\n`;
        prompt += `   若最终项目不符合这套固定职责结构，视为任务未完成，必须先重构到位再继续导出。\n`;
        prompt += `   导出前还必须同步 \`CODE_FILE.sourceCode\` 与 \`CODE_FILE.collaborativeSourceCode\`，再清理 \`canvas.fig\` 内部旧代码历史：移除过期 \`CODE_LIBRARY.chatMessages\` / \`chatCompressionState\`，清空旧 \`CODE_INSTANCE.codeSnapshot\` 预览缓存，并裁掉悬空的 \`CODE_COMPONENT\` 引用，避免 Figma Make 导入后恢复旧文件树。\n`;
        if (snapshot.hasCanvasFig) {
          prompt += `7. 直接复用已有 \`${relativeCanvasFig}\`，运行以下命令把当前源码回写进去：\n`;
          prompt += `   \`node scripts/canvas-fig-sync.mjs pack --fig ${relativeCanvasFig} --from ${relativeItemDir} --prune-missing --sanitize-for-export\`\n`;
        } else {
          prompt += `7. 使用内置空白模板 \`${templateCanvasPath}\` 作为基座，在 \`${relativeCanvasFig}\` 生成新的 \`canvas.fig\`，然后运行：\n`;
          prompt += `   \`node scripts/canvas-fig-sync.mjs pack --fig ${relativeCanvasFig} --from ${relativeItemDir} --prune-missing --sanitize-for-export\`\n`;
        }
        prompt += `8. 生成或更新 \`${relativeManifest}\`：\n`;
        prompt += `   \`node scripts/canvas-fig-sync.mjs inspect --fig ${relativeCanvasFig} --manifest ${relativeManifest}\`\n`;
        prompt += `9. 生成或更新 \`${relativeMeta}\`，至少包含 \`file_name\`、\`exported_at\`、\`client_meta\`、\`developer_related_links\`。其中 \`file_name\` 应与最终下载名一致，不要再写成 \`.make\`。\n`;
        prompt += `10. 确保 \`${relativeAiChat}\` 至少是空 JSON 对象 \`{}\`。\n`;
        prompt += `11. 如页面依赖图片资源，请把导出所需图片保留或同步到 \`${relativeImagesDir}/\`；不要随意改名已有 hash 文件。\n`;
        prompt += `12. 如果当前目录缺少导出壳子（如 \`src/App.tsx\`、\`src/main.tsx\`、\`package.json\`、\`vite.config.ts\`、\`index.html\`），请按技能文档补齐到 Figma 兼容结构。\n\n`;
        prompt += `验收要求：\n`;
        prompt += `- \`node scripts/canvas-fig-sync.mjs inspect --fig ${relativeCanvasFig}\` 能成功执行\n`;
        prompt += `- \`${relativeMeta}\` 中 \`exported_at\` 为最新时间\n`;
        prompt += `- \`${relativeMeta}\` 中 \`file_name\` 对应最终下载文件名 \`${snapshot.fileName}\`\n`;
        prompt += `- 导出壳子展示结果必须与当前页面一致，不能还是旧的 Figma 壳子内容\n`;
        prompt += `- ` + '`index.tsx` / `src/App.tsx` / `src/main.tsx`' + ` 顶部存在职责注释，且符合固定目录结构\n`;
        prompt += `- 再次访问 \`/api/export-make?path=${targetPath}&probe=1\` 时，返回 \`hasMakeAssets: true\`\n`;
        return prompt;
      };

      const WORKSPACE_API_ROUTES = {
        project: ['/api/workspace/project', '/api/prototype-admin/project-title'],
        installSkill: ['/api/workspace/skills/install', '/api/prototype-admin/install-skill'],
        navigationFolders: ['/api/workspace/navigation/folders', '/api/prototype-admin/sidebar-tree/folder'],
        navigation: ['/api/workspace/navigation', '/api/prototype-admin/sidebar-tree'],
        resourcesOrder: ['/api/workspace/resources/order', '/api/prototype-admin/resource-order'],
      } as const;

      const registerWorkspaceRoute = (
        paths: readonly string[],
        handler: (req: any, res: any) => Promise<any> | any,
      ) => {
        paths.forEach((routePath) => {
          server.middlewares.use(routePath, handler);
        });
      };

      registerWorkspaceRoute(WORKSPACE_API_ROUTES.project, async (req: any, res: any) => {
        if (req.method === 'GET') {
          return sendJSON(res, 200, { title: readProjectTitle() });
        }
        if (req.method !== 'PATCH') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const body = await parseBody(req);
          const rawTitle = typeof body?.title === 'string' ? body.title : '';
          const title = rawTitle.trim();
          if (!title) {
            return sendJSON(res, 400, { error: 'title cannot be empty' });
          }
          if (/[\u0000-\u001F\u007F]/.test(title)) {
            return sendJSON(res, 400, { error: 'title contains invalid control characters' });
          }

          const config = fs.existsSync(configPath)
            ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
            : {};
          const nextConfig = {
            ...config,
            projectInfo: {
              ...(config?.projectInfo || {}),
              name: title,
            },
          };
          fs.mkdirSync(path.dirname(configPath), { recursive: true });
          fs.writeFileSync(configPath, JSON.stringify(nextConfig, null, 2), 'utf8');
          return sendJSON(res, 200, { success: true, title });
        } catch (e: any) {
          return sendJSON(res, 500, { error: e?.message || 'Update project title failed' });
        }
      });

      // ─── Skill Install API ──────────────────────────────────────────────
      registerWorkspaceRoute(WORKSPACE_API_ROUTES.installSkill, async (req: any, res: any) => {
        if (req.method !== 'POST') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const body = await parseBody(req);
          const skillId = typeof body?.skillId === 'string' ? body.skillId.trim() : '';
          const client = typeof body?.client === 'string' ? body.client.trim() : '';

          if (!skillId || !client) {
            return sendJSON(res, 400, { error: 'skillId and client are required' });
          }

          const targetDir = getInstallSkillTargetDir(client);
          if (!targetDir) {
            return sendJSON(res, 400, {
              error: 'not_supported',
              message: `${client} 暂不支持自动安装技能`,
            });
          }

          const sourceDir = path.join(projectRoot, 'skills', skillId);
          if (!fs.existsSync(sourceDir)) {
            return sendJSON(res, 404, { error: `Skill '${skillId}' not found at skills/${skillId}` });
          }

          const destDir = path.join(projectRoot, targetDir, skillId);
          fs.mkdirSync(destDir, { recursive: true });
          copyDirRecursive(sourceDir, destDir);

          return sendJSON(res, 200, {
            success: true,
            skillId,
            client,
            installedTo: `${targetDir}/${skillId}`,
          });
        } catch (e: any) {
          return sendJSON(res, 500, { error: e?.message || 'Install skill failed' });
        }
      });

      registerWorkspaceRoute(WORKSPACE_API_ROUTES.navigationFolders, async (req: any, res: any) => {
        const tab = getTabFromRequest(req);
        if (!tab) {
          return sendJSON(res, 400, { error: 'Invalid tab, expected prototypes|components|docs|canvas' });
        }

        if (req.method !== 'POST') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const allowedItemKeys = resolveAllowedItemKeys(tab);
          const storedTree = sidebarTreeStore.getTree(tab);
          const sourceTree = storedTree.length > 0 ? storedTree : buildDefaultSidebarTree(allowedItemKeys);
          const tree = reconcileSidebarTree(sourceTree, tab, allowedItemKeys);

          const existingIds = collectSidebarTreeIds(tree);
          const createdFolderId = createUniqueFolderNodeId(existingIds);
          const title = createRootFolderTitle(tree);
          const nextTree: SidebarTreeNode[] = [
            {
              id: createdFolderId,
              kind: 'folder',
              title,
              children: [],
            },
            ...tree,
          ];

          sidebarTreeStore.setTree(tab, nextTree);

          return sendJSON(res, 200, {
            success: true,
            tab,
            version: SIDEBAR_TREE_VERSION,
            createdFolderId,
            tree: nextTree,
          });
        } catch (e: any) {
          return sendJSON(res, 500, { error: e?.message || 'Create sidebar folder failed' });
        }
      });

      registerWorkspaceRoute(WORKSPACE_API_ROUTES.navigation, async (req: any, res: any) => {
        const tab = getTabFromRequest(req);
        if (!tab) {
          return sendJSON(res, 400, { error: 'Invalid tab, expected prototypes|components|docs|canvas' });
        }

        if (req.method === 'GET') {
          const allowedItemKeys = resolveAllowedItemKeys(tab);
          const storedTree = sidebarTreeStore.getTree(tab);
          const sourceTree = storedTree.length > 0 ? storedTree : buildDefaultSidebarTree(allowedItemKeys);
          const tree = reconcileSidebarTree(sourceTree, tab, allowedItemKeys);
          if (JSON.stringify(tree) !== JSON.stringify(storedTree)) {
            sidebarTreeStore.setTree(tab, tree);
          }
          return sendJSON(res, 200, {
            tab,
            version: SIDEBAR_TREE_VERSION,
            tree,
          });
        }

        if (req.method !== 'PUT') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const body = await parseBody(req);
          const allowedItemKeys = resolveAllowedItemKeys(tab);
          const normalized = normalizeAndValidateSidebarTree(body?.tree, tab, allowedItemKeys);
          if (!normalized.valid) {
            return sendJSON(res, 400, { error: normalized.error });
          }
          sidebarTreeStore.setTree(tab, normalized.tree);
          return sendJSON(res, 200, {
            success: true,
            tab,
            version: SIDEBAR_TREE_VERSION,
            tree: normalized.tree,
          });
        } catch (e: any) {
          return sendJSON(res, 500, { error: e?.message || 'Save sidebar tree failed' });
        }
      });

      registerWorkspaceRoute(WORKSPACE_API_ROUTES.resourcesOrder, async (req: any, res: any) => {
        const type = getResourceOrderTypeFromRequest(req);
        if (!type) {
          return sendJSON(res, 400, { error: 'Invalid type, expected themes|data|templates' });
        }

        if (req.method === 'GET') {
          try {
            const allowedKeys = resolveAllowedResourceKeys(type);
            const storedOrder = sidebarTreeStore.getResourceOrder(type);
            const order = reconcileResourceOrder(storedOrder, allowedKeys);
            if (JSON.stringify(order) !== JSON.stringify(storedOrder)) {
              sidebarTreeStore.setResourceOrder(type, order);
            }
            return sendJSON(res, 200, {
              type,
              version: SIDEBAR_TREE_VERSION,
              order,
            });
          } catch (e: any) {
            return sendJSON(res, 500, { error: e?.message || 'Load resource order failed' });
          }
        }

        if (req.method !== 'PUT') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const body = await parseBody(req);
          if (!Array.isArray(body?.order)) {
            return sendJSON(res, 400, { error: 'order must be an array' });
          }
          const requestedOrder = body.order
            .filter((key: unknown): key is string => typeof key === 'string')
            .map((key) => key.trim())
            .filter(Boolean);
          const allowedKeys = resolveAllowedResourceKeys(type);
          const invalidKey = requestedOrder.find((key) => !allowedKeys.has(key));
          if (invalidKey) {
            return sendJSON(res, 400, { error: `Invalid resource key: ${invalidKey}` });
          }
          const order = reconcileResourceOrder(requestedOrder, allowedKeys);
          sidebarTreeStore.setResourceOrder(type, order);
          return sendJSON(res, 200, {
            success: true,
            type,
            version: SIDEBAR_TREE_VERSION,
            order,
          });
        } catch (e: any) {
          return sendJSON(res, 500, { error: e?.message || 'Save resource order failed' });
        }
      });

      const scanThemeReferences = (themeName: string) => {
        const referenceDirs = [
          path.join(projectRoot, 'src', 'components'),
          path.join(projectRoot, 'src', 'prototypes'),
        ];
        const allowedExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.css']);
        const needles = [
          `themes/${themeName}/designToken.json`,
          `themes/${themeName}/globals.css`,
        ];
        const references = new Set<string>();

        const walkDir = (dirPath: string) => {
          if (!fs.existsSync(dirPath)) return;
          const entries = fs.readdirSync(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              walkDir(entryPath);
              continue;
            }

            const ext = path.extname(entry.name);
            if (!allowedExt.has(ext)) continue;

            const content = fs.readFileSync(entryPath, 'utf8');
            if (needles.some(needle => content.includes(needle))) {
              references.add(normalizePath(path.relative(projectRoot, entryPath)));
            }
          }
        };

        referenceDirs.forEach(walkDir);

        return Array.from(references).sort();
      };

      const scanItemReferences = (itemType: 'components' | 'prototypes', itemName: string) => {
        const referenceDirs = [
          path.join(projectRoot, 'src', 'components'),
          path.join(projectRoot, 'src', 'prototypes'),
        ];
        const allowedExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.css']);
        const references = new Set<string>();
        const normalizedItemName = String(itemName || '').trim();
        const escapedName = normalizedItemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nameRegex = new RegExp(`(?:^|[\\\\/])${escapedName}(?:$|[\\\\/'"\\s])`);
        const targetDir = path.resolve(projectRoot, 'src', itemType, normalizedItemName);

        const walkDir = (dirPath: string) => {
          if (!fs.existsSync(dirPath)) return;
          const entries = fs.readdirSync(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              if (path.resolve(entryPath) === targetDir) {
                continue;
              }
              walkDir(entryPath);
              continue;
            }

            const ext = path.extname(entry.name);
            if (!allowedExt.has(ext)) continue;

            const content = fs.readFileSync(entryPath, 'utf8');
            if (nameRegex.test(content)) {
              references.add(normalizePath(path.relative(projectRoot, entryPath)));
            }
          }
        };

        referenceDirs.forEach(walkDir);

        return Array.from(references).sort();
      };

      // 递归复制目录
      const copyDir = (src: string, dest: string) => {
        fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };

      // ==================== /api/themes/check-references ====================
      server.middlewares.use('/api/themes/check-references', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const { themeName } = await parseBody(req);
          if (!themeName || typeof themeName !== 'string') {
            return sendJSON(res, 400, { error: 'Missing themeName parameter' });
          }

          const themeDir = path.join(projectRoot, 'src', 'themes', themeName);
          if (!fs.existsSync(themeDir)) {
            return sendJSON(res, 404, { error: 'Theme not found' });
          }

          const references = scanThemeReferences(themeName);
          const designTokenPath = path.join(themeDir, 'designToken.json');
          const globalsPath = path.join(themeDir, 'globals.css');

          return sendJSON(res, 200, {
            themeName,
            references,
            hasReferences: references.length > 0,
            themeAssets: {
              hasDesignToken: fs.existsSync(designTokenPath),
              hasGlobals: fs.existsSync(globalsPath),
            },
          });
        } catch (e: any) {
          console.error('[文件系统 API] 检查主题引用失败:', e);
          return sendJSON(res, 500, { error: e.message || 'Check references failed' });
        }
      });

      server.middlewares.use('/api/themes/get-contents', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const { themeName } = await parseBody(req);
          if (!themeName || typeof themeName !== 'string') {
            return sendJSON(res, 400, { error: 'Missing themeName parameter' });
          }

          const themeDir = path.join(projectRoot, 'src', 'themes', themeName);
          if (!fs.existsSync(themeDir)) {
            return sendJSON(res, 404, { error: 'Theme not found' });
          }

          const designTokenPath = path.join(themeDir, 'designToken.json');
          const globalsPath = path.join(themeDir, 'globals.css');
          const specPath = path.join(themeDir, 'DESIGN-SPEC.md');

          return sendJSON(res, 200, {
            themeName,
            designToken: fs.existsSync(designTokenPath) ? fs.readFileSync(designTokenPath, 'utf8') : null,
            globalsCss: fs.existsSync(globalsPath) ? fs.readFileSync(globalsPath, 'utf8') : null,
            designSpec: fs.existsSync(specPath) ? fs.readFileSync(specPath, 'utf8') : null,
          });
        } catch (e: any) {
          console.error('[文件系统 API] 获取主题内容失败:', e);
          return sendJSON(res, 500, { error: e.message || 'Get theme contents failed' });
        }
      });

      // ==================== /api/items/check-references ====================
      server.middlewares.use('/api/items/check-references', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const { itemType, itemName } = await parseBody(req);
          if (!itemType || !itemName || typeof itemType !== 'string' || typeof itemName !== 'string') {
            return sendJSON(res, 400, { error: 'Missing itemType or itemName parameter' });
          }

          if (itemType !== 'components' && itemType !== 'prototypes') {
            return sendJSON(res, 400, { error: 'Invalid itemType' });
          }

          const itemDir = path.join(projectRoot, 'src', itemType, itemName);
          if (!fs.existsSync(itemDir)) {
            return sendJSON(res, 404, { error: 'Item not found' });
          }

          const references = scanItemReferences(itemType, itemName);

          return sendJSON(res, 200, {
            itemType,
            itemName,
            references,
            hasReferences: references.length > 0,
          });
        } catch (e: any) {
          console.error('[文件系统 API] 检查元素/页面引用失败:', e);
          return sendJSON(res, 500, { error: e.message || 'Check references failed' });
        }
      });

      // ==================== /api/delete ====================
      server.middlewares.use('/api/delete', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const { path: targetPath } = await parseBody(req);
          
          if (!targetPath) {
            return sendJSON(res, 400, { error: 'Missing path parameter' });
          }

          // 验证路径安全性
          if (targetPath.includes('..') || targetPath.startsWith('/')) {
            return sendJSON(res, 403, { error: 'Invalid path' });
          }

          const parts = String(targetPath).split('/').filter(Boolean);
          const isElementsOrPages = parts.length === 2 && (parts[0] === 'components' || parts[0] === 'prototypes');
          const deletePath = isElementsOrPages
            ? path.join(projectRoot, 'src', parts[0], parts[1])
            : path.join(projectRoot, 'src', targetPath);
          const srcRoot = path.join(projectRoot, 'src');
          const resolvedDeletePath = path.resolve(deletePath);
          const relativeToSrc = path.relative(srcRoot, resolvedDeletePath);
          const relativeParts = relativeToSrc.split(path.sep).filter(Boolean);

          if (
            !relativeToSrc
            || relativeToSrc.startsWith('..')
            || path.isAbsolute(relativeToSrc)
            || relativeParts.length < 2
          ) {
            return sendJSON(res, 403, { error: 'Refuse to delete protected root directory' });
          }

          if (!fs.existsSync(deletePath)) {
            return sendJSON(res, 404, { error: 'Directory not found' });
          }

          if (isElementsOrPages) {
            fs.rmSync(deletePath, { recursive: true, force: true });

            return sendJSON(res, 200, {
              success: true,
              deletedPaths: [targetPath],
            });
          }

          // 删除目录
          fs.rmSync(deletePath, { recursive: true, force: true });

          return sendJSON(res, 200, { success: true });
        } catch (e: any) {
          console.error('[文件系统 API] 删除失败:', e);
          return sendJSON(res, 500, { error: e.message || 'Delete failed' });
        }
      });

      // ==================== /api/rename ====================
      server.middlewares.use('/api/rename', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const { path: targetPath, newName } = await parseBody(req);

          if (!targetPath || !newName) {
            return sendJSON(res, 400, { error: 'Missing path or newName parameter' });
          }

          // 验证路径安全性
          if (targetPath.includes('..') || targetPath.startsWith('/')) {
            return sendJSON(res, 403, { error: 'Invalid path' });
          }

          // 验证新名称格式
          const trimmedNewName = String(newName).trim();
          if (!trimmedNewName) {
            return sendJSON(res, 400, { error: 'Invalid newName format' });
          }
          if (trimmedNewName === '.' || trimmedNewName === '..') {
            return sendJSON(res, 400, { error: 'Invalid newName format' });
          }
          if (/[\r\n]/.test(trimmedNewName)) {
            return sendJSON(res, 400, { error: 'Invalid newName format' });
          }
          if (trimmedNewName.includes('*/')) {
            return sendJSON(res, 400, { error: 'Invalid newName format' });
          }
          if (/[/\\:*?"<>|]/.test(trimmedNewName)) {
            return sendJSON(res, 400, { error: 'Invalid newName format' });
          }

          // 解析路径
          const parts = String(targetPath).split('/').filter(Boolean);
          if (parts.length !== 2 || (parts[0] !== 'components' && parts[0] !== 'prototypes')) {
            return sendJSON(res, 400, { error: 'Invalid path format' });
          }

          const group = parts[0];
          const itemName = parts[1];
          const itemDir = path.join(projectRoot, 'src', group, itemName);

          if (!fs.existsSync(itemDir)) {
            return sendJSON(res, 404, { error: 'Directory not found' });
          }

          const indexFiles = ['index.tsx', 'index.ts', 'index.jsx', 'index.js'];
          let indexFilePath: string | null = null;
          for (const fileName of indexFiles) {
            const filePath = path.join(itemDir, fileName);
            if (fs.existsSync(filePath)) {
              indexFilePath = filePath;
              break;
            }
          }

          if (!indexFilePath) {
            return sendJSON(res, 404, { error: 'Entry file not found' });
          }

          const nameLineRegex = /(^\s*\*\s*@(?:name|displayName)\s+)(.+)$/m;
          const content = fs.readFileSync(indexFilePath, 'utf8');
          let updatedContent = content;

          if (nameLineRegex.test(content)) {
            updatedContent = content.replace(nameLineRegex, `$1${trimmedNewName}`);
          } else {
            updatedContent = `/**\n * @name ${trimmedNewName}\n */\n${content}`;
          }

          if (updatedContent !== content) {
            fs.writeFileSync(indexFilePath, updatedContent, 'utf8');
          }

          sendJSON(res, 200, { success: true });
        } catch (e: any) {
          console.error('[文件系统 API] 重命名失败:', e);
          sendJSON(res, 500, { error: e.message || 'Rename failed' });
        }
      });

      // ==================== /api/upload ====================
      server.middlewares.use('/api/upload', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const form = formidable({
            uploadDir: path.join(projectRoot, 'temp'),
            keepExtensions: true,
            multiples: true,
            maxFileSize: 100 * 1024 * 1024, // 100MB
          });

          form.parse(req, async (err: any, fields: any, files: any) => {
            if (err) {
              console.error('[文件系统 API] 上传解析失败:', err);
              return sendJSON(res, 500, { error: 'Upload parsing failed' });
            }

            try {
              // 提取字段值（处理数组和单值）
              const getFieldValue = (field: any) => Array.isArray(field) ? field[0] : field;
              
              const uploadType = getFieldValue(fields.uploadType);
              const targetType = getFieldValue(fields.targetType);
              const uploadMode = getFieldValue(fields.uploadMode);
              const folderNameField = getFieldValue(fields.folderName);
              const targetTypeRequired = uploadType !== 'local_axure';
              
              const normalizeFiles = (value: any) => {
                if (!value) return [];
                return Array.isArray(value) ? value : [value];
              };

              let fileList = normalizeFiles(files.files);
              if (fileList.length === 0) fileList = normalizeFiles(files.file);
              if (fileList.length === 0 && fields.file) {
                fileList = normalizeFiles(fields.file);
              }

              const isFolderUpload = uploadMode === 'folder' || fileList.length > 1;

              console.log('[文件系统 API] 原始文件对象:', {
                hasFilesFile: !!files.file,
                hasFilesFiles: !!files.files,
                hasFieldsFile: !!fields.file,
                fileCount: fileList.length,
                uploadMode,
                isFolderUpload,
              });

              console.log('[文件系统 API] 接收到的参数:', {
                uploadType,
                targetType,
                hasFile: fileList.length > 0,
                fileInfo: fileList.length > 0 ? { filepath: fileList[0]?.filepath, originalFilename: fileList[0]?.originalFilename } : null,
                fieldsKeys: Object.keys(fields),
                filesKeys: Object.keys(files)
              });

              if (!fileList.length || !uploadType || (targetTypeRequired && !targetType)) {
                console.error('[文件系统 API] 缺少必需参数:', { 
                  hasFile: fileList.length > 0, 
                  uploadType, 
                  targetType,
                  fileType: fileList.length > 0 ? typeof fileList[0] : 'undefined'
                });
                return sendJSON(res, 400, { 
                  error: 'Missing required parameters',
                  details: {
                    hasFile: fileList.length > 0,
                    hasUploadType: !!uploadType,
                    hasTargetType: !!targetType,
                    targetTypeRequired
                  }
                });
              }
              
              if (
                targetTypeRequired
                && !SUPPORTED_UPLOAD_TARGET_TYPES.includes(String(targetType) as (typeof SUPPORTED_UPLOAD_TARGET_TYPES)[number])
              ) {
                return sendJSON(res, 400, {
                  error: `Invalid targetType: ${targetType}. Supported targetType: ${SUPPORTED_UPLOAD_TARGET_TYPES.join(', ')}`
                });
              }

              if (targetType === 'themes' && !THEME_IMPORT_SUPPORTED_UPLOAD_TYPES.has(String(uploadType))) {
                return sendJSON(res, 400, {
                  error: `uploadType=${uploadType} 暂不支持 targetType=themes。当前支持: ${Array.from(THEME_IMPORT_SUPPORTED_UPLOAD_TYPES).join(', ')}`
                });
              }

              const primaryFile = fileList[0];
              const tempFilePath = primaryFile?.filepath || primaryFile?.path || primaryFile?.tempFilePath;
              const originalFilename = primaryFile?.originalFilename || primaryFile?.name || primaryFile?.filename || 'upload.zip';

              console.log('[文件系统 API] 文件信息:', {
                tempFilePath,
                originalFilename,
                fileCount: fileList.length,
                isFolderUpload,
              });

              if (uploadType === 'figma_make') {
                if (isFolderUpload) {
                  return sendJSON(res, 400, { error: 'figma_make 仅支持上传 Figma 原始导出的 ZIP 工程包，请不要上传文件夹' });
                }
                if (!String(originalFilename).toLowerCase().endsWith('.zip')) {
                  return sendJSON(res, 400, { error: 'figma_make 仅支持 ZIP 文件，请上传 Figma 原始导出的 ZIP 工程包' });
                }
              }

              if (!isFolderUpload) {
                if (!tempFilePath || !fs.existsSync(tempFilePath)) {
                  return sendJSON(res, 500, { error: '临时文件不存在' });
                }

                if (fs.statSync(tempFilePath).size === 0) {
                  return sendJSON(res, 500, { error: '上传的文件为空' });
                }
              } else {
                const missingFile = fileList.find((file: any) => !file?.filepath || !fs.existsSync(file.filepath));
                if (missingFile) {
                  return sendJSON(res, 500, { error: '上传的文件夹存在缺失文件，请重试' });
                }
              }

              const relativePaths = normalizeFiles(fields.relativePaths).map((value: any) => String(value));
              const derivedRootName = deriveRootFolderName(relativePaths);

              // AI 辅助类型：local_axure（解压到 temp 并返回 Prompt）
              if (uploadType === 'local_axure') {
                if (isFolderUpload) {
                  return sendJSON(res, 400, { error: 'local_axure 暂不支持文件夹上传，请使用 ZIP 文件' });
                }
                try {
                  const scriptPath = path.join(projectRoot, 'scripts', 'local-axure-extract.mjs');
                  const commandResult = runCommandSync({
                    command: nodeCommand,
                    args: [scriptPath, tempFilePath, originalFilename],
                    cwd: projectRoot,
                  });

                  if (commandResult.status !== 0) {
                    const details = [commandResult.stderr, commandResult.stdout]
                      .filter(Boolean)
                      .join('\n')
                      .trim();
                    throw new Error(details || 'local-axure-extract failed');
                  }

                  const rawOutput = commandResult.stdout.trim();

                  const lastLine = rawOutput.split('\n').filter(Boolean).slice(-1)[0] || rawOutput;
                  const extracted = JSON.parse(lastLine) as { extractDir: string; contentDir?: string };
                  const filePath = extracted.contentDir || extracted.extractDir;

                  // 清理临时 zip
                  fs.unlinkSync(tempFilePath);

                  const isThemeImport = targetType === 'themes';
                  const skillDocs = isThemeImport
                    ? ['/skills/local-axure-workflow/SKILL.md', ...THEME_IMPORT_SUB_SKILL_DOCS]
                    : ['/skills/local-axure-workflow/SKILL.md'];
                  const targetHint = targetType ? `\n\n建议输出目录：\`src/${targetType}\`` : '';
                  const prompt = isThemeImport
                    ? `本地 Axure ZIP 已上传并解压完成。\n\n解压目录：\`${filePath}\`\n\n请阅读技能文档：\n${formatReferenceList(skillDocs)}\n\n目标：导入主题并生成主题/文档/数据相关资产。\n\n建议输出目录：\n- \`src/themes/<theme-key>/\`\n- \`src/docs/\`\n- \`src/database/\`\n\n开始执行前：先根据 skill 的用户交互指南用简短中文回复用户，确认需求（主题范围/是否需要文档与数据/是否允许优化）。\n\n请按技能文档流程，从解压目录中提取并生成主题 token、设计规范、项目文档与数据模型。`
                    : `本地 Axure ZIP 已上传并解压完成。\n\n解压目录：\`${filePath}\`\n\n请阅读技能文档：\n${formatReferenceList(skillDocs)}${targetHint}\n\n开始执行前：先根据 skill 的用户交互指南用简短中文回复用户，确认需求（目标范围/输出类型/是否允许优化等）。\n\n请按技能文档流程，从解压目录中提取主题/数据/文档并还原页面/元素。`;

                  return sendJSON(res, 200, {
                    success: true,
                    uploadType,
                    filePath,
                    prompt,
                    message: '文件已解压，请复制 Prompt 交给 AI 处理'
                  });
                } catch (e: any) {
                  console.error('[文件系统 API] local_axure 解压失败:', e);
                  return sendJSON(res, 500, { error: `解压失败: ${e.message}` });
                }
              }

              let folderUploadContext: {
                tempExtractDir: string;
                inferred: { entryCount: number; hasRootFolder: boolean; rootFolderName: string };
                fallbackName: string;
              } | null = null;

              if (isFolderUpload) {
                try {
                  const tempExtractDir = path.join(projectRoot, 'temp', `folder-upload-${Date.now()}`);
                  fs.mkdirSync(tempExtractDir, { recursive: true });

                  const fallbackSource = folderNameField || derivedRootName || `upload-${Date.now()}`;
                  const fallbackName = truncateName(sanitizeFolderName(fallbackSource), 60) || `upload-${Date.now()}`;

                  fileList.forEach((file: any, index: number) => {
                    const sourcePath = file?.filepath || file?.path || file?.tempFilePath;
                    if (!sourcePath || !fs.existsSync(sourcePath)) return;

                    const rawRelativePath = relativePaths[index] || file?.originalFilename || file?.name || `file-${index}`;
                    const safeRelativePath = sanitizeRelativePath(String(rawRelativePath));
                    if (!safeRelativePath || hasIgnoredEntry(safeRelativePath)) {
                      fs.unlinkSync(sourcePath);
                      return;
                    }

                    const destPath = path.join(tempExtractDir, safeRelativePath);
                    fs.mkdirSync(path.dirname(destPath), { recursive: true });
                    fs.copyFileSync(sourcePath, destPath);
                    fs.unlinkSync(sourcePath);
                  });

                  const inferred = inferExtractedRootFolder(tempExtractDir);
                  if (inferred.entryCount === 0) {
                    return sendJSON(res, 500, { error: '上传的文件夹为空' });
                  }

                  folderUploadContext = {
                    tempExtractDir,
                    inferred,
                    fallbackName
                  };
                } catch (e: any) {
                  console.error('[文件系统 API] 文件夹处理失败:', e);
                  return sendJSON(res, 500, { error: `文件夹处理失败: ${e.message || '未知错误'}` });
                }
              }

              // 直接处理类型：make, axhub, google_stitch
              if (['make', 'axhub', 'google_stitch'].includes(uploadType)) {
                try {
                  // 解压到临时目录（先解压再分析目录结构，避免依赖 ZIP 条目解析）
                  const tempExtractDir = isFolderUpload
                    ? folderUploadContext!.tempExtractDir
                    : path.join(projectRoot, 'temp', `extract-${Date.now()}`);

                  if (!isFolderUpload) {
                    fs.mkdirSync(tempExtractDir, { recursive: true });
                    await extractZip(tempFilePath, { dir: tempExtractDir });
                  }

                  const inferred = isFolderUpload
                    ? folderUploadContext!.inferred
                    : inferExtractedRootFolder(tempExtractDir);
                  if (inferred.entryCount === 0) {
                    throw new Error('ZIP 文件为空');
                  }

                  const extractedRootFolderName = inferred.rootFolderName;
                  const hasRootFolder = inferred.hasRootFolder;

                  const basename = isFolderUpload
                    ? folderUploadContext!.fallbackName
                    : path.basename(originalFilename, path.extname(originalFilename));
                  const fallbackFolderName = truncateName(sanitizeFolderName(basename), 60);
                  const safeFallbackFolderName = fallbackFolderName || `upload-${Date.now()}`;
                  const targetFolderName = hasRootFolder
                    ? truncateName(extractedRootFolderName, 60)
                    : safeFallbackFolderName;

                  const targetBaseDir = path.join(projectRoot, 'src', targetType);
                  const targetDir = path.join(targetBaseDir, targetFolderName);
                  const resolvedTargetBase = path.resolve(targetBaseDir);
                  const resolvedTargetDir = path.resolve(targetDir);

                  // 防止覆盖整个 prototypes/components 目录或越界写入
                  if (resolvedTargetDir === resolvedTargetBase || !resolvedTargetDir.startsWith(resolvedTargetBase + path.sep)) {
                    throw new Error('目标目录不安全，已阻止解压');
                  }

                  console.log('[文件系统 API] ZIP 结构分析:', {
                    hasRootFolder,
                    rootFolderName: extractedRootFolderName,
                    targetDir,
                    entriesCount: inferred.entryCount
                  });

                  // 如果目标目录已存在，直接删除（覆盖）
                  if (fs.existsSync(targetDir)) {
                    fs.rmSync(targetDir, { recursive: true, force: true });
                  }

                  // 🔧 Windows 兼容性修复：等待杀毒软件释放文件
                  // 在 Windows 上，解压后杀毒软件（如 Windows Defender）会立即扫描新文件
                  // 导致文件被短暂锁定，此时执行 rename 会触发 EPERM 错误
                  // 延迟 500ms 让杀毒软件完成扫描，大幅降低权限错误的概率
                  await new Promise(resolve => setTimeout(resolve, 500));

                  // 移动到目标目录（使用复制+删除方式作为 fallback，避免 Windows 权限问题）
                  if (hasRootFolder) {
                    // 有根目录：移动根目录
                    const extractedRoot = path.join(tempExtractDir, extractedRootFolderName);
                    if (fs.existsSync(extractedRoot)) {
                      try {
                        // 优先尝试 rename（快速路径，毫秒级完成）
                        // rename 只修改文件系统元数据，不移动实际数据，性能最优
                        fs.renameSync(extractedRoot, targetDir);
                      } catch (renameError: any) {
                        // rename 失败则使用复制+删除（兼容路径，秒级完成）
                        // 虽然慢，但能处理跨驱动器、权限问题等 rename 无法处理的情况
                        console.warn('[文件系统] rename 失败，使用复制方式:', renameError.message);
                        copyDirRecursive(extractedRoot, targetDir);
                        fs.rmSync(extractedRoot, { recursive: true, force: true });
                      }
                    } else {
                      throw new Error('解压后找不到根目录');
                    }
                  } else {
                    // 没有根目录：直接移动整个解压目录
                    try {
                      // 优先尝试 rename（快速路径）
                      fs.renameSync(tempExtractDir, targetDir);
                    } catch (renameError: any) {
                      // rename 失败则使用复制+删除（兼容路径）
                      console.warn('[文件系统] rename 失败，使用复制方式:', renameError.message);
                      copyDirRecursive(tempExtractDir, targetDir);
                      fs.rmSync(tempExtractDir, { recursive: true, force: true });
                    }
                  }

                  // 清理临时文件
                  if (fs.existsSync(tempExtractDir)) {
                    fs.rmSync(tempExtractDir, { recursive: true, force: true });
                  }
                  if (!isFolderUpload) {
                    fs.unlinkSync(tempFilePath);
                  }

                  // 根据类型执行转换脚本
                  if (uploadType === 'axhub') {
                    // Chrome 扩展：执行转换脚本
                    const scriptPath = path.join(projectRoot, 'scripts', 'chrome-export-converter.mjs');
                    void runCommand({
                      command: nodeCommand,
                      args: [scriptPath, targetDir, targetFolderName],
                      cwd: projectRoot,
                      capture: true,
                    }).then((result) => {
                      if (result.code !== 0) {
                        console.error('[Chrome 转换] 执行失败:', result.stderr || result.stdout || `exit=${result.code}`);
                      } else {
                        console.log('[Chrome 转换] 完成:', result.stdout);
                      }
                      if (result.stderr) console.error('[Chrome 转换] 错误:', result.stderr);
                    }).catch((error: any) => {
                      console.error('[Chrome 转换] 执行失败:', error);
                    });
                  } else if (uploadType === 'google_stitch') {
                    const scriptPath = path.join(projectRoot, 'scripts', 'stitch-converter.mjs');
                    const commandResult = runCommandSync({
                      command: nodeCommand,
                      args: [scriptPath, targetDir, targetFolderName],
                      cwd: projectRoot,
                    });

                    if (commandResult.status !== 0) {
                      throw new Error(commandResult.stderr || commandResult.stdout || `stitch-converter exit=${commandResult.status}`);
                    }

                    const output = commandResult.stdout.trim();
                    const lastLine = output.split('\n').filter(Boolean).slice(-1)[0] || output;
                    let stitchResult: {
                      success?: boolean;
                      requiresAi?: boolean;
                      prompt?: string | null;
                      reasons?: string[];
                    } = {};

                    try {
                      stitchResult = JSON.parse(lastLine);
                    } catch (parseError: any) {
                      throw new Error(`stitch-converter 返回结果无法解析: ${parseError.message}`);
                    }

                    const requiresAi = stitchResult.requiresAi === true;
                    return sendJSON(res, 200, {
                      success: true,
                      message: requiresAi
                        ? '页面已导入完成，可先预览基础效果。部分细节还可继续优化，建议交给 AI 完成。'
                        : '上传并解压成功',
                      folderName: targetFolderName,
                      path: `${targetType}/${targetFolderName}`,
                      hint: requiresAi
                        ? '复制提示词后，可继续完善交互与动态内容'
                        : '如果页面无法预览，让 AI 处理即可',
                      requiresAi,
                      prompt: stitchResult.prompt || undefined,
                      reasons: Array.isArray(stitchResult.reasons) ? stitchResult.reasons : [],
                    });
                  }

                  return sendJSON(res, 200, {
                    success: true,
                    message: '上传并解压成功',
                    folderName: targetFolderName,
                    path: `${targetType}/${targetFolderName}`,
                    hint: '如果页面无法预览，让 AI 处理即可'
                  });
                } catch (e: any) {
                  console.error('[文件系统 API] 解压失败:', e);
                  if (e?.code === 'ENAMETOOLONG') {
                    return sendJSON(res, 500, {
                      error:
                        '解压失败：ZIP 内部路径过长（超出系统限制）。请解压后上传文件夹，或缩短文件名后重试。',
                    });
                  }
                  return sendJSON(res, 500, { error: `解压失败: ${e.message}` });
                }
              }

              // AI 处理类型：v0, google_aistudio, figma_make
              if (['v0', 'google_aistudio', 'figma_make'].includes(uploadType)) {
                try {
                  // 解压到 temp 目录
                  const timestamp = Date.now();
                  const basename = isFolderUpload
                    ? (folderUploadContext?.fallbackName || folderNameField || derivedRootName || `upload-${timestamp}`)
                    : path.basename(originalFilename, path.extname(originalFilename));
                  const inferredRootFolderName = folderUploadContext?.inferred.rootFolderName || derivedRootName || '';
                  const safeBaseName = buildSafeImportFolderName(
                    [basename, inferredRootFolderName],
                    uploadType,
                  );
                  const extractDirName = `${uploadType}-${truncateName(safeBaseName, 40)}-${timestamp}`;
                  const extractDir = isFolderUpload
                    ? (folderUploadContext!.inferred.hasRootFolder
                        ? path.join(folderUploadContext!.tempExtractDir, folderUploadContext!.inferred.rootFolderName)
                        : folderUploadContext!.tempExtractDir)
                    : path.join(projectRoot, 'temp', extractDirName);

                  if (!isFolderUpload) {
                    fs.mkdirSync(extractDir, { recursive: true });
                    await extractZip(tempFilePath, { dir: extractDir });
                    fs.unlinkSync(tempFilePath);
                  }

                  const pageName = buildSafeImportFolderName(
                    [basename, inferredRootFolderName, extractDirName],
                    uploadType,
                  );
                  const isThemeTarget = targetType === 'themes';

                  const converterConfigs: Record<string, {
                    label: string;
                    scriptFile: string;
                    tasksFileName: string;
                    themeTasksFileName: string;
                  }> = {
                    v0: {
                      label: 'V0',
                      scriptFile: 'v0-converter.mjs',
                      tasksFileName: '.v0-tasks.md',
                      themeTasksFileName: '.v0-theme-tasks.md',
                    },
                    google_aistudio: {
                      label: 'AI Studio',
                      scriptFile: 'ai-studio-converter.mjs',
                      tasksFileName: '.ai-studio-tasks.md',
                      themeTasksFileName: '.ai-studio-theme-tasks.md',
                    },
                    figma_make: {
                      label: 'Figma Make',
                      scriptFile: 'figma-make-converter.mjs',
                      tasksFileName: '.figma-make-tasks.md',
                      themeTasksFileName: '.figma-make-theme-tasks.md',
                    },
                  };

                  const converterConfig = converterConfigs[String(uploadType)];
                  if (!converterConfig) {
                    throw new Error(`未知的上传类型: ${uploadType}`);
                  }

                  const scriptPath = path.join(projectRoot, 'scripts', converterConfig.scriptFile);
                  const tasksFileName = isThemeTarget ? converterConfig.themeTasksFileName : converterConfig.tasksFileName;
                  const commandArgs = [scriptPath, extractDir, pageName, '--target-type', String(targetType)];

                  console.log(`[${converterConfig.label} 转换] 执行预处理脚本:`, `node ${commandArgs.join(' ')}`);

                  try {
                    const commandResult = runCommandSync({
                      command: nodeCommand,
                      args: commandArgs,
                      cwd: projectRoot,
                    });

                    if (commandResult.status !== 0) {
                      throw new Error(commandResult.stderr || commandResult.stdout || `exit=${commandResult.status}`);
                    }
                    const output = commandResult.stdout;

                    console.log(`[${converterConfig.label} 转换] 执行成功:`, output);

                    const tasksFilePath = path.join(projectRoot, 'src', targetType, pageName, tasksFileName);
                    if (!fs.existsSync(tasksFilePath)) {
                      throw new Error(`任务文档生成失败: ${tasksFileName}`);
                    }

                    const tasksFileRelPath = `src/${targetType}/${pageName}/${tasksFileName}`;
                    const prompt = isThemeTarget
                      ? `${converterConfig.label} 项目已上传并预处理完成（主题模式）。\n\n请先在仓库中读取以下主题任务清单：\n- ${tasksFileRelPath}\n\n然后基于该任务清单和技能文档，完成主题拆分（输出到 \`src/themes/${pageName}/\`、\`src/docs/\`、\`src/database/\`）。`
                      : `${converterConfig.label} 项目已上传并预处理完成。\n\n请先在仓库中读取以下转换任务清单：\n- ${tasksFileRelPath}\n\n然后根据该任务清单和技能文档，完成具体的转换工作。`;

                    return sendJSON(res, 200, {
                      success: true,
                      uploadType,
                      pageName,
                      tasksFile: tasksFileRelPath,
                      prompt,
                      message: isThemeTarget ? '主题文件已导入完成，可继续交给 AI 进行主题拆分。' : '页面文件已导入完成，可继续交给 AI 完成转换。',
                      hint: '继续时直接把提示词发给 AI 即可，无需手动查看内部任务文档。',
                    });
                  } catch (scriptError: any) {
                    console.error(`[${converterConfig.label} 转换] 执行失败:`, scriptError);

                    const pageBaseDir = path.join(projectRoot, 'src', targetType);
                    const pageDir = path.join(pageBaseDir, pageName);
                    if (fs.existsSync(pageDir) && isSafeChildDir(pageBaseDir, pageDir)) {
                      fs.rmSync(pageDir, { recursive: true, force: true });
                    } else if (fs.existsSync(pageDir)) {
                      console.error(`[${converterConfig.label} 转换] 跳过不安全目录清理:`, pageDir);
                    }

                    return sendJSON(res, 500, {
                      error: `预处理脚本执行失败: ${scriptError.message}`,
                      details: scriptError.stderr || scriptError.stdout || scriptError.message
                    });
                  }
                } catch (e: any) {
                  console.error('[文件系统 API] 解压失败:', e);
                  if (e?.code === 'ENAMETOOLONG') {
                    return sendJSON(res, 500, {
                      error:
                        '解压失败：ZIP 内部路径过长（超出系统限制）。请解压后上传文件夹，或缩短文件名后重试。',
                    });
                  }
                  return sendJSON(res, 500, { error: `解压失败: ${e.message}` });
                }
              }

              // 未知类型
              return sendJSON(res, 400, { error: `不支持的上传类型: ${uploadType}` });
            } catch (e: any) {
              console.error('[文件系统 API] 文件处理失败:', e);
              return sendJSON(res, 500, { error: e.message || 'File processing failed' });
            }
          });
        } catch (e: any) {
          console.error('[文件系统 API] 上传失败:', e);
          sendJSON(res, 500, { error: e.message || 'Upload failed' });
        }
      });

      // ==================== /api/upload-screenshots ====================
      server.middlewares.use('/api/upload-screenshots', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const form = formidable({
            uploadDir: path.join(projectRoot, 'temp'),
            keepExtensions: true,
            maxFileSize: 20 * 1024 * 1024, // 20MB per image
            multiples: true,
          });

          form.parse(req, async (err: any, fields: any, files: any) => {
            if (err) {
              console.error('[文件系统 API] 截图上传解析失败:', err);
              return sendJSON(res, 500, { error: 'Upload parsing failed' });
            }

            try {
              const getFieldValue = (field: any) => Array.isArray(field) ? field[0] : field;

              const rawBatchId = getFieldValue(fields.batchId);
              const targetType = getFieldValue(fields.targetType);
              const batchId = (typeof rawBatchId === 'string' ? rawBatchId : '')
                .trim()
                .replace(/[^a-z0-9_-]/gi, '')
                .slice(0, 64);

              if (
                targetType
                && !SUPPORTED_UPLOAD_TARGET_TYPES.includes(String(targetType) as (typeof SUPPORTED_UPLOAD_TARGET_TYPES)[number])
              ) {
                return sendJSON(res, 400, {
                  error: `Invalid targetType: ${targetType}. Supported targetType: ${SUPPORTED_UPLOAD_TARGET_TYPES.join(', ')}`
                });
              }

              const isThemeTarget = targetType === 'themes';

              const resolvedBatchId = batchId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              const screenshotsDir = path.join(projectRoot, 'temp', 'screenshots', resolvedBatchId);
              fs.mkdirSync(screenshotsDir, { recursive: true });

              const fileInput = (files.file ?? files.files) as any;
              const fileList = Array.isArray(fileInput) ? fileInput : (fileInput ? [fileInput] : []);

              if (fileList.length === 0) {
                return sendJSON(res, 400, { error: 'Missing file' });
              }

              const savedNames: string[] = [];

              for (const file of fileList) {
                const tempFilePath = file.filepath || file.path || file.tempFilePath;
                const originalFilename = file.originalFilename || file.name || file.filename || 'screenshot';

                if (!tempFilePath || !fs.existsSync(tempFilePath)) {
                  continue;
                }

                let safeName = path.basename(originalFilename).trim();
                safeName = safeName.replace(/[^\w.\- ]+/g, '-').replace(/\s+/g, '-');
                if (!safeName) safeName = 'screenshot';

                const ext = path.extname(safeName) || path.extname(originalFilename) || path.extname(tempFilePath) || '';
                const base = ext ? safeName.slice(0, -ext.length) : safeName;

                let candidate = `${base}${ext}`;
                let counter = 2;
                while (fs.existsSync(path.join(screenshotsDir, candidate))) {
                  candidate = `${base}-${counter}${ext}`;
                  counter += 1;
                }

                const destPath = path.join(screenshotsDir, candidate);
                moveFileWithFallback(tempFilePath, destPath);
                savedNames.push(candidate);
              }

              const entries = fs.readdirSync(screenshotsDir, { withFileTypes: true });
              const filePaths = entries
                .filter(entry => entry.isFile())
                .map(entry => normalizePath(path.join('temp', 'screenshots', resolvedBatchId, entry.name)))
                .sort((a, b) => a.localeCompare(b));

              const docs = isThemeTarget
                ? [
                    '/skills/screen-to-code/SKILL.md',
                    '/skills/screen-to-code/screenshot-collection.md',
                    ...THEME_IMPORT_SUB_SKILL_DOCS,
                  ]
                : [
                    '/skills/screen-to-code/SKILL.md',
                    '/skills/screen-to-code/screenshot-collection.md',
                  ];

              const prompt = isThemeTarget
                ? `**系统指令**：你将作为UI/UX 设计架构师 × 前端工程师（复合型），协助用户「基于截图导入并创建主题」。

请严格按以下技能文档执行：
${formatReferenceList(docs)}

截图清单（已上传到工作区）：
${filePaths.map(p => `- \`${p}\``).join('\n')}

先和用户确认 \`theme-key\` 与输出范围（是否需要文档/数据），然后基于截图生成主题 token、设计规范文档与主题示例入口，必要时补充 \`src/docs/\` 与 \`src/database/\`。`
                : `**系统指令**：你将作为UI/UX 设计架构师 × 前端工程师（复合型），协助用户「基于截图导入并创建页面/元素」。

请严格按以下技能文档执行（必须完整跑完 Phase 0 → 5）：
${formatReferenceList(docs)}

截图清单（已上传到工作区）：
${filePaths.map(p => `- \`${p}\``).join('\n')}

从 Phase 0 开始：先确认要生成页面还是元素、目标 name（kebab-case）、是否允许优化设计/交互；然后按文档产出抽象 JSON → 代码蓝图 → 再生成代码。`;

              return sendJSON(res, 200, {
                success: true,
                batchId: resolvedBatchId,
                files: filePaths,
                saved: savedNames,
                prompt,
                message: filePaths.length > 1 ? `已上传 ${filePaths.length} 张截图` : '已上传 1 张截图',
              });
            } catch (e: any) {
              console.error('[文件系统 API] 截图处理失败:', e);
              return sendJSON(res, 500, { error: e.message || 'File processing failed' });
            }
          });
        } catch (e: any) {
          console.error('[文件系统 API] 截图上传失败:', e);
          return sendJSON(res, 500, { error: e.message || 'Upload failed' });
        }
      });

      // ==================== /api/export-make ====================
      server.middlewares.use('/api/export-make', async (req: any, res: any) => {
        if (req.method !== 'GET') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const targetPath = (url.searchParams.get('path') || '').trim();

          if (!targetPath) {
            return sendJSON(res, 400, { error: 'Missing path parameter' });
          }

          if (!isSafeSrcTargetPath(targetPath)) {
            return sendJSON(res, 403, { error: 'Invalid path' });
          }

          const itemDir = path.join(projectRoot, 'src', targetPath);
          if (!fs.existsSync(itemDir) || !fs.statSync(itemDir).isDirectory()) {
            return sendJSON(res, 404, { error: 'Directory not found' });
          }

          const probe = url.searchParams.get('probe') === '1';
          const promptMode = url.searchParams.get('prompt') === '1';
          const snapshot = analyzeMakeAssets(itemDir, targetPath);

          if (probe) {
            return sendJSON(res, 200, {
              ok: true,
              path: targetPath,
              hasMakeAssets: snapshot.hasMakeAssets,
              lastExportedAt: snapshot.lastExportedAt,
              fileName: snapshot.fileName,
              hasCanvasFig: snapshot.hasCanvasFig,
              hasMetaJson: snapshot.hasMetaJson,
              hasAiChat: snapshot.hasAiChat,
              hasThumbnail: snapshot.hasThumbnail,
              hasManifest: snapshot.hasManifest,
              hasImagesDir: snapshot.hasImagesDir,
              imageCount: snapshot.imageCount,
              hasDriftRisk: snapshot.hasDriftRisk,
              driftReasons: snapshot.driftReasons,
            });
          }

          if (promptMode) {
            return sendJSON(res, 200, {
              ok: true,
              path: targetPath,
              hasMakeAssets: snapshot.hasMakeAssets,
              fileName: snapshot.fileName,
              hasDriftRisk: snapshot.hasDriftRisk,
              driftReasons: snapshot.driftReasons,
              prompt: buildMakeExportPrompt(targetPath),
            });
          }

          if (!snapshot.hasCanvasFig) {
            return sendJSON(res, 409, {
              error: '当前页面尚未生成 .fig 导出所需资产，请先复制 Prompt 让 AI 补齐。',
              hasMakeAssets: false,
              fileName: snapshot.fileName,
              hasDriftRisk: snapshot.hasDriftRisk,
              driftReasons: snapshot.driftReasons,
              prompt: buildMakeExportPrompt(targetPath),
            });
          }

          if (snapshot.hasDriftRisk) {
            return sendJSON(res, 409, {
              error: '检测到当前页面与 Figma 导出壳子可能未同步，请先按 Prompt 同步后再导出 .fig。',
              hasMakeAssets: true,
              fileName: snapshot.fileName,
              hasDriftRisk: true,
              driftReasons: snapshot.driftReasons,
              prompt: buildMakeExportPrompt(targetPath),
            });
          }

          const scriptPath = path.join(projectRoot, 'scripts', 'canvas-fig-sync.mjs');

          const packResult = runCommandSync({
            command: nodeCommand,
            args: [
              scriptPath,
              'pack',
              '--fig',
              snapshot.canvasFigPath,
              '--from',
              itemDir,
              '--prune-missing',
              '--sanitize-for-export',
              '--manifest',
              snapshot.manifestPath,
            ],
            cwd: projectRoot,
          });
          if (packResult.status !== 0) {
            throw new Error(packResult.stderr || packResult.stdout || `pack failed: exit=${packResult.status}`);
          }

          const inspectResult = runCommandSync({
            command: nodeCommand,
            args: [
              scriptPath,
              'inspect',
              '--fig',
              snapshot.canvasFigPath,
              '--manifest',
              snapshot.manifestPath,
            ],
            cwd: projectRoot,
          });
          if (inspectResult.status !== 0) {
            throw new Error(inspectResult.stderr || inspectResult.stdout || `inspect failed: exit=${inspectResult.status}`);
          }

          const meta = ensureMakeMeta(itemDir, targetPath);
          ensureMakeAiChat(itemDir);

          const fileNameBase = typeof meta?.file_name === 'string' && meta.file_name.trim()
            ? meta.file_name.trim()
            : path.basename(targetPath);
          const downloadFileName = fileNameBase.endsWith('.fig') ? fileNameBase : `${fileNameBase}.fig`;

          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Disposition', buildAttachmentContentDisposition(downloadFileName));

          try {
            const stream = fs.createReadStream(snapshot.canvasFigPath);
            stream.on('error', (streamError: any) => {
              console.error('[文件系统 API] export-make fig 读取失败:', streamError);
              if (!res.headersSent) {
                sendJSON(res, 500, { error: `读取 .fig 失败: ${streamError.message}` });
              } else {
                res.end();
              }
            });

            await new Promise<void>((resolve, reject) => {
              stream.on('end', resolve);
              stream.on('error', reject);
              res.on('close', resolve);
              stream.pipe(res);
            });
          } catch (streamError: any) {
            console.error('[文件系统 API] export-make fig 输出失败:', streamError);
            if (!res.headersSent) {
              return sendJSON(res, 500, { error: `输出 .fig 失败: ${streamError.message}` });
            }
          }
        } catch (e: any) {
          console.error('[文件系统 API] export-make 失败:', e);
          if (!res.headersSent) {
            sendJSON(res, 500, { error: e.message || 'Export make failed' });
          }
        }
      });

      // ==================== /api/zip ====================
      server.middlewares.use('/api/zip', async (req: any, res: any) => {
        if (req.method !== 'GET') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const targetPath = url.searchParams.get('path'); // e.g., 'prototypes/antd-demo'

          if (!targetPath) {
            return sendJSON(res, 400, { error: 'Missing path parameter' });
          }

          // 验证路径安全性
          if (targetPath.includes('..') || targetPath.startsWith('/')) {
            return sendJSON(res, 403, { error: 'Invalid path' });
          }

          const srcDir = path.join(projectRoot, 'src', targetPath);

          if (!fs.existsSync(srcDir)) {
            return sendJSON(res, 404, { error: 'Directory not found' });
          }

          const probe = url.searchParams.get('probe') === '1';
          const fileName = `${path.basename(targetPath)}.zip`;
          if (probe) {
            return sendJSON(res, 200, {
              ok: true,
              fileName,
              path: targetPath,
            });
          }

          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', buildAttachmentContentDisposition(fileName));

          // 使用 streaming 方式创建 ZIP（避免在内存中构建整个 zip buffer）
          try {
            const archive = new (archiver as any)('zip', { zlib: { level: 9 } });

            archive.on('warning', (warning: any) => {
              console.warn('[文件系统 API] ZIP warning:', warning);
            });

            archive.on('error', (zipError: any) => {
              console.error('[文件系统 API] ZIP 创建失败:', zipError);
              if (!res.headersSent) {
                sendJSON(res, 500, { error: `创建 ZIP 失败: ${zipError.message}` });
              } else {
                res.end();
              }
            });

            archive.pipe(res);
            archive.directory(srcDir, false);

            await new Promise<void>((resolve) => {
              res.on('close', resolve);
              res.on('finish', resolve);
              archive.on('error', resolve);
              archive.finalize();
            });
          } catch (zipError: any) {
            console.error('[文件系统 API] ZIP 创建失败:', zipError);
            if (!res.headersSent) {
              return sendJSON(res, 500, { error: `创建 ZIP 失败: ${zipError.message}` });
            }
          }
        } catch (e: any) {
          console.error('[文件系统 API] zip 失败:', e);
          if (!res.headersSent) {
            sendJSON(res, 500, { error: e.message || 'Zip failed' });
          }
        }
      });

      // ==================== /api/copy ====================
      server.middlewares.use('/api/copy', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          return sendJSON(res, 405, { error: 'Method not allowed' });
        }

        try {
          const { sourcePath, targetPath } = await parseBody(req);

          if (!sourcePath || !targetPath) {
            return sendJSON(res, 400, { error: 'Missing sourcePath or targetPath parameter' });
          }

          // 验证路径安全性
          if (sourcePath.includes('..') || targetPath.includes('..')) {
            return sendJSON(res, 403, { error: 'Invalid path' });
          }

          // 验证目标路径不包含中文字符
          const targetFolderName = path.basename(targetPath);
          if (/[\u4e00-\u9fa5]/.test(targetFolderName)) {
            return sendJSON(res, 400, { error: 'Target folder name cannot contain Chinese characters' });
          }

          // sourcePath 和 targetPath 格式: src/components/xxx 或 src/prototypes/xxx
          const sourceDir = path.join(projectRoot, sourcePath);
          const targetDir = path.join(projectRoot, targetPath);

          if (!fs.existsSync(sourceDir)) {
            return sendJSON(res, 404, { error: 'Source directory not found' });
          }

          if (fs.existsSync(targetDir)) {
            return sendJSON(res, 409, { error: 'Target directory already exists' });
          }

          // 复制目录
          copyDir(sourceDir, targetDir);

          // 更新副本的 @name 注释
          const indexFiles = ['index.tsx', 'index.ts', 'index.jsx', 'index.js'];
          let indexFilePath: string | null = null;
          
          for (const fileName of indexFiles) {
            const filePath = path.join(targetDir, fileName);
            if (fs.existsSync(filePath)) {
              indexFilePath = filePath;
              break;
            }
          }

          if (indexFilePath) {
            try {
              let content = fs.readFileSync(indexFilePath, 'utf8');
              
              // 提取文件夹名中的副本编号
              const copyMatch = targetFolderName.match(/-copy(\d*)$/);
              let copySuffix = '副本';
              if (copyMatch) {
                const copyNum = copyMatch[1];
                copySuffix = copyNum ? `副本${copyNum}` : '副本';
              }
              
              // 更新 @name 注释
              content = content.replace(
                /(@name\s+)([^\n]+)/,
                (match, prefix, name) => {
                  // 如果名称已经包含"副本"，先移除
                  const cleanName = name.replace(/\s*副本\d*\s*$/, '').trim();
                  return `${prefix}${cleanName} ${copySuffix}`;
                }
              );
              
              fs.writeFileSync(indexFilePath, content, 'utf8');
            } catch (e) {
              console.error('[文件系统 API] 更新 @name 注释失败:', e);
              // 不影响主流程，继续执行
            }
          }

          sendJSON(res, 200, { success: true });
        } catch (e: any) {
          console.error('[文件系统 API] 复制失败:', e);
          sendJSON(res, 500, { error: e.message || 'Copy failed' });
        }
      });
    }
  };
}
