
import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Shield, Car, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';
import { UserState } from '../App';

interface LoginProps {
  onLogin: (user: UserState) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [tab, setTab] = useState<'customer' | 'admin'>('customer');
  const [plate, setPlate] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', {
        type: tab,
        plate: tab === 'customer' ? plate : undefined,
        password: password
      });
      onLogin(res.user);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1C1E21] p-4 relative overflow-hidden">
      {/* Abstract Background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10"
      >
        <div className="p-8 pb-4">
          <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20 transform rotate-3">
                <Shield size={32} />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800">Rei do Óleo</h2>
          <p className="text-gray-500 text-center text-sm mt-1">Santa Terezinha • Gestão de Trocas</p>
        </div>

        <div className="flex border-b border-gray-100">
           <button 
             onClick={() => setTab('customer')}
             className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${tab === 'customer' ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50' : 'text-gray-400 hover:text-gray-600'}`}
           >
             <Car size={18} /> Sou Cliente
           </button>
           <button 
             onClick={() => setTab('admin')}
             className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${tab === 'admin' ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50' : 'text-gray-400 hover:text-gray-600'}`}
           >
             <Shield size={18} /> Administração
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
           {error && (
             <motion.div 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100"
             >
               {error}
             </motion.div>
           )}

           {tab === 'customer' && (
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Placa do Veículo</label>
               <input 
                 type="text"
                 required
                 placeholder="ABC-1234"
                 value={plate}
                 onChange={e => setPlate(e.target.value.toUpperCase())}
                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 uppercase font-mono"
               />
             </div>
           )}

           <div className="space-y-1">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Senha</label>
             <div className="relative">
               <input 
                 type={showPass ? "text" : "password"}
                 required
                 placeholder={tab === 'customer' ? "Senha (ou Placa)" : "Senha Admin"}
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300"
               />
               <button 
                 type="button"
                 onClick={() => setShowPass(!showPass)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
               >
                 {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
             </div>
           </div>

           <button 
             type="submit"
             disabled={loading}
             className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
           >
             {loading ? 'Entrando...' : (
               <>
                 Entrar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
               </>
             )}
           </button>
        </form>

        <div className="bg-gray-50 p-6 flex justify-center">
            <p className="text-xs text-center text-gray-400 max-w-[200px]">
              Se você é cliente e ainda não possui cadastro, procure nossa loja física.
            </p>
        </div>
      </motion.div>
    </div>
  );
}
