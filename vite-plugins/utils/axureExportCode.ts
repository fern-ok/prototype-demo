import path from 'path';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { build as viteBuild } from 'vite';

import { injectStablePageIds } from '../injectStablePageIds';
import { createVendorAliases, loadVendorPackagesConfig } from '../../scripts/utils/vendor-packages.mjs';

export interface AxureExportCodeResult {
  code: string;
  codePath: string;
}

function sanitizeAxureRuntimeCode(code: string): string {
  return String(code || '').replace(/\bprocess\.env\.NODE_ENV\b/g, '"production"');
}

function normalizeTargetPath(targetPath: string): string {
  return String(targetPath || '').trim().replace(/^\/+/, '').replace(/\/+$/, '');
}

function isSafeTargetPath(targetPath: string): boolean {
  if (!targetPath) return false;
  if (targetPath.includes('..')) return false;
  if (targetPath.startsWith('/')) return false;
  if (path.isAbsolute(targetPath)) return false;
  return /^(components|prototypes)\/[a-z0-9-]+$/.test(targetPath);
}

export function buildAxureExportCodePath(targetPath: string): string {
  const normalized = normalizeTargetPath(targetPath);
  return `/api/axure-export-code?path=${encodeURIComponent(normalized)}`;
}

export function resolveAxureEntryFilePath(projectRoot: string, targetPath: string): string {
  const normalized = normalizeTargetPath(targetPath);
  if (!isSafeTargetPath(normalized)) {
    throw new Error('无效的 Axure 导出路径');
  }

  const entryFilePath = path.resolve(projectRoot, 'src', normalized, 'index.tsx');
  return entryFilePath;
}

function loadVendorAliases(projectRoot: string) {
  try {
    const vendorPackagesConfig = loadVendorPackagesConfig(projectRoot);
    return createVendorAliases(projectRoot, vendorPackagesConfig);
  } catch {
    return [];
  }
}

function buildComponentBridgeCode(): string {
  return `
;var Component = UserComponent && (UserComponent.Component || UserComponent.default || UserComponent);
if (typeof window !== 'undefined') {
  window.Component = Component;
}
`;
}

function buildCssInjectionCode(cssText: string): string {
  if (!cssText.trim()) {
    return '';
  }

  return `(function() {
  if (typeof document === 'undefined') {
    return;
  }
  var style = document.createElement("style");
  style.textContent = ${JSON.stringify(cssText)};
  document.head.appendChild(style);
})();
`;
}

export async function generateAxureExportCode(projectRoot: string, targetPath: string): Promise<AxureExportCodeResult> {
  const normalized = normalizeTargetPath(targetPath);
  const entryFilePath = resolveAxureEntryFilePath(projectRoot, normalized);
  const vendorAliases = loadVendorAliases(projectRoot);

  const bundleResult = await viteBuild({
    configFile: false,
    publicDir: false,
    logLevel: 'silent',
    root: projectRoot,
    plugins: [
      tailwindcss(),
      injectStablePageIds(),
      react({
        jsxRuntime: 'classic',
        babel: { configFile: false, babelrc: false },
      }),
    ],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(projectRoot, 'src') },
        ...vendorAliases.map((alias: any) => ({
          find: new RegExp(`^${String(alias.packageName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
          replacement: alias.runtimeEntryAbsolute,
        })),
      ],
    },
    css: {
      preprocessorOptions: {
        scss: { api: 'modern-compiler' },
        sass: { api: 'modern-compiler' },
      },
    },
    build: {
      write: false,
      emptyOutDir: false,
      minify: 'esbuild',
      cssCodeSplit: false,
      target: 'es2015',
      assetsInlineLimit: 1024 * 1024,
      lib: {
        entry: entryFilePath,
        formats: ['iife'],
        name: 'UserComponent',
        fileName: () => 'axure-export.js',
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          inlineDynamicImports: true,
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
          generatedCode: {
            constBindings: false,
          },
        },
      },
    },
    esbuild: {
      target: 'es2015',
      legalComments: 'none',
      keepNames: true,
    },
  });

  const outputs = Array.isArray(bundleResult) ? bundleResult : [bundleResult];
  const outputBundle = outputs.find((item: any) => item && item.output && Array.isArray(item.output)) as
    | { output: Array<{ type: string; fileName: string; code?: string; source?: string | Uint8Array }> }
    | undefined;

  const jsChunk = outputBundle?.output.find((item) => item.type === 'chunk' && typeof item.code === 'string');
  if (!jsChunk || typeof jsChunk.code !== 'string') {
    throw new Error('Axure 导出代码生成失败');
  }
  const sanitizedJsCode = sanitizeAxureRuntimeCode(jsChunk.code);

  const cssAsset = outputBundle?.output.find((item) => (
    item.type === 'asset'
    && typeof item.fileName === 'string'
    && item.fileName.endsWith('.css')
  ));
  const cssText = typeof cssAsset?.source === 'string'
    ? cssAsset.source
    : cssAsset?.source instanceof Uint8Array
      ? Buffer.from(cssAsset.source).toString('utf8')
      : '';

  return {
    code: `${buildCssInjectionCode(cssText)}${sanitizedJsCode}${buildComponentBridgeCode()}`,
    codePath: buildAxureExportCodePath(normalized),
  };
}
