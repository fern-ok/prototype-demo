#!/usr/bin/env node

const baseUrl = process.argv[2] || 'http://localhost:51720';
const rootUrl = new URL('/', baseUrl).toString();
const previewUrl = new URL('/prototypes/ref-antd-copy', baseUrl).toString();

let hasFailure = false;

async function checkHtml(url, expected) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { Accept: 'text/html' },
  });
  const html = await response.text();

  const result = {
    ok: response.ok,
    hasViteClient: html.includes('/@vite/client'),
    hasReactRefreshPreamble: html.includes('/@react-refresh'),
  };

  const matches = expected(result);
  if (!matches) {
    hasFailure = true;
    console.error(`[shell-boundary] FAIL ${url}`);
    console.error(`  status=${response.status}`);
    console.error(`  hasViteClient=${result.hasViteClient}`);
    console.error(`  hasReactRefreshPreamble=${result.hasReactRefreshPreamble}`);
    return;
  }

  console.log(`[shell-boundary] OK   ${url}`);
}

await checkHtml(rootUrl, (result) => (
  result.ok
  && !result.hasViteClient
  && !result.hasReactRefreshPreamble
));

await checkHtml(previewUrl, (result) => (
  result.ok
  && result.hasViteClient
  && result.hasReactRefreshPreamble
));

if (hasFailure) {
  process.exitCode = 1;
}
