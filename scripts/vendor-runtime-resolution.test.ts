import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';
import { describe, expect, it } from 'vitest';

type VendorPackageConfig = {
  packageName: string;
  outputDir: string;
  runtimeEntry: string;
};

const APP_ROOT = path.resolve(__dirname, '..');
const JS_LIKE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const JSON_EXTENSIONS = ['.json'];
const STYLE_EXTENSIONS = ['.scss', '.sass', '.css'];
const SUPPORTED_EXTENSIONS = [...JS_LIKE_EXTENSIONS, ...JSON_EXTENSIONS, '.d.ts'];
const BUILTIN_MODULES = new Set([
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`),
]);

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function isBareSpecifier(specifier: string): boolean {
  return !specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.startsWith('data:');
}

function normalizePackageName(specifier: string): string {
  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/');
    return `${scope}/${name ?? ''}`;
  }

  return specifier.split('/')[0] ?? specifier;
}

function collectImportSpecifiers(source: string): string[] {
  const matches = new Set<string>();
  const patterns = [
    /from\s+['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /export\s+\*\s+from\s+['"]([^'"]+)['"]/g,
    /export\s*{[^}]*}\s*from\s+['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1]) {
        matches.add(match[1]);
      }
    }
  }

  return Array.from(matches);
}

function resolveRelativeImport(fromFile: string, specifier: string): string | null {
  const basePath = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    basePath,
    ...SUPPORTED_EXTENSIONS.map((extension) => `${basePath}${extension}`),
    ...SUPPORTED_EXTENSIONS.map((extension) => path.join(basePath, `index${extension}`)),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function gatherVendoredRuntimeState(pkg: VendorPackageConfig) {
  const packageRoot = path.resolve(APP_ROOT, pkg.outputDir);
  const entryPath = path.resolve(packageRoot, pkg.runtimeEntry);
  const pending = [entryPath];
  const visited = new Set<string>();
  const bareImports = new Set<string>();
  let requiresSass = false;

  while (pending.length > 0) {
    const currentFile = pending.pop();
    if (!currentFile || visited.has(currentFile) || !fs.existsSync(currentFile)) {
      continue;
    }

    visited.add(currentFile);
    const source = fs.readFileSync(currentFile, 'utf8');
    const imports = collectImportSpecifiers(source);

    for (const specifier of imports) {
      if (isBareSpecifier(specifier)) {
        bareImports.add(normalizePackageName(specifier));
        continue;
      }

      if (STYLE_EXTENSIONS.some((extension) => specifier.endsWith(extension))) {
        requiresSass = true;
        continue;
      }

      const resolved = resolveRelativeImport(currentFile, specifier);
      if (resolved) {
        pending.push(resolved);
      }
    }
  }

  return {
    entryPath,
    bareImports: Array.from(bareImports).sort(),
    requiresSass,
  };
}

describe('vendored package runtime resolution', () => {
  it('keeps all vendored runtime imports resolvable from axhub-make', () => {
    const packageJson = readJson<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(path.resolve(APP_ROOT, 'package.json'));

    const vendorConfig = readJson<{ packages?: VendorPackageConfig[] }>(
      path.resolve(APP_ROOT, 'vendor-packages.config.json'),
    );

    const declaredPackages = new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ]);

    const vendoredPackages = new Set(
      (vendorConfig.packages ?? []).map((pkg) => pkg.packageName),
    );

    const missingImports: Array<{ packageName: string; entryPath: string; importName: string }> = [];
    let shouldHaveSass = false;

    for (const pkg of vendorConfig.packages ?? []) {
      const runtimeState = gatherVendoredRuntimeState(pkg);
      shouldHaveSass = shouldHaveSass || runtimeState.requiresSass;

      for (const importName of runtimeState.bareImports) {
        if (BUILTIN_MODULES.has(importName)) {
          continue;
        }

        if (declaredPackages.has(importName) || vendoredPackages.has(importName)) {
          continue;
        }

        missingImports.push({
          packageName: pkg.packageName,
          entryPath: runtimeState.entryPath,
          importName,
        });
      }
    }

    expect(missingImports).toEqual([]);

    if (shouldHaveSass) {
      expect(
        declaredPackages.has('sass') || declaredPackages.has('sass-embedded'),
      ).toBe(true);
    }
  });
});
