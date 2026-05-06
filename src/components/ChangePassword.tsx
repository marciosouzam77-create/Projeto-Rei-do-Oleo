
import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight, ShieldCheck, LogOut } from 'lucide-react';
import { api } from '../lib/api';

interface ChangePasswordProps {
  plate: string;
  onPasswordChanged: () => void;
  onLogout: () => void;
}

export default function ChangePassword({ plate, onPasswordChanged, onLogout }: ChangePasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/change-password', { plate, newPassword });
      onPasswordChanged();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        <div className="flex flex-col items-center mb-8">
           <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <Lock size={32} />
           </div>
           <h2 className="text-2xl font-bold text-gray-800">Primeiro Acesso</h2>
           <p className="text-center text-gray-500 text-sm mt-2">
             Para sua segurança, você precisa definir uma nova senha para a placa <span className="font-mono font-bold text-amber-600 uppercase">{plate}</span>.
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           {error && (
             <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100">
               {error}
             </div>
           )}

           <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nova Senha</label>
              <input 
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
           </div>

           <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Confirmar Senha</label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
           </div>

           <button 
             type="submit"
             disabled={loading}
             className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2 mt-4"
           >
             {loading ? 'Processando...' : (
               <>
                 Salvar e Entrar <ShieldCheck size={18} />
               </>
             )}
           </button>

           <button 
             type="button"
             onClick={onLogout}
             className="w-full text-gray-400 hover:text-gray-600 font-bold py-2 text-sm transition-all flex items-center justify-center gap-2"
           >
             <LogOut size={16} /> Sair e fazer login depois
           </button>
        </form>
      </motion.div>
    </div>
  );
}
