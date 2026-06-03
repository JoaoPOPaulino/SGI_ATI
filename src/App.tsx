import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Inventario = React.lazy(() => import('./pages/Inventario'));
const Movimentacoes = React.lazy(() => import('./pages/Movimentacoes'));
const Manutencao = React.lazy(() => import('./pages/Manutencao'));
const Labin = React.lazy(() => import('./pages/Labin'));
const Perfil = React.lazy(() => import('./pages/Perfil'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Emprestimos = React.lazy(() => import('./pages/Emprestimos'));
const ChangePassword = React.lazy(() => import('./pages/ChangePassword'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-on-surface-variant font-medium">Carregando...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/trocar-senha" element={<ChangePassword />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/inventario" element={
              <ProtectedRoute>
                <Layout><Inventario /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/movimentacoes" element={
              <ProtectedRoute>
                <Layout><Movimentacoes /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/emprestimos" element={
              <ProtectedRoute>
                <Layout><Emprestimos /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/manutencao" element={
              <ProtectedRoute>
                <Layout><Manutencao /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/labin" element={
              <ProtectedRoute>
                <Layout><Labin /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Layout><Perfil /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredPerfil="ADMIN">
                <Layout><Admin /></Layout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
