import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

import { getLocalIP, getRequestPathname } from './utils/httpUtils';
import { MAKE_ENTRIES_RELATIVE_PATH } from './utils/makeConstants';
import { buildDocApiPath } from './utils/docUtils';
import {
  createAdminAssetVersionResolver,
  rewriteAdminAssetUrls,
  sendMaybeCompressedResponse,
} from './utils/httpResponseUtils';

function readInjectedHtml(htmlPath: string, injectScript: string, cacheBustToken?: string) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace('</head>', `${injectScript}\n</head>`);
  return rewriteAdminAssetUrls(html, cacheBustToken);
}

function setNoStoreHeaders(res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

function setImmutableAssetHeaders(res: any) {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
}

function setImageCacheHeaders(res: any) {
  res.setHeader('Cache-Control', 'public, max-age=86400');
}

function hasVersionQuery(requestUrl: string) {
  return /[?&]v=/.test(requestUrl);
}

function setAdminStaticCacheHeaders(res: any, pathname: string, requestUrl: string) {
  if (!hasVersionQuery(requestUrl)) {
    setNoStoreHeaders(res);
    return;
  }

  if (pathname.startsWith('/images/')) {
    setImageCacheHeaders(res);
    return;
  }

  if (pathname.startsWith('/assets/')) {
    setImmutableAssetHeaders(res);
    return;
  }

  setNoStoreHeaders(res);
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getCanvasDisplayName(canvasName: string) {
  return path.basename(canvasName, path.extname(canvasName)) || canvasName;
}

function injectCanvasTemplateHtml(templateHtml: string, canvasName: string, injectScript: string) {
  const displayName = getCanvasDisplayName(canvasName);
  const pageTitle = `${displayName} - Canvas`;

  return templateHtml
    .replace(/\{\{CANVAS_NAME\}\}/g, escapeHtmlAttribute(canvasName))
    .replace(/\{\{CANVAS_TITLE\}\}/g, escapeHtmlAttribute(pageTitle))
    .replace('<title>Canvas</title>', `<title>${escapeHtmlAttribute(pageTitle)}</title>`)
    .replace('</head>', `${injectScript}\n</head>`);
}

export function serveAdminPlugin(): Plugin {
  const projectRoot = process.cwd();
  const adminDir = path.resolve(projectRoot, 'admin');
  const appsMatch = projectRoot.match(/[\/\\]apps[\/\\]([^\/\\]+)/);
  const resolveAdminAssetVersion = createAdminAssetVersionResolver(adminDir);

  let projectPrefix = '';
  if (appsMatch) {
    const rootDir = projectRoot.split(/[\/\\]apps[\/\\]/)[0];
    const appsDir = path.join(rootDir, 'apps');

    if (fs.existsSync(appsDir)) {
      const appFolders = fs.readdirSync(appsDir);
      for (const folder of appFolders) {
        const folderPath = path.join(appsDir, folder);
        const entriesPath = path.join(folderPath, MAKE_ENTRIES_RELATIVE_PATH);
        if (fs.existsSync(entriesPath)) {
          projectPrefix = `apps/${folder}/`;
          break;
        }
      }
    }
  }

  const isMixedProject = Boolean(projectPrefix);

  return {
    name: 'serve-admin-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        try {
        const pathname = getRequestPathname(req);
        const requestUrl = String(req.url || pathname || '/');
        const localIP = getLocalIP();
        const actualPort = server.httpServer?.address()?.port || server.config.server?.port || 5173;
        const adminAssetVersion = resolveAdminAssetVersion();
        const injectScript = `
  <script>
    window.__PROJECT_PREFIX__ = '${projectPrefix}';
    window.__IS_MIXED_PROJECT__ = ${isMixedProject};
    window.__LOCAL_IP__ = '${localIP}';
    window.__LOCAL_PORT__ = ${actualPort};
  </script>`;
        const sendHtml = async (html: string, options?: { transform?: boolean }) => {
          let responseHtml = rewriteAdminAssetUrls(html, adminAssetVersion);
          if (options?.transform) {
            const htmlUrl = requestUrl === '/' ? '/index.html' : requestUrl;
            responseHtml = await server.transformIndexHtml(htmlUrl, responseHtml, requestUrl);
          }
          setNoStoreHeaders(res);
          sendMaybeCompressedResponse(req, res, {
            body: responseHtml,
            contentType: 'text/html; charset=utf-8',
          });
        };

        if (pathname === '/' || pathname === '/index.html') {
          const indexPath = path.join(adminDir, 'index.html');
          if (fs.existsSync(indexPath)) {
            // 首页 admin 壳不参与 src HMR，避免外层页面被 Vite client 带着刷新。
            await sendHtml(readInjectedHtml(indexPath, injectScript, adminAssetVersion), { transform: false });
            return;
          }
        }

        if (pathname && pathname.match(/^\/[^/]+\.html$/)) {
          const htmlPath = path.join(adminDir, pathname);
          if (fs.existsSync(htmlPath)) {
            // 其他 admin 静态壳页面同样不接入 HMR，只保留 iframe 内 src 页面自己的热更。
            await sendHtml(readInjectedHtml(htmlPath, injectScript, adminAssetVersion), { transform: false });
            return;
          }
        }

        if (pathname && pathname.startsWith('/assets/')) {
          const assetPath = path.join(adminDir, pathname);
          if (fs.existsSync(assetPath)) {
            const ext = path.extname(assetPath);
            const contentTypes: Record<string, string> = {
              '.js': 'application/javascript',
              '.css': 'text/css',
              '.json': 'application/json',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.svg': 'image/svg+xml',
              '.ico': 'image/x-icon',
              '.woff': 'font/woff',
              '.woff2': 'font/woff2',
              '.ttf': 'font/ttf',
              '.eot': 'application/vnd.ms-fontobject',
            };
            setAdminStaticCacheHeaders(res, pathname, requestUrl);
            sendMaybeCompressedResponse(req, res, {
              body: fs.readFileSync(assetPath),
              contentType: contentTypes[ext] || 'application/octet-stream',
            });
            return;
          }
        }

        if (pathname && pathname.startsWith('/images/')) {
          const imagePath = path.join(adminDir, pathname);
          if (fs.existsSync(imagePath)) {
            const ext = path.extname(imagePath);
            const contentTypes: Record<string, string> = {
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.gif': 'image/gif',
              '.svg': 'image/svg+xml',
              '.ico': 'image/x-icon',
            };
            setAdminStaticCacheHeaders(res, pathname, requestUrl);
            sendMaybeCompressedResponse(req, res, {
              body: fs.readFileSync(imagePath),
              contentType: contentTypes[ext] || 'image/png',
            });
            return;
          }
        }

        if (pathname && pathname.startsWith('/admin/')) {
          const adminFilePath = path.join(adminDir, pathname.replace('/admin/', ''));
          if (fs.existsSync(adminFilePath)) {
            const ext = path.extname(adminFilePath);
            const contentTypes: Record<string, string> = {
              '.js': 'application/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8',
              '.json': 'application/json; charset=utf-8',
              '.html': 'text/html; charset=utf-8',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.svg': 'image/svg+xml',
              '.ico': 'image/x-icon',
              '.woff': 'font/woff',
              '.woff2': 'font/woff2',
              '.ttf': 'font/ttf',
              '.eot': 'application/vnd.ms-fontobject',
            };
            const adminPathname = pathname.replace('/admin', '') || '/';
            setAdminStaticCacheHeaders(res, adminPathname, requestUrl);
            sendMaybeCompressedResponse(req, res, {
              body: fs.readFileSync(adminFilePath),
              contentType: contentTypes[ext] || 'application/octet-stream',
            });
            return;
          }
        }

        if (pathname && pathname.match(/^\/[^/]+\.js$/)) {
          const jsPath = path.join(adminDir, pathname);
          if (fs.existsSync(jsPath)) {
            setNoStoreHeaders(res);
            sendMaybeCompressedResponse(req, res, {
              body: fs.readFileSync(jsPath),
              contentType: 'application/javascript; charset=utf-8',
            });
            return;
          }
        }

        const isDocsAssetRequest = pathname?.startsWith('/docs/') && pathname.includes('/assets/');
        const encodedDocName = isDocsAssetRequest
          ? undefined
          : pathname?.match(/^\/docs\/(.+?)(?:\/spec\.html)?$/)?.[1];
        if (encodedDocName) {
          const specTemplatePath = path.join(adminDir, 'spec-template.html');
          if (fs.existsSync(specTemplatePath)) {
            let html = fs.readFileSync(specTemplatePath, 'utf8');
            const docName = decodeURIComponent(encodedDocName);
            const docFileName = docName.endsWith('.md') ? docName : `${docName}.md`;
            const specUrl = buildDocApiPath(docFileName);
            html = html.replace(/\{\{SPEC_URL\}\}/g, specUrl);
            html = html.replace(/\{\{TITLE\}\}/g, docName);
            html = html.replace(/\{\{MULTI_DOC\}\}/g, 'false');
            html = html.replace(/\{\{DOCS_CONFIG\}\}/g, '[]');
            html = html.replace('</head>', `${injectScript}\n</head>`);
            html = rewriteAdminAssetUrls(html, adminAssetVersion);
            // 文档页内容源现在也在 src 下，保留它自己的 Vite 转换与更新能力。
            await sendHtml(html, { transform: true });
            return;
          }
        }

        const encodedCanvasName = pathname?.match(/^\/canvas\/(.+?)\/?$/)?.[1];
        if (encodedCanvasName) {
          const canvasTemplatePath = path.join(adminDir, 'canvas-template.html');
          if (fs.existsSync(canvasTemplatePath)) {
            const canvasName = decodeURIComponent(encodedCanvasName);
            const html = injectCanvasTemplateHtml(
              fs.readFileSync(canvasTemplatePath, 'utf8'),
              canvasName,
              injectScript,
            );
            await sendHtml(rewriteAdminAssetUrls(html, adminAssetVersion), { transform: true });
            return;
          }
        }

        next();
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
