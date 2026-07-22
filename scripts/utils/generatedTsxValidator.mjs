import ts from 'typescript';

function formatDiagnostic(diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  if (!diagnostic.file || typeof diagnostic.start !== 'number') {
    return message;
  }

  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  const sourceLine = diagnostic.file.text.split(/\r?\n/u)[line] || '';
  return `${diagnostic.file.fileName}:${line + 1}:${character + 1} - ${message}\n${sourceLine}`;
}

export function validateGeneratedTsx(source, filePath = 'generated.tsx') {
  const result = ts.transpileModule(source, {
    fileName: filePath,
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
    },
  });

  const diagnostics = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );

  return {
    ok: diagnostics.length === 0,
    diagnostics,
    formatted: diagnostics.map(formatDiagnostic).join('\n\n'),
  };
}

export function assertValidGeneratedTsx(source, filePath = 'generated.tsx') {
  const validation = validateGeneratedTsx(source, filePath);
  if (!validation.ok) {
    throw new Error(`生成的 TSX 语法校验失败:\n${validation.formatted}`);
  }
}
