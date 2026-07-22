import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const prototypeDir = path.resolve('src/prototypes/www-zbj-com');
const sourcePath = path.join(prototypeDir, 'index.tsx');

function collectImageSources(source: string): string[] {
  return [...source.matchAll(/src="(assets\/images\/[^"]+)"/g)].map((match) => match[1] ?? '');
}

describe('www-zbj-com export sanity', () => {
  it('does not keep invalid exported image attributes or broken asset paths', () => {
    const source = fs.readFileSync(sourcePath, 'utf8');
    const imageSources = Array.from(new Set(collectImageSources(source)));
    const missingAssets = imageSources.filter((relativePath) => {
      return !fs.existsSync(path.join(prototypeDir, relativePath));
    });

    expect(source).not.toContain(' srcset=');
    expect(source).not.toContain('src="https://www.zbj.com/"');
    expect(missingAssets).toEqual([]);
  });
});
