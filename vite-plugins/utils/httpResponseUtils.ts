import fs from 'fs';
import path from 'path';
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'zlib';

const COMPRESSIBLE_TYPE_PREFIXES = [
  'text/',
];

const COMPRESSIBLE_TYPES = new Set([
  'application/javascript',
  'application/json',
  'application/manifest+json',
  'application/xml',
  'image/svg+xml',
]);

const DEFAULT_MIN_COMPRESS_BYTES = 1024;

type CompressionEncoding = 'br' | 'gzip';

interface CompressionOptions {
  body: Buffer | string;
  contentType?: string;
  acceptEncoding?: string;
  existingContentEncoding?: string;
  minBytes?: number;
}

export interface CompressedPayload {
  body: Buffer;
  contentEncoding?: CompressionEncoding;
  varyAcceptEncoding: boolean;
}

function normalizeContentType(contentType?: string): string {
  return String(contentType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
}

function toBuffer(body: Buffer | string): Buffer {
  return Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
}

function getEncodingWeight(acceptEncoding: string, encoding: CompressionEncoding): number {
  const tokens = String(acceptEncoding || '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  for (const token of tokens) {
    const [namePart, ...paramParts] = token.split(';').map((part) => part.trim());
    if (namePart !== encoding && namePart !== '*') {
      continue;
    }

    let quality = 1;
    for (const param of paramParts) {
      if (!param.startsWith('q=')) continue;
      const parsed = Number(param.slice(2));
      if (!Number.isNaN(parsed)) {
        quality = parsed;
      }
    }

    return quality;
  }

  return 0;
}

function resolvePreferredEncoding(acceptEncoding?: string): CompressionEncoding | null {
  const brWeight = getEncodingWeight(String(acceptEncoding || ''), 'br');
  const gzipWeight = getEncodingWeight(String(acceptEncoding || ''), 'gzip');

  if (brWeight <= 0 && gzipWeight <= 0) {
    return null;
  }

  return brWeight >= gzipWeight ? 'br' : 'gzip';
}

function appendVaryValue(currentValue: unknown, nextValue: string): string {
  const parts = String(currentValue || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.includes(nextValue)) {
    parts.push(nextValue);
  }

  return parts.join(', ');
}

export function isCompressibleContentType(contentType?: string): boolean {
  const normalized = normalizeContentType(contentType);
  if (!normalized) return false;

  if (COMPRESSIBLE_TYPES.has(normalized)) {
    return true;
  }

  return COMPRESSIBLE_TYPE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function createCompressedPayload(options: CompressionOptions): CompressedPayload {
  const body = toBuffer(options.body);
  const contentType = options.contentType;
  const varyAcceptEncoding = isCompressibleContentType(contentType);

  if (
    !varyAcceptEncoding
    || options.existingContentEncoding
    || body.byteLength < (options.minBytes ?? DEFAULT_MIN_COMPRESS_BYTES)
  ) {
    return { body, varyAcceptEncoding };
  }

  const encoding = resolvePreferredEncoding(options.acceptEncoding);
  if (!encoding) {
    return { body, varyAcceptEncoding };
  }

  return {
    body: encoding === 'br'
      ? brotliCompressSync(body, {
        params: {
          [zlibConstants.BROTLI_PARAM_QUALITY]: 4,
        },
      })
      : gzipSync(body, { level: 6 }),
    contentEncoding: encoding,
    varyAcceptEncoding,
  };
}

export function sendMaybeCompressedResponse(
  req: { headers?: Record<string, string | string[] | undefined> },
  res: {
    getHeader?: (name: string) => unknown;
    setHeader: (name: string, value: string) => void;
    end: (body: Buffer | string) => void;
  },
  options: {
    body: Buffer | string;
    contentType: string;
  },
) {
  const payload = createCompressedPayload({
    body: options.body,
    contentType: options.contentType,
    acceptEncoding: Array.isArray(req.headers?.['accept-encoding'])
      ? req.headers?.['accept-encoding'].join(', ')
      : req.headers?.['accept-encoding'],
    existingContentEncoding: typeof res.getHeader === 'function'
      ? String(res.getHeader('Content-Encoding') || '')
      : '',
  });

  if (payload.varyAcceptEncoding) {
    const nextVary = appendVaryValue(typeof res.getHeader === 'function' ? res.getHeader('Vary') : '', 'Accept-Encoding');
    res.setHeader('Vary', nextVary);
  }

  res.setHeader('Content-Type', options.contentType);
  if (payload.contentEncoding) {
    res.setHeader('Content-Encoding', payload.contentEncoding);
  }
  res.setHeader('Content-Length', String(payload.body.byteLength));
  res.end(payload.body);
}

function appendQueryParam(rawUrl: string, key: string, value: string): string {
  const url = new URL(rawUrl, 'http://axhub.local');
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function rewriteAdminAssetUrls(html: string, cacheBustToken?: string): string {
  const token = String(cacheBustToken || '').trim();
  if (!token) {
    return html;
  }

  return html.replace(
    /(src|href)=(['"])(\/(?:assets|images)\/[^"'<>]+)\2/g,
    (_match, attrName: string, quote: string, url: string) => `${attrName}=${quote}${appendQueryParam(url, 'axv', token)}${quote}`,
  );
}

function scanLatestMtimeMs(targetDir: string): number {
  let latestMtimeMs = 0;

  const walk = (currentPath: string) => {
    if (!fs.existsSync(currentPath)) {
      return;
    }

    const stat = fs.statSync(currentPath);
    latestMtimeMs = Math.max(latestMtimeMs, stat.mtimeMs);
    if (!stat.isDirectory()) {
      return;
    }

    for (const entry of fs.readdirSync(currentPath)) {
      walk(path.join(currentPath, entry));
    }
  };

  walk(targetDir);
  return latestMtimeMs;
}

export function createAdminAssetVersionResolver(adminDir: string, ttlMs: number = 1000): () => string {
  let cachedValue = '0';
  let cachedAt = 0;

  return () => {
    const now = Date.now();
    if (now - cachedAt < ttlMs) {
      return cachedValue;
    }

    cachedAt = now;
    cachedValue = String(Math.trunc(scanLatestMtimeMs(adminDir)));
    return cachedValue;
  };
}
