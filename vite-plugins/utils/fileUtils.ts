import fs from 'fs';

/**
 * 从文件注释中读取显示名称
 */
export function getDisplayName(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const nameMatch = content.match(/@(?:name|displayName)\s+(.+)/);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }
  } catch (err) {
    // 忽略读取错误
  }
  return null;
}
