export const INSTALL_SKILL_TARGET_DIRS: Record<string, string | null> = {
  // IDE editors
  cursor: '.cursor/skills',
  windsurf: '.windsurf/skills',
  qoder: 'skills',
  trae: '.trae/skills',
  trae_cn: '.trae/skills',
  vscode: '.github/skills',
  kiro: '.kiro/skills',
  antigravity: '.agent/skills',
  // CLI / Genie tools
  'claude-code': '.claude/skills',
  // Codex project-level skills follow the official recommended location.
  codex: '.agents/skills',
  opencode: '.opencode/skills',
};

export function getInstallSkillTargetDir(client: string): string | null {
  return INSTALL_SKILL_TARGET_DIRS[client] ?? null;
}
