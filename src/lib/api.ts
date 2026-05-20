const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 204 No Content (e.g. DELETE)
    if (response.status === 204) {
      return { data: undefined as unknown as T };
    }

    // Handle successful responses with empty body
    const text = await response.text();
    const data = text ? JSON.parse(text) : undefined;

    if (!response.ok) {
      return { error: data?.message || 'Something went wrong' };
    }

    return { data: data as T };
  } catch (error) {
    return { error: 'Network error. Please check your connection.' };
  }
}

export const api = {
  // Auth endpoints
  auth: {
    signup: async (data: { email: string; password: string; name: string; workspaceName?: string }) => {
      return fetchApi<{ user: any; token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    login: async (data: { email: string; password: string }) => {
      return fetchApi<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    logout: async () => {
      return fetchApi<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    },

    me: async () => {
      return fetchApi<any>('/auth/me');
    },

    forgotPassword: async (email: string) => {
      return fetchApi<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    verifyOtp: async (email: string, otp: string) => {
      return fetchApi<{ resetToken: string }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
    },

    resetPassword: async (token: string, password: string) => {
      return fetchApi<{ message: string }>('/auth/reset-password', {
        method: 'PATCH',
        body: JSON.stringify({ token, password }),
      });
    },
  },

  // User endpoints
  users: {
    getProfile: async () => {
      return fetchApi<any>('/users/profile');
    },

    updateProfile: async (data: { name?: string }) => {
      return fetchApi<any>('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // Workspace endpoints
  workspaces: {
    get: async () => {
      return fetchApi<any>('/workspaces');
    },

    getMembers: async () => {
      return fetchApi<any[]>('/workspaces/members');
    },
  },

  // Workflow endpoints
  workflows: {
    getAll: async (workspaceId: string) => {
      return fetchApi<any[]>(`/workspaces/${workspaceId}/workflows`);
    },

    getById: async (workspaceId: string, workflowId: string) => {
      return fetchApi<any>(`/workspaces/${workspaceId}/workflows/${workflowId}`);
    },

    create: async (workspaceId: string, data: { name: string; description?: string; nodes: string; edges: string; isPublic?: boolean }) => {
      return fetchApi<any>(`/workspaces/${workspaceId}/workflows`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (workspaceId: string, workflowId: string, data: { name?: string; description?: string; nodes?: string; edges?: string; isPublic?: boolean }) => {
      return fetchApi<any>(`/workspaces/${workspaceId}/workflows/${workflowId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (workspaceId: string, workflowId: string) => {
      return fetchApi<void>(`/workspaces/${workspaceId}/workflows/${workflowId}`, {
        method: 'DELETE',
      });
    },

    duplicate: async (workspaceId: string, workflowId: string) => {
      return fetchApi<any>(`/workspaces/${workspaceId}/workflows/${workflowId}/duplicate`, {
        method: 'POST',
      });
    },
  },
};

// Helper to save token
export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

// Helper to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}