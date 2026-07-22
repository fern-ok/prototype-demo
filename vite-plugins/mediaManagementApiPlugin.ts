import type { Plugin } from 'vite';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';

interface MediaAsset {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'audio' | 'animation' | 'folder';
  size?: number;
  mimeType?: string;
  createdAt: string;
  parentPath?: string;
}

/**
 * Media Management API Plugin
 * Provides API endpoints for managing media assets (images, audio, animations, folders)
 */
export function mediaManagementApiPlugin(): Plugin {
  let mediaDir: string;

  return {
    name: 'media-management-api',
    
    configureServer(server) {
      // Set media directory path
      mediaDir = path.join(process.cwd(), 'assets', 'media');
      
      // Ensure media directory exists
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      const normalizeMediaRelativePath = (value: string) => {
        return String(value || '')
          .replace(/\\/g, '/')
          .split('/')
          .filter(Boolean)
          .join('/');
      };

      const resolveMediaPath = (relativePath: string, options?: { allowRoot?: boolean }) => {
        const normalizedRelativePath = normalizeMediaRelativePath(relativePath);
        const resolvedMediaDir = path.resolve(mediaDir);
        const resolvedTargetPath = normalizedRelativePath
          ? path.resolve(resolvedMediaDir, normalizedRelativePath)
          : resolvedMediaDir;
        const allowRoot = options?.allowRoot === true;

        if (resolvedTargetPath === resolvedMediaDir) {
          return allowRoot ? resolvedTargetPath : null;
        }

        if (!resolvedTargetPath.startsWith(`${resolvedMediaDir}${path.sep}`)) {
          return null;
        }

        return resolvedTargetPath;
      };

      const toMediaRelativePath = (absolutePath: string) => {
        return path.relative(mediaDir, absolutePath).split(path.sep).join('/');
      };

      const isSafeMediaName = (value: string) => {
        return Boolean(value && value.trim() && !value.includes('..') && !/[\\/]/.test(value));
      };

      // Helper functions
      const sendJSON = (res: any, statusCode: number, data: any) => {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
      };

      const sendError = (res: any, statusCode: number, message: string) => {
        sendJSON(res, statusCode, { error: message, timestamp: new Date().toISOString() });
      };

      const getAssetType = (filePath: string, isDirectory: boolean): MediaAsset['type'] => {
        if (isDirectory) return 'folder';
        
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, MediaAsset['type']> = {
          '.jpg': 'image',
          '.jpeg': 'image',
          '.png': 'image',
          '.gif': 'image',
          '.webp': 'image',
          '.svg': 'image',
          '.mp3': 'audio',
          '.wav': 'audio',
          '.ogg': 'audio',
          '.m4a': 'audio',
          '.json': 'animation',
        };
        
        return mimeTypes[ext] || 'image';
      };

      const scanDirectory = (dirPath: string, relativePath: string = ''): MediaAsset[] => {
        const assets: MediaAsset[] = [];
        
        try {
          const items = fs.readdirSync(dirPath);
          
          for (const item of items) {
            // Skip hidden files
            if (item.startsWith('.')) continue;
            
            const fullPath = path.join(dirPath, item);
            const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
            const stats = fs.statSync(fullPath);
            
            const asset: MediaAsset = {
              id: uuidv4(),
              name: item,
              path: itemRelativePath,
              type: getAssetType(fullPath, stats.isDirectory()),
              createdAt: stats.birthtime.toISOString(),
              parentPath: relativePath || undefined,
            };

            if (!stats.isDirectory()) {
              asset.size = stats.size;
              asset.mimeType = getMimeType(fullPath);
            }

            assets.push(asset);
          }
        } catch (error: any) {
          console.error('Error scanning directory:', error);
        }
        
        return assets;
      };

      const getMimeType = (filePath: string): string => {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.mp3': 'audio/mpeg',
          '.wav': 'audio/wav',
          '.ogg': 'audio/ogg',
          '.m4a': 'audio/mp4',
          '.json': 'application/json',
        };
        return mimeTypes[ext] || 'application/octet-stream';
      };

      // Middleware to handle API routes
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        
        // GET /api/media - List media assets
        if (url.startsWith('/api/media') && req.method === 'GET') {
          try {
            const urlObj = new URL(url, `http://${req.headers.host}`);
            const requestedPath = urlObj.searchParams.get('path') || '';

            const targetDir = resolveMediaPath(requestedPath, { allowRoot: true });
            if (!targetDir) {
              return sendError(res, 403, 'Invalid media path');
            }
            
            if (!fs.existsSync(targetDir)) {
              return sendError(res, 404, 'Directory not found');
            }
            
            const assets = scanDirectory(targetDir, normalizeMediaRelativePath(requestedPath));
            sendJSON(res, 200, assets);
          } catch (error: any) {
            console.error('Error listing media:', error);
            sendError(res, 500, error.message || 'Failed to list media assets');
          }
          return;
        }

        // POST /api/media/upload - Upload file
        if (url === '/api/media/upload' && req.method === 'POST') {
          try {
            const form = formidable({
              uploadDir: mediaDir,
              keepExtensions: true,
              maxFileSize: 50 * 1024 * 1024, // 50MB
            });

            form.parse(req, (err, fields, files) => {
              if (err) {
                return sendError(res, 400, 'Upload failed: ' + err.message);
              }

              try {
                const file = Array.isArray(files.file) ? files.file[0] : files.file;
                if (!file) {
                  return sendError(res, 400, 'No file uploaded');
                }

                const targetPath = Array.isArray(fields.path) ? fields.path[0] : fields.path;
                const targetDir = resolveMediaPath(String(targetPath || ''), { allowRoot: true });
                if (!targetDir) {
                  return sendError(res, 403, 'Invalid upload path');
                }
                
                if (!fs.existsSync(targetDir)) {
                  fs.mkdirSync(targetDir, { recursive: true });
                }

                const fileName = path.basename(file.originalFilename || file.newFilename || '');
                if (!isSafeMediaName(fileName)) {
                  return sendError(res, 400, 'Invalid file name');
                }

                const finalPath = path.join(targetDir, fileName);
                fs.renameSync(file.filepath, finalPath);

                sendJSON(res, 200, { 
                  message: 'File uploaded successfully',
                  path: toMediaRelativePath(finalPath)
                });
              } catch (error: any) {
                sendError(res, 500, 'Failed to save file: ' + error.message);
              }
            });
          } catch (error: any) {
            sendError(res, 500, error.message || 'Upload failed');
          }
          return;
        }

        // POST /api/media/folder - Create folder
        if (url === '/api/media/folder' && req.method === 'POST') {
          try {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const { name, parentPath } = JSON.parse(body);
                
                if (!name || !name.trim()) {
                  return sendError(res, 400, 'Folder name is required');
                }

                const folderName = String(name).trim();
                if (!isSafeMediaName(folderName)) {
                  return sendError(res, 400, 'Invalid folder name');
                }

                const parentDir = resolveMediaPath(String(parentPath || ''), { allowRoot: true });
                if (!parentDir) {
                  return sendError(res, 403, 'Invalid parent path');
                }

                const targetDir = path.join(parentDir, folderName);

                if (fs.existsSync(targetDir)) {
                  return sendError(res, 400, 'Folder already exists');
                }

                fs.mkdirSync(targetDir, { recursive: true });
                sendJSON(res, 200, { 
                  message: 'Folder created successfully',
                  path: toMediaRelativePath(targetDir)
                });
              } catch (error: any) {
                sendError(res, 400, 'Invalid request: ' + error.message);
              }
            });
          } catch (error: any) {
            sendError(res, 500, error.message || 'Failed to create folder');
          }
          return;
        }

        // DELETE /api/media/:path - Delete file or folder
        if (url.startsWith('/api/media/') && req.method === 'DELETE') {
          try {
            const assetPath = decodeURIComponent(url.replace('/api/media/', ''));
            const fullPath = resolveMediaPath(assetPath);
            if (!fullPath) {
              return sendError(res, 403, 'Invalid asset path');
            }

            if (!fs.existsSync(fullPath)) {
              return sendError(res, 404, 'Asset not found');
            }

            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
              fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(fullPath);
            }

            sendJSON(res, 200, { message: 'Asset deleted successfully' });
          } catch (error: any) {
            console.error('Error deleting asset:', error);
            sendError(res, 500, error.message || 'Failed to delete asset');
          }
          return;
        }

        // GET /api/media/file/:path - Serve file
        if (url.startsWith('/api/media/file/') && req.method === 'GET') {
          try {
            const assetPath = decodeURIComponent(url.replace('/api/media/file/', ''));
            const fullPath = resolveMediaPath(assetPath);
            if (!fullPath) {
              return sendError(res, 403, 'Invalid asset path');
            }

            if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
              return sendError(res, 404, 'File not found');
            }

            const mimeType = getMimeType(fullPath);
            res.setHeader('Content-Type', mimeType);
            fs.createReadStream(fullPath).pipe(res);
          } catch (error: any) {
            console.error('Error serving file:', error);
            sendError(res, 500, error.message || 'Failed to serve file');
          }
          return;
        }

        next();
      });
    }
  };
}
