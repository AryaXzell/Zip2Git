/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GitHubUser, GitHubRepo, GitHubRateLimit } from '../types';

const BASE_URL = 'https://api.github.com';

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export async function validateToken(token: string): Promise<GitHubUser> {
  const response = await fetch(`${BASE_URL}/user`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Token GitHub tidak valid atau telah kedaluwarsa.');
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Gagal memvalidasi token GitHub.');
  }

  return response.json();
}

export async function getRepositories(token: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(`${BASE_URL}/user/repos?per_page=${perPage}&page=${page}&sort=updated`, {
      headers: getHeaders(token),
    });

    if (!response.ok) {
      if (repos.length > 0) {
        return repos;
      }
      throw new Error('Gagal mengambil daftar repositori GitHub Anda.');
    }

    const data: GitHubRepo[] = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    repos.push(...data);

    if (data.length < perPage || page >= 5) {
      break;
    }

    page++;
  }

  return repos;
}

interface CreateRepoPayload {
  name: string;
  description: string;
  private: boolean;
  auto_init: boolean;
}

export async function createRepository(
  token: string,
  payload: CreateRepoPayload
): Promise<GitHubRepo> {
  const response = await fetch(`${BASE_URL}/user/repos`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      private: payload.private,
      auto_init: payload.auto_init,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 422) {
      throw new Error('Nama repositori sudah digunakan atau tidak valid.');
    }
    throw new Error(errData.message || 'Gagal membuat repositori baru.');
  }

  return response.json();
}

/**
 * Fetch the recursive git tree of a repository branch to construct a path -> sha map.
 * This is crucial to avoid "conflict" errors (422/409) when writing over existing files.
 */
export async function getRepoTree(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<Map<string, string>> {
  const shaMap = new Map<string, string>();
  try {
    // 1. Get the branch ref to find the latest commit SHA
    const refRes = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
      headers: getHeaders(token),
    });

    if (!refRes.ok) {
      // Branch might not exist yet (e.g., brand-new empty repo)
      return shaMap;
    }

    const refData = await refRes.json();
    const commitSha = refData.object.sha;

    // 2. Fetch the recursive tree
    const treeRes = await fetch(
      `${BASE_URL}/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=true`,
      {
        headers: getHeaders(token),
      }
    );

    if (!treeRes.ok) {
      return shaMap;
    }

    const treeData = await treeRes.json();
    if (treeData.truncated) {
      (shaMap as any).truncated = true;
    }
    if (Array.isArray(treeData.tree)) {
      for (const item of treeData.tree) {
        if (item.type === 'blob' && item.path && item.sha) {
          shaMap.set(item.path, item.sha);
        }
      }
    }
  } catch (error) {
    console.warn('Error fetching repository git tree (might be empty):', error);
  }
  return shaMap;
}

interface UploadFilePayload {
  token: string;
  owner: string;
  repo: string;
  path: string;
  contentBase64: string;
  commitMessage: string;
  branch: string;
  sha?: string;
}

export async function uploadFile(payload: UploadFilePayload): Promise<void> {
  const { token, owner, repo, path: filePath, contentBase64, commitMessage, branch, sha } = payload;
  
  const body: { message: string; content: string; branch: string; sha?: string } = {
    message: commitMessage,
    content: contentBase64,
    branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    
    // Check if Rate Limit exceeded
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    if (rateLimitRemaining === '0') {
      const resetTime = response.headers.get('x-ratelimit-reset');
      const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000).toLocaleTimeString() : 'nanti';
      throw new Error(`Batas kecepatan GitHub API tercapai. Silakan coba lagi setelah pukul ${resetDate}.`);
    }

    throw new Error(
      errData.message || `Gagal mengunggah berkas: ${filePath}. Status: ${response.status}`
    );
  }
}

export async function getRateLimit(token: string): Promise<GitHubRateLimit> {
  const response = await fetch(`${BASE_URL}/rate_limit`, {
    headers: getHeaders(token),
  });
  if (!response.ok) {
    throw new Error('Gagal mengambil batas rate limit GitHub API.');
  }
  const data = await response.json();
  return {
    limit: data.resources.core.limit,
    remaining: data.resources.core.remaining,
    reset: data.resources.core.reset,
    used: data.resources.core.limit - data.resources.core.remaining,
  };
}

