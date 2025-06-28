// src/hooks/useCouriers.js
import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const useCouriers = () => {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCouriers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚚 useCouriers: Buscando transportadoras...');
      const result = await apiService.getCouriers();
      
      console.log('📥 useCouriers: Resultado recebido:', result);
      
      if (result && result.couriers) {
        setCouriers(result.couriers);
        console.log('✅ useCouriers: Transportadoras definidas:', result.couriers.length);
      } else if (result && Array.isArray(result)) {
        // Caso a API retorne diretamente um array
        setCouriers(result);
        console.log('✅ useCouriers: Transportadoras definidas:', result.length);
      } else {
        console.log('⚠️ useCouriers: Nenhuma transportadora encontrada');
        setCouriers([]);
      }
    } catch (err) {
      console.error('❌ useCouriers: Erro ao buscar transportadoras:', err);
      setError(err.message || 'Erro ao carregar transportadoras');
      setCouriers([]);
    } finally {
      setLoading(false);
    }
  };

  const detectCourier = async (trackingNumber) => {
    try {
      console.log('🔍 useCouriers: Detectando transportadora para:', trackingNumber);
      const result = await apiService.detectCourier(trackingNumber);
      
      console.log('✅ useCouriers: Resultado da detecção:', result);
      
      // Normalizar o resultado para sempre retornar um array
      let detectedCouriers = [];
      
      if (result && Array.isArray(result)) {
        detectedCouriers = result;
      } else if (result && result.couriers && Array.isArray(result.couriers)) {
        detectedCouriers = result.couriers;
      } else if (result && (result.slug || result.name)) {
        // Se retornou um objeto único, transformar em array
        detectedCouriers = [result];
      }
      
      // Garantir que cada item tenha pelo menos slug ou name
      const validCouriers = detectedCouriers.filter(courier => 
        courier && (courier.slug || courier.name)
      );
      
      console.log('📋 useCouriers: Transportadoras válidas detectadas:', validCouriers);
      return validCouriers;
      
    } catch (err) {
      console.error('❌ useCouriers: Erro ao detectar transportadora:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  return {
    couriers,
    loading,
    error,
    fetchCouriers,
    detectCourier,
    refetch: fetchCouriers
  };
};

export default useCouriers;