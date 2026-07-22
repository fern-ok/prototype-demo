import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import { getRequestPathname, readJsonBody, readRequestBody } from './utils/httpUtils';

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

function sendJson(res: any, statusCode: number, data: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function sendText(res: any, statusCode: number, text: string) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(text);
}

function sendHtml(res: any, statusCode: number, html: string) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}

function readMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

function normalizeSafeSegment(value: string): string | null {
  const decoded = decodeURIComponent(String(value || '').trim());
  if (!decoded || decoded.includes('..') || /[\\/]/.test(decoded)) {
    return null;
  }
  return decoded;
}

function createAssetName(originalName: string): string {
  const ext = path.extname(originalName || '').toLowerCase() || '.png';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `img-${Date.now().toString(36)}-${suffix}${ext}`;
}

function buildObsidianOpenUrl(filePath: string): string {
  return `obsidian://open?path=${encodeURIComponent(filePath.replace(/\\/g, '/'))}`;
}

function buildObsidianLaunchHtml(deeplinkUrl: string, title: string): string {
  const safeTitle = title.replace(/[<&>"]/g, '');
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px;">
    <p>正在打开 ${safeTitle}…</p>
    <p><a href="${deeplinkUrl}">如果没有自动跳转，请点这里</a></p>
    <script>
      window.location.href = ${JSON.stringify(deeplinkUrl)};
    </script>
  </body>
</html>`;
}

function hasAnnotationData(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'data.json'));
}

function findLegacyAnnotationDirs(annotationRoot: string): string[] {
  if (!fs.existsSync(annotationRoot)) {
    return [];
  }

  return fs.readdirSync(annotationRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(annotationRoot, entry.name))
    .filter((dirPath) => hasAnnotationData(dirPath))
    .sort((left, right) => {
      const leftMtime = fs.statSync(path.join(left, 'data.json')).mtimeMs;
      const rightMtime = fs.statSync(path.join(right, 'data.json')).mtimeMs;
      return rightMtime - leftMtime;
    });
}

function copyDirectoryContents(sourceDir: string, targetDir: string) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryContents(sourcePath, targetPath);
      continue;
    }
    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function normalizeAnnotationDataPayload(payload: unknown, prototypeName: string) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  const rawPayload = payload as Record<string, unknown>;
  const normalizedNodes = Array.isArray(rawPayload.nodes)
    ? rawPayload.nodes.filter((node) => node && typeof node === 'object')
    : [];
  return {
    ...rawPayload,
    version: 2,
    prototypeName,
    pageId: prototypeName,
    nodes: normalizedNodes,
  };
}

function migrateLegacyAnnotationDir(legacyDir: string, annotationRoot: string, prototypeName: string) {
  if (!legacyDir || !fs.existsSync(legacyDir) || legacyDir === annotationRoot) {
    return;
  }

  fs.mkdirSync(annotationRoot, { recursive: true });

  const legacyDataFile = path.join(legacyDir, 'data.json');
  const canonicalDataFile = path.join(annotationRoot, 'data.json');
  if (fs.existsSync(legacyDataFile) && !fs.existsSync(canonicalDataFile)) {
    const legacyPayload = JSON.parse(fs.readFileSync(legacyDataFile, 'utf8'));
    fs.writeFileSync(
      canonicalDataFile,
      JSON.stringify(normalizeAnnotationDataPayload(legacyPayload, prototypeName), null, 2),
      'utf8',
    );
  }

  copyDirectoryContents(path.join(legacyDir, 'nodes'), path.join(annotationRoot, 'annotations'));
  copyDirectoryContents(path.join(legacyDir, 'assets'), path.join(annotationRoot, 'assets'));
  fs.rmSync(legacyDir, { recursive: true, force: true });
}

export function annotationApiPlugin(): Plugin {
  return {
    name: 'annotation-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = getRequestPathname(req);
        if (!pathname.startsWith('/api/annotations/')) {
          return next();
        }

        const segments = pathname.split('/').filter(Boolean);
        const prototypeName = normalizeSafeSegment(segments[2]);
        if (!prototypeName) {
          return sendJson(res, 400, { error: 'Invalid annotation route' });
        }

        const maybeLegacyPageId = normalizeSafeSegment(segments[3]);
        const hasLegacyPageSegment = Boolean(
          maybeLegacyPageId
          && maybeLegacyPageId !== 'md'
          && maybeLegacyPageId !== 'annotations.md'
          && maybeLegacyPageId !== 'editor'
          && maybeLegacyPageId !== 'obsidian'
          && maybeLegacyPageId !== 'assets',
        );
        const rest = segments.slice(hasLegacyPageSegment ? 4 : 3);

        const prototypesRoot = path.resolve(process.cwd(), 'src', 'prototypes');
        const prototypeDir = path.resolve(prototypesRoot, prototypeName);
        if (!prototypeDir.startsWith(`${prototypesRoot}${path.sep}`) && prototypeDir !== prototypesRoot) {
          return sendJson(res, 403, { error: 'Invalid prototype path' });
        }

        const annotationRoot = path.resolve(prototypeDir, '.annotation');
        const legacyDir = hasLegacyPageSegment
          ? path.resolve(annotationRoot, maybeLegacyPageId as string)
          : findLegacyAnnotationDirs(annotationRoot)[0];

        if (legacyDir?.startsWith(`${annotationRoot}${path.sep}`) || legacyDir === annotationRoot) {
          migrateLegacyAnnotationDir(legacyDir, annotationRoot, prototypeName);
        }

        const dataFile = path.join(annotationRoot, 'data.json');
        const annotationsMdFile = path.join(annotationRoot, 'annotations.md');
        const viewerConfigFile = path.join(annotationRoot, 'viewer.json');
        const annotationsDir = path.join(annotationRoot, 'annotations');
        const assetsDir = path.join(annotationRoot, 'assets');

        const ensurePageDir = () => {
          fs.mkdirSync(annotationRoot, { recursive: true });
          fs.mkdirSync(annotationsDir, { recursive: true });
          fs.mkdirSync(assetsDir, { recursive: true });
        };

        const resolveAnnotationFile = (nodeId: string) => path.join(annotationsDir, `${nodeId}.md`);
        const resolveEditorTargetFile = (nodeId: string) => {
          const detailFile = resolveAnnotationFile(nodeId);
          if (fs.existsSync(detailFile)) {
            return detailFile;
          }
          return annotationsMdFile;
        };

        try {
          if (req.method === 'GET' && rest.length === 0) {
            if (!fs.existsSync(dataFile)) {
              return sendJson(res, 404, null);
            }
            return sendJson(res, 200, JSON.parse(fs.readFileSync(dataFile, 'utf8')));
          }

          if (req.method === 'PUT' && rest.length === 0) {
            ensurePageDir();
            const payload = await readJsonBody(req);
            fs.writeFileSync(
              dataFile,
              JSON.stringify(normalizeAnnotationDataPayload(payload, prototypeName), null, 2),
              'utf8',
            );
            return sendJson(res, 200, { ok: true });
          }

          if (rest[0] === 'annotations.md') {
            if (req.method === 'GET') {
              if (!fs.existsSync(annotationsMdFile)) {
                return sendJson(res, 404, { error: 'Not found' });
              }
              return sendText(res, 200, fs.readFileSync(annotationsMdFile, 'utf8'));
            }

            if (req.method === 'PUT') {
              ensurePageDir();
              const content = await readRequestBody(req);
              fs.writeFileSync(annotationsMdFile, content, 'utf8');
              return sendJson(res, 200, { ok: true });
            }
          }

          if (rest[0] === 'viewer.json') {
            if (req.method === 'GET') {
              if (!fs.existsSync(viewerConfigFile)) {
                return sendJson(res, 404, { error: 'Not found' });
              }
              return sendJson(res, 200, JSON.parse(fs.readFileSync(viewerConfigFile, 'utf8')));
            }
          }

          if (rest[0] === 'md') {
            const nodeId = normalizeSafeSegment(rest[1]);
            if (!nodeId) {
              return sendJson(res, 400, { error: 'Invalid node id' });
            }
            const markdownFile = resolveAnnotationFile(nodeId);

            if (req.method === 'GET') {
              if (!fs.existsSync(markdownFile)) {
                return sendJson(res, 404, { error: 'Not found' });
              }
              return sendText(res, 200, fs.readFileSync(markdownFile, 'utf8'));
            }

            if (req.method === 'PUT') {
              ensurePageDir();
              const content = await readRequestBody(req);
              fs.writeFileSync(markdownFile, content, 'utf8');
              return sendJson(res, 200, { ok: true });
            }

            if (req.method === 'DELETE') {
              if (fs.existsSync(markdownFile)) {
                fs.rmSync(markdownFile, { force: true });
              }
              return sendJson(res, 200, { ok: true });
            }
          }

          if (rest[0] === 'editor' || rest[0] === 'obsidian') {
            const nodeId = normalizeSafeSegment(rest[1]);
            if (!nodeId) {
              return sendJson(res, 400, { error: 'Invalid node id' });
            }

            const targetFile = resolveEditorTargetFile(nodeId);
            ensurePageDir();
            const deeplinkUrl = buildObsidianOpenUrl(targetFile);
            return sendHtml(
              res,
              200,
              buildObsidianLaunchHtml(
                deeplinkUrl,
                rest[0] === 'editor' ? '标注编辑器' : 'Obsidian',
              ),
            );
          }

          if (rest[0] === 'assets') {
            const assetName = rest[1] ? normalizeSafeSegment(rest[1]) : null;

            if (req.method === 'POST' && rest.length === 1) {
              ensurePageDir();
              const form = formidable({
                uploadDir: assetsDir,
                keepExtensions: true,
                maxFileSize: MAX_UPLOAD_SIZE,
              });

              return form.parse(req, (error, _fields, files) => {
                if (error) {
                  return sendJson(res, 400, { error: error.message });
                }
                const file = Array.isArray(files.file) ? files.file[0] : files.file;
                if (!file) {
                  return sendJson(res, 400, { error: 'Missing upload file' });
                }
                const filename = createAssetName(file.originalFilename || file.newFilename || 'image.png');
                const finalPath = path.join(assetsDir, filename);
                fs.renameSync(file.filepath, finalPath);
                return sendJson(res, 200, { filename });
              });
            }

            if (!assetName) {
              return sendJson(res, 400, { error: 'Invalid asset name' });
            }

            const assetPath = path.join(assetsDir, assetName);

            if (req.method === 'GET') {
              if (!fs.existsSync(assetPath)) {
                return sendJson(res, 404, { error: 'Not found' });
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', readMimeType(assetPath));
              fs.createReadStream(assetPath).pipe(res);
              return;
            }

            if (req.method === 'DELETE') {
              if (fs.existsSync(assetPath)) {
                fs.rmSync(assetPath, { force: true });
              }
              return sendJson(res, 200, { ok: true });
            }
          }
        } catch (error: any) {
          console.error('[annotation-api-plugin] request failed:', error);
          return sendJson(res, 500, { error: error?.message || 'Annotation request failed' });
        }

        return sendJson(res, 404, { error: 'Annotation route not found' });
      });
    },
  };
}
