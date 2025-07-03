import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Search,
  DollarSign
} from 'lucide-react';
import usePackages from '../hooks/usePackages';
import useCouriers from '../hooks/useCouriers';
import { useNavigate } from 'react-router-dom';

const AddPackage = () => {
  const navigate = useNavigate();
  const { createPackage, importPackages, loading } = usePackages();
  const { couriers, detectCourier } = useCouriers();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState({
    tracking_number: '',
    carrier_slug: '',
    title: '',
    customer_name: '',
    customer_phone: '',
    customer_cpf: '',
    customer_email: '',
    order_id: '',
    notes: '',
    previous_tracking_number: '',
    value: '' // ✅ NOVO CAMPO DE VALOR
  });
  const [detectedCouriers, setDetectedCouriers] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ FUNÇÃO PARA FORMATAÇÃO DE MOEDA BRASILEIRA
  const formatCurrency = useCallback((value) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '');
    
    // Se não há valor, retorna vazio
    if (!numericValue) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const number = parseInt(numericValue) / 100;
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(number);
  }, []);

  // ✅ FUNÇÃO PARA CONVERTER MOEDA FORMATADA PARA NÚMERO
  const parseCurrency = useCallback((formattedValue) => {
    if (!formattedValue) return 0;
    
    // Remove R$, espaços, pontos de milhares e substitui vírgula por ponto
    const numericString = formattedValue
      .replace(/R\$\s?/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    return parseFloat(numericString) || 0;
  }, []);

  const handleInputChange = (field, value) => {
    if (field === 'value') {
      // ✅ FORMATAÇÃO AUTOMÁTICA DO VALOR
      const formattedValue = formatCurrency(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Auto-detectar transportadora quando o número de rastreamento mudar
    if (field === 'tracking_number' && value.length > 5) {
      handleDetectCourier(value);
    }
  };

  const handleDetectCourier = async (trackingNumber) => {
    setIsDetecting(true);
    try {
      const detected = await detectCourier(trackingNumber);
      setDetectedCouriers(detected);
      
      // Se encontrou apenas uma transportadora, selecionar automaticamente
      if (detected.length === 1) {
        setFormData(prev => ({
          ...prev,
          carrier_slug: detected[0].slug
        }));
      }
    } catch (err) {
      console.error('Erro ao detectar transportadora:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.tracking_number.trim()) {
      setError('Número de rastreamento é obrigatório');
      return;
    }

    try {
      // ✅ CONVERTER VALOR FORMATADO PARA NÚMERO ANTES DE ENVIAR
      const dataToSend = {
        ...formData,
        value: formData.value ? parseCurrency(formData.value) : null
      };
      
      await createPackage(dataToSend);
      setSuccess('Encomenda adicionada com sucesso!');
      
      // Limpar formulário
      setFormData({
        tracking_number: '',
        carrier_slug: '',
        title: '',
        customer_name: '',
        customer_phone: '',
        customer_cpf: '',
        customer_email: '',
        order_id: '',
        notes: '',
        previous_tracking_number: '',
        value: '' // ✅ RESETAR VALOR
      });
      setDetectedCouriers([]);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/packages');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Erro ao adicionar encomenda');
    }
  };

  // ✅ ATUALIZAR PARA ACEITAR TODOS OS FORMATOS DE EXCEL
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificar se é um formato suportado
      const supportedTypes = [
        'text/csv',
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12' // .xlsb
      ];
      
      const supportedExtensions = ['.csv', '.xls', '.xlsx', '.xlsm', '.xlsb'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!supportedTypes.includes(file.type) && !supportedExtensions.includes(fileExtension)) {
                setError('Formato de arquivo não suportado. Use CSV, XLS, XLSX, XLSM ou XLSB.');
        return;
      }

      setSelectedFile(file);
      previewFile(file);
    }
  };

  // ✅ FUNÇÃO ATUALIZADA PARA PREVIEW DE EXCEL E CSV
  const previewFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (fileExtension === '.csv') {
          // Processar CSV
          const text = data;
          const lines = text.split('\n').slice(0, 6); // Primeiras 5 linhas + header
          const preview = lines.map(line => line.split(','));
          setFilePreview(preview);
        } else {
          // Processar Excel (será processado no backend)
          setFilePreview([
            ['Arquivo Excel selecionado'],
            ['Nome:', file.name],
            ['Tamanho:', `${(file.size / 1024).toFixed(1)} KB`],
            ['Tipo:', file.type || 'Excel'],
            ['Preview será gerado após o upload...']
          ]);
        }
      } catch (error) {
        console.error('Erro ao fazer preview:', error);
        setFilePreview([
          ['Erro ao fazer preview do arquivo'],
          ['O arquivo será processado durante a importação']
        ]);
      }
    };

    // Ler como texto para CSV, como ArrayBuffer para Excel
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (fileExtension === '.csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileImport = async () => {
    if (!selectedFile) {
      setError('Selecione um arquivo');
      return;
    }

    setError('');
    setImportResult(null);

    try {
      const result = await importPackages(selectedFile);
      setImportResult(result);
      setSelectedFile(null);
      setFilePreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message || 'Erro ao importar arquivo');
    }
  };

  const downloadTemplate = () => {
    // ✅ TEMPLATE ATUALIZADO COM CAMPO DE VALOR
    const csvContent = 'CÓDIGO,PRODUTO,NOME E TELEFONE,ID PEDIDO,VALOR TAXA,OBSERVAÇÃO 1 (STATUS CORREIOS),PRAZO FINAL,TROCA DE RASTREIO?\nOY105082335BR,Smartwatch XYZ,Maria Silva - (21)98765-4321,PED999,150.75,Produto entregue sem problemas,2024-12-31,BR987654321BR\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_encomendas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Adicionar Encomenda</h1>
          <p className="text-gray-600 mt-2">Adicione uma nova encomenda para rastreamento</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="h-4 w-4 inline mr-2" />
          Manual
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'import'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="h-4 w-4 inline mr-2" />
          Importar Excel/CSV
        </button>
      </div>

      {/* Manual Form */}
      {activeTab === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Encomenda Manualmente</CardTitle>
            <CardDescription>
              Preencha os dados da encomenda para iniciar o rastreamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tracking_number">Código de Rastreamento *</Label>
                  <div className="relative">
                    <Input
                      id="tracking_number"
                      value={formData.tracking_number}
                      onChange={(e) => handleInputChange('tracking_number', e.target.value)}
                      placeholder="Ex: BR123456789BR"
                      className="pr-10"
                    />
                    {isDetecting && (
                      <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 text-gray-400" />
                    )}
                  </div>
                  {detectedCouriers.length > 0 && (
                    <div className="text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Transportadora detectada: {detectedCouriers.map(c => c.name || c.slug).join(', ')}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carrier">Transportadora</Label>
                  <Select
                    value={formData.carrier_slug}
                    onValueChange={(value) => handleInputChange('carrier_slug', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a transportadora" />
                    </SelectTrigger>
                    <SelectContent>
                      {couriers.map((courier) => (
                        <SelectItem key={courier.slug} value={courier.slug}>
                          {courier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título (Opcional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Notebook Dell"
                  />
                </div>

                {/* ✅ NOVO CAMPO DE VALOR */}
                <div className="space-y-2">
                  <Label htmlFor="value">Valor da Encomenda</Label>
                  <div className="relative">
                    <Input
                      id="value"
                      type="text"
                      placeholder="R$ 0,00"
                      value={formData.value}
                      onChange={(e) => handleInputChange('value', e.target.value)}
                      className=""
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_name">Nome do Cliente</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Telefone do Cliente</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_cpf">CPF do Cliente</Label>
                  <Input
                    id="customer_cpf"
                    value={formData.customer_cpf}
                    onChange={(e) => handleInputChange('customer_cpf', e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_email">Email do Cliente</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order_id">ID do Pedido</Label>
                  <Input
                    id="order_id"
                    value={formData.order_id}
                    onChange={(e) => handleInputChange('order_id', e.target.value)}
                    placeholder="Ex: PED001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previous_tracking_number">Código Anterior (Troca)</Label>
                  <Input
                    id="previous_tracking_number"
                    value={formData.previous_tracking_number}
                    onChange={(e) => handleInputChange('previous_tracking_number', e.target.value.toUpperCase())}
                    placeholder="BR123456789BR"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (Opcional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Adicione observações sobre esta encomenda..."
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/packages')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Adicionar Encomenda
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* File Import */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Importar Encomendas via Excel/CSV</CardTitle>
              <CardDescription>
                Faça upload de um arquivo Excel (.xlsx, .xlsm, .xls) ou CSV para adicionar múltiplas encomendas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    Selecione um arquivo Excel ou CSV
                  </p>
                  <p className="text-gray-600">
                    Formatos suportados: .xlsx, .xlsm, .xls, .csv
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx,.xlsm,.xlsb,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="mt-4 space-x-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                  <Button onClick={downloadTemplate} variant="ghost">
                    Baixar Template CSV
                  </Button>
                </div>
              </div>

              {selectedFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">{selectedFile.name}</p>
                        <p className="text-sm text-blue-600">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleFileImport} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Importar
                        </>
                      )}
                    </Button>
                  </div>

                  {filePreview.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <h4 className="font-medium text-gray-900">Prévia do Arquivo</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <tbody>
                            {filePreview.map((row, index) => (
                              <tr key={index} className={index === 0 ? 'bg-gray-50 font-medium' : ''}>
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-4 py-2 border-r border-gray-200">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {importResult && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Importação concluída!</p>
                      <p>{importResult.created_count} encomendas foram adicionadas com sucesso.</p>
                      {importResult.errors && importResult.errors.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-red-600">
                            {importResult.errors.length} erro(s) encontrado(s)
                          </summary>
                          <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                            {importResult.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li>... e mais {importResult.errors.length - 5} erro(s)</li>
                            )}
                          </ul>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Formato do Arquivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  O arquivo deve conter as seguintes colunas (a primeira linha deve ser o cabeçalho):
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Coluna (Excel)</th>
                        <th className="text-left py-2">Obrigatório</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-2">
                      <tr>
                        <td className="py-1 font-mono">CÓDIGO</td>
                        <td className="py-1 text-red-600">Sim</td>
                        <td className="py-1">Número de rastreamento da encomenda (ex: OY105082335BR)</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-mono">PRODUTO</td>
                        <td className="py-1 text-gray-600">Não</td>
                        <td className="py-1">Nome ou descrição do produto</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-mono">NOME E TELEFONE</td>
                        <td className="py-1 text-gray-600">Não</td>
                        <td className="py-1">Nome completo e telefone do cliente</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-mono">ID PEDIDO</td>
                        <td className="py-1 text-gray-600">Não</td>
                        <td className="py-1">Identificador único do pedido</td>
                      </tr>
                      {/* ✅ NOVA LINHA PARA VALOR */}
                      <tr>
                        <td className="py-1 font-mono">VALOR TAXA</td>
                        <td className="py-1 text-gray-600">Não</td>
                        <td className="py-1">Valor da encomenda em reais (ex: 150.75 ou R$ 150,75)</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-mono">OBSERVAÇÃO 1 (STATUS CORREIOS)</td>
                        <td className="py-1 text-gray-600">Não</td>
                        <td className="py-1">Observações sobre o status da encomenda</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-mono">PRAZO FINAL</td>
                        <td className="py-1 text-gray-600">Não</td>
                        <td className="py-1">Data limite para entrega (formato: YYYY-MM-DD)</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-mono">TROCA DE RASTREIO?</td>
                        <td className="py-1 text-gray-600">Não</td>
                        <td className="py-1">Código de rastreamento anterior (se houver)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* ✅ EXEMPLO DE FORMATAÇÃO DE VALOR */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💰 Formatação do Campo Valor:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Aceita:</strong> 150.75, R$ 150,75, 150,75</li>
                    <li>• <strong>Resultado:</strong> R$ 150,75</li>
                    <li>• <strong>Dica:</strong> Use ponto ou vírgula para separar centavos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AddPackage;