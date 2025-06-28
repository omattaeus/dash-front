import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthProvider: Verificando usuário logado...');
    
    try {
      const savedUser = apiService.getCurrentUser();
      const token = localStorage.getItem('token');
      
      console.log('🔍 AuthProvider: Token no localStorage:', token ? 'Existe' : 'Não existe');
      console.log('🔍 AuthProvider: Usuário no localStorage:', savedUser);
      
      if (savedUser && token) {
        console.log('✅ Usuário encontrado no localStorage:', savedUser);
        setUser(savedUser);
      } else {
        console.log('ℹ️ Nenhum usuário válido encontrado no localStorage');
        // Limpar dados inconsistentes
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar usuário:', error);
      // Limpar dados corrompidos
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 AuthContext: Iniciando login...');
      
      const response = await apiService.login(email, password);
      
      console.log('📥 AuthContext: Resposta completa recebida:', response);
      
      if (response && response.user && response.token) {
        console.log('✅ AuthContext: Dados válidos recebidos');
        console.log('👤 AuthContext: Usuário:', response.user);
        console.log('🎫 AuthContext: Token:', response.token ? 'Recebido' : 'Não recebido');
        
        // Definir o usuário no estado IMEDIATAMENTE
        setUser(response.user);
        
        console.log('✅ AuthContext: Usuário definido no estado');
        
        // Verificar se foi salvo corretamente
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        
        console.log('💾 AuthContext: Verificação localStorage:');
        console.log('  - Token salvo:', savedToken ? 'Sim' : 'Não');
        console.log('  - Usuário salvo:', savedUser ? 'Sim' : 'Não');
        
        return { success: true };
      } else {
        console.error('❌ AuthContext: Resposta inválida:', {
          hasResponse: !!response,
          hasUser: !!(response && response.user),
          hasToken: !!(response && response.token),
          response
        });
        return {
          success: false,
          error: 'Resposta inválida do servidor'
        };
      }
    } catch (error) {
      console.error('❌ AuthContext: Erro no login:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log('📝 AuthContext: Iniciando registro...');
      
      const response = await apiService.register(name, email, password);
      
      console.log('📥 AuthContext: Resposta do registro:', response);
      
      if (response && response.user && response.token) {
        setUser(response.user);
        console.log('✅ AuthContext: Usuário registrado e definido:', response.user);
        return { success: true };
      } else {
        console.error('❌ AuthContext: Resposta não contém usuário:', response);
        return {
          success: false,
          error: 'Resposta inválida do servidor'
        };
      }
    } catch (error) {
      console.error('❌ AuthContext: Erro no registro:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  };

  const logout = () => {
    console.log('🚪 AuthContext: Fazendo logout...');
    apiService.logout();
    setUser(null);
    console.log('✅ AuthContext: Logout concluído');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  console.log('🔍 AuthContext: Estado atual completo:', {
    user: user ? { 
      id: user.id, 
      name: user.name, 
      email: user.email,
      role: user.role 
    } : null,
    loading,
    isAuthenticated: !!user,
    hasToken: !!localStorage.getItem('token'),
    hasUserInStorage: !!localStorage.getItem('user')
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};