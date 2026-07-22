#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadVendorPackagesConfig,
  syncVendorPackages,
} from './utils/vendor-packages.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const shouldBuild = !args.has('--skip-build');

function main() {
  const config = loadVendorPackagesConfig(appRoot);
  const result = syncVendorPackages(appRoot, config, { shouldBuild });

  const packageNames = result.packages.map((pkg) => pkg.packageName).join(', ');
  console.log(`Synced vendor packages: ${packageNames}`);
}

main();
