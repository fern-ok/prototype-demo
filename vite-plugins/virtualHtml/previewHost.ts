import path from 'path';

import { encodeRoutePath } from './handlers/pathNormalizer';
import { buildDocApiPath } from '../utils/docUtils';

export const PREVIEW_HOST_MODULE_PREFIX = 'virtual:axhub-preview-host.js?';

export interface PreviewHostModuleOptions {
  type: 'components' | 'prototypes' | 'themes';
  name: string;
  entryImportPath: string;
  resourcePath: string;
  resourceUrlPath: string;
  editableHackCssHref: string | null;
  initialHackCssEnabled: boolean;
  versionId?: string;
}

export interface HackCssUpdatePayload {
  resourcePath: string;
  href: string;
  removed: boolean;
  timestamp: number;
}

export interface DocUpdatePayload {
  docUrl: string;
  filePath: string;
  removed: boolean;
  timestamp: number;
}

export function createPreviewHostModuleId(options: PreviewHostModuleOptions): string {
  const params = new URLSearchParams({
    resourceType: options.type,
    name: options.name,
    entry: options.entryImportPath,
    resourcePath: options.resourcePath,
    resourceUrlPath: options.resourceUrlPath,
    initialHackCssEnabled: options.initialHackCssEnabled ? '1' : '0',
  });

  if (options.editableHackCssHref) {
    params.set('editableHackCssHref', options.editableHackCssHref);
  }

  if (options.versionId) {
    params.set('versionId', options.versionId);
  }

  return `${PREVIEW_HOST_MODULE_PREFIX}${params.toString()}`;
}

export function parsePreviewHostModuleId(id: string): PreviewHostModuleOptions | null {
  if (!id.startsWith(PREVIEW_HOST_MODULE_PREFIX)) {
    return null;
  }

  const params = new URLSearchParams(id.slice(PREVIEW_HOST_MODULE_PREFIX.length));
  const type = params.get('resourceType');
  const name = params.get('name');
  const entryImportPath = params.get('entry');
  const resourcePath = params.get('resourcePath');
  const resourceUrlPath = params.get('resourceUrlPath');

  if (
    (type !== 'components' && type !== 'prototypes' && type !== 'themes')
    || !name
    || !entryImportPath
    || !resourcePath
    || !resourceUrlPath
  ) {
    return null;
  }

  return {
    type,
    name,
    entryImportPath,
    resourcePath,
    resourceUrlPath,
    editableHackCssHref: params.get('editableHackCssHref'),
    initialHackCssEnabled: params.get('initialHackCssEnabled') === '1',
    versionId: params.get('versionId') || undefined,
  };
}

export function replacePreviewLoaderScript(html: string, previewHostModuleCode: string): string {
  const indentedCode = previewHostModuleCode
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');
  const loaderScript = `  <script type="module">\n${indentedCode}\n  </script>`;
  const legacyLoaderPattern = /<script type="module">\s*\/\/ 等待 bootstrap 加载完成[\s\S]*?<\/script>\s*<\/body>/;

  if (legacyLoaderPattern.test(html)) {
    return html.replace(legacyLoaderPattern, `${loaderScript}\n\n</body>`);
  }

  return html.replace('</body>', `${loaderScript}\n</body>`);
}

export function resolveEditableHackCssHref(
  type: 'components' | 'prototypes' | 'themes',
  name: string,
  versionId?: string,
): string | null {
  if (versionId) {
    return null;
  }

  if (type !== 'components' && type !== 'prototypes') {
    return null;
  }

  return encodeRoutePath(`/${type}/${name}/hack.css`);
}

export function createHackCssUpdatePayload(filePath: string, changeType: 'add' | 'change' | 'unlink'): HackCssUpdatePayload | null {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const marker = '/src/';
  const markerIndex = normalizedPath.lastIndexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const relativePath = normalizedPath.slice(markerIndex + marker.length);
  const pathParts = relativePath.split('/');

  if (pathParts.length < 3) {
    return null;
  }

  const [type, ...rest] = pathParts;
  if ((type !== 'components' && type !== 'prototypes') || rest[rest.length - 1] !== 'hack.css') {
    return null;
  }

  const name = rest.slice(0, -1).join('/');
  if (!name) {
    return null;
  }

  return {
    resourcePath: `${type}/${name}`,
    href: encodeRoutePath(`/${type}/${name}/hack.css`),
    removed: changeType === 'unlink',
    timestamp: Date.now(),
  };
}

export function createDocUpdatePayload(filePath: string, changeType: 'add' | 'change' | 'unlink'): DocUpdatePayload | null {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const marker = '/src/';
  const markerIndex = normalizedPath.lastIndexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const relativePath = normalizedPath.slice(markerIndex + marker.length);
  const pathParts = relativePath.split('/');

  if (pathParts.length < 2) {
    return null;
  }

  if (pathParts[0] === 'docs' && relativePath.endsWith('.md')) {
    const docName = relativePath.slice('docs/'.length);
    if (!docName) {
      return null;
    }

    return {
      docUrl: buildDocApiPath(docName),
      filePath: normalizedPath,
      removed: changeType === 'unlink',
      timestamp: Date.now(),
    };
  }

  const [type, ...rest] = pathParts;
  if ((type !== 'components' && type !== 'prototypes' && type !== 'themes') || rest.length < 2) {
    return null;
  }

  const fileName = rest[rest.length - 1];
  if (fileName !== 'spec.md' && fileName !== 'prd.md') {
    return null;
  }

  const name = rest.slice(0, -1).join('/');
  if (!name) {
    return null;
  }

  return {
    docUrl: encodeRoutePath(`/${type}/${name}/${fileName}`),
    filePath: normalizedPath,
    removed: changeType === 'unlink',
    timestamp: Date.now(),
  };
}

function toJsString(value: string | null): string {
  return value === null ? 'null' : JSON.stringify(value);
}

export function createPreviewHostModuleCode(options: PreviewHostModuleOptions): string {
  const editorModeBootstrapSnippet = `
function resolveInitialEditorMode() {
  const params = new URLSearchParams(window.location.search);
  const editor = params.get('editor');
  if (editor === 'textEdit' || editor === 'webEditorV2' || editor === 'annotation') {
    return editor;
  }
  return 'none';
}

function maybeEnableInitialEditorMode(hostState) {
  if (hostState.editorModeHandled) {
    return;
  }

  const bootstrap = window.DevTemplateBootstrap;
  if (!bootstrap || !bootstrap.editors || typeof bootstrap.editors.enable !== 'function') {
    window.setTimeout(() => maybeEnableInitialEditorMode(hostState), 30);
    return;
  }

  hostState.editorModeHandled = true;
  const initialMode = resolveInitialEditorMode();
  if (initialMode === 'none') {
    Promise.resolve(bootstrap.editors.disable?.()).catch((error) => {
      hostState.editorModeHandled = false;
      console.error('[Axhub Preview Host] Failed to sync default editor mode:', error);
    });
    return;
  }

  Promise.resolve(bootstrap.editors.enable(initialMode)).catch((error) => {
    hostState.editorModeHandled = false;
    console.error('[Axhub Preview Host] Failed to enable initial editor mode:', error);
  });
}
`;

  return `import React from 'react';
import * as ReactDOMLegacy from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';
import PreviewComponent from ${JSON.stringify(options.entryImportPath)};

const RESOURCE_PATH = ${JSON.stringify(options.resourcePath)};
const RESOURCE_URL_PATH = ${JSON.stringify(options.resourceUrlPath)};
const ENTRY_IMPORT_PATH = ${JSON.stringify(options.entryImportPath)};
const AXHUB_RUNTIME_KEY = '__AXHUB_PREVIEW_RUNTIME__';
const AXHUB_HOST_KEY = ${JSON.stringify(options.resourcePath)};
let CurrentComponent = PreviewComponent;
let currentHackCssHref = ${toJsString(options.editableHackCssHref)};

const LegacyReactDOM = {
  ...ReactDOMLegacy,
  createRoot,
  hydrateRoot,
};

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash).toString(36);
}

function getStablePageId() {
  if (typeof window.__PAGE_FULL_PATH__ !== 'undefined') {
    const fullPath = window.__PAGE_FULL_PATH__;
    const hash = hashString(fullPath);
    const pathSegment = String(fullPath)
      .split('/')
      .slice(-2)
      .join('-')
      .replace(/\\.(tsx|jsx|ts|js)$/u, '')
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .slice(0, 32);
    return \`\${pathSegment}-\${hash}\`;
  }

  if (typeof window.__PAGE_ID__ !== 'undefined') {
    return window.__PAGE_ID__;
  }

  const pathKey = \`\${window.location.pathname}\${window.location.search}\`;
  const hash = hashString(pathKey);
  const pathSegment = pathKey
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return \`\${pathSegment}-\${hash}\`;
}

function getRuntimeState() {
  if (!window[AXHUB_RUNTIME_KEY]) {
    window[AXHUB_RUNTIME_KEY] = { hosts: new Map() };
  }

  const runtime = window[AXHUB_RUNTIME_KEY];
  let hostState = runtime.hosts.get(AXHUB_HOST_KEY);
  if (!hostState) {
    hostState = {
      root: null,
      rootElement: null,
      editorModeHandled: false,
      latestProps: null,
    };
    runtime.hosts.set(AXHUB_HOST_KEY, hostState);
  }
  return hostState;
}

function getRootElement() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('[Axhub Preview Host] Missing #root container');
  }
  return rootElement;
}

function ensureRoot(hostState) {
  const rootElement = getRootElement();
  if (!hostState.root || hostState.rootElement !== rootElement) {
    hostState.root = createRoot(rootElement);
    hostState.rootElement = rootElement;
  }
  return rootElement;
}

function getDefaultProps(container) {
  return {
    container,
    config: {},
    data: {},
    events: {},
  };
}

function getRenderProps(container, nextProps) {
  if (nextProps && typeof nextProps === 'object') {
    return {
      ...getDefaultProps(container),
      ...nextProps,
      container: nextProps.container || container,
    };
  }

  return getDefaultProps(container);
}

function findHackCssLink() {
  return document.head.querySelector(\`link[data-axhub-hack-css="\${RESOURCE_PATH}"]\`);
}

function updateHackCssLink(payload) {
  const hostState = getRuntimeState();
  if (payload && typeof payload.href === 'string' && payload.href) {
    currentHackCssHref = payload.href;
  }

  const nextHref = currentHackCssHref;
  const existingLink = findHackCssLink();
  if (payload && payload.removed) {
    if (existingLink) {
      existingLink.remove();
    }
    hostState.hackCssLink = null;
    return;
  }

  if (!nextHref) {
    return;
  }

  const link = existingLink || document.createElement('link');
  link.rel = 'stylesheet';
  link.setAttribute('data-axhub-hack-css', RESOURCE_PATH);
  link.href = \`\${nextHref}?t=\${payload && payload.timestamp ? payload.timestamp : Date.now()}\`;
  if (!link.parentNode) {
    document.head.appendChild(link);
  }
  hostState.hackCssLink = link;
}

function applyStablePageId(container) {
  const stablePageId = getStablePageId();
  if (stablePageId) {
    container.setAttribute('data-page-id', stablePageId);
  }
}

function syncLegacyBootstrap(container) {
  const hostState = getRuntimeState();
  const bootstrap = window.DevTemplateBootstrap;

  window.React = React;
  window.ReactDOM = LegacyReactDOM;
  window.AxhubDevComponent = CurrentComponent;

  if (!bootstrap || typeof bootstrap !== 'object') {
    return;
  }

  bootstrap.React = React;
  bootstrap.ReactDOM = LegacyReactDOM;
  bootstrap.renderComponent = (Component, props) => {
    if (Component) {
      CurrentComponent = Component;
    }
    hostState.latestProps = props && typeof props === 'object' ? props : null;
    renderCurrentComponent(hostState.latestProps);
  };
}

${editorModeBootstrapSnippet}

function afterRender(container) {
  syncLegacyBootstrap(container);
  applyStablePageId(container);
  maybeEnableInitialEditorMode(getRuntimeState());
}

function renderCurrentComponent(nextProps) {
  const hostState = getRuntimeState();
  const rootElement = ensureRoot(hostState);
  if (typeof nextProps !== 'undefined') {
    hostState.latestProps = nextProps && typeof nextProps === 'object' ? nextProps : null;
  }

  const renderProps = getRenderProps(rootElement, hostState.latestProps);
  hostState.root.render(React.createElement(CurrentComponent, renderProps));
  afterRender(rootElement);
}

async function resolveUpdatedPreviewModule(nextModule) {
  if (nextModule && nextModule.default) {
    return nextModule;
  }

  try {
    const refreshedModule = await import(/* @vite-ignore */ \`\${ENTRY_IMPORT_PATH}?t=\${Date.now()}\`);
    if (refreshedModule && refreshedModule.default) {
      return refreshedModule;
    }
  } catch (error) {
    console.warn('[Axhub Preview Host] Fallback re-import failed:', error);
  }

  return null;
}

renderCurrentComponent();

if (${options.initialHackCssEnabled ? 'true' : 'false'} && currentHackCssHref) {
  updateHackCssLink({ href: currentHackCssHref, removed: false, timestamp: Date.now() });
}

if (import.meta.hot) {
  const hostState = getRuntimeState();
  if (hostState.hackCssHandler && typeof import.meta.hot.off === 'function') {
    import.meta.hot.off('axhub:hack-css-update', hostState.hackCssHandler);
  }

  hostState.hackCssHandler = (payload) => {
    if (!payload || payload.resourcePath !== RESOURCE_PATH) {
      return;
    }
    updateHackCssLink(payload);
  };

  import.meta.hot.on('axhub:hack-css-update', hostState.hackCssHandler);
  import.meta.hot.accept(ENTRY_IMPORT_PATH, async (module) => {
    const resolvedModule = await resolveUpdatedPreviewModule(module);
    if (!resolvedModule || !resolvedModule.default) {
      console.warn('[Axhub Preview Host] Skipped preview rerender because the updated module has no default export.');
      return;
    }

    CurrentComponent = resolvedModule.default;
    renderCurrentComponent();
  });
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    if (hostState.hackCssHandler && typeof import.meta.hot.off === 'function') {
      import.meta.hot.off('axhub:hack-css-update', hostState.hackCssHandler);
    }
  });
}

export function __axhubRenderPreview() {
  renderCurrentComponent();
}
`;
}

export function createPreviewHostOptions(input: {
  type: 'components' | 'prototypes' | 'themes';
  name: string;
  entryImportPath: string;
  versionId?: string;
  initialHackCssEnabled?: boolean;
}): PreviewHostModuleOptions {
  const resourcePath = `${input.type}/${input.name}`;
  return {
    type: input.type,
    name: input.name,
    entryImportPath: input.entryImportPath,
    resourcePath,
    resourceUrlPath: encodeRoutePath(`/${resourcePath}`),
    editableHackCssHref: resolveEditableHackCssHref(input.type, input.name, input.versionId),
    initialHackCssEnabled: Boolean(input.initialHackCssEnabled),
    versionId: input.versionId,
  };
}

export function toPosixPath(input: string): string {
  return input.split(path.sep).join('/');
}
