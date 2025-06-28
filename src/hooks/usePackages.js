// src/hooks/usePackages.js
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const usePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 usePackages: Buscando pacotes...');
      const result = await apiService.getPackages();
      
      console.log('📥 usePackages: Resultado recebido:', result);
      
      if (result && result.packages) {
        setPackages(result.packages);
        console.log('✅ usePackages: Pacotes definidos:', result.packages.length);
      } else {
        console.log('⚠️ usePackages: Nenhum pacote encontrado ou resultado inválido');
        setPackages([]);
      }
    } catch (err) {
      console.error('❌ usePackages: Erro ao buscar pacotes:', err);
      setError(err.message || 'Erro ao carregar pacotes');
      setPackages([]);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!initialized) {
      fetchPackages();
    }
  }, [fetchPackages, initialized]);

  const createPackage = useCallback(async (packageData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 usePackages: Criando pacote...');
      const result = await apiService.createPackage(packageData);
      
      console.log('✅ usePackages: Pacote criado:', result);
      
      await fetchPackages();
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
      
      await fetchPackages();
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
      
      await fetchPackages();
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
      
      await fetchPackages();
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
      
      await fetchPackages();
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
      
      await fetchPackages();
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
      
      await fetchPackages();
      return result;
    } catch (err) {
      console.error('❌ usePackages: Erro na sincronização completa:', err);
      setError(err.message || 'Erro na sincronização completa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPackages]);

  // ADICIONE ESTE MÉTODO QUE ESTAVA FALTANDO
  const syncCorreiosFromAfterShip = useCallback(async (filtros = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 usePackages: Sincronizando Correios via AfterShip...');
      const result = await apiService.syncCorreiosFromAfterShip(filtros);
      
      console.log('✅ usePackages: Sincronização dos Correios concluída:', result);
      
      await fetchPackages();
      return result;
    } catch (err) {
      console.error('❌ usePackages: Erro na sincronização dos Correios:', err);
      setError(err.message || 'Erro na sincronização dos Correios');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPackages]);

  const refetch = useCallback(() => {
    console.log('🔄 usePackages: Refresh manual solicitado');
    fetchPackages();
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