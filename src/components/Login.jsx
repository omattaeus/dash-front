import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Loader2, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('🔄 Login: Iniciando submissão do formulário...');
    console.log('📝 Login: Dados do formulário:', { 
      email, 
      isRegisterMode, 
      name: isRegisterMode ? name : 'N/A' 
    });

    // Adicione esta linha para pausar a execução
    debugger;

    try {
      let result;
      
      if (isRegisterMode) {
        if (!name.trim()) {
          setError('Nome é obrigatório');
          return;
        }
        console.log('📝 Login: Chamando função de registro...');
        result = await register(name, email, password);
      } else {
        console.log('🔐 Login: Chamando função de login...');
        result = await login(email, password);
      }

      console.log('📥 Login: Resultado recebido:', result);
      
      // Outro debugger para ver o resultado
      debugger;

      if (result && result.success) {
        console.log('✅ Login: Sucesso! Aguardando atualização do estado...');
        
        // Aguardar um pouco para o estado ser atualizado
        setTimeout(() => {
          console.log('🔄 Login: Redirecionando para dashboard...');
          navigate('/dashboard');
          debugger;
        }, 100);
        
      } else {
        console.error('❌ Login: Falha na autenticação:', result);
        setError(result?.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('❌ Login: Erro inesperado:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const testAPI = async () => {
    try {
      console.log('🧪 Testando conexão com a API...');
      const response = await fetch('http://localhost:3001/api/health');
      const data = await response.json();
      console.log('✅ API está funcionando:', data);
      alert('API está funcionando! Verifique o console para mais detalhes.');
    } catch (error) {
      console.error('❌ Erro ao testar API:', error);
      alert('Erro ao conectar com a API. Verifique se o backend está rodando.');
    }
  };

  // Função para testar localStorage
  const testLocalStorage = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('🧪 Teste localStorage:', {
      token: token ? `${token.substring(0, 20)}...` : 'Não encontrado',
      user: user ? JSON.parse(user) : 'Não encontrado'
    });
    
    alert(`Token: ${token ? 'Existe' : 'Não existe'}\nUser: ${user ? 'Existe' : 'Não existe'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isRegisterMode ? 'Criar Conta' : 'Dashboard de Rastreamento'}
          </CardTitle>
          <CardDescription>
            {isRegisterMode 
              ? 'Crie sua conta para acessar o sistema'
              : 'Faça login para acessar o sistema de rastreamento de encomendas'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isRegisterMode ? 'Criando conta...' : 'Entrando...'}
                </>
              ) : (
                isRegisterMode ? 'Criar Conta' : 'Entrar'
              )}
            </Button>
            
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {isRegisterMode 
                  ? 'Já tem uma conta? Faça login'
                  : 'Não tem uma conta? Registre-se'
                }
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;