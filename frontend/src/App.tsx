import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/ContextoAutenticacao';
import { ToastProvider } from './components/SistemaToast';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/RotaProtegida';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Painel'));
const Inventario = lazy(() => import('./pages/Inventario'));
const Movimentacoes = lazy(() => import('./pages/Movimentacoes'));
const Manutencao = lazy(() => import('./pages/Manutencao'));
const Labin = lazy(() => import('./pages/Labin'));
const Perfil = lazy(() => import('./pages/Perfil'));
const Admin = lazy(() => import('./pages/Admin'));
const Emprestimos = lazy(() => import('./pages/Emprestimos'));
const ChangePassword = lazy(() => import('./pages/TrocarSenha'));
const NotFound = lazy(() => import('./pages/NaoEncontrado'));

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<div role="status" className="p-6 text-center">Carregando página...</div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/trocar-senha" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="inventario" element={<Inventario />} />
                <Route path="movimentacoes" element={<Movimentacoes />} />
                <Route path="emprestimos" element={<Emprestimos section="emprestimos" />} />
                <Route path="eventos" element={<Emprestimos section="eventos" />} />
                <Route path="manutencao" element={<Manutencao />} />
                <Route path="labin" element={<Labin />} />
                <Route path="perfil" element={<Perfil />} />
                <Route path="admin" element={
                  <ProtectedRoute requiredPerfil="ADMIN">
                    <Admin />
                  </ProtectedRoute>
                } />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
