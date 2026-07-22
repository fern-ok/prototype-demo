import fs from 'node:fs';

export type PreviewResourceGroup = 'components' | 'prototypes' | 'themes';
export type PreviewTitleMode = 'dev' | 'export';

export function readEntryDisplayName(indexFilePath: string): string | null {
  try {
    const content = fs.readFileSync(indexFilePath, 'utf8');
    const match = content.match(/@name\s+([^\n]+)/);
    const displayName = match?.[1]?.replace(/\*\/\s*$/, '').trim();
    return displayName || null;
  } catch {
    return null;
  }
}

export function buildPreviewTitle(options: {
  group: PreviewResourceGroup;
  name: string;
  displayName?: string | null;
  mode: PreviewTitleMode;
}): string {
  const label = String(options.displayName || options.name || '').trim() || '未命名预览';
  const suffixMap: Record<PreviewResourceGroup, Record<PreviewTitleMode, string>> = {
    components: {
      dev: '组件预览（开发）',
      export: '组件预览',
    },
    prototypes: {
      dev: '原型预览（开发）',
      export: '原型预览',
    },
    themes: {
      dev: '主题预览（开发）',
      export: '主题预览',
    },
  };

  return `${label} - ${suffixMap[options.group][options.mode]}`;
}
