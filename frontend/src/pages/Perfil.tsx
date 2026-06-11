import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/ContextoAutenticacao';
import { User, Mail, Shield, MapPin, Key, Clock, Camera, MessageSquare, Send, CheckCircle2, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '../services/supabase';

function tempoDecorrido(isoDate: string | null): string {
  if (!isoDate) return 'Nunca alterada';
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  if (minutos < 1) return 'agora mesmo';
  if (minutos < 60) return `há ${minutos} minuto${minutos > 1 ? 's' : ''}`;
  if (horas < 24) return `há ${horas} hora${horas > 1 ? 's' : ''}`;
  if (dias === 1) return 'há 1 dia';
  return `há ${dias} dias`;
}

const Perfil: React.FC = () => {
  const { user, updatePhoto } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fbTipo, setFbTipo] = useState<'Problema' | 'Sugestão'>('Sugestão');
  const [fbMensagem, setFbMensagem] = useState('');
  const [fbEnviado, setFbEnviado] = useState(false);
  const [fbErro, setFbErro] = useState('');

  if (!user) return null;

  const ultimaTroca = localStorage.getItem('sgi_ati_ultima_troca_senha');

  const handlePhotoClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const maxSize = 300;
      let w = bitmap.width, h = bitmap.height;
      if (w > h) { if (w > maxSize) { h *= maxSize / w; w = maxSize; } }
      else { if (h > maxSize) { w *= maxSize / h; h = maxSize; } }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(bitmap, 0, 0, w, h);
      updatePhoto(canvas.toDataURL('image/jpeg', 0.75));
      bitmap.close();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {}
  };

  const [fbLoading, setFbLoading] = useState(false);
  const [fbResult, setFbResult] = useState<{subject: string; body: string; mailto: string} | null>(null);

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbMensagem.trim()) { setFbErro('Escreva sua mensagem.'); return; }
    setFbErro('');
    setFbLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-feedback', {
        body: { usuario: user.nome, email: user.email, perfil: user.perfil, polo: user.polo, tipo: fbTipo, mensagem: fbMensagem },
      });
      if (error) throw error;
      setFbMensagem('');
      setFbResult(data);
    } catch {
      setFbErro('Erro ao enviar. Tente novamente.');
    } finally {
      setFbLoading(false);
    }
  };

  const copyFeedback = () => {
    if (fbResult) {
      navigator.clipboard.writeText(`Assunto: ${fbResult.subject}\n\n${fbResult.body}`);
      setFbEnviado(true);
      setTimeout(() => { setFbEnviado(false); setFbResult(null); }, 3000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-body text-on-surface">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Meu Perfil</h1>
        <p className="text-xs text-outline font-semibold">Gerencie suas informações de conta e credenciais de acesso.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
        <div>
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-primary-container/20"></div>
            <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-4 border-surface-container-lowest relative z-10 mb-4 mt-6 overflow-hidden group cursor-pointer" onClick={handlePhotoClick}>
              {user.foto ? <img src={user.foto} alt="Foto" className="w-full h-full object-cover" /> : <User size={40} />}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={20} className="text-white" /></div>
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="absolute w-0 h-0 opacity-0 pointer-events-none" />
            <h2 className="text-xl font-bold text-primary mb-1 truncate px-4">{user.nome}</h2>
            <div className="inline-flex px-2 py-0.5 rounded uppercase tracking-widest font-black text-[10px] bg-primary/10 text-primary border border-primary/20 mb-6">{user.perfil}</div>
            <div className="w-full space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm"><Mail size={16} className="text-outline" /><span className="text-on-surface-variant truncate max-w-[220px]">{user.email}</span></div>
              <div className="flex items-center gap-3 text-sm"><Shield size={16} className="text-outline" /><span className="text-on-surface-variant">Nível de Acesso: {user.perfil}</span></div>
              <div className="flex items-center gap-3 text-sm"><MapPin size={16} className="text-outline" /><span className="text-on-surface-variant truncate">Polo: {user.polo || 'Geral'}</span></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Key size={18} className="text-primary" />Segurança</h3>
            <div className="space-y-4">
              <div className="p-4 bg-surface rounded-xl border border-outline-variant/30 flex items-center justify-between">
                <div><h4 className="font-bold text-sm">Senha de Acesso</h4><p className="text-xs text-on-surface-variant">Última alteração: {tempoDecorrido(ultimaTroca)}</p></div>
                <button onClick={() => navigate('/trocar-senha')} className="px-4 py-2 custom-gradient-btn text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all">Alterar Senha</button>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Clock size={18} className="text-primary" />Atividade</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                <div className="text-sm"><span className="font-bold block">Sessão atual</span><span className="text-xs text-on-surface-variant">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                <div className="text-xs font-semibold text-emerald-500">Ativa</div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="text-sm"><span className="font-bold block">Acesso ao sistema</span><span className="text-xs text-on-surface-variant">Perfil: {user.perfil} • Polo: {user.polo || 'Geral'}</span></div>
                <div className="text-xs font-semibold text-outline">{user.ativo ? 'Ativo' : 'Inativo'}</div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-primary" />Feedback & Melhorias</h3>

            {fbResult ? (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <p className="font-bold text-emerald-700 flex items-center gap-1"><CheckCircle2 size={14} />Feedback registrado com sucesso!</p>
                  <p className="text-emerald-600 mt-1">Salvo no banco de dados. Para enviar por e-mail, use uma das opções abaixo:</p>
                </div>
                <div className="bg-surface p-3 rounded-xl border border-outline/20 text-[10px] text-on-surface-variant max-h-32 overflow-y-auto font-mono whitespace-pre-wrap">{fbResult.body}</div>
                <div className="flex gap-2">
                  <button onClick={copyFeedback} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                    {fbEnviado ? <><CheckCircle2 size={14} />Copiado!</> : <><Copy size={14} />Copiar Conteúdo</>}
                  </button>
                  <a href={fbResult.mailto} className="flex-1 py-2.5 bg-surface border border-outline rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-primary hover:bg-primary/5 transition-colors no-underline">
                    <ExternalLink size={14} />Abrir E-mail
                  </a>
                </div>
                <button onClick={() => setFbResult(null)} className="w-full text-[10px] text-outline hover:text-on-surface transition-colors">Enviar outro feedback</button>
              </div>
            ) : (
            <>
            <p className="text-xs text-outline mb-4">Encontrou um problema ou tem uma sugestão? Envie diretamente para a equipe.</p>
            <form onSubmit={handleFeedback} className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setFbTipo('Sugestão')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${fbTipo === 'Sugestão' ? 'bg-primary text-white' : 'bg-surface border border-outline text-outline'}`}>💡 Sugestão</button>
                <button type="button" onClick={() => setFbTipo('Problema')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${fbTipo === 'Problema' ? 'bg-red-600 text-white' : 'bg-surface border border-outline text-outline'}`}>🐛 Problema</button>
              </div>
              <textarea rows={4} value={fbMensagem} onChange={(e) => setFbMensagem(e.target.value)} placeholder="Descreva seu problema ou sugestão..." className="w-full px-4 py-3 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary resize-none" />
              {fbErro && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={12} />{fbErro}</p>}
              {fbEnviado && <p className="text-[10px] text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} />Feedback enviado com sucesso!</p>}
              <button type="submit" disabled={fbLoading} className="w-full py-2.5 custom-gradient-btn text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                {fbLoading ? 'Enviando...' : <><Send size={14} />Enviar Feedback</>}
              </button>
            </form>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
