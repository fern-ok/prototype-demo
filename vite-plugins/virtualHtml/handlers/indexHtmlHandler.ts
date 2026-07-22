import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { encodeRoutePath, normalizePath } from './pathNormalizer';
import { logVirtualHtmlDebug, logVirtualHtmlWarn } from '../logger';
import {
  createPreviewHostModuleCode,
  createPreviewHostOptions,
  replacePreviewLoaderScript,
} from '../previewHost';
import { buildPreviewTitle, readEntryDisplayName } from '../../utils/previewTitle';

type HtmlResponder = (html: string, transformUrl?: string) => Promise<void>;

function replaceDevTemplateBootstrapScript(html: string, bootstrapImportPath: string): string {
  return html.replace(
    /  <script type="module" src=["']\/assets\/dev-template-bootstrap\.js(?:\?[^"']*)?["']><\/script>/,
    `  <script type="module">\n    import ${JSON.stringify(bootstrapImportPath)};\n  </script>`,
  );
}

export async function handleIndexHtml(
  req: IncomingMessage,
  res: ServerResponse,
  devTemplate: string,
  htmlTemplate: string,
  respondHtml: HtmlResponder,
): Promise<boolean> {
  if (!req.url) return false;

  // 先尝试标准化路径
  const normalized = normalizePath(req.url);

  // 只处理预览请求（action === 'preview'）
  if (normalized && normalized.action === 'preview') {
    const { type, name, versionId } = normalized;

    logVirtualHtmlDebug('预览请求:', normalized.originalUrl, '→', normalized.normalizedUrl);

    if (['components', 'prototypes', 'themes'].includes(type)) {
      const urlPath = encodeRoutePath(`/${type}/${name}`);
      const moduleImportPath = `/${type}/${name}`;
      let tsxPath: string;
      let basePath: string;

      // 如果有版本参数，从 Git 版本目录读取
      if (versionId) {
        const gitVersionsDir = path.resolve(process.cwd(), '.git-versions', versionId);
        basePath = path.join(gitVersionsDir, 'src', type, name);
        tsxPath = path.join(basePath, 'index.tsx');
        logVirtualHtmlDebug('从 Git 版本读取:', versionId, tsxPath);
      } else {
        // 否则从当前工作目录读取
        basePath = path.resolve(process.cwd(), 'src', type, name);
        tsxPath = path.join(basePath, 'index.tsx');
      }

      logVirtualHtmlDebug('检查 TSX 文件:', tsxPath, '存在:', fs.existsSync(tsxPath));

      if (fs.existsSync(tsxPath)) {
        const displayName = readEntryDisplayName(tsxPath);
        const title = buildPreviewTitle({
          group: type,
          name,
          displayName,
          mode: 'dev',
        });
        // Vite 的 html-proxy/import-analysis 在虚拟 HTML 模块里解析 import 时，
        // 对包含中文目录名的百分号编码路径兼容性不稳定。这里保留页面 URL 为编码形式，
        // 但模块 import 使用原始路由路径，让 Vite 能正确映射到 src 下的真实文件。
        const entryImportPath = versionId
          ? `/@fs/${tsxPath}`
          : `${moduleImportPath}/index.tsx`;
        const hackCssPath = path.resolve(process.cwd(), 'src', type, name, 'hack.css');
        const previewHostModuleCode = createPreviewHostModuleCode(
          createPreviewHostOptions({
            type,
            name,
            entryImportPath,
            versionId,
            initialHackCssEnabled: fs.existsSync(hackCssPath),
          }),
        );
        const bootstrapModulePath = path.resolve(process.cwd(), 'admin', 'assets', 'dev-template-bootstrap.js')
          .split(path.sep)
          .join('/');

        let html = devTemplate.replace(/\{\{TITLE\}\}/g, title);
        html = replacePreviewLoaderScript(html, previewHostModuleCode);
        html = replaceDevTemplateBootstrapScript(html, `/@fs/${bootstrapModulePath}`);

        // 🔥 添加 <base> 标签来修正相对路径基准（重要！）
        // 新路径格式 /prototypes/ref-antd 会被浏览器当作目录，导致相对路径解析错误
        // 添加 <base href="/prototypes/ref-antd/"> 可以修正这个问题
        const baseHref = `${urlPath}/`;
        html = html.replace('</head>', `  <base href="${baseHref}">\n  </head>`);
        if (fs.existsSync(hackCssPath)) {
          logVirtualHtmlDebug('注入 hack.css:', hackCssPath);
          html = html.replace(
            '</head>',
            `  <link rel="stylesheet" data-axhub-hack-css="${type}/${name}" href="./hack.css">\n  </head>`,
          );
        }

        logVirtualHtmlDebug('返回虚拟 HTML:', normalized.normalizedUrl);

        // 交给 Vite 转换 HTML 时需要使用一个稳定的 .html 虚拟地址。
        // 当前版本与历史版本不能共用同一个 transformUrl，否则 Vite 的 html-proxy
        // 会复用当前页面的内联脚本，导致历史版本页面又加载回当前源码。
        // 这里用一个仅供 transformIndexHtml 使用的虚拟路径段隔离不同版本，
        // 避免在 URL 查询参数里追加 ver 触发双问号问题。
        const transformUrl = versionId
          ? `${urlPath}/__axhub_version__/${versionId}/index.html`
          : `${urlPath}/index.html`;
        await respondHtml(html, transformUrl);
        return true;
      } else if (versionId) {
        // 版本文件不存在
        const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>版本不存在</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .error-container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 500px;
      text-align: center;
    }
    h1 { color: #ff4d4f; margin-top: 0; }
    p { color: #666; line-height: 1.6; }
    .version-id { 
      background: #f0f0f0; 
      padding: 4px 8px; 
      border-radius: 4px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>❌ 版本文件不存在</h1>
    <p>版本 <span class="version-id">${versionId}</span> 的文件未找到。</p>
    <p>可能的原因：</p>
    <p>1. 版本文件尚未提取<br>2. 该版本不包含此页面<br>3. 服务器已重启，临时文件被清理</p>
    <p><strong>解决方法：</strong></p>
    <p>请先调用 <code>/api/git/build-version</code> 接口提取版本文件。</p>
  </div>
</body>
</html>
`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.statusCode = 404;
        res.end(errorHtml);
        return true;
      }
    }
    return false;
  }

  // 兼容旧的 .html 路径检查（如果标准化失败）
  if (req.url?.includes('/index.html')) {
    const [urlWithoutQuery, queryString] = req.url.split('?');
    const urlPath = urlWithoutQuery.replace('/index.html', '');
    const pathParts = urlPath.split('/').filter(Boolean);

    const params = new URLSearchParams(queryString || '');
    const versionId = params.get('ver');

    logVirtualHtmlDebug('旧格式请求路径:', req.url, '解析部分:', pathParts);

    if (pathParts.length >= 2 && ['components', 'prototypes', 'themes'].includes(pathParts[0])) {
      // 这种情况应该已经被标准化处理了，如果到这里说明有问题
      logVirtualHtmlWarn('未被标准化处理的路径:', req.url);
    }
  }

  return false;
}
