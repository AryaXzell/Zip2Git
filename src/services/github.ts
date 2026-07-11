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

export interface TreeItem {
  path: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
  sha: string;
}

export async function createBlob(
  token: string,
  owner: string,
  repo: string,
  contentBase64: string
): Promise<string> {
  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/blobs`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      content: contentBase64,
      encoding: 'base64',
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Gagal membuat blob berkas. Status: ${response.status}`);
  }

  const data = await response.json();
  return data.sha;
}

export async function createTree(
  token: string,
  owner: string,
  repo: string,
  treeItems: TreeItem[],
  baseTreeSha?: string
): Promise<string> {
  const body: any = { tree: treeItems };
  if (baseTreeSha) {
    body.base_tree = baseTreeSha;
  }

  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Gagal membuat pohon berkas (tree). Status: ${response.status}`);
  }

  const data = await response.json();
  return data.sha;
}

export async function createCommit(
  token: string,
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parents: string[]
): Promise<string> {
  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      message,
      tree: treeSha,
      parents,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Gagal membuat commit. Status: ${response.status}`);
  }

  const data = await response.json();
  return data.sha;
}

export async function getBranchRef(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<{ commitSha: string; treeSha: string } | null> {
  try {
    const refRes = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
      headers: getHeaders(token),
    });

    if (!refRes.ok) {
      return null;
    }

    const refData = await refRes.json();
    const commitSha = refData.object.sha;

    // Fetch commit to get tree SHA
    const commitRes = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/commits/${commitSha}`, {
      headers: getHeaders(token),
    });

    if (!commitRes.ok) {
      return { commitSha, treeSha: commitSha }; // Fallback
    }

    const commitData = await commitRes.json();
    return {
      commitSha,
      treeSha: commitData.tree.sha,
    };
  } catch (error) {
    console.warn('Error fetching branch reference:', error);
    return null;
  }
}

export async function updateRef(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  commitSha: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({
      sha: commitSha,
      force: true,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Gagal memperbarui referensi branch ${branch}. Status: ${response.status}`);
  }
}

export async function createRef(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  commitSha: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha: commitSha,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Gagal membuat referensi branch ${branch}. Status: ${response.status}`);
  }
}

export async function deleteRepository(
  token: string,
  owner: string,
  repo: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 403 || response.status === 401) {
      throw new Error('Izin tidak cukup atau token tidak valid. Pastikan token Anda memiliki cakupan (scope) "delete_repo" agar dapat menghapus repositori.');
    }
    throw new Error(errData.message || `Gagal menghapus repositori. Status: ${response.status}`);
  }
}

export async function getBranches(
  token: string,
  owner: string,
  repo: string
): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/branches?per_page=100`, {
    headers: getHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`Gagal mengambil daftar branch. Status: ${response.status}`);
  }
  const data = await response.json();
  return data.map((b: any) => b.name);
}

export async function createNewBranch(
  token: string,
  owner: string,
  repo: string,
  newBranch: string,
  sourceBranch: string
): Promise<void> {
  const sourceRef = await getBranchRef(token, owner, repo, sourceBranch);
  if (!sourceRef) {
    throw new Error(`Branch sumber "${sourceBranch}" tidak ditemukan.`);
  }
  await createRef(token, owner, repo, newBranch, sourceRef.commitSha);
}

export async function createPullRequest(
  token: string,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body: string
): Promise<{ html_url: string; number: number }> {
  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      title,
      head,
      base,
      body,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Gagal membuat Pull Request. Status: ${response.status}`);
  }

  return response.json();
}



