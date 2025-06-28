// services/apiService.js
import { toast } from 'sonner'; // ou sua biblioteca de toast preferida

// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Constantes para códigos de status HTTP
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Constantes para chaves do localStorage
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  /**
   * Processa a fila de requisições falhadas após refresh do token
   */
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Obtém o token do localStorage
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Remove dados de autenticação e redireciona para login
   */
  handleAuthError() {
    console.log('🔒 ApiService: Erro de autenticação, limpando dados');
    this.clearAuthData();
    
    // Evitar redirecionamento se já estiver na página de login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * Limpa dados de autenticação do localStorage
   */
  clearAuthData() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  /**
   * Salva dados de autenticação no localStorage
   */
  saveAuthData(token, user) {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      console.log('✅ ApiService: Dados de autenticação salvos');
      return true;
    } catch (error) {
      console.error('❌ ApiService: Erro ao salvar dados de autenticação:', error);
      return false;
    }
  }

  /**
   * Método principal para fazer requisições HTTP
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token && !endpoint.includes('/auth/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      console.log('🔄 ApiService: Fazendo requisição para:', url);
      
      const response = await fetch(url, config);
      
      console.log('📥 ApiService: Status da resposta:', response.status);
      
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        this.handleAuthError();
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'Erro interno do servidor' };
        }
        
        const errorMessage = errorData.error || errorData.message || `Erro HTTP: ${response.status}`;
        
        console.error('❌ ApiService: Erro na resposta:', {
          status: response.status,
          message: errorMessage,
        });
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('📊 ApiService: Dados recebidos com sucesso');
      
      return data;
    } catch (error) {
      console.error('❌ ApiService: Erro na requisição:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS DE AUTENTICAÇÃO ====================

  /**
   * Realiza login do usuário
   */
  async login(email, password) {
    try {
      console.log('🔐 ApiService: Tentando fazer login');
      
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }
      
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (!response?.user || !response?.token) {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Salvar dados de autenticação
      const saved = this.saveAuthData(response.token, response.user);
      if (!saved) {
        throw new Error('Erro ao salvar dados de autenticação');
      }
      
      console.log('✅ ApiService: Login realizado com sucesso');
      return response;
    } catch (error) {
      console.error('❌ ApiService: Erro no login:', error);
      throw error;
    }
  }

  /**
   * Registra novo usuário
   */
  async register(name, email, password) {
    try {
      console.log('📝 ApiService: Tentando registrar usuário');
      
      if (!name || !email || !password) {
        throw new Error('Nome, email e senha são obrigatórios');
      }
      
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      
      if (!response?.user || !response?.token) {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Salvar dados de autenticação
      const saved = this.saveAuthData(response.token, response.user);
      if (!saved) {
        throw new Error('Erro ao salvar dados de autenticação');
      }
      
      console.log('✅ ApiService: Registro realizado com sucesso');
      return response;
    } catch (error) {
      console.error('❌ ApiService: Erro no registro:', error);
      throw error;
    }
  }

  /**
   * Realiza logout do usuário
   */
  logout() {
    console.log('🚪 ApiService: Realizando logout');
    this.clearAuthData();
    console.log('✅ ApiService: Logout realizado');
  }

  /**
   * Obtém o usuário atual do localStorage
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      const token = this.getToken();
      
      if (!userStr || !token) {
        return null;
      }
      
      const user = JSON.parse(userStr);
      console.log('👤 ApiService: Usuário atual obtido');
      return user;
    } catch (error) {
      console.error('❌ ApiService: Erro ao obter usuário atual:', error);
      this.clearAuthData();
      return null;
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated() {
    const token = this.getToken();
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return !!(token && user);
  }

  // ==================== MÉTODOS PARA ENCOMENDAS ====================

  /**
   * Obtém lista de encomendas
   */
  async getPackages(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/packages?${queryString}` : '/packages';
      
      console.log('📦 ApiService: Buscando encomendas');
      return await this.request(endpoint);
    } catch (error) {
      console.error('❌ ApiService: Erro ao buscar encomendas:', error);
      throw error;
    }
  }

  /**
   * Obtém uma encomenda específica
   */
  async getPackage(id) {
    try {
      if (!id) {
        throw new Error('ID da encomenda é obrigatório');
      }
      
      console.log('📦 ApiService: Buscando encomenda:', id);
      return await this.request(`/packages/${id}`);
    } catch (error) {
      console.error('❌ ApiService: Erro ao buscar encomenda:', error);
      throw error;
    }
  }

  /**
   * Cria nova encomenda
   */
  async createPackage(packageData) {
    try {
      console.log('📦 ApiService: Criando encomenda:', packageData);
      
      // Enviar dados EXATAMENTE como recebidos (sem transformação)
      return await this.request('/packages', {
        method: 'POST',
        body: JSON.stringify(packageData),
      });
    } catch (error) {
      console.error('❌ ApiService: Erro ao criar encomenda:', error);
      throw error;
    }
  }

  /**
   * Atualiza encomenda existente
   */
  async updatePackage(id, packageData) {
    try {
      if (!id) {
        throw new Error('ID da encomenda é obrigatório');
      }
      
      if (!packageData) {
        throw new Error('Dados da encomenda são obrigatórios');
      }
      
      console.log('📦 ApiService: Atualizando encomenda:', id);
      return await this.request(`/packages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(packageData),
      });
    } catch (error) {
      console.error('❌ ApiService: Erro ao atualizar encomenda:', error);
      throw error;
    }
  }

  /**
   * Remove encomenda
   */
  async deletePackage(id) {
    try {
      if (!id) {
        throw new Error('ID da encomenda é obrigatório');
      }
      
      console.log('📦 ApiService: Removendo encomenda:', id);
      return await this.request(`/packages/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('❌ ApiService: Erro ao remover encomenda:', error);
      throw error;
    }
  }

  /**
   * Atualiza rastreamento de uma encomenda
   */
  async updateTracking(id) {
    try {
      if (!id) {
        throw new Error('ID da encomenda é obrigatório');
      }
      
      console.log('📦 ApiService: Atualizando rastreamento:', id);
      return await this.request(`/packages/${id}/track`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('❌ ApiService: Erro ao atualizar rastreamento:', error);
      throw error;
    }
  }

  /**
   * Obtém URL de rastreamento
   */
  async getTrackingUrl(id) {
    try {
      if (!id) {
        throw new Error('ID da encomenda é obrigatório');
      }
      
      console.log('📦 ApiService: Obtendo URL de rastreamento:', id);
      return await this.request(`/packages/${id}/tracking-url`);
    } catch (error) {
      console.error('❌ ApiService: Erro ao obter URL de rastreamento:', error);
      throw error;
    }
  }

  /**
   * Importa encomendas de arquivo
   */
  async importPackages(file) {
    try {
      if (!file) {
        throw new Error('Arquivo é obrigatório');
      }
      
      const formData = new FormData();
      formData.append('file', file);

      console.log('📦 ApiService: Importando encomendas');
      return await this.request('/packages/import', {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('❌ ApiService: Erro ao importar encomendas:', error);
      throw error;
    }
  }

  /**
   * Sincroniza com AfterShip
   */
  async syncWithAfterShip() {
    try {
      console.log('📦 ApiService: Sincronizando com AfterShip');
      return await this.request('/packages/sync-aftership', {
        method: 'POST',
      });
    } catch (error) {
      console.error('❌ ApiService: Erro ao sincronizar com AfterShip:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas das encomendas
   */
  async getStats() {
    try {
      console.log('📊 ApiService: Obtendo estatísticas');
      return await this.request('/packages/stats');
    } catch (error) {
      console.error('❌ ApiService: Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS PARA TRANSPORTADORAS ====================

  /**
   * Obtém lista de transportadoras
   */
  async getCouriers() {
    try {
      console.log('🚚 ApiService: Buscando transportadoras');
      return await this.request('/couriers');
    } catch (error) {
      console.error('❌ ApiService: Erro ao buscar transportadoras:', error);
      throw error;
    }
  }

  /**
   * Detecta transportadora pelo código de rastreamento
   */
  async detectCourier(trackingNumber) {
    try {
      if (!trackingNumber) {
        throw new Error('Código de rastreamento é obrigatório');
      }
      
      console.log('🚚 ApiService: Detectando transportadora');
      return await this.request('/couriers/detect', {
        method: 'POST',
        body: JSON.stringify({ tracking_number: trackingNumber }),
      });
    } catch (error) {
      console.error('❌ ApiService: Erro ao detectar transportadora:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS UTILITÁRIOS ====================

  /**
   * Verifica saúde da API
   */
  async healthCheck() {
    try {
      console.log('🏥 ApiService: Verificando saúde da API');
      return await this.request('/health');
    } catch (error) {
      console.error('❌ ApiService: Erro no health check:', error);
      throw error;
    }
  }

    async syncAllFromAfterShip() {
    try {
            console.log('📦 ApiService: Sincronizando todos os dados do AfterShip');
            return await this.request('/packages/sync-all-aftership', {
            method: 'POST',
            });
        } catch (error) {
            console.error('❌ ApiService: Erro na sincronização completa:', error);
            throw error;
        }
    }

    async syncCorreiosFromAfterShip(filtros = {}) {
        try {
            console.log('📦 ApiService: Sincronizando Correios via AfterShip');
            return await this.request('/packages/sync-correios-aftership', {
            method: 'POST',
            body: JSON.stringify(filtros),
            });
        } catch (error) {
            console.error('❌ ApiService: Erro na sincronização dos Correios:', error);
            throw error;
        }
    }
}

const apiService = new ApiService();

export default apiService;

export { ApiService, HTTP_STATUS, STORAGE_KEYS };