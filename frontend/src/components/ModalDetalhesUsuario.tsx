import React from 'react';
import { X, Mail, Shield, MapPin, Circle, Clock, Users, UserPlus, ToggleLeft, Pencil, Trash2, ClipboardCheck, Ban, Fingerprint } from 'lucide-react';
import { AdminAction } from '../services/bancoMock';
import { AuditLogRecord } from '../services/supabaseUsuarios';

interface ModalUser {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  perfil: string;
  ativo: boolean;
  polo?: string | null;
  foto?: string | null;
}

interface UserDetailModalProps {
  open: boolean;
  user: ModalUser | null;
  auditLogs: AuditLogRecord[];
  onClose: () => void;
}

const actionLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  CREATE_USER: { label: 'Usuário criado', icon: <UserPlus size={12} /> },
  DELETE_USER: { label: 'Usuário excluído', icon: <Trash2 size={12} /> },
  CHANGE_PROFILE: { label: 'Perfil alterado', icon: <Shield size={12} /> },
  TOGGLE_STATUS: { label: 'Status alterado', icon: <ToggleLeft size={12} /> },
  CHANGE_POLO: { label: 'Polo alterado', icon: <MapPin size={12} /> },
  APPROVE_REGISTRATION: { label: 'Cadastro aprovado', icon: <ClipboardCheck size={12} /> },
  REJECT_REGISTRATION: { label: 'Cadastro rejeitado', icon: <Ban size={12} /> },
};

const profileColor: Record<string, string> = {
  ADMIN: 'bg-amber-100 text-amber-700 border-amber-200',
  SUPERIOR: 'bg-blue-100 text-blue-700 border-blue-200',
  TECNICO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ESTAGIARIO: 'bg-surface-container text-on-surface-variant border-outline-variant/30',
};

const UserDetailModal: React.FC<UserDetailModalProps> = ({ open, user, auditLogs, onClose }) => {
  if (!open || !user) return null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
              {user.foto ? (
                <img src={user.foto} alt={user.nome} className="w-full h-full object-cover" />
              ) : (
                user.nome.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">{user.nome}</h3>
              <p className="text-[10px] text-outline">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-outline uppercase tracking-wider mb-1.5">
                <Shield size={12} /> Perfil
              </div>
              <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-lg border ${profileColor[user.perfil] || 'bg-surface-container'}`}>
                {user.perfil === 'ESTAGIARIO' ? 'ESTAGIÁRIO' : user.perfil}
              </span>
            </div>

            <div className="bg-surface-container-low rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-outline uppercase tracking-wider mb-1.5">
                <Circle size={12} /> Status
              </div>
              {user.ativo ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-outline">
                  <div className="w-1.5 h-1.5 bg-outline rounded-full" />
                  Inativo
                </span>
              )}
            </div>

            <div className="bg-surface-container-low rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-outline uppercase tracking-wider mb-1.5">
                <MapPin size={12} /> Polo
              </div>
              <span className="text-[10px] font-semibold text-on-surface">
                {user.polo || '—'}
              </span>
            </div>

            <div className="bg-surface-container-low rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-outline uppercase tracking-wider mb-1.5">
                <Mail size={12} /> Email
              </div>
              <span className="text-[10px] font-semibold text-on-surface truncate block">{user.email}</span>
            </div>

            <div className="bg-surface-container-low rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-outline uppercase tracking-wider mb-1.5">
                <Fingerprint size={12} /> CPF (Login)
              </div>
              <span className="text-[10px] font-semibold text-on-surface">
                {user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
              </span>
            </div>
          </div>

          <div className="border-t border-outline-variant/10 pt-4">
            <h4 className="text-xs font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <Clock size={14} className="text-outline" />
              Histórico de Auditoria
            </h4>

            {auditLogs.length === 0 ? (
              <p className="text-[10px] text-outline italic">Nenhuma ação registrada para este usuário.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {auditLogs.map(log => {
                  const action = actionLabels[log.action];
                  return (
                    <div key={log.id} className="flex items-start gap-2.5 bg-surface-container-low rounded-xl p-2.5">
                      <div className="p-1.5 bg-surface-container-highest rounded-lg text-outline shrink-0 mt-0.5">
                        {action?.icon || <Circle size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold text-on-surface">
                            {action?.label || log.action}
                          </span>
                          <span className="text-[9px] text-outline shrink-0">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-[9px] text-outline mt-0.5">
                          Por: <strong className="text-on-surface-variant">{log.admin_name}</strong>
                          {log.details ? ` — ${log.details}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-outline-variant/10">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
