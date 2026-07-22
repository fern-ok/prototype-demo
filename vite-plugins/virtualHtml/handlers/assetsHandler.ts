import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

import { sendMaybeCompressedResponse } from '../../utils/httpResponseUtils';

function hasVersionQuery(requestUrl: string) {
  return /[?&]v=/.test(requestUrl);
}

function setNoStoreHeaders(res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

function setImmutableAssetHeaders(res: ServerResponse) {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
}

export function handleAssetsRequest(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.url && req.url.startsWith('/assets/')) {
    const pathname = req.url.split('?')[0];
    const relativePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const assetPath = path.resolve(process.cwd(), 'admin', relativePath);
    
    console.log('[主项目] 请求 asset:', req.url, '-> 路径:', assetPath, '存在:', fs.existsSync(assetPath));
    
    if (fs.existsSync(assetPath)) {
      try {
        const content = fs.readFileSync(assetPath);
        const ext = path.extname(assetPath);
        const contentTypes: Record<string, string> = {
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.gif': 'image/gif'
        };

        if (hasVersionQuery(req.url)) {
          setImmutableAssetHeaders(res);
        } else {
          setNoStoreHeaders(res);
        }
        res.statusCode = 200;
        sendMaybeCompressedResponse(req, res, {
          body: content,
          contentType: contentTypes[ext] || 'application/octet-stream',
        });
        console.log('[主项目] ✅ 成功返回 asset:', req.url);
        return true;
      } catch (err) {
        console.error('[主项目] ❌ 读取 assets 文件失败:', err);
      }
    } else {
      console.log('[主项目] ❌ asset 文件不存在');
    }
  }
  
  return false;
}
