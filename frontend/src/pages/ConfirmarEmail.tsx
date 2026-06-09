import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';

const ConfirmarEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Confirmando e-mail...');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const confirmarEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Token inválido ou ausente.');
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update({
          email_confirmado: true,
          token_confirmacao: null,
        })
        .eq('token_confirmacao', token)
        .select('id')
        .single();

      if (error || !data) {
        setStatus('error');
        setMessage('Erro ao confirmar e-mail. O link pode estar inválido ou já ter sido usado.');
        return;
      }

      setStatus('success');
      setMessage('E-mail confirmado com sucesso! Redirecionando para o login...');

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    };

    confirmarEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center max-w-md w-full">
        <div className="flex justify-center mb-5">
          {status === 'loading' && <Loader2 size={42} className="text-blue-600 animate-spin" />}
          {status === 'success' && <CheckCircle2 size={42} className="text-green-600" />}
          {status === 'error' && <AlertCircle size={42} className="text-red-600" />}
        </div>

        <h1 className="text-2xl font-extrabold text-gray-800 mb-3">
          Confirmação de E-mail
        </h1>

        <p className="text-sm text-gray-500">
          {message}
        </p>
      </div>
    </div>
  );
};

export default ConfirmarEmail;