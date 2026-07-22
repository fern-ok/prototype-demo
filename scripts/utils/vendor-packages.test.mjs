import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  buildVendorImportMap,
  createVendorAliases,
  loadVendorPackagesConfig,
  syncVendorPackages,
} from './vendor-packages.mjs';

const testFilePath = fileURLToPath(import.meta.url);
const appRoot = path.resolve(path.dirname(testFilePath), '..', '..');

describe('vendor packages', () => {
  it('loads configured vendor packages and derives import metadata', () => {
    const config = loadVendorPackagesConfig(appRoot);

    expect(config.packages).toEqual([
      expect.objectContaining({
        packageName: 'axhub-annotation',
        outputDir: 'vendor/axhub-annotation',
        runtimeEntry: 'dist/index.mjs',
        typesEntry: 'dist/index.d.ts',
      }),
    ]);

    const aliases = createVendorAliases(appRoot, config);
    expect(aliases).toEqual([
      expect.objectContaining({
        packageName: 'axhub-annotation',
        runtimeEntryRelative: 'vendor/axhub-annotation/dist/index.mjs',
        typesEntryRelative: 'vendor/axhub-annotation/dist/index.d.ts',
      }),
    ]);

    const importMap = buildVendorImportMap(appRoot, config);
    expect(importMap.paths['axhub-annotation']).toEqual(['./vendor/axhub-annotation/dist/index.d.ts']);
    expect(importMap.paths).not.toHaveProperty('tiptap-editor');
  });

  it('syncs package artifacts into the local vendor directory and writes generated metadata', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'axhub-vendor-test-'));
    const sourceRoot = path.join(tempRoot, 'packages', 'demo-package');
    const distRoot = path.join(sourceRoot, 'dist');
    const appTempRoot = path.join(tempRoot, 'apps', 'axhub-make');

    fs.mkdirSync(distRoot, { recursive: true });
    fs.mkdirSync(appTempRoot, { recursive: true });
    fs.writeFileSync(path.join(distRoot, 'index.mjs'), 'export const demo = true;\n', 'utf8');
    fs.writeFileSync(path.join(distRoot, 'index.d.ts'), 'export declare const demo: true;\n', 'utf8');
    fs.writeFileSync(
      path.join(sourceRoot, 'package.json'),
      JSON.stringify({ name: 'demo-package', type: 'module' }, null, 2),
      'utf8',
    );

    const config = {
      packages: [
        {
          packageName: 'demo-package',
          sourceDir: '../../packages/demo-package',
          outputDir: 'vendor/demo-package',
          runtimeEntry: 'dist/index.mjs',
          typesEntry: 'dist/index.d.ts',
          copy: ['dist', 'package.json'],
        },
      ],
    };

    try {
      const result = syncVendorPackages(appTempRoot, config, {
        shouldBuild: false,
        onBuildPackage: () => {
          throw new Error('build hook should not run when shouldBuild=false');
        },
      });

      expect(result.packages).toHaveLength(1);
      expect(fs.existsSync(path.join(appTempRoot, 'vendor', 'demo-package', 'dist', 'index.mjs'))).toBe(true);
      expect(fs.existsSync(path.join(appTempRoot, 'vendor', 'demo-package', 'package.json'))).toBe(true);

      const generatedAliases = JSON.parse(
        fs.readFileSync(path.join(appTempRoot, 'vendor', 'vendor-aliases.generated.json'), 'utf8'),
      );
      expect(generatedAliases.packages[0]).toMatchObject({
        packageName: 'demo-package',
        runtimeEntryRelative: 'vendor/demo-package/dist/index.mjs',
        typesEntryRelative: 'vendor/demo-package/dist/index.d.ts',
      });

      const generatedPaths = JSON.parse(
        fs.readFileSync(path.join(appTempRoot, 'vendor', 'vendor-tsconfig-paths.generated.json'), 'utf8'),
      );
      expect(generatedPaths.compilerOptions.paths['demo-package']).toEqual(['./vendor/demo-package/dist/index.d.ts']);

      const generatedTsconfig = JSON.parse(
        fs.readFileSync(path.join(appTempRoot, 'vendor', 'vendor-tsconfig.generated.json'), 'utf8'),
      );
      expect(generatedTsconfig).toMatchObject({
        extends: '../tsconfig.base.json',
        compilerOptions: {
          baseUrl: '..',
          paths: {
            'demo-package': ['./vendor/demo-package/dist/index.d.ts'],
          },
        },
      });
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('keeps published vendor artifacts when source packages are unavailable', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'axhub-vendor-fallback-test-'));
    const appTempRoot = path.join(tempRoot, 'apps', 'axhub-make');
    const vendoredRoot = path.join(appTempRoot, 'vendor', 'demo-package');
    const vendoredDistRoot = path.join(vendoredRoot, 'dist');

    fs.mkdirSync(vendoredDistRoot, { recursive: true });
    fs.writeFileSync(path.join(vendoredDistRoot, 'index.mjs'), 'export const published = true;\n', 'utf8');
    fs.writeFileSync(path.join(vendoredDistRoot, 'index.d.ts'), 'export declare const published: true;\n', 'utf8');
    fs.writeFileSync(
      path.join(vendoredRoot, 'package.json'),
      JSON.stringify({ name: 'demo-package', type: 'module' }, null, 2),
      'utf8',
    );

    const config = {
      packages: [
        {
          packageName: 'demo-package',
          sourceDir: '../../packages/demo-package',
          outputDir: 'vendor/demo-package',
          runtimeEntry: 'dist/index.mjs',
          typesEntry: 'dist/index.d.ts',
          copy: ['dist', 'package.json'],
        },
      ],
    };

    try {
      const result = syncVendorPackages(appTempRoot, config, {
        shouldBuild: true,
        onBuildPackage: () => {
          throw new Error('build hook should not run when published artifacts are reused');
        },
      });

      expect(result.packages).toHaveLength(1);
      expect(fs.readFileSync(path.join(vendoredDistRoot, 'index.mjs'), 'utf8')).toContain('published = true');
      expect(fs.existsSync(path.join(appTempRoot, 'vendor', 'vendor-aliases.generated.json'))).toBe(true);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
