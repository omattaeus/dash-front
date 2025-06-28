import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  Eye, 
  Trash2, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
  Download,
  Truck,
  Loader2,
  CheckCircle
} from 'lucide-react';
import usePackages from '../hooks/usePackages';
import useCouriers from '../hooks/useCouriers';

const PackagesList = () => {
  const { 
    packages, 
    loading, 
    error, 
    refetch, 
    deletePackage, 
    updateTracking, 
    syncAllFromAfterShip,
    syncCorreiosFromAfterShip,
    createPackage
  } = usePackages();
  const { couriers, detectCourier } = useCouriers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingCorreios, setIsSyncingCorreios] = useState(false);

  // Estados do modal unificado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    tracking_number: '',
    carrier_slug: '',
    title: '',
    customer_name: '',
    customer_cpf: '',
    customer_email: '',
    order_id: '',
    notes: '',
  });

  useEffect(() => {
    if (!packages.length && !loading) {
      refetch();
    }
  }, []);

  const statuses = [
    { value: 'pending', label: 'Pendente' },
    { value: 'in_transit', label: 'Em Trânsito' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'exception', label: 'Problema' },
    { value: 'expired', label: 'Expirado' }
  ];

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = 
      (pkg.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    const matchesCarrier = carrierFilter === 'all' || pkg.carrierSlug === carrierFilter;
    
    return matchesSearch && matchesStatus && matchesCarrier;
  });

  // Funções do modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      tracking_number: '',
      carrier_slug: '',
      title: '',
      customer_name: '',
      customer_cpf: '',
      customer_email: '',
      order_id: '',
      notes: '',
    });
    setShowSuccess(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDetectCarrier = async () => {
    if (!formData.tracking_number.trim()) {
      alert('Digite um código de rastreamento primeiro');
      return;
    }

    setIsDetecting(true);
    try {
      const detected = await detectCourier(formData.tracking_number);
      
      if (detected && detected.length > 0) {
        handleInputChange('carrier_slug', detected[0].slug);
        
        // Auto-preencher título se vazio
        if (!formData.title) {
          handleInputChange('title', `Encomenda ${formData.tracking_number}`);
        }
        
        alert(`Transportadora detectada: ${detected[0].name}`);
      } else {
        alert('Não foi possível detectar a transportadora automaticamente');
      }
    } catch (error) {
      console.error('Erro ao detectar transportadora:', error);
      alert('Erro ao detectar transportadora');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    
    if (!formData.tracking_number.trim()) {
      alert('Código de rastreamento é obrigatório');
      return;
    }

    setIsCreating(true);
    try {
      await createPackage(formData);
      setShowSuccess(true);
      
      // Resetar formulário e fechar modal após 2 segundos
      setTimeout(() => {
        closeModal();
        refetch();
      }, 2000);
    } catch (error) {
      console.error('Erro ao criar encomenda:', error);
      alert(error.message || 'Erro ao criar encomenda');
    } finally {
      setIsCreating(false);
    }
  };

  // Funções existentes
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPackages(filteredPackages.map(pkg => pkg.id));
    } else {
      setSelectedPackages([]);
    }
  };

  const handleSelectPackage = (packageId, checked) => {
    if (checked) {
      setSelectedPackages([...selectedPackages, packageId]);
    } else {
      setSelectedPackages(selectedPackages.filter(id => id !== packageId));
    }
  };

  const handleUpdateSelected = async () => {
    setIsUpdating(true);
    try {
      const promises = selectedPackages.map(id => updateTracking(id));
      await Promise.all(promises);
      setSelectedPackages([]);
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar selecionados:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedPackages.length} encomenda(s)?`)) {
      return;
    }

    try {
      const promises = selectedPackages.map(id => deletePackage(id));
      await Promise.all(promises);
      setSelectedPackages([]);
      refetch();
    } catch (error) {
      console.error('Erro ao excluir selecionados:', error);
    }
  };

  const handleSyncAll = async () => {
    if (!confirm('Isso irá importar todos os trackings do AfterShip. Continuar?')) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncAllFromAfterShip();
      alert(`Sincronização geral concluída!\n\nTotal encontrado: ${result.result.total_found}\nCorreios encontrados: ${result.result.correios_found}\nImportados: ${result.result.imported}\nAtualizados: ${result.result.updated}\nErros: ${result.result.errors}`);
    } catch (error) {
      alert('Erro na sincronização: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncCorreios = async () => {
    if (!confirm('Isso irá importar apenas as encomendas dos Correios do AfterShip. Continuar?')) {
      return;
    }

    setIsSyncingCorreios(true);
    try {
      const result = await syncCorreiosFromAfterShip({ dias_recentes: 90 });
      alert(`Sincronização dos Correios concluída!\n\nEncontrados: ${result.result.total_found}\nImportados: ${result.result.imported}\nAtualizados: ${result.result.updated}\nErros: ${result.result.errors}`);
    } catch (error) {
      alert('Erro na sincronização dos Correios: ' + error.message);
    } finally {
      setIsSyncingCorreios(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': 'Pendente',
      'in_transit': 'Em Trânsito',
      'delivered': 'Entregue',
      'exception': 'Problema',
      'expired': 'Expirado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_transit': 'bg-yellow-100 text-yellow-800',
      'delivered': 'bg-green-100 text-green-800',
      'exception': 'bg-red-100 text-red-800',
      'expired': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPackages = filteredPackages.slice(startIndex, startIndex + itemsPerPage);

  const isAnyLoading = loading || isSyncing || isSyncingCorreios;

  // Componente do Modal de Nova Encomenda
  const NewPackageModal = () => (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nova Encomenda
          </DialogTitle>
          <DialogDescription>
            Digite o código de rastreamento para iniciar o acompanhamento automático
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Encomenda Criada!
              </h3>
              <p className="text-gray-600">
                O rastreamento automático foi iniciado.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitForm} className="space-y-4">
            {/* Código de Rastreamento */}
            <div className="space-y-2">
              <Label htmlFor="tracking_number">
                Código de Rastreamento *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="tracking_number"
                  type="text"
                  placeholder="Ex: BR123456789BR"
                  value={formData.tracking_number}
                  onChange={(e) => handleInputChange('tracking_number', e.target.value.toUpperCase())}
                  className="flex-1"
                  required
                  disabled={isCreating}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDetectCarrier}
                  disabled={isDetecting || !formData.tracking_number.trim() || isCreating}
                >
                  {isDetecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Transportadora */}
            <div className="space-y-2">
              <Label htmlFor="carrier">Transportadora</Label>
              <Select 
                value={formData.carrier_slug} 
                onValueChange={(value) => handleInputChange('carrier_slug', value)}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione ou deixe detectar automaticamente" />
                </SelectTrigger>
                <SelectContent>
                  {couriers.map(courier => (
                    <SelectItem key={courier.slug} value={courier.slug}>
                      {courier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título da Encomenda</Label>
              <Input
                id="title"
                type="text"
                placeholder="Ex: Produto comprado na loja X"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                disabled={isCreating}
              />
            </div>

            {/* Informações do Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Nome do Cliente</Label>
                <Input
                  id="customer_name"
                  type="text"
                  placeholder="Nome completo"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_cpf">CPF do Cliente</Label>
                <Input
                  id="customer_cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.customer_cpf}
                  onChange={(e) => handleInputChange('customer_cpf', e.target.value)}
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email do Cliente</Label>
                <Input
                  id="customer_email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.customer_email}
                  onChange={(e) => handleInputChange('customer_email', e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_id">ID do Pedido</Label>
                <Input
                  id="order_id"
                  type="text"
                  placeholder="Ex: PED-12345"
                  value={formData.order_id}
                  onChange={(e) => handleInputChange('order_id', e.target.value)}
                  disabled={isCreating}
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre a encomenda..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                disabled={isCreating}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isCreating}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !formData.tracking_number.trim()}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Criar e Rastrear
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );

  if (loading && packages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando encomendas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encomendas</h1>
          <p className="text-gray-600">
            {filteredPackages.length} de {packages.length} encomenda(s)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={refetch} variant="outline" disabled={isAnyLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button onClick={handleSyncCorreios} variant="outline" disabled={isAnyLoading}>
            <Truck className={`h-4 w-4 mr-2 ${isSyncingCorreios ? 'animate-spin' : ''}`} />
            {isSyncingCorreios ? 'Sincronizando...' : 'Sync Correios'}
          </Button>
          
          <Button onClick={handleSyncAll} variant="outline" disabled={isAnyLoading}>
            <Download className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sync Tudo'}
          </Button>
          
          <Button onClick={openModal} disabled={isAnyLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Encomenda
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código, título, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={isAnyLoading}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isAnyLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={carrierFilter} onValueChange={setCarrierFilter} disabled={isAnyLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por transportadora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as transportadoras</SelectItem>
                {couriers.map(courier => (
                  <SelectItem key={courier.slug} value={courier.slug}>
                    {courier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedPackages.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedPackages.length} encomenda(s) selecionada(s)
              </span>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUpdateSelected}
                  disabled={isUpdating || isAnyLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                  Atualizar Selecionadas
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeleteSelected}
                  disabled={isAnyLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Selecionadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Encomendas</CardTitle>
          <CardDescription>
            {filteredPackages.length} encomenda(s) encontrada(s)
            {carrierFilter === 'correios-brazil' && (
              <span className="ml-2 text-blue-600 font-medium">
                • Filtrado por Correios
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedPackages.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">
                        <Checkbox
                          checked={selectedPackages.length === filteredPackages.length && filteredPackages.length > 0}
                          onCheckedChange={handleSelectAll}
                          disabled={isAnyLoading}
                        />
                      </th>
                      <th className="text-left p-3 font-medium">Código</th>
                      <th className="text-left p-3 font-medium">Transportadora</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Atualizado</th>
                      <th className="text-left p-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPackages.map((pkg) => (
                      <tr key={pkg.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <Checkbox
                            checked={selectedPackages.includes(pkg.id)}
                            onCheckedChange={(checked) => handleSelectPackage(pkg.id, checked)}
                            disabled={isAnyLoading}
                          />
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-gray-900">{pkg.trackingNumber}</p>
                            {pkg.title && (
                              <p className="text-sm text-gray-500">{pkg.title}</p>
                            )}
                            {pkg.customerName && (
                              <p className="text-xs text-gray-400">{pkg.customerName}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">
                          <div className="flex items-center">
                            {pkg.carrierSlug === 'correios-brazil' && (
                              <Truck className="h-4 w-4 mr-1 text-blue-600" />
                            )}
                            {pkg.carrierName || pkg.carrierSlug || 'Não detectada'}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(pkg.status)}>
                            {getStatusLabel(pkg.status)}
                          </Badge>
                        </td>
                        <td className="p-3 text-gray-600">
                          {getTimeAgo(pkg.lastTrackedAt || pkg.updatedAt)}
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Link to={`/packages/${pkg.id}`}>
                              <Button variant="ghost" size="sm" title="Ver detalhes" disabled={isAnyLoading}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Atualizar tracking"
                              onClick={() => updateTracking(pkg.id)}
                              disabled={isAnyLoading}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Excluir"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir esta encomenda?')) {
                                  deletePackage(pkg.id);
                                }
                              }}
                              disabled={isAnyLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredPackages.length)} de {filteredPackages.length} resultados
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1 || isAnyLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          disabled={isAnyLoading}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages || isAnyLoading}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma encomenda encontrada
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' || carrierFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando sua primeira encomenda ou sincronize com o AfterShip'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && carrierFilter === 'all' && (
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={openModal} disabled={isAnyLoading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Encomenda
                  </Button>

                  <Button onClick={handleSyncCorreios} variant="outline" disabled={isSyncingCorreios}>
                    <Truck className={`h-4 w-4 mr-2 ${isSyncingCorreios ? 'animate-spin' : ''}`} />
                    {isSyncingCorreios ? 'Sincronizando...' : 'Sincronizar Correios'}
                  </Button>
                  <Button onClick={handleSyncAll} variant="outline" disabled={isSyncing}>
                    <Download className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Tudo'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <NewPackageModal />
    </div>
  );
};

export default PackagesList;