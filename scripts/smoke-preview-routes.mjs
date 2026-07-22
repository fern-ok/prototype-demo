#!/usr/bin/env node

const baseUrl = process.argv[2] || 'http://localhost:51720';
const targets = process.argv.slice(3).length > 0
  ? process.argv.slice(3)
  : [
      '/prototypes/ref-antd-copy',
      '/components/ref-button',
      '/themes/antd-new',
    ];

let hasFailure = false;

for (const target of targets) {
  const requestUrl = new URL(target, baseUrl).toString();

  try {
    const response = await fetch(requestUrl, {
      redirect: 'follow',
      headers: {
        Accept: 'text/html',
      },
    });

    const html = await response.text();
    const htmlProxyMatches = Array.from(
      html.matchAll(/src="([^"]*html-proxy[^"]*)"/g),
      (match) => match[1],
    );
    const bootstrapProxy = htmlProxyMatches.find((value) => value.includes('index=0.js')) || null;
    const hostProxy = htmlProxyMatches.find((value) => value.includes('index=1.js')) || null;

    let bootstrapScript = '';
    let hostScript = '';
    if (bootstrapProxy) {
      bootstrapScript = await fetch(new URL(bootstrapProxy, baseUrl)).then((res) => res.text());
    }
    if (hostProxy) {
      hostScript = await fetch(new URL(hostProxy, baseUrl)).then((res) => res.text());
    }

    const ok = response.ok
      && html.includes('<div id="root"></div>')
      && htmlProxyMatches.length >= 2
      && !html.includes('waitForBootstrap')
      && bootstrapScript.includes('dev-template-bootstrap.js')
      && hostScript.includes('import PreviewComponent from')
      && hostScript.includes('import.meta.hot.accept(')
      && hostScript.includes(`window.AxhubDevComponent = CurrentComponent;`)
      && html.includes('<div id="root"></div>');

    if (!ok) {
      hasFailure = true;
      console.error(`[preview-smoke] FAIL ${requestUrl}`);
      console.error(`  status=${response.status}`);
      console.error(`  containsRoot=${html.includes('<div id="root"></div>')}`);
      console.error(`  htmlProxyCount=${htmlProxyMatches.length}`);
      console.error(`  removedLegacyLoader=${!html.includes('waitForBootstrap')}`);
      console.error(`  bootstrapProxy=${Boolean(bootstrapProxy)}`);
      console.error(`  hostProxy=${Boolean(hostProxy)}`);
      console.error(`  hostImportsEntry=${hostScript.includes('import PreviewComponent from')}`);
      console.error(`  hostHasAcceptBoundary=${hostScript.includes('import.meta.hot.accept(')}`);
      console.error(`  hostSetsDebugGlobals=${hostScript.includes('window.AxhubDevComponent = CurrentComponent;')}`);
      continue;
    }

    console.log(`[preview-smoke] OK   ${requestUrl}`);
  } catch (error) {
    hasFailure = true;
    console.error(`[preview-smoke] ERROR ${requestUrl}`);
    console.error(`  ${(error && error.message) || error}`);
  }
}

if (hasFailure) {
  process.exitCode = 1;
}
