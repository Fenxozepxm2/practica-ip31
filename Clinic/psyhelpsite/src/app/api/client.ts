// Mock API client with auth token simulation

const API_DELAY = 800; // Simulate network delay

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface ApiError {
  message: string;
  status: number;
}

// Simulate token storage
let authToken: string | null = localStorage.getItem('authToken');

export const apiClient = {
  setAuthToken(token: string) {
    authToken = token;
    localStorage.setItem('authToken', token);
  },

  getAuthToken() {
    return authToken;
  },

  clearAuthToken() {
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  },

  isAuthenticated() {
    return !!authToken;
  },

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, API_DELAY));

    // Add auth header if token exists
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // In a real app, this would be a fetch request
    // For now, we simulate API responses
    return {
      data: null as T,
      status: 200,
    };
  },

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  },

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },
};

export type { ApiResponse, ApiError };
