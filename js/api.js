// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

class ChrisProgramsAPI {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Helper method to make authenticated requests
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(email, username, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password })
    });

    this.token = data.token;
    localStorage.setItem('authToken', this.token);
    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    this.token = data.token;
    localStorage.setItem('authToken', this.token);
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // File methods
  async uploadFiles(files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  }

  async getFiles() {
    return await this.request('/files');
  }

  async downloadFile(fileId) {
    return await this.request(`/files/${fileId}/download`);
  }

  // Chat methods
  async getChatMessages() {
    return await this.request('/chat/messages');
  }

  async sendMessage(message) {
    return await this.request('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // Admin methods
  async getAdminStats() {
    return await this.request('/admin/stats');
  }

  async getUsers() {
    return await this.request('/admin/users');
  }

  async deleteFile(fileId) {
    return await this.request(`/admin/files/${fileId}`, {
      method: 'DELETE'
    });
  }
}

// Global API instance
const api = new ChrisProgramsAPI();