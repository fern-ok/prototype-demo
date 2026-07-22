import type { Plugin } from 'vite';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import {
  createGitVersionAvailability,
  isGitHistoryMissingMessage,
  isGitRepositoryErrorMessage,
  type GitVersionAvailability,
  type GitVersionAvailabilityErrorCode,
} from './gitVersionSupport';

const execAsync = promisify(exec);

/**
 * Git 版本管理 API 插件
 * 提供基于 Git 的版本控制功能，用于页面和元素的文件夹级别版本管理
 */
export function gitVersionApiPlugin(): Plugin {
  const resolveModuleFile = (basePath: string): string | null => {
    const fileCandidates = [basePath, `${basePath}.ts`, `${basePath}.tsx`, `${basePath}.js`, `${basePath}.jsx`];
    for (const candidate of fileCandidates) {
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      } catch {
        // Ignore fs race/errors and continue probing other candidates.
      }
    }

    const indexCandidates = [
      path.join(basePath, 'index.ts'),
      path.join(basePath, 'index.tsx'),
      path.join(basePath, 'index.js'),
      path.join(basePath, 'index.jsx'),
    ];

    for (const candidate of indexCandidates) {
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      } catch {
        // Ignore fs race/errors and continue probing other candidates.
      }
    }

    return null;
  };

  return {
    name: 'git-version-api',

    /**
     * 解决跨文件夹导入问题：
     * 当从 .git-versions/{id}/src/... 中的文件发起相对导入时，如果目标文件
     * 不在已提取的版本目录中（如 ../../components/side-menu），则回退到
     * 当前工作目录的 src/ 下去解析。
     */
    resolveId(source, importer) {
      if (!importer) return null;

      const projectRoot = process.cwd();
      const gitVersionsDir = path.join(projectRoot, '.git-versions');
      const normalizedImporter = path.normalize(importer);

      // 只处理来自 .git-versions 目录中的导入
      if (!normalizedImporter.startsWith(gitVersionsDir)) return null;

      // 解析相对路径导入
      const resolved = path.resolve(path.dirname(normalizedImporter), source);

      // 如果解析后的路径仍在 .git-versions 内且文件不存在，则回退到真实 src/
      if (!resolved.startsWith(gitVersionsDir)) return null;

      const versionResolvedPath = resolveModuleFile(resolved);
      if (versionResolvedPath) {
        return versionResolvedPath;
      }

      // 文件不存在 → 提取 .git-versions/{id}/ 之后的相对路径，映射到真实 src/
      const relativeTail = path.relative(gitVersionsDir, resolved);
      // relativeTail 形如 "67c09dc5/src/components/side-menu"
      const slashIdx = relativeTail.indexOf(path.sep);
      if (slashIdx < 0) return null;
      const pathAfterVersionId = relativeTail.substring(slashIdx + 1);
      // pathAfterVersionId 形如 "src/components/side-menu"

      const realPath = path.join(projectRoot, pathAfterVersionId);

      return resolveModuleFile(realPath);
    },

    configureServer(server) {
      const projectRoot = process.cwd();

      // 服务器启动时清理临时版本文件
      const gitVersionsDir = path.join(projectRoot, '.git-versions');
      
      if (fs.existsSync(gitVersionsDir)) {
        try {
          console.log('[Git 版本管理] 清理临时版本文件...');
          fs.rmSync(gitVersionsDir, { recursive: true, force: true });
          console.log('[Git 版本管理] ✅ 临时版本文件已清理');
        } catch (error) {
          console.error('[Git 版本管理] ⚠️  清理临时文件失败:', error);
        }
      }
      
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

      const extractGitErrorMessage = (error: any): string => {
        if (!error) return '';
        const candidate = error.stderr || error.stdout || error.message || error;
        return String(candidate || '').trim();
      };

      const getAvailabilityStatusCode = (errorCode?: GitVersionAvailabilityErrorCode): number => {
        if (errorCode === 'git-not-available') return 503;
        if (errorCode === 'git-history-not-ready') return 409;
        if (errorCode === 'git-repository-not-initialized') return 412;
        return 500;
      };

      const sendGitAvailabilityError = (res: any, availability: GitVersionAvailability) => {
        sendJSON(res, getAvailabilityStatusCode(availability.errorCode), availability);
      };

      const probeGitVersionAvailability = async (cwd: string): Promise<GitVersionAvailability> => {
        try {
          await execAsync('git --version', { cwd });
        } catch (error: any) {
          return createGitVersionAvailability({
            gitAvailable: false,
            details: extractGitErrorMessage(error),
          });
        }

        try {
          const { stdout } = await execAsync('git rev-parse --is-inside-work-tree', { cwd });
          if (stdout.trim() !== 'true') {
            return createGitVersionAvailability({
              gitAvailable: true,
              isGitRepo: false,
            });
          }
        } catch (error: any) {
          const details = extractGitErrorMessage(error);
          if (isGitRepositoryErrorMessage(details)) {
            return createGitVersionAvailability({
              gitAvailable: true,
              isGitRepo: false,
              details,
            });
          }
          throw new Error(`Git 环境检测失败: ${details || 'Unknown error'}`);
        }

        try {
          await execAsync('git rev-parse --verify HEAD', { cwd });
        } catch (error: any) {
          const details = extractGitErrorMessage(error);
          if (isGitHistoryMissingMessage(details)) {
            return createGitVersionAvailability({
              gitAvailable: true,
              isGitRepo: true,
              hasCommits: false,
              details,
            });
          }
          if (isGitRepositoryErrorMessage(details)) {
            return createGitVersionAvailability({
              gitAvailable: true,
              isGitRepo: false,
              details,
            });
          }
          throw new Error(`Git 历史检测失败: ${details || 'Unknown error'}`);
        }

        return createGitVersionAvailability({
          gitAvailable: true,
          isGitRepo: true,
          hasCommits: true,
        });
      };

      const ensureGitVersionAvailability = async (
        res: any,
        options: { requireHistory?: boolean } = {},
      ): Promise<GitVersionAvailability | null> => {
        const availability = await probeGitVersionAvailability(projectRoot);
        if (!availability.gitAvailable || !availability.isGitRepo) {
          sendGitAvailabilityError(res, availability);
          return null;
        }
        if (options.requireHistory && availability.hasCommits === false) {
          sendGitAvailabilityError(res, availability);
          return null;
        }
        return availability;
      };

      // 检查 Git 是否可用
      (async () => {
        try {
          const availability = await probeGitVersionAvailability(projectRoot);
          if (!availability.gitAvailable) {
            console.warn('[Git 版本管理] ⚠️  Git 未安装或不可用');
            console.warn('[Git 版本管理] 💡 请安装 Git 以使用版本管理功能: https://git-scm.com/downloads');
            return;
          }
          if (!availability.isGitRepo) {
            console.warn('[Git 版本管理] ⚠️  当前项目未启用 Git 版本管理');
            return;
          }
          if (availability.hasCommits === false) {
            console.warn('[Git 版本管理] ⚠️  Git 仓库已初始化，但还没有任何提交记录');
            return;
          }
          console.log('[Git 版本管理] ✅ Git 与版本历史已就绪');
        } catch (error) {
          console.warn('[Git 版本管理] ⚠️  Git 环境检测失败:', error);
        }
      })();

      // Helper function to execute git command
      const execGit = async (command: string, cwd: string) => {
        try {
          const { stdout, stderr } = await execAsync(command, { cwd, maxBuffer: 1024 * 1024 * 10 });
          return { stdout: stdout.trim(), stderr: stderr.trim() };
        } catch (error: any) {
          const message = extractGitErrorMessage(error);
          if (isGitRepositoryErrorMessage(message)) {
            throw new Error('当前项目未启用 Git 版本管理。请先在项目根目录执行 git init，并至少提交一次版本后再使用该功能。');
          }
          if (isGitHistoryMissingMessage(message)) {
            throw new Error('当前项目已启用 Git，但还没有任何提交记录。请先提交一次版本后再查看历史版本。');
          }
          throw new Error(`Git 命令执行失败: ${message || 'Unknown error'}`);
        }
      };

      const normalizeTargetPath = (rawTargetPath: string, projectRoot: string) => {
        const sourceRoot = path.resolve(projectRoot, 'src');
        const trimmedPath = String(rawTargetPath || '').trim();

        if (!trimmedPath) {
          throw new Error('Missing path parameter');
        }

        let normalizedPath = trimmedPath.replace(/\\/g, '/');
        const normalizedProjectRoot = projectRoot.replace(/\\/g, '/').replace(/\/+$/, '');
        const normalizedSourceRoot = sourceRoot.replace(/\\/g, '/').replace(/\/+$/, '');

        if (normalizedPath.startsWith(normalizedSourceRoot + '/')) {
          normalizedPath = normalizedPath.slice(normalizedSourceRoot.length + 1);
        } else if (normalizedPath.startsWith(normalizedProjectRoot + '/src/')) {
          normalizedPath = normalizedPath.slice(normalizedProjectRoot.length + '/src/'.length);
        } else {
          const srcMarkerIndex = normalizedPath.lastIndexOf('/src/');
          if (srcMarkerIndex >= 0) {
            normalizedPath = normalizedPath.slice(srcMarkerIndex + '/src/'.length);
          } else if (normalizedPath.startsWith('src/')) {
            normalizedPath = normalizedPath.slice('src/'.length);
          }
        }

        normalizedPath = normalizedPath
          .replace(/^\/+/, '')
          .replace(/\/index\.(t|j)sx?$/i, '')
          .replace(/\/+$/, '');

        if (!normalizedPath) {
          throw new Error('Invalid path');
        }

        const segments = normalizedPath.split('/').filter(Boolean);
        if (segments.length === 0 || segments.some((segment) => segment === '.' || segment === '..')) {
          throw new Error('Invalid path');
        }

        const resolvedFolderPath = path.resolve(sourceRoot, normalizedPath);
        const relativeToSourceRoot = path.relative(sourceRoot, resolvedFolderPath);

        if (!relativeToSourceRoot || relativeToSourceRoot.startsWith('..') || path.isAbsolute(relativeToSourceRoot)) {
          throw new Error('Invalid path');
        }

        return {
          sourceRoot,
          targetPath: segments.join('/'),
          folderPath: resolvedFolderPath,
        };
      };

      // Main middleware for git version API
      server.middlewares.use(async (req: any, res: any, next: any) => {
        // Only handle /api/git/* routes
        if (!req.url.startsWith('/api/git')) {
          return next();
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const pathname = url.pathname;

          // Route: GET /api/git/history - Get git history for a folder
          if (pathname === '/api/git/history' && req.method === 'GET') {
            const availability = await ensureGitVersionAvailability(res, { requireHistory: false });
            if (!availability) return;
            
            const rawTargetPath = url.searchParams.get('path'); // e.g., 'prototypes/home' or 'components/button'
            
            if (!rawTargetPath) {
              sendJSON(res, 400, { error: 'Missing path parameter' });
              return;
            }

            const projectRoot = process.cwd();
            let targetPath = '';
            let folderPath = '';

            try {
              ({ targetPath, folderPath } = normalizeTargetPath(rawTargetPath, projectRoot));
            } catch (error: any) {
              sendJSON(res, 403, { error: 'Invalid path' });
              return;
            }

            if (!fs.existsSync(folderPath)) {
              sendJSON(res, 404, { error: 'Folder not found' });
              return;
            }

            // Check for uncommitted changes in the folder
            const statusCommand = `git status --porcelain -- src/${targetPath}`;
            const { stdout: statusOutput } = await execGit(statusCommand, projectRoot);
            const hasUncommitted = statusOutput.length > 0;

            if (availability.hasCommits === false) {
              sendJSON(res, 200, {
                commits: [],
                hasUncommitted,
                uncommittedFiles: statusOutput,
                historyReady: false,
                errorCode: availability.errorCode,
                message: availability.message,
              });
              return;
            }

            // Get git log for the folder (last 20 commits)
            const gitCommand = `git log -20 --pretty=format:'%H|%an|%ae|%at|%s' -- src/${targetPath}`;
            const { stdout } = await execGit(gitCommand, projectRoot);

            if (!stdout) {
              sendJSON(res, 200, {
                commits: [],
                hasUncommitted,
                uncommittedFiles: statusOutput,
                historyReady: true,
              });
              return;
            }

            const commits = stdout.split('\n').map(line => {
              const [hash, author, email, timestamp, message] = line.split('|');
              return {
                hash,
                author,
                email,
                timestamp: parseInt(timestamp) * 1000, // Convert to milliseconds
                message,
                date: new Date(parseInt(timestamp) * 1000).toISOString()
              };
            });

            sendJSON(res, 200, {
              commits,
              hasUncommitted,
              uncommittedFiles: statusOutput,
              historyReady: true,
            });
            return;
          }

          // Route: POST /api/git/restore - Restore folder to a specific commit
          if (pathname === '/api/git/restore' && req.method === 'POST') {
            if (!(await ensureGitVersionAvailability(res, { requireHistory: true }))) return;
            
            const body = await parseBody(req);
            const { path: rawTargetPath, commitHash } = body;

            if (!rawTargetPath || !commitHash) {
              sendJSON(res, 400, { error: 'Missing path or commitHash parameter' });
              return;
            }

            const projectRoot = process.cwd();
            let targetPath = '';
            let folderPath = '';

            try {
              ({ targetPath, folderPath } = normalizeTargetPath(rawTargetPath, projectRoot));
            } catch (error: any) {
              sendJSON(res, 403, { error: 'Invalid path' });
              return;
            }

            if (!fs.existsSync(folderPath)) {
              sendJSON(res, 404, { error: 'Folder not found' });
              return;
            }

            // Verify commit exists
            const verifyCommand = `git cat-file -t ${commitHash}`;
            try {
              await execGit(verifyCommand, projectRoot);
            } catch (error) {
              sendJSON(res, 400, { error: 'Invalid commit hash' });
              return;
            }

            // Restore folder to specific commit
            const restoreCommand = `git checkout ${commitHash} -- src/${targetPath}`;
            await execGit(restoreCommand, projectRoot);

            sendJSON(res, 200, { success: true, message: 'Folder restored successfully' });
            return;
          }

          // Route: POST /api/git/commit - Commit changes for a folder
          if (pathname === '/api/git/commit' && req.method === 'POST') {
            if (!(await ensureGitVersionAvailability(res, { requireHistory: false }))) return;
            
            const body = await parseBody(req);
            const { path: rawTargetPath, message } = body;

            if (!rawTargetPath || !message) {
              sendJSON(res, 400, { error: 'Missing path or message parameter' });
              return;
            }

            const projectRoot = process.cwd();
            let targetPath = '';
            let folderPath = '';

            try {
              ({ targetPath, folderPath } = normalizeTargetPath(rawTargetPath, projectRoot));
            } catch (error: any) {
              sendJSON(res, 403, { error: 'Invalid path' });
              return;
            }

            if (!fs.existsSync(folderPath)) {
              sendJSON(res, 404, { error: 'Folder not found' });
              return;
            }

            // Check if there are changes to commit
            const statusCommand = `git status --porcelain -- src/${targetPath}`;
            const { stdout: statusOutput } = await execGit(statusCommand, projectRoot);

            if (!statusOutput) {
              sendJSON(res, 400, { error: 'No changes to commit' });
              return;
            }

            // Add and commit changes
            const addCommand = `git add src/${targetPath}`;
            await execGit(addCommand, projectRoot);

            const commitCommand = `git commit -m "${message.replace(/"/g, '\\"')}"`;
            const { stdout: commitOutput } = await execGit(commitCommand, projectRoot);

            sendJSON(res, 200, { success: true, message: 'Changes committed successfully', output: commitOutput });
            return;
          }

          // Route: GET /api/git/diff - Get diff for uncommitted changes
          if (pathname === '/api/git/diff' && req.method === 'GET') {
            if (!(await ensureGitVersionAvailability(res, { requireHistory: false }))) return;
            
            const rawTargetPath = url.searchParams.get('path');
            
            if (!rawTargetPath) {
              sendJSON(res, 400, { error: 'Missing path parameter' });
              return;
            }

            const projectRoot = process.cwd();
            let targetPath = '';
            let folderPath = '';

            try {
              ({ targetPath, folderPath } = normalizeTargetPath(rawTargetPath, projectRoot));
            } catch (error: any) {
              sendJSON(res, 403, { error: 'Invalid path' });
              return;
            }

            if (!fs.existsSync(folderPath)) {
              sendJSON(res, 404, { error: 'Folder not found' });
              return;
            }

            // Get diff for uncommitted changes
            const diffCommand = `git diff -- src/${targetPath}`;
            const { stdout: diffOutput } = await execGit(diffCommand, projectRoot);

            // Get list of changed files
            const statusCommand = `git status --porcelain -- src/${targetPath}`;
            const { stdout: statusOutput } = await execGit(statusCommand, projectRoot);

            const changedFiles = statusOutput.split('\n').filter(line => line.trim()).map(line => {
              const status = line.substring(0, 2).trim();
              const file = line.substring(3);
              return { status, file };
            });

            sendJSON(res, 200, { diff: diffOutput, changedFiles });
            return;
          }

          // Route: POST /api/git/build-version - Extract version files (no build)
          if (pathname === '/api/git/build-version' && req.method === 'POST') {
            if (!(await ensureGitVersionAvailability(res, { requireHistory: true }))) return;
            
            const body = await parseBody(req);
            const { path: rawTargetPath, commitHash } = body;

            if (!rawTargetPath || !commitHash) {
              sendJSON(res, 400, { error: 'Missing path or commitHash parameter' });
              return;
            }

            const projectRoot = process.cwd();
            let targetPath = '';
            let folderPath = '';

            try {
              ({ targetPath, folderPath } = normalizeTargetPath(rawTargetPath, projectRoot));
            } catch (error: any) {
              sendJSON(res, 403, { error: 'Invalid path' });
              return;
            }

            if (!fs.existsSync(folderPath)) {
              sendJSON(res, 404, { error: 'Folder not found' });
              return;
            }

            try {
              // Create temporary directory for version files
              const versionId = commitHash.substring(0, 8);
              const tempDir = path.join(projectRoot, '.git-versions', versionId);
              const srcPath = path.join(tempDir, 'src', targetPath);
              
              // Check if already extracted
              if (fs.existsSync(srcPath)) {
                console.log('[Git 版本管理] 使用已提取的版本:', versionId);
                const specPath = path.join(srcPath, 'spec.md');
                const indexPath = path.join(srcPath, 'index.tsx');
                const hasSpec = fs.existsSync(specPath);
                const hasPrototype = fs.existsSync(indexPath);
                
                sendJSON(res, 200, { 
                  success: true, 
                  versionId,
                  hasSpec,
                  hasPrototype,
                  specUrl: hasSpec ? `/${targetPath}/spec.html?ver=${versionId}` : null,
                  prototypeUrl: hasPrototype ? `/${targetPath}/index.html?ver=${versionId}` : null,
                  cached: true
                });
                return;
              }
              
              fs.mkdirSync(srcPath, { recursive: true });

              console.log('[Git 版本管理] 开始提取版本文件:', versionId, targetPath);

              // Get list of files in the commit
              const listCommand = `git ls-tree -r --name-only ${commitHash} src/${targetPath}`;
              const { stdout: fileList } = await execGit(listCommand, projectRoot);
              
              if (!fileList.trim()) {
                sendJSON(res, 404, { error: 'No files found in this version' });
                return;
              }

              // Extract each file
              const files = fileList.trim().split('\n');
              for (const file of files) {
                const targetFile = path.join(tempDir, file);
                const targetDir = path.dirname(targetFile);
                
                // Create directory if needed
                fs.mkdirSync(targetDir, { recursive: true });
                
                // Get file content from git
                const showCommand = `git show ${commitHash}:${file}`;
                const { stdout: content } = await execGit(showCommand, projectRoot);
                fs.writeFileSync(targetFile, content);
              }

              console.log('[Git 版本管理] ✅ 文件提取完成');

              // Check what files exist in the version
              const specPath = path.join(srcPath, 'spec.md');
              const indexPath = path.join(srcPath, 'index.tsx');
              const hasSpec = fs.existsSync(specPath);
              const hasPrototype = fs.existsSync(indexPath);

              // Generate URLs for accessing the version
              const specUrl = hasSpec ? `/${targetPath}/spec.html?ver=${versionId}` : null;
              const prototypeUrl = hasPrototype ? `/${targetPath}/index.html?ver=${versionId}` : null;

              sendJSON(res, 200, { 
                success: true, 
                versionId,
                hasSpec,
                hasPrototype,
                specUrl,
                prototypeUrl
              });
            } catch (error: any) {
              console.error('Extract version error:', error);
              sendJSON(res, 500, { error: error.message || 'Failed to extract version' });
            }
            return;
          }

          // Route: GET /api/git/version-file - Get file from specific version
          if (pathname.startsWith('/api/git/version-file/') && req.method === 'GET') {
            try {
              // Parse URL: /api/git/version-file/{versionId}/{path}/spec.md
              const parts = pathname.replace('/api/git/version-file/', '').split('/');
              if (parts.length < 3) {
                sendJSON(res, 400, { error: 'Invalid URL format' });
                return;
              }

              const versionId = parts[0];
              const fileName = parts[parts.length - 1];
              const targetPath = parts.slice(1, -1).join('/');

              // Validate
              if (targetPath.includes('..') || targetPath.startsWith('/')) {
                sendJSON(res, 403, { error: 'Invalid path' });
                return;
              }

              const projectRoot = process.cwd();
              const tempDir = path.join(projectRoot, '.git-versions', versionId);
              const filePath = path.join(tempDir, 'src', targetPath, fileName);

              if (!fs.existsSync(filePath)) {
                sendJSON(res, 404, { error: 'File not found in version' });
                return;
              }

              const content = fs.readFileSync(filePath, 'utf8');
              res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
              res.end(content);
            } catch (error: any) {
              console.error('Get version file error:', error);
              sendJSON(res, 500, { error: error.message });
            }
            return;
          }

          // Route: GET /api/git/status - Check git repository status
          if (pathname === '/api/git/status' && req.method === 'GET') {
            const availability = await probeGitVersionAvailability(projectRoot);

            if (!availability.gitAvailable || !availability.isGitRepo) {
              sendJSON(res, 200, availability);
              return;
            }

            try {
              const { stdout: branchOutput } = await execGit('git branch --show-current', projectRoot);
              const currentBranch = branchOutput || 'main';

              const { stdout: statusOutput } = await execGit('git status --porcelain', projectRoot);
              const hasChanges = statusOutput.length > 0;

              sendJSON(res, 200, {
                ...availability,
                currentBranch,
                hasChanges,
              });
            } catch (error: any) {
              sendJSON(res, 200, {
                ...availability,
                error: 'Git 状态获取失败',
                message: error.message,
              });
            }
            return;
          }

          // No route matched
          sendJSON(res, 404, { error: 'API endpoint not found' });
          
        } catch (error: any) {
          console.error('Git version API error:', error);
          sendJSON(res, 500, { error: error.message || 'Internal server error' });
        }
      });
    }
  };
}
