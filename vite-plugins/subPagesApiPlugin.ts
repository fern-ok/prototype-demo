import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { getRequestPathname, readJsonBody } from './utils/httpUtils';

export interface SubPageItem {
  name: string;
  path: string;
}

interface PagesJson {
  pages: SubPageItem[];
}

function getPagesJsonPath(prototypeName: string): string {
  const projectRoot = process.cwd();
  return path.resolve(projectRoot, 'src', 'prototypes', prototypeName, 'pages.json');
}

function normalizeSubPageName(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSubPagePath(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\/{2,}/g, '/');
}

function readPagesJson(prototypeName: string): PagesJson {
  const filePath = getPagesJsonPath(prototypeName);
  if (!fs.existsSync(filePath)) {
    return { pages: [] };
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.pages)) {
      const seenPaths = new Set<string>();
      const pages = data.pages
        .map((page) => ({
          name: normalizeSubPageName(page?.name),
          path: normalizeSubPagePath(page?.path),
        }))
        .filter((page) => {
          if (!page.name || !page.path || seenPaths.has(page.path)) {
            return false;
          }
          seenPaths.add(page.path);
          return true;
        });
      return { pages };
    }
    return { pages: [] };
  } catch {
    return { pages: [] };
  }
}

function writePagesJson(prototypeName: string, data: PagesJson): void {
  const filePath = getPagesJsonPath(prototypeName);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    throw new Error(`原型目录不存在: ${prototypeName}`);
  }
  if (!data.pages.length) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return;
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function subPagesApiPlugin(): Plugin {
  return {
    name: 'sub-pages-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const pathname = getRequestPathname(req);
        if (pathname !== '/api/sub-pages') {
          return next();
        }

        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        const prototypeName = url.searchParams.get('prototype');

        if (!prototypeName) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: '缺少 prototype 参数' }));
          return;
        }

        // Validate prototype name to prevent path traversal
        if (/[/\\]|\.\./.test(prototypeName)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: '无效的原型名称' }));
          return;
        }

        try {
          if (req.method === 'GET') {
            const data = readPagesJson(prototypeName);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify(data));
            return;
          }

          if (req.method === 'PUT') {
            const body = await readJsonBody(req);
            if (!body || !Array.isArray(body.pages)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: '请求体必须包含 pages 数组' }));
              return;
            }

            const seenPaths = new Set<string>();
            const pages: SubPageItem[] = body.pages
              .map((page: any) => ({
                name: normalizeSubPageName(page?.name),
                path: normalizeSubPagePath(page?.path),
              }))
              .filter((page: SubPageItem) => {
                if (!page.name || !page.path || seenPaths.has(page.path)) {
                  return false;
                }
                seenPaths.add(page.path);
                return true;
              });

            writePagesJson(prototypeName, { pages });

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, pages }));
            return;
          }

          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        } catch (error: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: error?.message || '未知错误' }));
        }
      });
    },
  };
}
