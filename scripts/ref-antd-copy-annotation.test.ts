import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

describe('ref-antd-copy annotations', () => {
  it('mounts the annotation viewer in the prototype source', () => {
    const sourcePath = path.resolve('src/prototypes/ref-antd-copy/index.tsx');
    const source = fs.readFileSync(sourcePath, 'utf8');

    expect(source).toContain('AnnotationViewer');
  });
});
