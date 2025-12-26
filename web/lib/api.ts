import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'root' | 'user';
  mailbox_name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text_body?: string;
  html_body?: string;
  raw_content?: string;
  headers?: string;
  status: 'success' | 'failed' | 'temporary' | 'permanent';
  failure_reason?: string;
  received_at: string;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user_id: string;
  username: string;
  role: string;
}

export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
      username,
      password,
    });
    return response.data.data;
  },
};

export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User[]>>('/mailboxes');
    // Get first mailbox (user's own)
    const mailboxes = response.data.data;
    return mailboxes[0];
  },
  listUsers: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/admin/users');
    return response.data.data;
  },
};

export const messageApi = {
  list: async (params?: {
    limit?: number;
    offset?: number;
    to?: string;
    from?: string;
    subject?: string;
    status?: string;
  }): Promise<{ messages: Message[]; total: number; limit: number; offset: number }> => {
    const response = await api.get<ApiResponse<{ messages: Message[]; total: number; limit: number; offset: number }>>(
      '/messages',
      { params }
    );
    return response.data.data;
  },
  get: async (id: string): Promise<Message> => {
    const response = await api.get<ApiResponse<Message>>(`/messages/${id}`);
    return response.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/messages/${id}`);
  },
  bulkDelete: async (ids: string[]): Promise<void> => {
    await api.delete('/messages', { data: { ids } });
  },
  getAttachmentUrl: (messageId: string, attachmentId: string): string => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return `${apiUrl}/api/messages/${messageId}/attachments/${attachmentId}`;
  },
};

export const configApi = {
  get: async (): Promise<{
    smtp_port: number;
    api_port: number;
    version: string;
    max_attachment_size: number;
    simulation_mode: string;
    database_type: string;
    environment: string;
  }> => {
    const response = await api.get<ApiResponse<any>>('/admin/config');
    return response.data.data;
  },
};

export default api;

