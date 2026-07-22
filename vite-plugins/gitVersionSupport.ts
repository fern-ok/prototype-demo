export type GitVersionAvailabilityErrorCode =
  | 'git-not-available'
  | 'git-repository-not-initialized'
  | 'git-history-not-ready';

export interface GitVersionAvailability {
  initialized: boolean;
  isGitRepo: boolean;
  gitAvailable: boolean;
  hasCommits?: boolean;
  error?: string;
  errorCode?: GitVersionAvailabilityErrorCode;
  message?: string;
  details?: string;
}

const gitRepositoryErrorPatterns = [
  /not a git repository/i,
  /不是一个?\s*git\s*仓库/i,
  /不是\s*git\s*仓库/i,
];

const gitHistoryMissingPatterns = [
  /does not have any commits yet/i,
  /your current branch .* does not have any commits yet/i,
  /没有任何提交/i,
  /尚未有任何提交/i,
  /当前分支.*没有提交/i,
  /ambiguous argument 'head'/i,
  /bad revision 'head'/i,
];

export function isGitRepositoryErrorMessage(message: string): boolean {
  return gitRepositoryErrorPatterns.some((pattern) => pattern.test(message));
}

export function isGitHistoryMissingMessage(message: string): boolean {
  return gitHistoryMissingPatterns.some((pattern) => pattern.test(message));
}

export function createGitVersionAvailability(options: {
  gitAvailable: boolean;
  isGitRepo?: boolean;
  hasCommits?: boolean;
  details?: string;
}): GitVersionAvailability {
  const { gitAvailable, isGitRepo = false, hasCommits = isGitRepo, details } = options;

  if (!gitAvailable) {
    return {
      initialized: false,
      isGitRepo: false,
      gitAvailable: false,
      error: 'Git 未安装或不可用',
      errorCode: 'git-not-available',
      message: '版本管理功能需要 Git 支持。请先安装 Git 后重启开发服务器。',
      ...(details ? { details } : {}),
    };
  }

  if (!isGitRepo) {
    return {
      initialized: false,
      isGitRepo: false,
      gitAvailable: true,
      error: 'Git 仓库未初始化',
      errorCode: 'git-repository-not-initialized',
      message: '当前项目未启用 Git 版本管理。请先在项目根目录执行 git init，并至少提交一次版本后再使用该功能。',
      ...(details ? { details } : {}),
    };
  }

  if (!hasCommits) {
    return {
      initialized: true,
      isGitRepo: true,
      gitAvailable: true,
      hasCommits: false,
      error: 'Git 仓库暂无提交记录',
      errorCode: 'git-history-not-ready',
      message: '当前项目已启用 Git，但还没有任何提交记录。请先提交一次版本后再查看历史版本。',
      ...(details ? { details } : {}),
    };
  }

  return {
    initialized: true,
    isGitRepo: true,
    gitAvailable: true,
    hasCommits: true,
  };
}
