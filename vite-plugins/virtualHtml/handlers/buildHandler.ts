import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { execa } from 'execa';
import { readEntriesManifest } from '../../utils/entriesManifest';

/**
 * 构建锁：防止同一入口并发构建，防止多个构建同时阻塞资源。
 * key = urlPath, value = Promise（当前正在构建的 Promise）
 */
const activeBuildMap = new Map<string, Promise<{ js: string } | null>>();

/** 构建超时时间（毫秒） */
const BUILD_TIMEOUT_MS = 120_000; // 2 分钟

async function runBuild(urlPath: string, projectRoot: string): Promise<{ js: string } | null> {
  try {
    const buildProcess = execa('npx', ['vite', 'build'], {
      cwd: projectRoot,
      env: { ...process.env, ENTRY_KEY: urlPath },
      timeout: BUILD_TIMEOUT_MS,
    });

    await buildProcess;

    const builtFilePath = path.resolve(projectRoot, 'dist', `${urlPath}.js`);
    if (fs.existsSync(builtFilePath)) {
      const jsContent = fs.readFileSync(builtFilePath, 'utf8');
      console.log(`✅ 构建成功: ${urlPath}`);
      return { js: jsContent };
    }

    console.error('构建文件不存在:', builtFilePath);
    return null;
  } catch (error: any) {
    if (error.timedOut) {
      console.error(`⏰ 构建超时 (${BUILD_TIMEOUT_MS / 1000}s): ${urlPath}`);
    } else {
      console.error(`❌ 构建失败: ${urlPath}`);
      console.error('错误信息:', error.message);
      if (error.stderr) {
        console.error('stderr:', error.stderr);
      }
    }
    return null;
  } finally {
    activeBuildMap.delete(urlPath);
  }
}

export function handleBuildRequest(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.url && req.url.startsWith('/build/') && req.url.endsWith('.js')) {
    const encodedUrlPath = req.url.replace('/build/', '').replace('.js', '');
    const urlPath = decodeURIComponent(encodedUrlPath);
    const projectRoot = process.cwd();
    const directEntryPath = path.resolve(projectRoot, 'src', urlPath, 'index.tsx');
    let hasEntry = fs.existsSync(directEntryPath);

    if (!hasEntry) {
      try {
        const manifest = readEntriesManifest(projectRoot);
        const item = manifest.items?.[urlPath];
        if (item?.js) {
          const manifestEntryPath = path.resolve(projectRoot, item.js);
          hasEntry = fs.existsSync(manifestEntryPath);
        }
      } catch {
        hasEntry = false;
      }
    }

    if (hasEntry) {
      console.log(`\n🔨 开始构建: ${urlPath}`);

      // 如果同一入口已经在构建中，复用其 Promise，不重复启动
      let buildPromise = activeBuildMap.get(urlPath);
      if (!buildPromise) {
        buildPromise = runBuild(urlPath, projectRoot);
        activeBuildMap.set(urlPath, buildPromise);
      } else {
        console.log(`⏳ 复用进行中的构建: ${urlPath}`);
      }

      buildPromise
        .then((result) => {
          if (result) {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Cache-Control', 'no-cache');
            res.statusCode = 200;
            res.end(result.js);
          } else {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end(`Build failed for ${urlPath}`);
          }
        })
        .catch((err) => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.end(`Build failed for ${urlPath}\n${err.message}`);
        });

      return true;
    }

    res.statusCode = 404;
    res.end('Not Found');
    return true;
  }

  return false;
}
