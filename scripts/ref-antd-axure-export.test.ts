import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { reviewFile } from '../vite-plugins/codeReviewPlugin';

describe('ref-antd axure export annotations', () => {
  it('passes axure-export review for the prototype source header', () => {
    const sourcePath = path.resolve('src/prototypes/ref-antd/index.tsx');
    const source = fs.readFileSync(sourcePath, 'utf8');
    const result = reviewFile(sourcePath, { mode: 'axure-export' });

    expect(source).toContain('@mode axure');
    expect(source).toContain('/skills/axure-export-workflow/SKILL.md');
    expect(result.passed).toBe(true);
    expect(result.summary.blockingErrors).toBe(0);
  });
});
