/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { ZipFileInfo } from '../types';

/**
 * Checks if a path or any of its segments should be ignored
 */
export function shouldIgnore(path: string, customIgnoreRules?: string): boolean {
  const parts = path.toLowerCase().split(/[/\\]/);
  
  // Folders that must be ignored to prevent uploading garbage/dependencies
  const ignoredFolders = [
    'node_modules',
    '.git',
    '.github',
    'dist',
    'build',
    '.next',
    '.cache',
    '.gradle',
    '.idea',
    'captures'
  ];

  // If there are custom ignore rules, parse them
  const customPatterns: string[] = [];
  if (customIgnoreRules) {
    customIgnoreRules.split(/[\n,]+/).forEach(line => {
      const trimmed = line.trim().toLowerCase();
      if (trimmed && !trimmed.startsWith('#')) {
        customPatterns.push(trimmed);
      }
    });
  }

  return parts.some((part) => {
    // Check against custom patterns
    if (customPatterns.length > 0) {
      for (const pattern of customPatterns) {
        // Handle simple wildcards like *.pem or directories
        if (pattern.startsWith('*.')) {
          const ext = pattern.slice(1); // e.g. .pem
          if (part.endsWith(ext)) {
            return true;
          }
        } else if (part === pattern || part.startsWith(pattern) || part.endsWith(pattern)) {
          return true;
        }
      }
    }

    // Exact folder/file match from our list
    if (ignoredFolders.includes(part)) {
      return true;
    }

    // Direct files or pattern matches
    if (
      part === '.ds_store' ||
      part === 'thumbs.db' ||
      part === 'local.properties' ||
      part.endsWith('.iml') ||
      part.startsWith('.env') // Automatically ignore all environment file variations (.env, .env.local, .env.development, etc.)
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Format bytes to a human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Parse a zip file and extract file metadata
 */
export async function parseZipFile(file: File, customIgnoreRules?: string): Promise<{
  zip: JSZip;
  info: ZipFileInfo;
}> {
  const zip = await JSZip.loadAsync(file);
  const files: { path: string; size: number }[] = [];
  const folders = new Set<string>();

  zip.forEach((relativePath, fileObj) => {
    if (shouldIgnore(relativePath, customIgnoreRules)) {
      return;
    }

    if (fileObj.dir) {
      folders.add(relativePath);
    } else {
      // Find parent directories and record them if not already added
      const segments = relativePath.split('/');
      segments.pop(); // remove file name
      let currentPath = '';
      for (const segment of segments) {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        folders.add(currentPath);
      }
      
      // We can't know the precise uncompressed size immediately without reading in some versions,
      // but fileObj._data.uncompressedSize or fileObj.async can give it.
      // JSZip JSZipObject contains a `date` and some metadata.
      // We can approximate size or use fileObj properties safely.
      // Let's check: JSZipObject does have a public `_data` or we can just count files.
      // Actually, JSZip's internal representation has size, but to be safe,
      // we can fetch the size or keep it zero.
      // In JSZip, fileObj has a `name` and we can get content size.
      // Let's just set a mock/default or read the size safely.
      // JSZipObject doesn't expose public size cleanly in type definitions always,
      // but we can query it using as `any` or estimate.
      // Let's use `(fileObj as any)._data?.uncompressedSize || 0` or similar.
      const size = (fileObj as any)._data?.uncompressedSize || 0;
      files.push({
        path: relativePath,
        size,
      });
    }
  });

  return {
    zip,
    info: {
      name: file.name,
      size: file.size,
      totalFiles: files.length,
      totalFolders: folders.size,
      files,
    },
  };
}

/**
 * Packs a list of files (from direct folder selection) into a JSZip instance
 */
export async function createZipFromFiles(filesList: File[], customIgnoreRules?: string): Promise<{
  zip: JSZip;
  info: ZipFileInfo;
}> {
  const zip = new JSZip();
  const files: { path: string; size: number }[] = [];
  const folders = new Set<string>();

  for (const file of filesList) {
    let relativePath = file.webkitRelativePath || file.name;
    
    // Strip the root directory segment (e.g., "my-app/src/main.ts" -> "src/main.ts")
    // to match standard zipping behavior where contents are zipped, not the outer folder.
    const parts = relativePath.split('/');
    if (parts.length > 1) {
      parts.shift();
      relativePath = parts.join('/');
    }

    if (shouldIgnore(relativePath, customIgnoreRules)) {
      continue;
    }

    // Pack file into zip instance
    zip.file(relativePath, file);

    // Track folders
    const segments = relativePath.split('/');
    segments.pop(); // remove file name
    let currentPath = '';
    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      folders.add(currentPath);
    }

    files.push({
      path: relativePath,
      size: file.size,
    });
  }

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const rootFolderName = filesList[0]?.webkitRelativePath?.split('/')[0] || 'folder-upload';

  return {
    zip,
    info: {
      name: rootFolderName,
      size: totalSize,
      totalFiles: files.length,
      totalFolders: folders.size,
      files,
    },
  };
}

/**
 * Converts a JSZipObject into a Base64 encoded string
 */
export async function fileToBase64(fileObj: JSZip.JSZipObject): Promise<string> {
  const uint8 = await fileObj.async('uint8array');
  
  // Safe base64 conversion that avoids stack overflow errors on large files
  const chunks: string[] = [];
  const chunkSize = 0xffff; // 65535
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
  }
  
  return window.btoa(chunks.join(''));
}
