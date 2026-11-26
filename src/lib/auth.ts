export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
}

export interface AuthApiResponse {
  user?: AuthUser | null;
  error?: string;
}

/** Sends an auth API request and parses JSON safely with friendly error messages. */
export async function requestAuth(
  path: string,
  options?: RequestInit,
): Promise<AuthApiResponse> {
  const response = await fetch(`/api/auth/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const rawText = response.status === 204 ? '' : await response.text();
  let result: AuthApiResponse = {};
  if (rawText) {
    try {
      result = JSON.parse(rawText) as AuthApiResponse;
    } catch {
      throw new Error(
        'Respons server tidak valid. Pastikan server API (port 3001) dan MySQL sedang berjalan.',
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      result.error ||
        (response.status >= 500
          ? 'Server API tidak merespons. Pastikan server API dan MySQL berjalan.'
          : 'Permintaan autentikasi gagal.'),
    );
  }
  return result;
}
