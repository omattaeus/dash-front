import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PackagesList from './components/PackagesList';
import PackageDetails from './components/PackageDetails';
import AddPackage from './components/AddPackage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rotas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="packages" element={<PackagesList />} />
            <Route path="packages/new" element={<AddPackage />} />
            <Route path="packages/:id" element={<PackageDetails />} />
            <Route path="settings" element={<div className="p-8 text-center text-gray-500">Página de Configurações em desenvolvimento</div>} />
          </Route>
          
          {/* Rota 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;