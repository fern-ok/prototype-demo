import type { Plugin } from 'vite';

export function forceInlineDynamicImportsOff(enable: boolean): Plugin {
  return {
    name: 'force-inline-dynamic-imports-off',
    configResolved(config) {
      if (!enable) {
        return;
      }
      const output = config.build.rollupOptions.output;
      const outputs = Array.isArray(output) ? output : output ? [output] : [];
      outputs.forEach((item) => {
        if (item) {
          item.inlineDynamicImports = false;
        }
      });
    }
  };
}
