// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Obter token do localStorage
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Se o token expirou, redirecionar para login
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Métodos de autenticação
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.user && response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async register(name, email, password) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    
    if (response.user && response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Métodos para encomendas
  async getPackages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/packages?${queryString}` : '/packages';
    return this.request(endpoint);
  }

  async getPackage(id) {
    return this.request(`/packages/${id}`);
  }

  async createPackage(packageData) {
    return this.request('/packages', {
      method: 'POST',
      body: JSON.stringify(packageData),
    });
  }

  async updatePackage(id, packageData) {
    return this.request(`/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(packageData),
    });
  }

  async deletePackage(id) {
    return this.request(`/packages/${id}`, {
      method: 'DELETE',
    });
  }

  async updateTracking(id) {
    return this.request(`/packages/${id}/track`, {
      method: 'POST',
    });
  }

  async getTrackingUrl(id) {
    return this.request(`/packages/${id}/tracking-url`);
  }

  async importPackages(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/packages/import', {
      method: 'POST',
      headers: {}, // Remove Content-Type para FormData
      body: formData,
    });
  }

  async syncWithAfterShip() {
    return this.request('/packages/sync-aftership', {
      method: 'POST',
    });
  }

  async getStats() {
    return this.request('/packages/stats');
  }

  // Métodos para transportadoras
  async getCouriers() {
    return this.request('/couriers');
  }

  async detectCourier(trackingNumber) {
    return this.request('/couriers/detect', {
      method: 'POST',
      body: JSON.stringify({ tracking_number: trackingNumber }),
    });
  }

  async healthCheck() {
    return this.request('/health');
  }
}

const apiService = new ApiService();

export default apiService;