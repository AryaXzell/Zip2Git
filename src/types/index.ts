/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  total_private_repos?: number;
  owned_private_repos?: number;
  company?: string | null;
  location?: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
}

export interface UploadProgress {
  status: 'idle' | 'extracting' | 'uploading' | 'completed' | 'failed';
  percent: number;
  currentFile: string;
  uploadedCount: number;
  totalCount: number;
  estimatedSecondsRemaining: number;
  error: string | null;
}

export interface UploadHistoryItem {
  id: string;
  timestamp: string;
  repoName: string;
  zipName: string;
  fileCount: number;
  status: 'completed' | 'failed';
  url: string | null;
}

export interface ZipFileInfo {
  name: string;
  size: number;
  totalFiles: number;
  totalFolders: number;
  files: { path: string; size: number }[];
}

export interface AppSettings {
  theme: 'dark' | 'light';
  clearSessionOnClose: boolean;
  defaultBranch: string;
  defaultCommitMessage: string;
  autoOverwrite: boolean;
  customIgnoreRules?: string;
  uploadMethod: 'sequential' | 'parallel';
  parallelLimit: number;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

