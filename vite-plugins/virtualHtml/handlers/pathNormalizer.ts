import type { IncomingMessage, ServerResponse } from 'http';
import { logVirtualHtmlDebug } from '../logger';
import fs from 'fs';
import path from 'path';
import { readEntriesManifest } from '../../utils/entriesManifest';

/**
 * 路径标准化器
 *
 * 新路径格式（推荐）：
 * - /prototypes/{name}          → 原型预览
 * - /prototypes/{name}/spec     → 原型文档
 * - /components/{name}          → 组件预览
 * - /components/{name}/spec     → 组件文档
 * - /themes/{name}         → 主题预览
 * - /themes/{name}/spec    → 主题文档
 * - /docs/{name}           → 系统文档
 *
 * 旧路径格式（兼容）：
 * - /{name}.html                    → 重定向到新格式
 * - /{name}/spec.html               → 重定向到新格式
 * - /prototypes/{name}/index.html        → 重定向到新格式
 * - /components/{name}/index.html     → 重定向到新格式
 * - /assets/docs/{name}/spec.html  → 重定向到新格式
 */

export interface NormalizedPath {
  type: 'prototypes' | 'components' | 'themes' | 'docs';
  name: string;
  action: 'preview' | 'spec';
  isLegacy: boolean;
  originalUrl: string;
  normalizedUrl: string;
  versionId?: string;
  subPath?: string;
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function decodePathSegments(parts: string[]): string[] {
  return parts.map((part) => safeDecodeURIComponent(part));
}

function looksLikeFileRequest(subPath: string): boolean {
  if (!subPath) return false;
  const lastSegment = subPath.split('/').filter(Boolean).pop() || '';
  return /\.[a-z0-9]+$/i.test(lastSegment);
}

export function encodeRoutePath(pathname: string): string {
  const hasLeadingSlash = pathname.startsWith('/');
  const hasTrailingSlash = pathname.endsWith('/') && pathname !== '/';
  const encoded = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(safeDecodeURIComponent(segment)))
    .join('/');

  const withLeadingSlash = hasLeadingSlash ? `/${encoded}` : encoded;
  if (hasTrailingSlash && withLeadingSlash) {
    return `${withLeadingSlash}/`;
  }
  return withLeadingSlash || (hasLeadingSlash ? '/' : '');
}

function resolveEntryTypeByName(name: string): 'prototypes' | 'components' | 'themes' | null {
  const projectRoot = process.cwd();
  const normalizedName = String(name || '').trim();
  if (!normalizedName) return null;

  const scanOrder: Array<'prototypes' | 'components' | 'themes'> = ['prototypes', 'components', 'themes'];
  for (const type of scanOrder) {
    const entryPath = path.resolve(projectRoot, 'src', type, normalizedName, 'index.tsx');
    if (fs.existsSync(entryPath)) {
      return type;
    }
  }

  try {
    const manifest = readEntriesManifest(projectRoot);
    for (const type of scanOrder) {
      if (manifest.items?.[`${type}/${normalizedName}`]) {
        return type;
      }
    }
  } catch {
    // ignore manifest read errors and keep null fallback
  }

  return null;
}

function resolveTypedEntryName(
  type: 'prototypes' | 'components' | 'themes',
  nameParts: string[],
): { name: string; restParts: string[] } | null {
  const projectRoot = process.cwd();

  for (let partCount = nameParts.length; partCount >= 1; partCount -= 1) {
    const candidateName = nameParts.slice(0, partCount).join('/');
    const restParts = nameParts.slice(partCount);
    const entryPath = path.resolve(projectRoot, 'src', type, candidateName, 'index.tsx');
    if (fs.existsSync(entryPath)) {
      return { name: candidateName, restParts };
    }
  }

  try {
    const manifest = readEntriesManifest(projectRoot);
    for (let partCount = nameParts.length; partCount >= 1; partCount -= 1) {
      const candidateName = nameParts.slice(0, partCount).join('/');
      if (manifest.items?.[`${type}/${candidateName}`]) {
        return {
          name: candidateName,
          restParts: nameParts.slice(partCount),
        };
      }
    }
  } catch {
    // ignore manifest read errors and keep null fallback
  }

  return null;
}

/**
 * 解析并标准化路径
 */
export function normalizePath(url: string): NormalizedPath | null {
  const [urlWithoutQuery, queryString] = url.split('?');
  const params = new URLSearchParams(queryString || '');
  const versionId = params.get('ver') || undefined;

  // Vite 内部的 html-proxy 请求需要保留原样，不能参与旧路径重定向。
  // 否则浏览器在加载 /index.html?html-proxy&index=*.js 时会被 301 到页面地址，
  // 最终表现为 script 资源加载失败。
  if (params.has('html-proxy')) {
    return null;
  }

  // 移除末尾的 .html
  const cleanUrl = urlWithoutQuery.replace(/\.html$/, '');

  // 解析路径部分
  const pathParts = cleanUrl.split('/').filter(Boolean);

  if (pathParts.length === 0) return null;

  // 文档静态资源路径不参与页面路由标准化，交给资源处理器兜底。
  if (pathParts[0] === 'docs' && pathParts.includes('assets')) {
    return null;
  }

  // 情况 1: /prototypes/{name} 或 /prototypes/{name}/spec 或 /prototypes/{name}/index
  if (pathParts[0] === 'prototypes' && pathParts.length >= 2) {
    const decodedNameParts = decodePathSegments(pathParts.slice(1));
    const resolved = resolveTypedEntryName('prototypes', decodedNameParts);
    if (!resolved) return null;
    const lastPart = resolved.restParts[resolved.restParts.length - 1];
    const isSpecRoute = resolved.restParts.length === 1 && lastPart === 'spec';
    const isLegacyIndexRoute = resolved.restParts.length === 1 && lastPart === 'index';
    const subPath = !isSpecRoute && !isLegacyIndexRoute ? resolved.restParts.join('/') : '';

    // 真实文件请求（如 index.tsx、style.css）应该交给 Vite 模块系统处理，
    // 不能被误判成页面预览路由，否则会返回 HTML 导致模块加载失败。
    if (looksLikeFileRequest(subPath)) {
      return null;
    }

    if (resolved.restParts.length === 0 || !isSpecRoute) {
      // /prototypes/{name} 或 /prototypes/{name}/index.html
      return {
        type: 'prototypes',
        name: resolved.name,
        action: 'preview',
        isLegacy: isLegacyIndexRoute,
        originalUrl: url,
        normalizedUrl: `${encodeRoutePath(`/prototypes/${resolved.name}${subPath ? `/${subPath}` : ''}`)}${versionId ? `?ver=${versionId}` : ''}`,
        versionId,
        subPath: subPath || undefined,
      };
    } else if (isSpecRoute) {
      // /prototypes/{name}/spec 或 /prototypes/{name}/spec.html
      return {
        type: 'prototypes',
        name: resolved.name,
        action: 'spec',
        isLegacy: urlWithoutQuery.includes('.html'),
        originalUrl: url,
        normalizedUrl: `${encodeRoutePath(`/prototypes/${resolved.name}/spec`)}${versionId ? `?ver=${versionId}` : ''}`,
        versionId
      };
    }
  }

  // 情况 2: /components/{name} 或 /components/{name}/spec 或 /components/{name}/index
  if (pathParts[0] === 'components' && pathParts.length >= 2) {
    const decodedNameParts = decodePathSegments(pathParts.slice(1));
    const resolved = resolveTypedEntryName('components', decodedNameParts);
    if (!resolved) return null;
    const lastPart = resolved.restParts[resolved.restParts.length - 1];
    const isSpecRoute = resolved.restParts.length === 1 && lastPart === 'spec';
    const isLegacyIndexRoute = resolved.restParts.length === 1 && lastPart === 'index';
    const subPath = !isSpecRoute && !isLegacyIndexRoute ? resolved.restParts.join('/') : '';

    // 真实文件请求（如 index.tsx、style.css）应该交给 Vite 模块系统处理，
    // 不能被误判成页面预览路由，否则会返回 HTML 导致模块加载失败。
    if (looksLikeFileRequest(subPath)) {
      return null;
    }

    if (resolved.restParts.length === 0 || !isSpecRoute) {
      // /components/{name} 或 /components/{name}/index.html
      return {
        type: 'components',
        name: resolved.name,
        action: 'preview',
        isLegacy: isLegacyIndexRoute,
        originalUrl: url,
        normalizedUrl: `${encodeRoutePath(`/components/${resolved.name}${subPath ? `/${subPath}` : ''}`)}${versionId ? `?ver=${versionId}` : ''}`,
        versionId,
        subPath: subPath || undefined,
      };
    } else if (isSpecRoute) {
      // /components/{name}/spec 或 /components/{name}/spec.html
      return {
        type: 'components',
        name: resolved.name,
        action: 'spec',
        isLegacy: urlWithoutQuery.includes('.html'),
        originalUrl: url,
        normalizedUrl: `${encodeRoutePath(`/components/${resolved.name}/spec`)}${versionId ? `?ver=${versionId}` : ''}`,
        versionId
      };
    }
  }

  // 情况 3: /themes/{name} 或 /themes/{name}/spec 或 /themes/{name}/index
  if (pathParts[0] === 'themes' && pathParts.length >= 2) {
    const decodedNameParts = decodePathSegments(pathParts.slice(1));
    const resolved = resolveTypedEntryName('themes', decodedNameParts);
    if (!resolved) return null;
    const lastPart = resolved.restParts[resolved.restParts.length - 1];
    const isSpecRoute = resolved.restParts.length === 1 && lastPart === 'spec';
    const isLegacyIndexRoute = resolved.restParts.length === 1 && lastPart === 'index';
    const subPath = !isSpecRoute && !isLegacyIndexRoute ? resolved.restParts.join('/') : '';

    // 真实文件请求（如 index.tsx、style.css）应该交给 Vite 模块系统处理，
    // 不能被误判成页面预览路由，否则会返回 HTML 导致模块加载失败。
    if (looksLikeFileRequest(subPath)) {
      return null;
    }

    if (resolved.restParts.length === 0 || !isSpecRoute) {
      // /themes/{name} 或 /themes/{name}/index.html
      return {
        type: 'themes',
        name: resolved.name,
        action: 'preview',
        isLegacy: isLegacyIndexRoute,
        originalUrl: url,
        normalizedUrl: `${encodeRoutePath(`/themes/${resolved.name}${subPath ? `/${subPath}` : ''}`)}${versionId ? `?ver=${versionId}` : ''}`,
        versionId,
        subPath: subPath || undefined,
      };
    } else if (isSpecRoute) {
      // /themes/{name}/spec 或 /themes/{name}/spec.html
      return {
        type: 'themes',
        name: resolved.name,
        action: 'spec',
        isLegacy: urlWithoutQuery.includes('.html'),
        originalUrl: url,
        normalizedUrl: `${encodeRoutePath(`/themes/${resolved.name}/spec`)}${versionId ? `?ver=${versionId}` : ''}`,
        versionId
      };
    }
  }

  // 情况 4: /docs/{name} 或 /docs/{name}/spec.html
  if (pathParts[0] === 'docs' && pathParts.length >= 2) {
    const nameParts = decodePathSegments(pathParts.slice(1));
    const lastPart = nameParts[nameParts.length - 1];

    if (lastPart === 'spec') {
      // /docs/{name}/spec.html（旧格式）→ /docs/{name}
      const name = nameParts.slice(0, -1).join('/');
      return {
        type: 'docs',
        name,
        action: 'spec',
        isLegacy: true,
        originalUrl: url,
        normalizedUrl: encodeRoutePath(`/docs/${name}`),
        versionId
      };
    }

    // /docs/{name}
    const name = nameParts.join('/');
    return {
      type: 'docs',
      name,
      action: 'spec',
      isLegacy: false,
      originalUrl: url,
      normalizedUrl: encodeRoutePath(`/docs/${name}`),
      versionId
    };
  }

  // 情况 5: /assets/docs/{name} 或 /assets/docs/{name}/spec.html（旧格式兼容）
  if (pathParts[0] === 'assets' && pathParts[1] === 'docs' && pathParts.length >= 3) {
    const nameParts = decodePathSegments(pathParts.slice(2));
    const lastPart = nameParts[nameParts.length - 1];

    if (lastPart === 'spec') {
      // /assets/docs/{name}/spec.html（旧格式）→ /docs/{name}
      const name = nameParts.slice(0, -1).join('/');
      return {
        type: 'docs',
        name,
        action: 'spec',
        isLegacy: true,
        originalUrl: url,
        normalizedUrl: encodeRoutePath(`/docs/${name}`),
        versionId
      };
    }

    // /assets/docs/{name}（旧格式）→ /docs/{name}
    const name = nameParts.join('/');
    return {
      type: 'docs',
      name,
      action: 'spec',
      isLegacy: true,
      originalUrl: url,
      normalizedUrl: encodeRoutePath(`/docs/${name}`),
      versionId
    };
  }

  // 情况 6: /{name}.html 或 /{name}/spec.html（旧格式，需要查找是 page 还是 element）
  if (pathParts.length === 1 && urlWithoutQuery.endsWith('.html')) {
    const name = safeDecodeURIComponent(pathParts[0]);

    const type = resolveEntryTypeByName(name);
    if (type) {
      return {
        type,
        name,
        action: 'preview',
        isLegacy: true,
        originalUrl: url,
        normalizedUrl: `${encodeRoutePath(`/${type}/${name}`)}${versionId ? `?ver=${versionId}` : ''}`,
        versionId
      };
    }
  }

  // 情况 7: /{name}/spec.html（旧格式）
  if (pathParts.length === 2 && pathParts[1] === 'spec' && urlWithoutQuery.endsWith('.html')) {
    const name = safeDecodeURIComponent(pathParts[0]);

    const type = resolveEntryTypeByName(name);
    if (type) {
      return {
        type,
        name,
        action: 'spec',
        isLegacy: true,
        originalUrl: url,
        normalizedUrl: `${encodeRoutePath(`/${type}/${name}/spec`)}${versionId ? `?ver=${versionId}` : ''}`,
        versionId
      };
    }
  }

  return null;
}

/**
 * 处理路径重定向（旧格式 → 新格式）
 */
export function handlePathRedirect(req: IncomingMessage, res: ServerResponse): boolean {
  if (!req.url) return false;

  const normalized = normalizePath(req.url);

  if (
    normalized &&
    !normalized.isLegacy &&
    normalized.action === 'preview'
  ) {
    const htmlEntryPath = path.resolve(process.cwd(), 'src', normalized.type, normalized.name, 'index.html');
    if (fs.existsSync(htmlEntryPath) && !normalized.subPath) {
      const params = new URLSearchParams(req.url.split('?')[1] || '');
      const query = params.toString();
      const redirectUrl = `${encodeRoutePath(`/${normalized.type}/${normalized.name}/index.html`)}${query ? `?${query}` : ''}`;

      res.statusCode = 302;
      res.setHeader('Location', redirectUrl);
      res.end();
      return true;
    }
  }

  if (normalized && normalized.isLegacy) {
    if (normalized.action === 'preview') {
      const htmlEntryPath = path.resolve(process.cwd(), 'src', normalized.type, normalized.name, 'index.html');
      if (fs.existsSync(htmlEntryPath)) {
        return false;
      }
    }

    // 旧格式，重定向到新格式
    logVirtualHtmlDebug('路径重定向:', normalized.originalUrl, '→', normalized.normalizedUrl);

    res.statusCode = 301; // 永久重定向
    res.setHeader('Location', normalized.normalizedUrl);
    res.end();
    return true;
  }

  return false;
}
