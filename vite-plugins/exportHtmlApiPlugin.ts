import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import archiver from 'archiver';

import { getRequestPathname } from './utils/httpUtils';
import { buildAttachmentContentDisposition } from './utils/contentDisposition';
import { scanProjectEntries, writeEntriesManifestAtomic, readEntriesManifest } from './utils/entriesManifest';
import { generateAxureExportCode } from './utils/axureExportCode';
import { buildExportIndexBundle } from './utils/exportIndexBundle';
import { buildPreviewTitle, readEntryDisplayName } from './utils/previewTitle';

const OFFLINE_REACT_FILE_NAME = 'react.production.min.js';
const OFFLINE_REACT_DOM_FILE_NAME = 'react-dom.production.min.js';
const OFFLINE_BOOTSTRAP_FILE_NAME = 'export-html-bootstrap.js';

interface ExportEntry {
  key: string;
  group: 'components' | 'prototypes';
  name: string;
  displayName: string;
  jsPath: string;
}

function createExportEntry(projectRoot: string, key: string): ExportEntry | null {
  const manifest = readEntriesManifest(projectRoot);
  const item = manifest.items?.[key] as { group: string; name: string } | undefined;
  if (!item || (item.group !== 'components' && item.group !== 'prototypes')) {
    return null;
  }

  const builtJsPath = path.join(projectRoot, 'dist', `${key}.js`);
  if (!fs.existsSync(builtJsPath)) {
    return null;
  }

  const srcIndexPath = path.join(projectRoot, 'src', key, 'index.tsx');
  return {
    key,
    group: item.group,
    name: item.name,
    displayName: readEntryDisplayName(srcIndexPath) || item.name,
    jsPath: `${key}.js`,
  };
}

function scanBuiltEntries(projectRoot: string, options: { includeRef?: boolean } = {}): ExportEntry[] {
  const manifest = readEntriesManifest(projectRoot);
  const includeRef = options.includeRef === true;
  const entries: ExportEntry[] = [];

  for (const key of Object.keys(manifest.items || {})) {
    const entry = createExportEntry(projectRoot, key);
    if (!entry) continue;
    if (!includeRef && entry.name.startsWith('ref-')) continue;
    entries.push(entry);
  }

  return entries;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function serializeForInlineScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function readExportTemplate(projectRoot: string): string {
  const templatePath = path.join(projectRoot, 'admin', 'html-template.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error('缺少 admin/html-template.html，请先构建 prototype-admin');
  }
  return fs.readFileSync(templatePath, 'utf8');
}

function resolveNodeModuleFile(projectRoot: string, relativePath: string): string {
  let currentDir = projectRoot;

  while (true) {
    const candidate = path.join(currentDir, 'node_modules', relativePath);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  throw new Error(`缺少离线导出依赖资源: ${relativePath}`);
}

function getOfflineBootstrapScript(): string {
  return `;(function () {
  function applyRootSizing() {
    var urlParams = new URLSearchParams(window.location.search);
    var scale = urlParams.get('scale');
    var width = urlParams.get('width');
    var height = urlParams.get('height');
    var rootElement = document.getElementById('root');

    if (!rootElement) {
      return;
    }

    if (scale) {
      var scaleValue = parseFloat(scale);
      if (!Number.isNaN(scaleValue) && scaleValue > 0) {
        rootElement.style.transform = 'scale(' + scaleValue + ')';
        rootElement.style.transformOrigin = 'top left';
      }
    }

    if (width) {
      var widthValue = parseInt(width, 10);
      if (!Number.isNaN(widthValue) && widthValue > 0) {
        rootElement.style.width = widthValue + 'px';
      }
    }

    if (height) {
      var heightValue = parseInt(height, 10);
      if (!Number.isNaN(heightValue) && heightValue > 0) {
        rootElement.style.height = heightValue + 'px';
      }
    }
  }

  function renderComponent(Component, props) {
    var rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('[Html Template] 找不到 #root 元素');
      return;
    }

    if (!window.React || !window.ReactDOM) {
      console.error('[Html Template] React 或 ReactDOM 未加载');
      return;
    }

    var finalProps = props || {
      container: rootElement,
      config: {},
      data: {},
      events: {},
    };

    try {
      if (typeof window.ReactDOM.createRoot === 'function') {
        window.ReactDOM.createRoot(rootElement).render(window.React.createElement(Component, finalProps));
        return;
      }

      if (typeof window.ReactDOM.render === 'function') {
        window.ReactDOM.render(window.React.createElement(Component, finalProps), rootElement);
        return;
      }

      throw new Error('当前 ReactDOM 版本不支持 createRoot/render');
    } catch (error) {
      console.error('[Html Template] 渲染失败:', error);
    }
  }

  applyRootSizing();

  window.__AXHUB_DEFINE_COMPONENT__ = function (Component) {
    window.UserComponent = Component;
    return Component;
  };

  window.HtmlTemplateBootstrap = {
    renderComponent: renderComponent,
    React: window.React,
    ReactDOM: window.ReactDOM,
  };
})();`;
}

function buildOfflineVendorScriptTags(options: {
  reactPath: string;
  reactDomPath: string;
  bootstrapPath: string;
}): string {
  return `  <script src="${options.reactPath}"></script>
  <script src="${options.reactDomPath}"></script>
  <script src="${options.bootstrapPath}"></script>`;
}

function buildOfflineRenderScript(entryScriptPath: string): string {
  return `  <script>
    function waitForBootstrap(timeoutMs = 10000) {
      return new Promise((resolve, reject) => {
        const startedAt = Date.now();

        function check() {
          if (window.HtmlTemplateBootstrap) {
            resolve(window.HtmlTemplateBootstrap);
            return;
          }

          if (Date.now() - startedAt >= timeoutMs) {
            reject(new Error('[Html Template] Bootstrap 初始化超时'));
            return;
          }

          setTimeout(check, 10);
        }

        check();
      });
    }

    function loadEntryScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(\`[Html Template] 入口脚本加载失败: \${src}\`));
        document.body.appendChild(script);
      });
    }

    async function bootstrapAndRender() {
      try {
        const bootstrap = await waitForBootstrap();
        const { renderComponent, React, ReactDOM } = bootstrap;

        window.React = React;
        window.ReactDOM = ReactDOM;

        await loadEntryScript('${entryScriptPath}');

        const Component = window.UserComponent?.Component || window.UserComponent?.default || window.UserComponent;
        if (!Component) {
          throw new Error('[Html Template] 入口脚本未暴露 UserComponent');
        }

        renderComponent(Component);
      } catch (error) {
        console.error('[Html Template] 页面初始化失败:', error);
      }
    }

    bootstrapAndRender();
  </script>`;
}

function generateExportPageHtml(
  projectRoot: string,
  entry: ExportEntry,
  options: {
    entryScriptPath: string;
    reactPath: string;
    reactDomPath: string;
    bootstrapPath: string;
  },
): string {
  const title = buildPreviewTitle({
    group: entry.group,
    name: entry.name,
    displayName: entry.displayName,
    mode: 'export',
  });

  return readExportTemplate(projectRoot)
    .replace(/\{\{TITLE\}\}/g, escapeHtml(title))
    .replace('<body>', `<body>\n\n  <script>\n    window.__AXHUB_EXPORT_META__ = ${serializeForInlineScript({ group: entry.group })};\n  </script>`)
    .replace(/window\.location\.pathname\.includes\('\/components\/'\)/g, `window.location.pathname.includes('/components/') || window.__AXHUB_EXPORT_META__?.group === 'components'`)
    .replace(/<script type="module" src="\{\{BOOTSTRAP_PATH\}\}"><\/script>/, buildOfflineVendorScriptTags(options))
    .replace(/<script type="module">[\s\S]*?bootstrapAndRender\(\);\s*<\/script>/, buildOfflineRenderScript(options.entryScriptPath));
}

function generateIndexHtml(entries: ExportEntry[], projectName: string): string {
  const prototypes = entries.filter((entry) => entry.group === 'prototypes');
  const components = entries.filter((entry) => entry.group === 'components');

  const renderList = (items: ExportEntry[]) => items.map((item) => {
    const href = `${item.group}/${item.name}.html`;
    return `        <a href="${href}" class="item-card">
          <div class="item-name">${escapeHtml(item.displayName)}</div>
          <div class="item-path">${escapeHtml(item.key)}</div>
        </a>`;
  }).join('\n');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(projectName)} - 原型预览</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: #f5f5f5;
      color: #333;
      min-height: 100vh;
    }
    .header {
      background: #fff;
      border-bottom: 1px solid #e8e8e8;
      padding: 24px 32px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .header h1 span { color: #1677ff; }
    .header p {
      margin-top: 8px;
      font-size: 14px;
      color: #999;
    }
    .content {
      max-width: 960px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #666;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e8e8e8;
    }
    .section { margin-bottom: 32px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .item-card {
      display: block;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 20px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
    }
    .item-card:hover {
      border-color: #1677ff;
      box-shadow: 0 2px 8px rgba(22, 119, 255, 0.1);
      transform: translateY(-2px);
    }
    .item-name {
      font-size: 15px;
      font-weight: 500;
      color: #1a1a1a;
      margin-bottom: 6px;
    }
    .item-path {
      font-size: 12px;
      color: #999;
      font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
    }
    .empty {
      color: #ccc;
      font-size: 14px;
      padding: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(projectName)} <span>原型预览</span></h1>
    <p>共 ${entries.length} 个页面 · 由 Axhub Make 导出</p>
  </div>
  <div class="content">
${prototypes.length > 0 ? `    <div class="section">
      <div class="section-title">页面（${prototypes.length}）</div>
      <div class="grid">
${renderList(prototypes)}
      </div>
    </div>` : ''}
${components.length > 0 ? `    <div class="section">
      <div class="section-title">组件（${components.length}）</div>
      <div class="grid">
${renderList(components)}
      </div>
    </div>` : ''}
${entries.length === 0 ? '    <div class="empty">没有可预览的页面或组件</div>' : ''}
  </div>
</body>
</html>`;
}

function sendJSON(res: any, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function buildSingleEntry(projectRoot: string, entryKey: string) {
  const buildResult = spawnSync('npx', ['vite', 'build'], {
    cwd: projectRoot,
    env: { ...process.env, ENTRY_KEY: entryKey },
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 5 * 60 * 1000,
    shell: true,
  });

  if (buildResult.status !== 0) {
    const stderr = buildResult.stderr?.toString() || '';
    const stdout = buildResult.stdout?.toString() || '';
    throw new Error(stderr || stdout || `exit code ${buildResult.status}`);
  }
}

function buildAllEntries(projectRoot: string) {
  const buildScript = path.join(projectRoot, 'scripts', 'build-all.js');
  const nodeCommand = process.platform === 'win32' ? 'node.exe' : 'node';
  const buildResult = spawnSync(nodeCommand, [buildScript], {
    cwd: projectRoot,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 5 * 60 * 1000,
  });

  if (buildResult.status !== 0) {
    const stderr = buildResult.stderr?.toString() || '';
    const stdout = buildResult.stdout?.toString() || '';
    throw new Error(stderr || stdout || `exit code ${buildResult.status}`);
  }
}

function sanitizeZipName(name: string) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function getProjectName(projectRoot: string): string {
  try {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return pkg.name || 'Axhub Project';
    }
  } catch {
    // ignore
  }

  return 'Axhub Project';
}

function ensureManifest(projectRoot: string) {
  const scanned = scanProjectEntries(projectRoot, ['components', 'prototypes', 'themes']);
  return writeEntriesManifestAtomic(projectRoot, scanned);
}

function resolveRequestedEntry(projectRoot: string, targetPath: string): ExportEntry | null {
  const manifest = ensureManifest(projectRoot);
  const item = manifest.items?.[targetPath] as { group: string } | undefined;
  if (!item || (item.group !== 'components' && item.group !== 'prototypes')) {
    return null;
  }

  buildSingleEntry(projectRoot, targetPath);
  return createExportEntry(projectRoot, targetPath);
}

function resolveManifestEntry(projectRoot: string, targetPath: string): ExportEntry | null {
  const manifest = ensureManifest(projectRoot);
  const item = manifest.items?.[targetPath] as { group: string; name: string } | undefined;
  if (!item || (item.group !== 'components' && item.group !== 'prototypes')) {
    return null;
  }

  const srcIndexPath = path.join(projectRoot, 'src', targetPath, 'index.tsx');
  return {
    key: targetPath,
    group: item.group,
    name: item.name,
    displayName: readEntryDisplayName(srcIndexPath) || item.name,
    jsPath: `${targetPath}.js`,
  };
}

export function exportHtmlApiPlugin(): Plugin {
  return {
    name: 'export-html-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const pathname = getRequestPathname(req);
        if (
          req.method !== 'GET'
          || (pathname !== '/api/export-html' && pathname !== '/api/export-index-bundle' && pathname !== '/api/axure-export-code')
        ) {
          return next();
        }

        const projectRoot = process.cwd();

        try {
          const requestUrl = new URL(req.url, 'http://127.0.0.1');
          const targetPath = requestUrl.searchParams.get('path')?.trim() || '';

          if (pathname === '/api/axure-export-code') {
            if (!targetPath) {
              return sendJSON(res, 400, { error: '缺少 path 参数' });
            }

            const entry = resolveManifestEntry(projectRoot, targetPath);
            if (!entry) {
              return sendJSON(res, 404, { error: '未找到可导出的原型或组件' });
            }

            const result = await generateAxureExportCode(projectRoot, entry.key);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
            res.end(result.code);
            return;
          }

          if (pathname === '/api/export-index-bundle') {
            if (!targetPath) {
              return sendJSON(res, 400, { error: '缺少 path 参数' });
            }

            const entry = resolveRequestedEntry(projectRoot, targetPath);
            if (!entry) {
              return sendJSON(res, 404, { error: '未找到可导出的原型或组件' });
            }

            return sendJSON(res, 200, await buildExportIndexBundle(projectRoot, entry));
          }

          console.log('\n📦 [导出 HTML] 开始构建...');

          let entries: ExportEntry[] = [];
          let singleEntry: ExportEntry | null = null;

          if (targetPath) {
            console.log(`[导出 HTML] 构建单个入口: ${targetPath}`);
            singleEntry = resolveRequestedEntry(projectRoot, targetPath);
            if (!singleEntry) {
              return sendJSON(res, 404, { error: '未找到可导出的原型或组件' });
            }
            entries = [singleEntry];
            console.log(`[导出 HTML] 单条目导出就绪: ${singleEntry.key}`);
          } else {
            ensureManifest(projectRoot);
            console.log('[导出 HTML] 运行全量构建脚本...');
            buildAllEntries(projectRoot);
            entries = scanBuiltEntries(projectRoot);
            if (entries.length === 0) {
              return sendJSON(res, 500, { error: '构建完成但没有找到可导出的页面' });
            }
            console.log(`[导出 HTML] 找到 ${entries.length} 个可导出入口`);
          }

          const projectName = getProjectName(projectRoot);
          const zipFileName = singleEntry
            ? `${sanitizeZipName(singleEntry.name)}-html.zip`
            : `${sanitizeZipName(projectName)}-html.zip`;

          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', buildAttachmentContentDisposition(zipFileName));

          const archive = archiver('zip', { zlib: { level: 6 } });
          archive.on('warning', (warning: any) => {
            console.warn('[导出 HTML] ZIP warning:', warning);
          });
          archive.on('error', (error: any) => {
            console.error('[导出 HTML] ZIP error:', error);
            if (!res.headersSent) {
              sendJSON(res, 500, { error: `ZIP 创建失败: ${error.message}` });
            } else {
              res.end();
            }
          });
          archive.pipe(res);

          const distDir = path.join(projectRoot, 'dist');
          // Exported HTML pages use an inline template plus a tiny offline bootstrap,
          // so the full admin asset set (spec/editor/dev templates) is unnecessary.
          archive.file(
            resolveNodeModuleFile(projectRoot, path.join('react', 'umd', OFFLINE_REACT_FILE_NAME)),
            { name: `assets/${OFFLINE_REACT_FILE_NAME}` },
          );
          archive.file(
            resolveNodeModuleFile(projectRoot, path.join('react-dom', 'umd', OFFLINE_REACT_DOM_FILE_NAME)),
            { name: `assets/${OFFLINE_REACT_DOM_FILE_NAME}` },
          );
          archive.append(getOfflineBootstrapScript(), { name: `assets/${OFFLINE_BOOTSTRAP_FILE_NAME}` });

          if (singleEntry) {
            const entryJsPath = path.join(distDir, singleEntry.jsPath);
            if (!fs.existsSync(entryJsPath)) {
              return sendJSON(res, 500, { error: '构建完成但缺少当前条目的 JS 产物' });
            }

            archive.file(entryJsPath, { name: 'index.js' });
            archive.append(
              generateExportPageHtml(projectRoot, singleEntry, {
                entryScriptPath: './index.js',
                reactPath: `./assets/${OFFLINE_REACT_FILE_NAME}`,
                reactDomPath: `./assets/${OFFLINE_REACT_DOM_FILE_NAME}`,
                bootstrapPath: `./assets/${OFFLINE_BOOTSTRAP_FILE_NAME}`,
              }),
              { name: 'index.html' },
            );
          } else {
            archive.append(generateIndexHtml(entries, projectName), { name: 'index.html' });

            for (const entry of entries) {
              const entryJsPath = path.join(distDir, entry.jsPath);
              if (fs.existsSync(entryJsPath)) {
                archive.file(entryJsPath, { name: entry.jsPath });
              }

              archive.append(
                generateExportPageHtml(projectRoot, entry, {
                  entryScriptPath: `./${entry.name}.js`,
                  reactPath: `../assets/${OFFLINE_REACT_FILE_NAME}`,
                  reactDomPath: `../assets/${OFFLINE_REACT_DOM_FILE_NAME}`,
                  bootstrapPath: `../assets/${OFFLINE_BOOTSTRAP_FILE_NAME}`,
                }),
                { name: `${entry.group}/${entry.name}.html` },
              );
            }
          }

          const mediaDir = path.join(projectRoot, 'src', 'media');
          if (fs.existsSync(mediaDir)) {
            archive.directory(mediaDir, 'media');
          }

          await archive.finalize();
          console.log('[导出 HTML] ✅ ZIP 导出完成');
        } catch (error: any) {
          console.error('[导出 HTML] 导出失败:', error);
          if (!res.headersSent) {
            sendJSON(res, 500, { error: error.message || '导出失败' });
          }
        }
      });
    },
  };
}
