// Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import usePackages from '../hooks/usePackages';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { packages, loading, error, initialized, refetch } = usePackages();
  const [stats, setStats] = useState({
    total: 0,
    in_transit: 0,
    delivered: 0,
    exception: 0
  });

  // Remover o useEffect que causava o loop
  // useEffect(() => {
  //   fetchPackages();
  // }, [fetchPackages]);

  // Calcular estatísticas quando os pacotes mudarem
  useEffect(() => {
    if (packages.length > 0) {
      const newStats = packages.reduce((acc, pkg) => {
        acc.total++;
        switch (pkg.status) {
          case 'in_transit':
          case 'transit':
            acc.in_transit++;
            break;
          case 'delivered':
            acc.delivered++;
            break;
          case 'exception':
          case 'expired':
            acc.exception++;
            break;
          default:
            break;
        }
        return acc;
      }, { total: 0, in_transit: 0, delivered: 0, exception: 0 });
      
      setStats(newStats);
    } else if (initialized && packages.length === 0) {
      // Resetar stats quando não há pacotes
      setStats({
        total: 0,
        in_transit: 0,
        delivered: 0,
        exception: 0
      });
    }
  }, [packages, initialized]);

  const statsCards = [
    {
      title: 'Total',
      value: stats.total.toString(),
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Em Trânsito',
      value: stats.in_transit.toString(),
      icon: Truck,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Entregues',
      value: stats.delivered.toString(),
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Problemas',
      value: stats.exception.toString(),
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
    },
  ];

  const recentPackages = packages.slice(0, 4).map(pkg => ({
    id: pkg.id,
    code: pkg.tracking_number || pkg.trackingNumber,
    carrier: pkg.carrier_name || pkg.carrierName || 'Desconhecida',
    status: getStatusLabel(pkg.status),
    statusColor: getStatusColor(pkg.status),
    lastUpdate: getTimeAgo(pkg.updated_at || pkg.updatedAt),
  }));

  const pieData = [
    { name: 'Entregues', value: stats.delivered, color: '#10B981' },
    { name: 'Em Trânsito', value: stats.in_transit, color: '#F59E0B' },
    { name: 'Problemas', value: stats.exception, color: '#EF4444' },
    { name: 'Outros', value: stats.total - stats.delivered - stats.in_transit - stats.exception, color: '#6B7280' },
  ];

  const carrierStats = packages.reduce((acc, pkg) => {
    const carrier = pkg.carrier_name || pkg.carrierName || 'Desconhecida';
    acc[carrier] = (acc[carrier] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(carrierStats).map(([name, value]) => ({
    name,
    value
  }));

  const handleRefresh = () => {
    console.log('🔄 Dashboard: Botão de refresh clicado');
    refetch();
  };

  // Loading inicial (quando ainda não inicializou)
  if (!initialized && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando dados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Packages */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Encomendas Recentes</CardTitle>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
            <CardDescription>
              Últimas encomendas adicionadas ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPackages.length > 0 ? (
                recentPackages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-gray-900">{pkg.code}</p>
                          <p className="text-sm text-gray-500">{pkg.carrier}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={pkg.statusColor}>
                        {pkg.status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{pkg.lastUpdate}</p>
                      </div>
                      <Link to={`/packages/${pkg.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma encomenda encontrada</p>
                  <Link to="/packages/new">
                    <Button className="mt-4">
                      Adicionar Primeira Encomenda
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>
              Visão geral do status das encomendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.total > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData.filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {pieData.filter(item => item.value > 0).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sem dados para exibir</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Carriers Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Encomendas por Transportadora</CardTitle>
          <CardDescription>
            Distribuição de encomendas entre as transportadoras
          </CardDescription>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sem dados para exibir</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Funções auxiliares permanecem iguais...
function getStatusLabel(status) {
  const statusMap = {
    'pending': 'Pendente',
    'in_transit': 'Em Trânsito',
    'transit': 'Em Trânsito',
    'delivered': 'Entregue',
    'exception': 'Problema',
    'expired': 'Expirado'
  };
  return statusMap[status] || 'Desconhecido';
}

function getStatusColor(status) {
  const colorMap = {
    'pending': 'bg-gray-100 text-gray-800',
    'in_transit': 'bg-yellow-100 text-yellow-800',
    'transit': 'bg-yellow-100 text-yellow-800',
    'delivered': 'bg-green-100 text-green-800',
    'exception': 'bg-red-100 text-red-800',
    'expired': 'bg-red-100 text-red-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

function getTimeAgo(dateString) {
  if (!dateString) return 'Desconhecido';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Agora';
  if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
}

export default Dashboard;