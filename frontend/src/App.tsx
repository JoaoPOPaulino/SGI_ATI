import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/ContextoAutenticacao';
import { ToastProvider } from './components/SistemaToast';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/RotaProtegida';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Painel';
import Inventario from './pages/Inventario';
import Movimentacoes from './pages/Movimentacoes';
import Manutencao from './pages/Manutencao';
import Labin from './pages/Labin';
import Perfil from './pages/Perfil';
import Admin from './pages/Admin';
import Emprestimos from './pages/Emprestimos';
import ChangePassword from './pages/TrocarSenha';
import NotFound from './pages/NaoEncontrado';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/trocar-senha" element={<ChangePassword />} />

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
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
