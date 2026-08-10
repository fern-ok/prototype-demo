#!/usr/bin/env node

/**
 * 为 dist 目录下的所有 JS 文件生成对应的 HTML 文件
 * 使用 html-template.html 模板，用于构建后直接访问
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(workspaceRoot, 'dist');
const adminDir = path.resolve(workspaceRoot, 'admin');
const templatePath = path.join(adminDir, 'html-template.html');

let generatedCount = 0;

// 检查模板是否存在
if (!fs.existsSync(templatePath)) {
  console.error('错误: html-template.html 模板不存在，请先构建 prototype-admin');
  console.error('路径:', templatePath);
  process.exit(1);
}

// 检查 dist 目录是否存在
if (!fs.existsSync(distDir)) {
  console.log('dist 目录不存在，跳过 HTML 生成');
  process.exit(0);
}

const template = fs.readFileSync(templatePath, 'utf8');

/**
 * 递归遍历目录，为每个 JS 文件生成 HTML
 */
function generateHtmlForDirectory(dir, baseDir = distDir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const itemPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      // 递归处理子目录
      generateHtmlForDirectory(itemPath, baseDir);
    } else if (item.name.endsWith('.js') && !item.name.includes('.worker')) {
      // 为 JS 文件生成 HTML
      const relativePath = path.relative(baseDir, itemPath);
      const jsName = relativePath.replace('.js', '');
      const htmlPath = path.join(dir, item.name.replace('.js', '.html'));

      // 根据路径生成标题
      let title = 'Preview';
      if (jsName.startsWith('components/')) {
        const name = jsName.replace('components/', '');
        title = `Element: ${name}`;
      } else if (jsName.startsWith('prototypes/')) {
        const name = jsName.replace('prototypes/', '');
        title = `Page: ${name}`;
      }

      // 计算 JS 文件的相对路径（从 HTML 的位置）
      const jsFileName = `./${item.name}`;
      
      // 计算 bootstrap JS 的相对路径
      const relativeDir = path.relative(baseDir, dir);
      const depth = relativeDir ? relativeDir.split(path.sep).length : 0;
      const bootstrapPath = depth > 0 
        ? '../'.repeat(depth) + 'assets/html-template-bootstrap.js'
        : './assets/html-template-bootstrap.js';

      // 替换模板变量
      let html = template.replace('{{TITLE}}', title);
      html = html.replace('{{ENTRY}}', jsFileName);
      html = html.replace('{{BOOTSTRAP_PATH}}', bootstrapPath);

      // 写入 HTML 文件
      fs.writeFileSync(htmlPath, html, 'utf8');
      console.log(`生成: ${relativePath.replace('.js', '.html')}`);
      generatedCount++;
    }
  }
}

console.log('\n开始为 dist 目录生成 HTML 文件...\n');

generateHtmlForDirectory(distDir);

console.log(`\n完成！共生成 ${generatedCount} 个 HTML 文件。`);
console.log('模板文件: admin/html-template.html\n');

// 复制 bootstrap JS 到 dist/assets
const srcBootstrap = path.join(adminDir, 'assets/html-template-bootstrap.js');
const destAssetsDir = path.join(distDir, 'assets');
const destBootstrap = path.join(destAssetsDir, 'html-template-bootstrap.js');

if (fs.existsSync(srcBootstrap)) {
  if (!fs.existsSync(destAssetsDir)) {
    fs.mkdirSync(destAssetsDir, { recursive: true });
  }
  fs.copyFileSync(srcBootstrap, destBootstrap);
  console.log('✓ html-template-bootstrap.js 已复制到 dist/assets');

  // 复制 chunks 目录（bootstrap 依赖的 chunk 文件）
  const srcChunksDir = path.join(adminDir, 'assets', 'chunks');
  const destChunksDir = path.join(destAssetsDir, 'chunks');
  if (fs.existsSync(srcChunksDir)) {
    function copyDir(src, dest) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
    copyDir(srcChunksDir, destChunksDir);
    console.log('✓ chunks 目录已复制到 dist/assets');
  }

  // 同时复制其他必要的依赖（如果有的话）
  const assetsFiles = fs.readdirSync(path.join(adminDir, 'assets'));
  for (const file of assetsFiles) {
    // 复制 bootstrap 依赖的 chunk 文件
    if (file.startsWith('index-') && file.endsWith('.js')) {
      const src = path.join(adminDir, 'assets', file);
      const dest = path.join(destAssetsDir, file);
      fs.copyFileSync(src, dest);
      console.log(`✓ ${file} 已复制到 dist/assets`);
    }
  }
} else {
  console.warn('⚠ html-template-bootstrap.js 不存在，请先构建 prototype-admin');
}

// 在 dist 根目录生成 index.html，自动跳转到版本管理首页
const rootIndexHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>公共数据资源授权运营管理平台</title>
  <meta http-equiv="refresh" content="0; url=./prototypes/index.html">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>">
  <style>
    html, body { margin: 0; padding: 0; height: 100%; }
    body { display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1e3a5f 0%, #0f63f4 100%); color: #fff; }
    .redirect-box { text-align: center; padding: 40px; }
    .redirect-box h1 { font-size: 22px; margin: 0 0 12px; }
    .redirect-box p { font-size: 14px; opacity: 0.8; margin: 0; }
    .redirect-box a { color: #fff; text-decoration: underline; }
  </style>
  <script>
    // 如 meta refresh 未生效（通常会自动跳转），通过 JS 跳转
    window.location.replace('./prototypes/index.html');
  </script>
</head>
<body>
  <div class="redirect-box">
    <h1>公共数据资源授权运营管理平台</h1>
    <p>正在跳转到版本管理首页...<br>如未自动跳转，请 <a href="./prototypes/index.html">点击此处</a></p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), rootIndexHtml, 'utf8');
console.log('✓ 已生成根目录 index.html，跳转到版本管理首页');
