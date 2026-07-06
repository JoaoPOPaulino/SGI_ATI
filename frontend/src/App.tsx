import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/ContextoAutenticacao';
import { ToastProvider } from './components/SistemaToast';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/RotaProtegida';
import Layout from './components/Layout';

const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Painel'));
const Inventario = React.lazy(() => import('./pages/Inventario'));
const Movimentacoes = React.lazy(() => import('./pages/Movimentacoes'));
const Manutencao = React.lazy(() => import('./pages/Manutencao'));
const Labin = React.lazy(() => import('./pages/Labin'));
const Perfil = React.lazy(() => import('./pages/Perfil'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Emprestimos = React.lazy(() => import('./pages/Emprestimos'));
const ChangePassword = React.lazy(() => import('./pages/TrocarSenha'));
const NotFound = React.lazy(() => import('./pages/NaoEncontrado'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-on-surface-variant font-medium">Carregando...</span>
    </div>
  </div>
);

const LazyPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={
                <Suspense fallback={<PageLoader />}><Login /></Suspense>
              } />
              <Route path="/trocar-senha" element={
                <Suspense fallback={<PageLoader />}><ChangePassword /></Suspense>
              } />

              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<LazyPage><Dashboard /></LazyPage>} />
                <Route path="inventario" element={<LazyPage><Inventario /></LazyPage>} />
                <Route path="movimentacoes" element={<LazyPage><Movimentacoes /></LazyPage>} />
                <Route path="emprestimos" element={<LazyPage><Emprestimos section="emprestimos" /></LazyPage>} />
                <Route path="eventos" element={<LazyPage><Emprestimos section="eventos" /></LazyPage>} />
                <Route path="manutencao" element={<LazyPage><Manutencao /></LazyPage>} />
                <Route path="labin" element={<LazyPage><Labin /></LazyPage>} />
                <Route path="perfil" element={<LazyPage><Perfil /></LazyPage>} />
                <Route path="admin" element={
                  <ProtectedRoute requiredPerfil="ADMIN">
                    <LazyPage><Admin /></LazyPage>
                  </ProtectedRoute>
                } />
              </Route>

              <Route path="*" element={
                <Suspense fallback={<PageLoader />}><NotFound /></Suspense>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
