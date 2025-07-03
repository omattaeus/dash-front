// src/hooks/usePackages.js
import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService';

const usePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  
  // ✅ CONTROLE DE REQUISIÇÕES
  const isRequestingRef = useRef(false);
  const lastRequestTimeRef = useRef(0);
  const MIN_REQUEST_INTERVAL = 2000; // 2 segundos entre requisições

  const fetchPackages = useCallback(async (force = false) => {
    // ✅ PREVENIR MÚLTIPLAS REQUISIÇÕES SIMULTÂNEAS
    if (isRequestingRef.current && !force) {
      console.log('📦 usePackages: Requisição já em andamento, ignorando...');
      return;
    }

    // ✅ THROTTLING - MÍNIMO 2 SEGUNDOS ENTRE REQUISIÇÕES
    const now = Date.now();
    if (now - lastRequestTimeRef.current < MIN_REQUEST_INTERVAL && !force) {
      console.log('📦 usePackages: Throttling ativo, aguardando...');
      return;
    }

    try {
      isRequestingRef.current = true;
      lastRequestTimeRef.current = now;
      setLoading(true);
      setError(null);
      
      console.log('📦 usePackages: Buscando pacotes...');
      const result = await apiService.getPackages();
      
      console.log('📥 usePackages: Resultado recebido:', result);
      
      // ✅ TRATAR DIFERENTES FORMATOS DE RESPOSTA
      let packagesData = [];
      
      if (result) {
        if (result.packages && Array.isArray(result.packages)) {
          packagesData = result.packages;
        } else if (result.data && Array.isArray(result.data)) {
          packagesData = result.data;
        } else if (Array.isArray(result)) {
          packagesData = result;
        } else if (result.success && result.data && Array.isArray(result.data)) {
          packagesData = result.data;
        }
      }
      
      setPackages(packagesData);
      console.log('✅ usePackages: Pacotes definidos:', packagesData.length);
      
    } catch (err) {
      console.error('❌ usePackages: Erro ao buscar pacotes:', err);
      
      // ✅ NÃO FAZER RETRY AUTOMÁTICO EM CASO DE 429
      if (err.message.includes('429') || err.message.includes('Muitas requisições')) {
        setError('Muitas requisições. Aguarde alguns segundos antes de tentar novamente.');
        // ✅ AGUARDAR 30 SEGUNDOS ANTES DE PERMITIR NOVA REQUISIÇÃO
        setTimeout(() => {
          setError(null);
        }, 30000);
      } else {
        setError(err.message || 'Erro ao carregar pacotes');
      }
      
      setPackages([]);
    } finally {
      setLoading(false);
      setInitialized(true);
      isRequestingRef.current = false;
    }
  }, []);

  // ✅ CARREGAR APENAS UMA VEZ
  useEffect(() => {
    if (!initialized) {
      console.log('📦 usePackages: Carregamento inicial');
      fetchPackages(true);
    }
  }, [fetchPackages, initialized]);

  const createPackage = useCallback(async (packageData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 usePackages: Criando pacote...');
      const result = await apiService.createPackage(packageData);
      
      console.log('✅ usePackages: Pacote criado:', result);
      
      // ✅ AGUARDAR 1 SEGUNDO ANTES DE RECARREGAR
      setTimeout(() => {
        fetchPackages(true);
      }, 1000);
      
      return result;
    } catch (err) {
      console.error('❌ usePackages: Erro ao criar pacote:', err);
      setError(err.message || 'Erro ao criar pacote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPackages]);

  const updatePackage = useCallback(async (id, packageData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 usePackages: Atualizando pacote:', id);
      const result = await apiService.updatePackage(id, packageData);
      
      console.log('✅ usePackages: Pacote atualizado:', result);
      
      setTimeout(() => {
        fetchPackages(true);
      }, 1000);
      
      return result;
    } catch (err) {
      console.error('❌ usePackages: Erro ao atualizar pacote:', err);
      setError(err.message || 'Erro ao atualizar pacote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPackages]);

  const deletePackage = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 usePackages: Excluindo pacote:', id);
      const result = await apiService.deletePackage(id);
      
      console.log('✅ usePackages: Pacote excluído:', result);
      
      setTimeout(() => {
        fetchPackages(true);
      }, 1000);
      
      return result;
    } catch (err) {
      console.error('❌ usePackages: Erro ao excluir pacote:', err);
      setError(err.message || 'Erro ao excluir pacote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPackages]);

  const updateTracking = useCallback(async (id) => {
    try {
      console.log('📦 usePackages: Atualizando tracking:', id);
      const result = await apiService.updateTracking(id);
      
      console.log('✅ usePackages: Tracking atualizado:', result);
      
      setTimeout(() => {
        fetchPackages(true);
      }, 1000);
      
      return result;
    } catch (err) {
      console.error('❌ usePackages: Erro ao atualizar tracking:', err);
      throw err;
    }
  }, [fetchPackages]);

  const importPackages = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 usePackages: Importando pacotes...');
      const result = await apiService.importPackages(file);
      
      console.log('✅ usePackages: Pacotes importados:', result);
      
      setTimeout(() => {
        fetchPackages(true);
      }, 2000);
      
      return result;
    } catch (err) {
      console.error('❌ usePackages: Erro ao importar pacotes:', err);
      setError(err.message || 'Erro ao importar pacotes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPackages]);

  const syncWithAfterShip = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 usePackages: Sincronizando com AfterShip...');
      const result = await apiService.syncWithAfterShip();
      
      console.log('✅ usePackages: Sincronização concluída:', result);
      
      setTimeout(() => {
        fetchPackages(true);
      }, 2000);
      
      return result;
    } catch (err) {
      console.error('❌ usePackages: Erro na sincronização:', err);
      setError(err.message || 'Erro na sincronização');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPackages]);

  const syncAllFromAfterShip = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 usePackages: Iniciando sincronização completa...');
      const result = await apiService.syncAllFromAfterShip();
      
      console.log('✅ usePackages: Sincronização completa concluída:', result);
      
      setTimeout(() => {
        fetchPackages(true);
      }, 3000);
      
      return result;
    } catch (err) {
      console.error('❌ usePackages: Erro na sincronização completa:', err);
      setError(err.message || 'Erro na sincronização completa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPackages]);

  const syncCorreiosFromAfterShip = useCallback(async (filtros = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 usePackages: Sincronizando Correios via AfterShip...');
      const result = await apiService.syncCorreiosFromAfterShip(filtros);
      
      console.log('✅ usePackages: Sincronização dos Correios concluída:', result);
      
      setTimeout(() => {
        fetchPackages(true);
      }, 2000);
      
      return result;
    } catch (err) {
      console.error('❌ usePackages: Erro na sincronização dos Correios:', err);
      setError(err.message || 'Erro na sincronização dos Correios');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPackages]);

  // ✅ REFETCH MANUAL COM THROTTLING
  const refetch = useCallback(() => {
    console.log('🔄 usePackages: Refresh manual solicitado');
    fetchPackages(true);
  }, [fetchPackages]);

  return {
    packages,
    loading,
    error,
    initialized,
    fetchPackages: refetch,
    createPackage,
    updatePackage,
    deletePackage,
    updateTracking,
    importPackages,
    syncWithAfterShip,
    syncAllFromAfterShip,
    syncCorreiosFromAfterShip,
    refetch
  };
};

export default usePackages;