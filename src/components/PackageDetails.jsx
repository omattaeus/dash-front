import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  RefreshCw, 
  Save, 
  MapPin, 
  Clock,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import apiService from '@/services/apiService';

const PackageDetails = () => {
  const { id } = useParams();
  const [packageData, setPackageData] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPackageData();
  }, [id]);

  const fetchPackageData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📦 Buscando dados do package:', id);
      const response = await apiService.getPackage(id);
      
      if (response && response.package) {
        const pkg = response.package;
        setPackageData(pkg);
        setNotes(pkg.notes || '');
        
        // Log para debug do preço
        console.log('💰 Dados de preço recebidos:', {
          price: pkg.price,
          formattedPrice: pkg.formattedPrice,
          hasPrice: pkg.hasPrice
        });
        
        // Processar eventos de tracking
        if (pkg.trackingEvents && pkg.trackingEvents.length > 0) {
          const processedEvents = pkg.trackingEvents.map((event, index) => ({
            id: event.id || index,
            date: formatDate(event.eventDate),
            location: event.location || 'Local não informado',
            description: event.description || 'Evento de rastreamento',
            status: event.status || 'pending',
            isCompleted: true
          }));
          
          // Adicionar evento futuro se não estiver entregue
          if (pkg.status !== 'delivered') {
            processedEvents.unshift({
              id: 'future',
              date: 'Aguardando...',
              location: 'Destino',
              description: 'Objeto será entregue ao destinatário',
              status: 'pending',
              isCompleted: false
            });
          }
          
          setTrackingHistory(processedEvents);
        } else {
          setTrackingHistory([]);
        }
        
        console.log('✅ Dados do package carregados:', pkg);
      } else {
        setError('Package não encontrado');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar package:', err);
      setError(err.message || 'Erro ao carregar dados do package');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!packageData) return;
    
    try {
      setIsUpdating(true);
      console.log('🔄 Atualizando tracking do package:', packageData.id);
      
      await apiService.updateTracking(packageData.id);
      
      // Recarregar dados após atualização
      await fetchPackageData();
      
      console.log('✅ Tracking atualizado com sucesso');
    } catch (err) {
      console.error('❌ Erro ao atualizar tracking:', err);
      setError(err.message || 'Erro ao atualizar rastreamento');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!packageData) return;
    
    try {
      setIsSaving(true);
      console.log('💾 Salvando notas do package:', packageData.id);
      
      await apiService.updatePackage(packageData.id, { notes });
      
      // Atualizar dados locais
      setPackageData(prev => ({ ...prev, notes }));
      
      console.log('✅ Notas salvas com sucesso');
    } catch (err) {
      console.error('❌ Erro ao salvar notas:', err);
      setError(err.message || 'Erro ao salvar notas');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  // ✅ FUNÇÃO ATUALIZADA PARA USAR DADOS DO BACKEND
  const getPackageValue = () => {
    // 1. Priorizar formattedPrice se disponível (já formatado pelo backend)
    if (packageData.formattedPrice) {
      return packageData.formattedPrice;
    }
    
    // 2. Usar price do banco de dados
    if (packageData.price !== null && packageData.price !== undefined) {
      const numericPrice = parseFloat(packageData.price);
      if (!isNaN(numericPrice) && numericPrice > 0) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(numericPrice);
      }
    }
    
    // 3. Fallback para campos alternativos (compatibilidade)
    const fallbackFields = ['value', 'orderValue', 'amount'];
    for (const field of fallbackFields) {
      if (packageData[field] !== null && packageData[field] !== undefined) {
        const numericValue = parseFloat(packageData[field]);
        if (!isNaN(numericValue) && numericValue > 0) {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(numericValue);
        }
      }
    }
    
    return 'Não informado';
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        label: 'Pendente',
        color: 'bg-gray-100 text-gray-800',
        icon: Clock
      },
      in_transit: {
        label: 'Em Trânsito',
        color: 'bg-blue-100 text-blue-800',
        icon: Truck
      },
      delivered: {
        label: 'Entregue',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      exception: {
        label: 'Exceção',
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle
      },
      expired: {
        label: 'Expirado',
        color: 'bg-gray-100 text-gray-800',
        icon: XCircle
      }
    };
    
    return statusMap[status] || statusMap.pending;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'posted':
        return <Package className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'exception':
        return <AlertCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getLastUpdateText = (lastTrackedAt) => {
    if (!lastTrackedAt) return 'Nunca atualizado';
    
    try {
      const lastUpdate = new Date(lastTrackedAt);
      const now = new Date();
      const diffInMinutes = Math.floor((now - lastUpdate) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Agora mesmo';
      if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h atrás`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d atrás`;
    } catch {
      return 'Data inválida';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dados do package...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPackageData} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Package not found
  if (!packageData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Package className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">Package não encontrado</p>
          <Link to="/packages">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Lista
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(packageData.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/packages">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Encomenda {packageData.trackingNumber}
            </h1>
            <p className="text-gray-600">
              Criada em {formatDate(packageData.createdAt)}
            </p>
          </div>
        </div>
        <Button onClick={handleUpdateTracking} disabled={isUpdating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Package Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Código de Rastreamento</Label>
                <p className="text-lg font-mono font-medium">{packageData.trackingNumber}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Transportadora</Label>
                <p className="text-lg">{packageData.carrierName || packageData.carrierSlug || 'Não informado'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Título</Label>
                <p className="text-lg">{packageData.title || 'Sem título'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Valor da Encomenda</Label>
                <p className="ext-sm font-medium text-gray-600">
                  {getPackageValue()}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Status Atual</Label>
                <div className="mt-1">
                  <Badge className={statusInfo.color}>
                    <statusInfo.icon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Última Atualização</Label>
                <p className="text-lg">{getLastUpdateText(packageData.lastTrackedAt)}</p>
              </div>

              {/* Customer Info */}
              {(packageData.customerName || packageData.customerEmail) && (
                <>
                  <hr className="my-4" />
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Informações do Cliente</Label>
                    {packageData.customerName && (
                      <p className="text-sm text-gray-700">Nome: {packageData.customerName}</p>
                    )}
                    {packageData.customerEmail && (
                      <p className="text-sm text-gray-700">Email: {packageData.customerEmail}</p>
                    )}
                    {packageData.customerCpf && (
                      <p className="text-sm text-gray-700">CPF: {packageData.customerCpf}</p>
                    )}
                  </div>
                </>
              )}

              {/* Order Info */}
              {packageData.orderId && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">ID do Pedido</Label>
                  <p className="text-lg font-mono">{packageData.orderId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
              <CardDescription>
                Adicione observações sobre esta encomenda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Digite suas observações aqui..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <Button onClick={handleSaveNotes} disabled={isSaving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Notas'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tracking History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Rastreamento</CardTitle>
              <CardDescription>
                Acompanhe o progresso da sua encomenda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trackingHistory.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {trackingHistory.map((event, index) => (
                      <div key={event.id} className="relative flex items-start space-x-4">
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${
                          event.isCompleted 
                            ? 'bg-blue-100 border-blue-500 text-blue-600' 
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                        }`}>
                          {getStatusIcon(event.status)}
                        </div>
                        
                        {/* Event content */}
                        <div className="flex-1 min-w-0">
                          <div className={`p-4 rounded-lg border ${
                            event.isCompleted 
                              ? 'bg-white border-gray-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <p className={`font-medium ${
                                event.isCompleted ? 'text-gray-900' : 'text-gray-500'
                              }`}>
                                {event.location}
                              </p>
                              <p className={`text-sm ${
                                event.isCompleted ? 'text-gray-600' : 'text-gray-400'
                              }`}>
                                {event.date}
                              </p>
                            </div>
                            <p className={`text-sm ${
                              event.isCompleted ? 'text-gray-700' : 'text-gray-500'
                            }`}>
                              {event.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Nenhum evento de rastreamento encontrado</p>
                  <Button onClick={handleUpdateTracking} disabled={isUpdating} variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                    Atualizar Rastreamento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;