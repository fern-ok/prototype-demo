import fs from 'fs';
import path from 'path';

import { generateAxureExportCode } from './axureExportCode';

export interface ExportIndexBundle {
  entry: {
    name: string;
    group: string;
    displayName: string;
    code: string;
    axureCode: string;
    axureCodePath: string;
    hackCss: string;
  };
  annotation?: {
    data: unknown | null;
    annotationsMd: string;
    markdownMap: Record<string, string>;
    assetMap: Record<string, string>;
    viewer?: Record<string, unknown>;
  };
  docs: {
    spec: string;
    related: Record<string, string>;
  };
  images: {
    docImageMap: Record<string, string>;
    themeImageMap: Record<string, string>;
  };
  meta: {
    version: number;
    exportedAt: string;
  };
}

export interface ExportBundleEntryDescriptor {
  key: string;
  group: 'components' | 'prototypes';
  name: string;
  displayName: string;
  jsPath?: string;
}

type ImageBucket = 'doc' | 'theme' | 'annotation';

const IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
]);

const MARKDOWN_IMAGE_REFERENCE_PATTERN = /((?:\/|\.{1,2}\/|assets\/|src\/)[^"'`\s)]+?\.(?:png|jpe?g|gif|webp|svg))/gi;
const DOC_PATH_REFERENCE_PATTERN = /((?:\/docs\/|\/?src\/docs\/)[^\s`'")]+|(?:\/?src\/themes\/)[^\s`'")]+)/g;
const THEME_DOC_CANDIDATES = ['DESIGN.md', 'DESIGN-SPEC.md', 'README.md'];

function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, '/');
}

function normalizeProjectRelativePath(projectRoot: string, filePath: string): string {
  return normalizeSlashes(path.relative(projectRoot, filePath));
}

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function directoryExists(directoryPath: string): boolean {
  try {
    return fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory();
  } catch {
    return false;
  }
}

function readTextFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function readTextFileIfExists(filePath: string): string {
  return fileExists(filePath) ? readTextFile(filePath) : '';
}

function readJsonFileIfExists(filePath: string): unknown | null {
  if (!fileExists(filePath)) {
    return null;
  }
  try {
    return JSON.parse(readTextFile(filePath));
  } catch {
    return null;
  }
}

function getMimeType(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
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

function fileToDataUrl(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return `data:${getMimeType(filePath)};base64,${content.toString('base64')}`;
}

function trimReferenceToken(value: string): string {
  return String(value || '').trim().replace(/[),.;:]+$/g, '');
}

function extractProjectPathReferences(contents: string[]): string[] {
  const references = new Set<string>();

  for (const content of contents) {
    if (!content) continue;
    DOC_PATH_REFERENCE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null = null;
    while ((match = DOC_PATH_REFERENCE_PATTERN.exec(content)) !== null) {
      const reference = trimReferenceToken(match[1] || '');
      if (!reference) continue;
      references.add(reference);
    }
  }

  return Array.from(references);
}

function resolveDocsRootPath(projectRoot: string, reference: string): string | null {
  const normalized = trimReferenceToken(reference).replace(/^\/+/, '');
  if (!normalized) return null;

  const relative = normalized.startsWith('docs/')
    ? normalized.slice('docs/'.length)
    : normalized.startsWith('src/docs/')
      ? normalized.slice('src/docs/'.length)
      : null;

  if (relative == null || !relative) {
    return null;
  }

  const candidate = path.resolve(projectRoot, 'src', 'docs', relative);
  if (fileExists(candidate)) {
    return candidate;
  }

  if (!path.extname(candidate)) {
    const withMd = `${candidate}.md`;
    if (fileExists(withMd)) {
      return withMd;
    }
  }

  return null;
}

function resolveThemeDocumentPaths(projectRoot: string, reference: string): string[] {
  const normalized = trimReferenceToken(reference).replace(/^\/+/, '');
  if (!normalized.startsWith('src/themes/')) {
    return [];
  }

  const candidate = path.resolve(projectRoot, normalized);
  if (fileExists(candidate) && path.extname(candidate).toLowerCase() === '.md') {
    return [candidate];
  }

  const themeDir = directoryExists(candidate)
    ? candidate
    : directoryExists(path.dirname(candidate))
      ? path.dirname(candidate)
      : null;

  if (!themeDir) {
    return [];
  }

  return THEME_DOC_CANDIDATES
    .map((fileName) => path.join(themeDir, fileName))
    .filter((filePath, index, all) => fileExists(filePath) && all.indexOf(filePath) === index);
}

function resolveImageReference(
  projectRoot: string,
  ownerFilePath: string,
  reference: string,
): { filePath: string; bucket: ImageBucket } | null {
  const normalizedReference = trimReferenceToken(reference);
  if (!normalizedReference || normalizedReference.startsWith('data:') || /^[a-z]+:\/\//i.test(normalizedReference)) {
    return null;
  }

  const refWithoutQuery = normalizedReference.split(/[?#]/)[0] || normalizedReference;
  const normalized = normalizeSlashes(refWithoutQuery);

  let candidatePath: string | null = null;
  if (normalized.startsWith('/docs/')) {
    candidatePath = path.resolve(projectRoot, 'src', 'docs', normalized.slice('/docs/'.length));
  } else if (normalized.startsWith('/src/')) {
    candidatePath = path.resolve(projectRoot, normalized.slice('/'.length));
  } else if (normalized.startsWith('src/')) {
    candidatePath = path.resolve(projectRoot, normalized);
  } else if (normalized.startsWith('/themes/')) {
    candidatePath = path.resolve(projectRoot, 'src', 'themes', normalized.slice('/themes/'.length));
  } else if (normalized.startsWith('/components/')) {
    candidatePath = path.resolve(projectRoot, 'src', 'components', normalized.slice('/components/'.length));
  } else if (normalized.startsWith('/prototypes/')) {
    candidatePath = path.resolve(projectRoot, 'src', 'prototypes', normalized.slice('/prototypes/'.length));
  } else if (normalized.startsWith('/')) {
    candidatePath = path.resolve(projectRoot, normalized.slice('/'.length));
  } else {
    candidatePath = path.resolve(path.dirname(ownerFilePath), normalized);
  }

  if (!candidatePath || !fileExists(candidatePath)) {
    return null;
  }

  const extension = path.extname(candidatePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) {
    return null;
  }

  const normalizedCandidatePath = normalizeSlashes(candidatePath);
  if (normalizedCandidatePath.includes('/.annotation/assets/')) {
    return { filePath: candidatePath, bucket: 'annotation' };
  }
  if (normalizedCandidatePath.includes('/src/themes/')) {
    return { filePath: candidatePath, bucket: 'theme' };
  }
  return { filePath: candidatePath, bucket: 'doc' };
}

function inlineImageReferences(
  content: string,
  ownerFilePath: string,
  projectRoot: string,
  maps: {
    docImageMap: Record<string, string>;
    themeImageMap: Record<string, string>;
    annotationAssetMap?: Record<string, string>;
  },
): string {
  if (!content) {
    return '';
  }

  return content.replace(MARKDOWN_IMAGE_REFERENCE_PATTERN, (rawReference) => {
    const resolved = resolveImageReference(projectRoot, ownerFilePath, rawReference);
    if (!resolved) {
      return rawReference;
    }

    const dataUrl = fileToDataUrl(resolved.filePath);
    if (resolved.bucket === 'theme') {
      maps.themeImageMap[normalizeProjectRelativePath(projectRoot, resolved.filePath)] = dataUrl;
    } else if (resolved.bucket === 'annotation') {
      const annotationKey = path.basename(resolved.filePath);
      if (maps.annotationAssetMap) {
        maps.annotationAssetMap[annotationKey] = dataUrl;
      }
    } else {
      maps.docImageMap[normalizeProjectRelativePath(projectRoot, resolved.filePath)] = dataUrl;
    }

    return dataUrl;
  });
}

function readAnnotationMarkdownMap(annotationRoot: string): Record<string, string> {
  const markdownMap: Record<string, string> = {};
  const markdownDirectory = directoryExists(path.join(annotationRoot, 'annotations'))
    ? path.join(annotationRoot, 'annotations')
    : directoryExists(path.join(annotationRoot, 'nodes'))
      ? path.join(annotationRoot, 'nodes')
      : null;

  if (!markdownDirectory) {
    return markdownMap;
  }

  for (const entry of fs.readdirSync(markdownDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.md') continue;
    markdownMap[path.basename(entry.name, '.md')] = readTextFile(path.join(markdownDirectory, entry.name));
  }

  return markdownMap;
}

function readAnnotationAssetMap(annotationRoot: string): Record<string, string> {
  const assetDirectory = path.join(annotationRoot, 'assets');
  const assetMap: Record<string, string> = {};
  if (!directoryExists(assetDirectory)) {
    return assetMap;
  }

  for (const entry of fs.readdirSync(assetDirectory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    assetMap[entry.name] = fileToDataUrl(path.join(assetDirectory, entry.name));
  }

  return assetMap;
}

function hasAnnotationContent(params: {
  data: unknown | null;
  annotationsMd: string;
  markdownMap: Record<string, string>;
}): boolean {
  const nodes = (params.data as { nodes?: unknown[] } | null | undefined)?.nodes;
  if (Array.isArray(nodes) && nodes.length > 0) {
    return true;
  }

  if (params.annotationsMd.trim()) {
    return true;
  }

  return Object.values(params.markdownMap).some((content) => content.trim().length > 0);
}

export async function buildExportIndexBundle(
  projectRoot: string,
  descriptor: ExportBundleEntryDescriptor,
): Promise<ExportIndexBundle> {
  const jsRelativePath = descriptor.jsPath || `${descriptor.key}.js`;
  const entryRoot = path.resolve(projectRoot, 'src', descriptor.group, descriptor.name);
  const builtCodePath = path.resolve(projectRoot, 'dist', jsRelativePath);
  const sourceCodePath = path.join(entryRoot, 'index.tsx');
  const hackCssPath = path.join(entryRoot, 'hack.css');
  const specPath = path.join(entryRoot, 'spec.md');
  const annotationRoot = path.join(entryRoot, '.annotation');

  const annotationAssetMap = readAnnotationAssetMap(annotationRoot);
  const markdownMap = readAnnotationMarkdownMap(annotationRoot);
  const docImageMap: Record<string, string> = {};
  const themeImageMap: Record<string, string> = {};

  const sourceCode = readTextFileIfExists(sourceCodePath);
  const specRaw = readTextFileIfExists(specPath);
  const annotationsMdRaw = readTextFileIfExists(path.join(annotationRoot, 'annotations.md'));
  const annotationData = readJsonFileIfExists(path.join(annotationRoot, 'data.json'));
  const annotationViewerConfig = readJsonFileIfExists(path.join(annotationRoot, 'viewer.json'));

  const pathReferences = extractProjectPathReferences([
    sourceCode,
    specRaw,
    annotationsMdRaw,
    ...Object.values(markdownMap),
  ]);

  const relatedDocumentPaths = new Map<string, string>();
  for (const reference of pathReferences) {
    const docsPath = resolveDocsRootPath(projectRoot, reference);
    if (docsPath) {
      relatedDocumentPaths.set(normalizeProjectRelativePath(projectRoot, docsPath), docsPath);
      continue;
    }

    for (const themeDocPath of resolveThemeDocumentPaths(projectRoot, reference)) {
      relatedDocumentPaths.set(normalizeProjectRelativePath(projectRoot, themeDocPath), themeDocPath);
    }
  }

  const spec = inlineImageReferences(specRaw, specPath, projectRoot, {
    docImageMap,
    themeImageMap,
    annotationAssetMap,
  });
  const annotationsMd = inlineImageReferences(annotationsMdRaw, path.join(annotationRoot, 'annotations.md'), projectRoot, {
    docImageMap,
    themeImageMap,
    annotationAssetMap,
  });

  const inlinedMarkdownMap = Object.fromEntries(
    Object.entries(markdownMap).map(([nodeId, content]) => {
      const markdownOwnerPath = directoryExists(path.join(annotationRoot, 'annotations'))
        ? path.join(annotationRoot, 'annotations', `${nodeId}.md`)
        : path.join(annotationRoot, 'nodes', `${nodeId}.md`);
      return [
        nodeId,
        inlineImageReferences(content, markdownOwnerPath, projectRoot, {
          docImageMap,
          themeImageMap,
          annotationAssetMap,
        }),
      ];
    }),
  );

  const related = Object.fromEntries(
    Array.from(relatedDocumentPaths.entries()).map(([relativePath, absolutePath]) => [
      relativePath,
      inlineImageReferences(readTextFile(absolutePath), absolutePath, projectRoot, {
        docImageMap,
        themeImageMap,
        annotationAssetMap,
      }),
    ]),
  );

  const annotation = hasAnnotationContent({
    data: annotationData,
    annotationsMd,
    markdownMap: inlinedMarkdownMap,
  })
    ? {
      data: annotationData,
      annotationsMd,
      markdownMap: inlinedMarkdownMap,
      assetMap: annotationAssetMap,
      ...(annotationViewerConfig && typeof annotationViewerConfig === 'object'
        ? { viewer: annotationViewerConfig as Record<string, unknown> }
        : {}),
    }
    : undefined;

  const axureExport = await generateAxureExportCode(projectRoot, descriptor.key);

  return {
    entry: {
      name: descriptor.name,
      group: descriptor.group,
      displayName: descriptor.displayName,
      code: readTextFileIfExists(builtCodePath),
      axureCode: axureExport.code,
      axureCodePath: axureExport.codePath,
      hackCss: readTextFileIfExists(hackCssPath),
    },
    ...(annotation ? { annotation } : {}),
    docs: {
      spec,
      related,
    },
    images: {
      docImageMap,
      themeImageMap,
    },
    meta: {
      version: 1,
      exportedAt: new Date().toISOString(),
    },
  };
}
