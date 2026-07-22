#!/usr/bin/env node

/**
 * Figma Make 项目预处理器（最小化处理模式）
 *
 * 只做 100% 有把握的操作：
 * 1. 完整复制项目
 * 2. 转换 @/ 路径别名
 * 3. 转换 package@version 导入
 * 4. 分析项目结构
 * 5. 生成任务文档
 *
 * 不做任何组件逻辑改写，全部留给 AI 处理
 *
 * 约定输入：
 * - 这里接收的 projectDir 应来自 Figma 原始导出的 ZIP 工程包解压结果
 * - 不建议传入人工整理过的文件夹，以免破坏官方项目结构
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_TYPE_TO_SRC_DIR = {
  prototypes: 'src/prototypes',
  components: 'src/components',
  themes: 'src/themes',
};

const THEME_SPLIT_SKILL_DOCS = [
  '/skills/axure-prototype-workflow/theme-generation.md',
  '/skills/axure-prototype-workflow/doc-generation.md',
  '/skills/axure-prototype-workflow/data-generation.md',
  '/skills/web-page-workflow/theme-generation.md',
  '/skills/web-page-workflow/doc-generation.md',
  '/skills/web-page-workflow/data-generation.md',
];

const CODE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'];
const IGNORED_DIRS = new Set(['node_modules', '.npm-local-cache', 'build']);

const CONFIG = {
  projectRoot: path.resolve(__dirname, '..'),
};

function log(message, type = 'info') {
  const prefix = { info: '✓', warn: '⚠', error: '✗', progress: '⏳' }[type] || 'ℹ';
  console.log(`${prefix} ${message}`);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sanitizeName(rawName) {
  return String(rawName || '')
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function normalizeSlashes(input) {
  return String(input || '').replace(/\\/g, '/');
}

function ensureRelativeSpecifier(specifier) {
  const normalized = normalizeSlashes(specifier);
  if (normalized.startsWith('.')) return normalized;
  return `./${normalized}`;
}

function countUniqueCssVariables(content) {
  const matches = content.matchAll(/--([a-z0-9-_]+)\s*:/gi);
  const names = new Set();
  for (const match of matches) {
    if (match[1]) {
      names.add(match[1]);
    }
  }
  return names.size;
}

function getTargetInfo(targetType, outputName) {
  const srcDir = TARGET_TYPE_TO_SRC_DIR[targetType];
  const outputBaseDir = path.resolve(CONFIG.projectRoot, srcDir);
  const outputDir = path.join(outputBaseDir, outputName);
  const relativeOutputDir = `${srcDir}/${outputName}`;

  if (targetType === 'themes') {
    return {
      targetType,
      srcDir,
      outputBaseDir,
      outputDir,
      relativeOutputDir,
      tasksFileName: '.figma-make-theme-tasks.md',
      analysisFileName: '.figma-make-theme-analysis.json',
      checkPath: `/themes/${outputName}`,
      label: '主题',
    };
  }

  return {
    targetType,
    srcDir,
    outputBaseDir,
    outputDir,
    relativeOutputDir,
    tasksFileName: '.figma-make-tasks.md',
    analysisFileName: '.figma-make-analysis.json',
    checkPath: `/${targetType}/${outputName}`,
    label: targetType === 'components' ? '组件' : '页面',
  };
}

function walkFiles(dir, options = {}) {
  const {
    extensions = null,
    includeAllFiles = false,
  } = options;
  const results = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, options));
      continue;
    }

    if (includeAllFiles) {
      results.push(fullPath);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!extensions || extensions.includes(ext)) {
      results.push(fullPath);
    }
  }

  return results;
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) return 0;
  ensureDir(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += copyDirectory(srcPath, destPath);
      continue;
    }

    fs.copyFileSync(srcPath, destPath);
    count += 1;
  }

  return count;
}

function parsePackageSpecifier(specifier) {
  if (!specifier || specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('#')) {
    return null;
  }

  if (specifier.startsWith('@/')) {
    return null;
  }

  if (specifier.startsWith('@')) {
    const firstSlash = specifier.indexOf('/');
    if (firstSlash === -1) return null;
    const secondSlash = specifier.indexOf('/', firstSlash + 1);
    const packageWithVersion = secondSlash === -1 ? specifier : specifier.slice(0, secondSlash);
    const rest = secondSlash === -1 ? '' : specifier.slice(secondSlash);
    const match = packageWithVersion.match(/^(@[^/]+\/[^@/]+)@(.+)$/);
    if (!match) return null;
    return {
      packageName: match[1],
      version: match[2],
      normalized: `${match[1]}${rest}`,
    };
  }

  const slashIndex = specifier.indexOf('/');
  const packageWithVersion = slashIndex === -1 ? specifier : specifier.slice(0, slashIndex);
  const rest = slashIndex === -1 ? '' : specifier.slice(slashIndex);
  const match = packageWithVersion.match(/^([^@/]+)@(.+)$/);
  if (!match) return null;

  return {
    packageName: match[1],
    version: match[2],
    normalized: `${match[1]}${rest}`,
  };
}

function replaceAliasAndVersionImports(targetDir) {
  const srcRoot = path.join(targetDir, 'src');
  const files = walkFiles(targetDir, { extensions: CODE_EXTENSIONS });
  const pathAliases = [];
  const versionedImports = [];
  let processedCount = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    const relativeFilePath = normalizeSlashes(path.relative(targetDir, file));

    content = content.replace(
      /((?:from|import|export)\s*(?:[^'"]*?\sfrom\s*)?['"])@\/([^'"]+)(['"])/g,
      (fullMatch, prefix, targetPath, suffix) => {
        const resolvedTarget = path.join(srcRoot, targetPath);
        const relativeSpecifier = ensureRelativeSpecifier(path.relative(path.dirname(file), resolvedTarget));
        pathAliases.push({
          file: relativeFilePath,
          original: `@/${targetPath}`,
          replacement: normalizeSlashes(relativeSpecifier),
        });
        return `${prefix}${normalizeSlashes(relativeSpecifier)}${suffix}`;
      },
    );

    content = content.replace(
      /(\bimport\s*\(\s*['"])([^'"]+)(['"]\s*\))/g,
      (fullMatch, prefix, specifier, suffix) => {
        if (specifier.startsWith('@/')) {
          const targetPath = specifier.slice(2);
          const resolvedTarget = path.join(srcRoot, targetPath);
          const relativeSpecifier = ensureRelativeSpecifier(path.relative(path.dirname(file), resolvedTarget));
          pathAliases.push({
            file: relativeFilePath,
            original: specifier,
            replacement: normalizeSlashes(relativeSpecifier),
          });
          return `${prefix}${normalizeSlashes(relativeSpecifier)}${suffix}`;
        }

        const parsed = parsePackageSpecifier(specifier);
        if (!parsed) return fullMatch;
        versionedImports.push({
          file: relativeFilePath,
          original: specifier,
          replacement: parsed.normalized,
          packageName: parsed.packageName,
          version: parsed.version,
        });
        return `${prefix}${parsed.normalized}${suffix}`;
      },
    );

    content = content.replace(
      /((?:from|import|export)\s*(?:[^'"]*?\sfrom\s*)?['"])([^'"]+)(['"])/g,
      (fullMatch, prefix, specifier, suffix) => {
        const parsed = parsePackageSpecifier(specifier);
        if (!parsed) return fullMatch;
        versionedImports.push({
          file: relativeFilePath,
          original: specifier,
          replacement: parsed.normalized,
          packageName: parsed.packageName,
          version: parsed.version,
        });
        return `${prefix}${parsed.normalized}${suffix}`;
      },
    );

    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      processedCount += 1;
    }
  }

  return {
    processedCount,
    pathAliases,
    versionedImports,
  };
}

function parseImports(content) {
  const imports = [];
  const importMatches = content.matchAll(/(?:from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\))/g);
  for (const match of importMatches) {
    const specifier = match[1] || match[2];
    if (specifier) {
      imports.push(specifier);
    }
  }
  return imports;
}

function parseVersionedAliases(viteContent) {
  const aliasMap = new Map();

  const objectMatches = viteContent.matchAll(/['"]([^'"]+@[^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g);
  for (const match of objectMatches) {
    aliasMap.set(match[1], match[2]);
  }

  const arrayMatches = viteContent.matchAll(/find\s*:\s*['"]([^'"]+@[^'"]+)['"][\s\S]*?replacement\s*:\s*['"]([^'"]+)['"]/g);
  for (const match of arrayMatches) {
    aliasMap.set(match[1], match[2]);
  }

  return Array.from(aliasMap.entries()).map(([find, replacement]) => {
    const parsed = parsePackageSpecifier(find);
    return {
      find,
      replacement,
      packageName: parsed?.packageName || replacement,
      version: parsed?.version || '',
    };
  });
}

function detectAtAlias(viteContent) {
  const objectMatch = viteContent.match(/['"]@['"]\s*:\s*['"]([^'"]+)['"]/);
  if (objectMatch) return objectMatch[1];

  const arrayMatch = viteContent.match(/find\s*:\s*['"]@['"][\s\S]*?replacement\s*:\s*['"]([^'"]+)['"]/);
  return arrayMatch ? arrayMatch[1] : '';
}

function resolveOptionalPath(targetDir, candidates) {
  for (const candidate of candidates) {
    const fullPath = path.join(targetDir, candidate);
    if (fs.existsSync(fullPath)) {
      return {
        exists: true,
        path: candidate,
        absolutePath: fullPath,
      };
    }
  }

  return {
    exists: false,
    path: '',
    absolutePath: '',
  };
}

function countFilesRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;

  let total = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += countFilesRecursive(fullPath);
    } else if (entry.isFile()) {
      total += 1;
    }
  }
  return total;
}

function collectFigmaMakeAssets(targetDir) {
  const imagesDir = path.join(targetDir, 'images');
  return {
    hasCanvasFig: fs.existsSync(path.join(targetDir, 'canvas.fig')),
    hasMetaJson: fs.existsSync(path.join(targetDir, 'meta.json')),
    hasAiChat: fs.existsSync(path.join(targetDir, 'ai_chat.json')),
    hasThumbnail: fs.existsSync(path.join(targetDir, 'thumbnail.png')),
    hasImagesDir: fs.existsSync(imagesDir),
    hasCodeManifest: fs.existsSync(path.join(targetDir, 'canvas.code-manifest.json')),
    imageCount: countFilesRecursive(imagesDir),
  };
}

function analyzeProject(targetDir, conversionResult) {
  const srcDir = path.join(targetDir, 'src');
  const allFiles = walkFiles(targetDir, { includeAllFiles: true });
  const codeFiles = walkFiles(targetDir, { extensions: CODE_EXTENSIONS });
  const pageFiles = walkFiles(path.join(srcDir, 'pages'), { extensions: ['.tsx', '.ts', '.jsx', '.js'] })
    .map((file) => normalizeSlashes(path.relative(targetDir, file)));
  const componentFiles = walkFiles(path.join(srcDir, 'components'), { extensions: ['.tsx', '.ts', '.jsx', '.js'] })
    .map((file) => normalizeSlashes(path.relative(targetDir, file)));

  const files = codeFiles.map((file) => {
    const relativePath = normalizeSlashes(path.relative(targetDir, file));
    const content = fs.readFileSync(file, 'utf8');
    const imports = parseImports(content);
    return {
      path: relativePath,
      importCount: imports.length,
      imports: imports.slice(0, 25),
      containsRouteHint: /createBrowserRouter|Routes|Route|react-router/i.test(content),
      usesCssVariables: /var\(--[a-z0-9-_]+\)/i.test(content),
    };
  });

  const packageJsonPath = path.join(targetDir, 'package.json');
  let dependencies = {
    all: {},
    toInstall: [],
    excluded: ['react', 'react-dom', 'next-themes'],
  };

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = packageJson.dependencies || {};
    dependencies = {
      all: allDeps,
      toInstall: Object.keys(allDeps).filter((dep) => {
        return dep !== 'react' && dep !== 'react-dom' && dep !== 'next-themes';
      }),
      excluded: ['react', 'react-dom', 'next-themes'],
    };
  }

  const viteConfigInfo = resolveOptionalPath(targetDir, ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs']);
  const viteContent = viteConfigInfo.exists ? fs.readFileSync(viteConfigInfo.absolutePath, 'utf8') : '';
  const versionedAliases = viteContent ? parseVersionedAliases(viteContent) : [];
  const atAliasReplacement = viteContent ? detectAtAlias(viteContent) : '';

  const indexCssInfo = resolveOptionalPath(targetDir, ['src/index.css']);
  const globalsCssInfo = resolveOptionalPath(targetDir, ['src/styles/globals.css']);
  const designGuideInfo = resolveOptionalPath(targetDir, ['src/DESIGN_SYSTEM_GUIDE.md', 'DESIGN_SYSTEM_GUIDE.md']);
  const tokenReferenceInfo = resolveOptionalPath(targetDir, ['src/TOKEN_REFERENCE.md', 'TOKEN_REFERENCE.md']);
  const figmaMakeAssets = collectFigmaMakeAssets(targetDir);

  const indexCssContent = indexCssInfo.exists ? fs.readFileSync(indexCssInfo.absolutePath, 'utf8') : '';
  const globalsCssContent = globalsCssInfo.exists ? fs.readFileSync(globalsCssInfo.absolutePath, 'utf8') : '';

  return {
    summary: {
      totalFiles: allFiles.length,
      codeFileCount: codeFiles.length,
      componentCount: componentFiles.length,
      pageCount: pageFiles.length,
      pathAliasCount: conversionResult.pathAliases.length,
      versionedImportCount: conversionResult.versionedImports.length,
      versionedAliasCount: versionedAliases.length,
      dependenciesToInstall: dependencies.toInstall.length,
      cssVariableCount: countUniqueCssVariables(`${indexCssContent}\n${globalsCssContent}`),
      designDocCount: [designGuideInfo.exists, tokenReferenceInfo.exists].filter(Boolean).length,
    },
    structure: {
      hasSrcDir: fs.existsSync(srcDir),
      hasAppTsx: fs.existsSync(path.join(srcDir, 'App.tsx')),
      hasMainTsx: fs.existsSync(path.join(srcDir, 'main.tsx')),
      hasPagesDir: fs.existsSync(path.join(srcDir, 'pages')),
      hasComponentsDir: fs.existsSync(path.join(srcDir, 'components')),
      hasGuidelinesDir: fs.existsSync(path.join(srcDir, 'guidelines')),
      hasBuildDir: fs.existsSync(path.join(targetDir, 'build')),
      hasViteConfig: viteConfigInfo.exists,
      hasIndexHtml: fs.existsSync(path.join(targetDir, 'index.html')),
      hasIndexCss: indexCssInfo.exists,
      hasGlobalsCss: globalsCssInfo.exists,
    },
    entryFiles: {
      appTsx: fs.existsSync(path.join(srcDir, 'App.tsx')) ? 'src/App.tsx' : '',
      mainTsx: fs.existsSync(path.join(srcDir, 'main.tsx')) ? 'src/main.tsx' : '',
      indexHtml: fs.existsSync(path.join(targetDir, 'index.html')) ? 'index.html' : '',
      pagesDir: fs.existsSync(path.join(srcDir, 'pages')) ? 'src/pages' : '',
      pageFiles,
    },
    pathAliases: conversionResult.pathAliases,
    versionedImports: conversionResult.versionedImports,
    versionedAliases,
    dependencies,
    css: {
      hasIndexCss: indexCssInfo.exists,
      indexCssPath: indexCssInfo.path,
      indexCssSize: indexCssContent.length,
      hasGlobalsCss: globalsCssInfo.exists,
      globalsCssPath: globalsCssInfo.path,
      globalsCssSize: globalsCssContent.length,
      cssVariableCount: countUniqueCssVariables(`${indexCssContent}\n${globalsCssContent}`),
      prefersGlobalsCssAsSource: globalsCssInfo.exists,
      atAliasReplacement,
    },
    docs: {
      designSystemGuide: {
        exists: designGuideInfo.exists,
        path: designGuideInfo.path,
      },
      tokenReference: {
        exists: tokenReferenceInfo.exists,
        path: tokenReferenceInfo.path,
      },
    },
    figmaMakeAssets,
    files,
  };
}

function writeAnalysisReport(report, targetInfo) {
  const reportPath = path.join(targetInfo.outputDir, targetInfo.analysisFileName);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  return reportPath;
}

function renderDocLine(docInfo) {
  return docInfo.exists ? `\`${docInfo.path}\`` : '未提供';
}

function generateDefaultTasksDocument(report, targetInfo, outputName, tempDir) {
  const reportPath = writeAnalysisReport(report, targetInfo);

  let markdown = '# Figma Make 项目转换任务清单\n\n';
  markdown += '> **重要**: 请先阅读 `/skills/figma-make-project-converter/SKILL.md` 了解转换规范\n\n';
  markdown += `**名称**: ${outputName}\n`;
  markdown += `**项目位置**: \`${targetInfo.relativeOutputDir}/\`\n`;
  markdown += `**原始文件**: \`${tempDir}\` (仅供参考，不要修改)\n`;
  markdown += `**生成时间**: ${new Date().toLocaleString()}\n\n`;

  if (
    report.figmaMakeAssets.hasCanvasFig
    || report.figmaMakeAssets.hasMetaJson
    || report.figmaMakeAssets.hasAiChat
    || report.figmaMakeAssets.hasThumbnail
    || report.figmaMakeAssets.hasImagesDir
    || report.figmaMakeAssets.hasCodeManifest
  ) {
    markdown += '## ⚠️ 注意：保留 Figma Make 原始资产\n\n';
    markdown += '此项目从 Figma Make 导入，以下文件必须保留，用于后续导出 `名称.fig`：\n';
    if (report.figmaMakeAssets.hasCanvasFig) markdown += '- `canvas.fig` — Figma 设计数据（二进制，勿修改）\n';
    if (report.figmaMakeAssets.hasMetaJson) markdown += '- `meta.json` — 项目元数据\n';
    if (report.figmaMakeAssets.hasAiChat) markdown += '- `ai_chat.json` — AI 聊天历史\n';
    if (report.figmaMakeAssets.hasThumbnail) markdown += '- `thumbnail.png` — 项目缩略图\n';
    if (report.figmaMakeAssets.hasCodeManifest) markdown += '- `canvas.code-manifest.json` — CODE_FILE 索引清单\n';
    if (report.figmaMakeAssets.hasImagesDir) {
      markdown += `- \`images/\` — 设计稿图片资源（当前 ${report.figmaMakeAssets.imageCount} 个文件）\n`;
    }
    markdown += '\n';
  }

  markdown += '## 📊 项目概况\n\n';
  markdown += `- 总文件数: ${report.summary.totalFiles}\n`;
  markdown += `- 组件数: ${report.summary.componentCount}\n`;
  markdown += `- 页面数: ${report.summary.pageCount}\n`;
  markdown += `- ~~路径别名 (@/)~~: ${report.summary.pathAliasCount} 处，已由脚本转换\n`;
  markdown += `- ~~版本化导入~~: ${report.summary.versionedImportCount} 处，已改为裸包名\n`;
  markdown += `- vite 版本化 alias: ${report.summary.versionedAliasCount} 处（仅保留为参考信息）\n`;
  markdown += `- 待安装依赖: ${report.summary.dependenciesToInstall} 个\n`;
  markdown += `- CSS 变量: ${report.summary.cssVariableCount} 个\n\n`;

  markdown += '## 🧱 固定目录结构（必须遵守）\n\n';
  markdown += '```text\n';
  markdown += `${targetInfo.relativeOutputDir}/\n`;
  markdown += '├── index.tsx          # Axhub runtime adapter only\n';
  markdown += '├── style.css          # root style bridge only\n';
  markdown += '└── src/\n';
  markdown += '    ├── App.tsx        # Figma export shell only\n';
  markdown += '    ├── main.tsx       # Vite mount only\n';
  markdown += '    ├── index.css      # Figma style bridge only\n';
  markdown += '    ├── components/    # shared page implementation\n';
  markdown += '    └── styles/        # shared page styles\n';
  markdown += '```\n\n';
  markdown += '要求：\n';
  markdown += '- 页面真实视觉和交互主体优先沉淀在 `src/components/**`\n';
  markdown += '- 根目录 `index.tsx` 只做 Axhub 运行时适配，不复制页面视觉实现\n';
  markdown += '- `src/App.tsx` 只做 Figma 导出薄壳，不复制页面逻辑\n';
  markdown += '- `style.css` / `src/index.css` 只做样式桥接，避免重复堆样式\n';
  markdown += '- 在 `index.tsx`、`src/App.tsx`、`src/main.tsx` 顶部写职责注释，提醒后续维护者不要让入口漂移\n\n';
  markdown += '> 若最终项目不符合这套固定结构，视为转换未完成，应继续重构后再进入后续任务。\n\n';

  markdown += '## ✅ 转换任务（共 6 个）\n\n';

  markdown += '### 任务 1: 确定页面入口并创建 `index.tsx`\n\n';
  markdown += `**候选入口**:\n`;
  if (report.entryFiles.appTsx) markdown += `- \`${targetInfo.relativeOutputDir}/${report.entryFiles.appTsx}\`\n`;
  if (report.entryFiles.mainTsx) markdown += `- \`${targetInfo.relativeOutputDir}/${report.entryFiles.mainTsx}\`\n`;
  if (report.entryFiles.pageFiles.length > 0) {
    markdown += `- \`${targetInfo.relativeOutputDir}/src/pages/\` 下共有 ${report.entryFiles.pageFiles.length} 个页面文件\n`;
  }
  markdown += '\n';
  markdown += '**操作**:\n';
  markdown += '1. 按照 `/skills/figma-make-project-converter/SKILL.md` 的页面组件规范创建 `index.tsx`\n';
  markdown += '2. 优先使用 `src/App.tsx` 作为汇总入口；若存在多页面路由，则收敛为本项目单入口组件\n';
  markdown += '3. 不保留对 Figma Make 原始 `main.tsx` 挂载逻辑的依赖\n';
  markdown += '4. 在 `index.tsx` 顶部写注释，明确它只是 Axhub runtime adapter\n\n';
  markdown += '> 若页面后续还要重新导出 `名称.fig`，请确保导出壳子 `src/App.tsx` 最终仍能表达当前页面真实内容，避免它与根目录 `index.tsx` 漂移。\n\n';

  markdown += '### 任务 2: 创建 `style.css`\n\n';
  markdown += '**目标**: 按约定使用 `globals.css` 作为主样式来源\n\n';
  markdown += '**操作**:\n';
  markdown += '1. 创建 `style.css`，第一行固定为 `@import "tailwindcss";`\n';
  if (report.css.hasGlobalsCss) {
    markdown += `2. 以 \`${targetInfo.relativeOutputDir}/${report.css.globalsCssPath}\` 作为主要样式来源\n`;
  } else {
    markdown += '2. 未发现 `src/styles/globals.css`，需要 AI 从现有组件样式中补齐基础样式\n';
  }
  if (report.css.hasIndexCss) {
    markdown += `3. \`${targetInfo.relativeOutputDir}/${report.css.indexCssPath}\` 仅作为视觉回归参考，不直接搬运为最终 \`style.css\`\n`;
  }
  markdown += '4. 在 `style.css` 与 `src/index.css` 中保留注释，明确它们只是样式桥接层\n';
  markdown += '\n';

  markdown += '### 任务 3: 清理 Figma Make 运行时耦合\n\n';
  markdown += '**脚本已完成**:\n';
  markdown += `- ~~转换 \`@/\` 路径别名~~ ✓ 已完成（${report.summary.pathAliasCount} 处）\n`;
  markdown += `- ~~转换 \`package@version\` 导入~~ ✓ 已完成（${report.summary.versionedImportCount} 处）\n\n`;
  markdown += '**仍需处理**:\n';
  markdown += '- 不再依赖 `vite.config.ts` 中的 alias 作为运行前提\n';
  markdown += '- 可保留 `vite.config.ts` 作为参考，但最终组件需独立运行\n';
  markdown += '- 不保留原始 Vite 挂载入口与多页面路由壳层\n';
  markdown += '- `src/App.tsx` 与 `src/main.tsx` 顶部要写职责注释，避免后续维护时误塞页面逻辑\n\n';

  markdown += '### 任务 4: 收敛多页面/路由结构\n\n';
  markdown += '**目标**: 将 Figma Make 的多页面应用收敛为本项目单入口页面组件\n\n';
  markdown += '**操作**:\n';
  markdown += '- 保留页面视觉层级与主要交互结构\n';
  markdown += '- 将路由切换逻辑合并为单页面展示或局部状态切换\n';
  markdown += '- 不强行保留浏览器路由壳层\n\n';

  markdown += '### 任务 5: 安装依赖\n\n';
  if (report.dependencies.toInstall.length > 0) {
    markdown += '**执行命令**:\n';
    markdown += '```bash\n';
    markdown += `pnpm add ${report.dependencies.toInstall.join(' ')}\n`;
    markdown += '```\n\n';
    markdown += `**已排除**: ${report.dependencies.excluded.map((item) => `\`${item}\``).join('、')}\n\n`;
  } else {
    markdown += '✓ 无需安装额外依赖\n\n';
  }

  markdown += '### 任务 6: 验收测试\n\n';
  markdown += '**执行命令**:\n';
  markdown += '```bash\n';
  markdown += `node scripts/check-app-ready.mjs ${targetInfo.checkPath}\n`;
  markdown += '```\n\n';
  markdown += '**验收要求**: 页面正常渲染、无控制台错误、主视觉与原项目一致\n\n';

  markdown += '## 📚 可直接利用的设计资料\n\n';
  markdown += `- DESIGN_SYSTEM_GUIDE.md: ${renderDocLine(report.docs.designSystemGuide)}\n`;
  markdown += `- TOKEN_REFERENCE.md: ${renderDocLine(report.docs.tokenReference)}\n\n`;

  markdown += '## 📎 产物索引\n\n';
  markdown += `- 任务清单: \`${targetInfo.tasksFileName}\`\n`;
  markdown += `- 分析报告: \`${targetInfo.analysisFileName}\`\n`;
  markdown += '- 转换规范: `/skills/figma-make-project-converter/SKILL.md`\n';

  const mdPath = path.join(targetInfo.outputDir, targetInfo.tasksFileName);
  fs.writeFileSync(mdPath, markdown);

  return { reportPath, mdPath };
}

function generateThemeTasksDocument(report, targetInfo, outputName, tempDir) {
  const reportPath = writeAnalysisReport(report, targetInfo);

  let markdown = '# Figma Make 主题导入任务清单\n\n';
  markdown += '> **重要**: 请先阅读 `/skills/figma-make-project-converter/SKILL.md` 与主题拆分技能文档，按任务顺序执行\n\n';
  markdown += `**主题 key**: ${outputName}\n`;
  markdown += `**主题目录**: \`${targetInfo.relativeOutputDir}/\`\n`;
  markdown += `**原始文件**: \`${tempDir}\` (仅供参考，不要修改)\n`;
  markdown += `**生成时间**: ${new Date().toLocaleString()}\n\n`;

  if (
    report.figmaMakeAssets.hasCanvasFig
    || report.figmaMakeAssets.hasMetaJson
    || report.figmaMakeAssets.hasAiChat
    || report.figmaMakeAssets.hasThumbnail
    || report.figmaMakeAssets.hasImagesDir
    || report.figmaMakeAssets.hasCodeManifest
  ) {
    markdown += '## ⚠️ 注意：保留 Figma Make 原始资产\n\n';
    markdown += '此项目从 Figma Make 导入，以下文件必须保留，用于后续导出 `名称.fig`：\n';
    if (report.figmaMakeAssets.hasCanvasFig) markdown += '- `canvas.fig` — Figma 设计数据（二进制，勿修改）\n';
    if (report.figmaMakeAssets.hasMetaJson) markdown += '- `meta.json` — 项目元数据\n';
    if (report.figmaMakeAssets.hasAiChat) markdown += '- `ai_chat.json` — AI 聊天历史\n';
    if (report.figmaMakeAssets.hasThumbnail) markdown += '- `thumbnail.png` — 项目缩略图\n';
    if (report.figmaMakeAssets.hasCodeManifest) markdown += '- `canvas.code-manifest.json` — CODE_FILE 索引清单\n';
    if (report.figmaMakeAssets.hasImagesDir) {
      markdown += `- \`images/\` — 设计稿图片资源（当前 ${report.figmaMakeAssets.imageCount} 个文件）\n`;
    }
    markdown += '\n';
  }

  markdown += '## 📊 输入概况\n\n';
  markdown += `- 总文件数: ${report.summary.totalFiles}\n`;
  markdown += `- 组件数: ${report.summary.componentCount}\n`;
  markdown += `- 页面数: ${report.summary.pageCount}\n`;
  markdown += `- CSS 变量: ${report.summary.cssVariableCount}\n`;
  markdown += `- 版本化 alias: ${report.summary.versionedAliasCount} 处\n`;
  markdown += `- 待评估依赖: ${report.summary.dependenciesToInstall} 个\n\n`;

  markdown += '## 📚 参考文档（必须阅读）\n\n';
  markdown += '- `/skills/figma-make-project-converter/SKILL.md`\n';
  THEME_SPLIT_SKILL_DOCS.forEach((docPath) => {
    markdown += `- \`${docPath}\`\n`;
  });
  markdown += '\n';

  markdown += '## 🧭 可利用的设计输入\n\n';
  markdown += `- DESIGN_SYSTEM_GUIDE.md: ${renderDocLine(report.docs.designSystemGuide)}\n`;
  markdown += `- TOKEN_REFERENCE.md: ${renderDocLine(report.docs.tokenReference)}\n`;
  markdown += report.css.hasGlobalsCss
    ? `- 主题主样式参考: \`${targetInfo.relativeOutputDir}/${report.css.globalsCssPath}\`\n`
    : '- 主题主样式参考: 未找到 `src/styles/globals.css`\n';
  markdown += report.css.hasIndexCss
    ? `- 视觉回归参考: \`${targetInfo.relativeOutputDir}/${report.css.indexCssPath}\`\n\n`
    : '- 视觉回归参考: 未找到 `src/index.css`\n\n';

  markdown += '## ✅ 主题导入任务（共 5 个）\n\n';

  markdown += '### 任务 1：生成主题 token\n\n';
  markdown += `**目标**：在 \`${targetInfo.relativeOutputDir}/\` 下生成 \`globals.css\` 或 \`designToken.json\`（二选一）\n\n`;
  markdown += '**要求**：\n';
  markdown += '- 优先利用设计文档、CSS 变量和全局样式提取颜色、字体、间距、圆角、阴影 token\n';
  markdown += '- 若输出 `designToken.json`，必须包含 `name` 字段\n\n';

  markdown += '### 任务 2：生成 DESIGN-SPEC.md\n\n';
  markdown += `**目标**：输出 \`${targetInfo.relativeOutputDir}/DESIGN-SPEC.md\`\n\n`;
  markdown += '**要求**：说明设计语言、组件风格、排版层级、状态与使用建议\n\n';

  markdown += '### 任务 3：按需生成项目文档\n\n';
  markdown += '**目标**：在 `src/docs/` 下补充主题相关文档\n\n';
  markdown += '**要求**：结合输入项目的信息架构与设计文档产出高可读说明\n\n';

  markdown += '### 任务 4：按需生成数据模型\n\n';
  markdown += '**目标**：在 `src/database/` 下补充或更新数据模型\n\n';
  markdown += '**要求**：文件名英文、`tableName` 中文、`records` 数组中 `id` 唯一\n\n';

  markdown += '### 任务 5：生成/更新主题演示入口\n\n';
  markdown += `**目标**：生成或更新 \`${targetInfo.relativeOutputDir}/index.tsx\`\n\n`;
  markdown += '**要求**：明确演示 token、生效方式与关键组件外观\n\n';

  markdown += '## 📎 产物索引\n\n';
  markdown += `- 任务清单: \`${targetInfo.tasksFileName}\`\n`;
  markdown += `- 分析报告: \`${targetInfo.analysisFileName}\`\n`;

  const mdPath = path.join(targetInfo.outputDir, targetInfo.tasksFileName);
  fs.writeFileSync(mdPath, markdown);

  return { reportPath, mdPath };
}

function parseArgs(rawArgs) {
  const args = [...rawArgs];
  const help = args.length === 0 || args.includes('--help') || args.includes('-h');

  if (help) {
    return { help: true };
  }

  let projectDirArg = '';
  let outputNameArg = '';
  let targetType = 'prototypes';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--target-type') {
      const nextValue = args[index + 1];
      if (!nextValue) {
        throw new Error('参数 --target-type 缺少值');
      }
      targetType = String(nextValue).trim();
      index += 1;
      continue;
    }

    if (!projectDirArg) {
      projectDirArg = arg;
      continue;
    }

    if (!outputNameArg) {
      outputNameArg = arg;
      continue;
    }
  }

  if (!projectDirArg) {
    throw new Error('缺少 <figma-make-project-dir> 参数');
  }

  if (!Object.prototype.hasOwnProperty.call(TARGET_TYPE_TO_SRC_DIR, targetType)) {
    throw new Error(`不支持的 targetType: ${targetType}。可选值: ${Object.keys(TARGET_TYPE_TO_SRC_DIR).join(', ')}`);
  }

  const outputName = sanitizeName(outputNameArg || path.basename(projectDirArg));
  if (!outputName) {
    throw new Error('无法生成有效的输出名称，请显式传入 [output-name]');
  }

  return {
    help: false,
    projectDirArg,
    outputName,
    targetType,
  };
}

function printHelp() {
  console.log(`
Figma Make 项目预处理器

使用方法:
  node scripts/figma-make-converter.mjs <figma-make-project-dir> [output-name] [--target-type <prototypes|components|themes>]

示例:
  node scripts/figma-make-converter.mjs "temp/my-figma-make-project" my-page
  node scripts/figma-make-converter.mjs "temp/my-figma-make-project" brand-theme --target-type themes

功能:
  - 输入目录应来自 Figma 原始导出的 ZIP 工程包解压结果
  - 完整复制 Figma Make 项目（排除 node_modules / .npm-local-cache / build）
  - 转换 @/ 路径别名
  - 转换 package@version 导入
  - 生成 AI 工作文档（默认 .figma-make-tasks.md；主题模式 .figma-make-theme-tasks.md）
  - 生成分析报告（默认 .figma-make-analysis.json；主题模式 .figma-make-theme-analysis.json）
  `);
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (error) {
    log(`参数错误: ${error.message}`, 'error');
    printHelp();
    process.exit(1);
  }

  if (parsed.help) {
    printHelp();
    process.exit(0);
  }

  const figmaMakeDir = path.resolve(CONFIG.projectRoot, parsed.projectDirArg);
  const targetInfo = getTargetInfo(parsed.targetType, parsed.outputName);

  if (!fs.existsSync(figmaMakeDir)) {
    log(`错误: 找不到目录 ${figmaMakeDir}`, 'error');
    process.exit(1);
  }

  const srcDir = path.join(figmaMakeDir, 'src');
  const packageJsonPath = path.join(figmaMakeDir, 'package.json');
  const hasAppTsx = fs.existsSync(path.join(srcDir, 'App.tsx'));
  const hasMainTsx = fs.existsSync(path.join(srcDir, 'main.tsx'));

  if (!fs.existsSync(srcDir) || !fs.existsSync(packageJsonPath) || (!hasAppTsx && !hasMainTsx)) {
    log('错误: 这不是一个有效的 Figma Make 项目（需要包含 src/、package.json，以及 src/App.tsx 或 src/main.tsx）', 'error');
    process.exit(1);
  }

  try {
    ensureDir(targetInfo.outputBaseDir);

    log(`开始预处理 Figma Make 项目（targetType=${parsed.targetType}）...`, 'info');

    log('步骤 1/4: 复制项目文件...', 'progress');
    const fileCount = copyDirectory(figmaMakeDir, targetInfo.outputDir);
    log(`已复制 ${fileCount} 个文件`, 'info');

    log('步骤 2/4: 处理确定性转换（@/ 与 package@version）...', 'progress');
    const conversionResult = replaceAliasAndVersionImports(targetInfo.outputDir);
    log(`已处理 ${conversionResult.processedCount} 个文件`, 'info');

    log('步骤 3/4: 分析项目结构...', 'progress');
    const report = analyzeProject(targetInfo.outputDir, conversionResult);
    log(`发现 ${report.summary.componentCount} 个组件，${report.summary.pageCount} 个页面`, 'info');

    log('步骤 4/4: 生成任务文档...', 'progress');
    const { reportPath, mdPath } = parsed.targetType === 'themes'
      ? generateThemeTasksDocument(report, targetInfo, parsed.outputName, `temp/${path.basename(figmaMakeDir)}`)
      : generateDefaultTasksDocument(report, targetInfo, parsed.outputName, `temp/${path.basename(figmaMakeDir)}`);

    log('✅ 预处理完成！', 'info');
    log('', 'info');
    log(`📁 ${targetInfo.label}位置: ${targetInfo.relativeOutputDir}/`, 'info');
    log(`📋 AI 工作文档: ${path.relative(CONFIG.projectRoot, mdPath)}`, 'info');
    log(`📊 详细数据: ${path.relative(CONFIG.projectRoot, reportPath)}`, 'info');
    log('', 'info');
    log('📈 统计:', 'info');
    log(`  - 文件数: ${report.summary.totalFiles}`, 'info');
    log(`  - 组件数: ${report.summary.componentCount}`, 'info');
    log(`  - 页面数: ${report.summary.pageCount}`, 'info');
    log(`  - CSS 变量: ${report.summary.cssVariableCount}`, 'info');
    log('', 'info');
    log('🎯 下一步:', 'info');
    log(`1. 查看任务文档: cat ${path.relative(CONFIG.projectRoot, mdPath)}`, 'info');
    log(parsed.targetType === 'themes'
      ? '2. 让 AI 按任务单完成主题/文档/数据生成'
      : '2. 让 AI 根据任务清单完成转换', 'info');
  } catch (error) {
    log(`预处理失败: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

main();
