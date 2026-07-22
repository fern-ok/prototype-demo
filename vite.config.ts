import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createVendorAliases, loadVendorPackagesConfig } from './scripts/utils/vendor-packages.mjs';

// ── 构建模式也需要的插件（静态导入） ──
import { axhubComponentEnforcer } from './vite-plugins/axhubComponentEnforcer';
import { forceInlineDynamicImportsOff } from './vite-plugins/forceInlineDynamicImportsOff';
import { injectStablePageIds } from './vite-plugins/injectStablePageIds';
import {
  MAKE_CONFIG_RELATIVE_PATH,
  MAKE_ENTRIES_RELATIVE_PATH,
} from './vite-plugins/utils/makeConstants';
import { readEntriesManifest, scanProjectEntries, writeEntriesManifestAtomic } from './vite-plugins/utils/entriesManifest';

// ── 仅 dev server 模式需要的插件 ──
// 使用动态 import() 避免在 build 模式下加载这些模块。
// lowdbService 等单例会在模块求值时创建持久资源，导致 vite build 进程无法退出。
async function loadServePlugins(): Promise<Plugin[]> {
  const [
    { aiCliPlugin },
    { annotationApiPlugin },
    { autoDebugPlugin },
    { axureBridgeProxyPlugin },
    { canvasApiPlugin },
    { codeReviewPlugin },
    { configApiPlugin },
    { dataManagementApiPlugin },
    { docsApiPlugin },
    { docsImportApiPlugin },
    { downloadDistPlugin },
    { exportHtmlApiPlugin },
    { exportImageProxyPlugin },
    { fileSystemApiPlugin },
    { gitVersionApiPlugin },
    { lanAccessControlPlugin },
    { mediaManagementApiPlugin },
    { serveAdminPlugin },
    { sourceApiPlugin },
    { specDocApiPlugin },
    { subPagesApiPlugin },
    { templatesApiPlugin },
    { themesApiPlugin },
    { unsetReferenceApiPlugin },
    { uploadDocsApiPlugin },
    { versionApiPlugin },
    { virtualHtmlPlugin },
    { websocketPlugin },
    { writeDevServerInfoPlugin },
  ] = await Promise.all([
    import('./vite-plugins/aiCliPlugin'),
    import('./vite-plugins/annotationApiPlugin'),
    import('./vite-plugins/autoDebugPlugin'),
    import('./vite-plugins/axureBridgeProxyPlugin'),
    import('./vite-plugins/canvasApiPlugin'),
    import('./vite-plugins/codeReviewPlugin'),
    import('./vite-plugins/configApiPlugin'),
    import('./vite-plugins/dataManagementApiPlugin'),
    import('./vite-plugins/docsApiPlugin'),
    import('./vite-plugins/docsImportApiPlugin'),
    import('./vite-plugins/downloadDistPlugin'),
    import('./vite-plugins/exportHtmlApiPlugin'),
    import('./vite-plugins/exportImageProxyPlugin'),
    import('./vite-plugins/fileSystemApiPlugin'),
    import('./vite-plugins/gitVersionApiPlugin'),
    import('./vite-plugins/lanAccessControlPlugin'),
    import('./vite-plugins/mediaManagementApiPlugin'),
    import('./vite-plugins/serveAdminPlugin'),
    import('./vite-plugins/sourceApiPlugin'),
    import('./vite-plugins/specDocApiPlugin'),
    import('./vite-plugins/subPagesApiPlugin'),
    import('./vite-plugins/templatesApiPlugin'),
    import('./vite-plugins/themesApiPlugin'),
    import('./vite-plugins/unsetReferenceApiPlugin'),
    import('./vite-plugins/uploadDocsApiPlugin'),
    import('./vite-plugins/versionApiPlugin'),
    import('./vite-plugins/virtualHtml'),
    import('./vite-plugins/websocketPlugin'),
    import('./vite-plugins/writeDevServerInfoPlugin'),
  ]);

  return [
    lanAccessControlPlugin(),
    writeDevServerInfoPlugin(),
    serveAdminPlugin(),
    axureBridgeProxyPlugin(),
    exportImageProxyPlugin(),
    virtualHtmlPlugin(),
    websocketPlugin(),
    versionApiPlugin(),
    downloadDistPlugin(),
    exportHtmlApiPlugin(),
    docsImportApiPlugin(),
    docsApiPlugin(),
    canvasApiPlugin(),
    templatesApiPlugin(),
    uploadDocsApiPlugin(),
    sourceApiPlugin(),
    specDocApiPlugin(),
    subPagesApiPlugin(),
    unsetReferenceApiPlugin(),
    themesApiPlugin(),
    fileSystemApiPlugin(),
    dataManagementApiPlugin(),
    mediaManagementApiPlugin(),
    codeReviewPlugin(),
    autoDebugPlugin(),
    configApiPlugin(),
    annotationApiPlugin(),
    aiCliPlugin(),
    gitVersionApiPlugin(),
  ];
}

const projectRoot = process.cwd();
const vendorPackagesConfig = loadVendorPackagesConfig(projectRoot);
const vendorAliases = createVendorAliases(projectRoot, vendorPackagesConfig);
const configPath = path.resolve(projectRoot, MAKE_CONFIG_RELATIVE_PATH);
let axhubConfig: any = { server: { host: 'localhost', allowLAN: true } };
if (fs.existsSync(configPath)) {
  try {
    axhubConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.warn(`Failed to parse ${MAKE_CONFIG_RELATIVE_PATH}, using defaults:`, error);
  }
}

writeEntriesManifestAtomic(
  projectRoot,
  scanProjectEntries(projectRoot, ['components', 'prototypes', 'themes']),
);
const entries = readEntriesManifest(projectRoot);

const entryKey = process.env.ENTRY_KEY;
const jsEntries = entries.js as Record<string, string>;
const htmlEntries = entries.html as Record<string, string>;

const hasSingleEntry = typeof entryKey === 'string' && entryKey.length > 0;
let rollupInput: Record<string, string> = htmlEntries;

if (hasSingleEntry) {
  if (!jsEntries[entryKey as string]) {
    throw new Error(`ENTRY_KEY=${entryKey} 未在 ${MAKE_ENTRIES_RELATIVE_PATH} 中找到对应入口文件。请确保目录 src/${entryKey} 存在且包含 index.tsx 文件。`);
  }
  rollupInput = { [entryKey as string]: jsEntries[entryKey as string] };
}

const isIifeBuild = hasSingleEntry;

export default defineConfig(async ({ command }) => {
  const isServe = command === 'serve';

  // 仅在 serve 模式才加载 server-only 插件，避免 build 进程被持久资源阻塞
  const servePlugins = isServe ? await loadServePlugins() : [];

  const config: any = {
    plugins: [
      tailwindcss(),
      injectStablePageIds(),
      ...servePlugins,
      forceInlineDynamicImportsOff(isIifeBuild),
      react({
        jsxRuntime: 'classic',
        babel: { configFile: false, babelrc: false }
      }),
      isIifeBuild ? axhubComponentEnforcer(jsEntries[entryKey as string]) : null
    ].filter(Boolean) as Plugin[],

    root: 'src',

    optimizeDeps: {
      // React Fast Refresh 在开发态会接管 react/react-dom 的依赖预处理。
      // 这里不要再把它们排除掉，否则会和 plugin-react 的 include 冲突。
      exclude: [],
      include: [
        'lucide-react'
      ]
    },

    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(projectRoot, 'src') },
        ...vendorAliases.map((alias) => ({
          find: new RegExp(`^${alias.packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
          replacement: alias.runtimeEntryAbsolute,
        })),
        !isIifeBuild && !isServe && {
          find: /^react$/,
          replacement: path.resolve(projectRoot, 'src/common/react-shim.js')
        },
        !isIifeBuild && !isServe && {
          find: /^react-dom$/,
          replacement: path.resolve(projectRoot, 'src/common/react-dom-shim.js')
        },
        !isIifeBuild && !isServe && {
          find: /^react\/.*/,
          replacement: path.resolve(projectRoot, 'src/common/react-shim.js')
        },
        !isIifeBuild && !isServe && {
          find: /^react-dom\/.*/,
          replacement: path.resolve(projectRoot, 'src/common/react-dom-shim.js')
        }
      ].filter(Boolean) as { find: string | RegExp; replacement: string }[]
    },

    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        },
        sass: {
          api: 'modern-compiler'
        }
      }
    },

    server: {
      port: 51720, // 默认从 51720 开始，如果被占用会自动尝试 51721, 51722...
      strictPort: false, // 端口被占用时自动尝试下一个端口
      host: '0.0.0.0', // 统一使用 0.0.0.0 绑定，确保端口检测正确
      open: false, // 开发态不要自动打开浏览器，避免端口回退时误打开 51721/51722 等页面
      cors: true,
      // HMR 配置
      hmr: {
        // 禁用 Vite 的错误覆盖层（Error Overlay）
        // 原因：项目使用多入口架构（prototypes、components 等），Vite 的 Error Overlay 会在所有打开的页面上显示错误
        // 这导致用户在访问页面 A 时，如果页面 B 出现构建错误，错误会跨页面显示在页面 A 上，造成困扰
        // 解决方案：禁用 Vite 的 Error Overlay，使用 dev-template.html 中已实现的自定义错误捕获和显示系统
        // 优点：避免跨页面错误显示，保持错误提示的页面隔离性，风险最小
        overlay: false
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    },

    build: {
      outDir: path.resolve(projectRoot, 'dist'),
      emptyOutDir: !isIifeBuild,
      target: isIifeBuild ? 'es2015' : 'esnext',
      assetsInlineLimit: 1024 * 1024, // 1MB - 小于此大小的图片会被内联为 Base64

      rollupOptions: {
        input: rollupInput,

        external: isIifeBuild ? ['react', 'react-dom'] : [],

        output: {
          entryFileNames: (chunkInfo: { name: string }) => `${chunkInfo.name}.js`,
          format: isIifeBuild ? 'iife' : 'es',
          name: 'UserComponent',

          ...(isIifeBuild
            ? {
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM'
              },
              generatedCode: { constBindings: false }
            }
            : {})
        }
      },

      minify: isIifeBuild ? 'esbuild' : false
    },

    esbuild: isIifeBuild
      ? {
        target: 'es2015',
        legalComments: 'none',
        keepNames: true
      }
      : {
        jsx: 'transform',
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment'
      },

    test: {
      globals: true,
      environment: 'node',
      include: [
        'tests/**/*.test.ts',
        'tests/**/*.test.tsx',
        'scripts/**/*.test.ts',
        'scripts/**/*.test.mjs',
        'vite-plugins/**/*.test.ts',
      ],
      root: '.',
    }
  };

  return config;
});
