import fs from 'fs';
import path from 'path';

const appRoot = process.cwd();
const srcRoot = path.join(appRoot, 'src');
const previewGroups = ['components', 'prototypes', 'themes'];
const legacyHtmlFiles = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name === 'index.html') {
      legacyHtmlFiles.push(path.relative(appRoot, fullPath));
    }
  }
}

for (const group of previewGroups) {
  const groupRoot = path.join(srcRoot, group);
  if (fs.existsSync(groupRoot)) {
    walk(groupRoot);
  }
}

if (legacyHtmlFiles.length > 0) {
  console.error('Found legacy preview HTML files under src/. Dev preview must use the virtual host pipeline only:');
  for (const file of legacyHtmlFiles) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('No legacy src preview HTML files found.');
