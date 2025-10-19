import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_BASE_URL } from './config';

class ServerApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async getAuthToken(): Promise<string> {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) {
      redirect('/');
    }
    
    return token;
  }

  async get<T = unknown>(endpoint: string): Promise<T> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Importante para datos dinámicos en SSR
    });

    if (response.status === 401) {
      redirect('/');
    }
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async post<T = unknown>(endpoint: string, data: unknown): Promise<T> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      redirect('/');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async put<T = unknown>(endpoint: string, data: unknown): Promise<T> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      redirect('/');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async patch<T = unknown>(endpoint: string, data: unknown): Promise<T> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      redirect('/');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async delete<T = unknown>(endpoint: string): Promise<T> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      redirect('/');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }
}

export const serverApi = new ServerApiClient();