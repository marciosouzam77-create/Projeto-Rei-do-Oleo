
import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Car, User, Droplets, Gauge } from 'lucide-react';
import { api } from '../lib/api';
import { OilType, VISCOSITIES, GEAR_OIL_TYPES, Customer, Vehicle, Service } from '../types';

interface ServiceFormProps {
  onClose: () => void;
  customers: Customer[];
  vehicles: Vehicle[];
  initialData?: Service | null;
}

export default function ServiceForm({ onClose, customers, vehicles, initialData }: ServiceFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    if (initialData) {
      const vehicle = vehicles.find(v => v.id === initialData.vehicleId);
      return vehicle?.customerId || '';
    }
    return '';
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialData?.vehicleId || '');
  const [currentKm, setCurrentKm] = useState<number>(initialData?.currentKm || 0);
  
  // Oil Items as text
  const [oilItemsText, setOilItemsText] = useState(initialData?.oilItems?.join('\n') || '');
  // Service Items as text
  const [serviceItemsText, setServiceItemsText] = useState(initialData?.serviceItems?.join('\n') || '');
  
  const [price, setPrice] = useState<number>(initialData?.totalPrice || 0);
  
  // Calculate back intervals if editing
  const existingNextDate = initialData?.nextChangeDate ? new Date(initialData.nextChangeDate) : null;
  const existingDate = initialData?.date ? new Date(initialData.date) : new Date();
  const monthsDiff = existingNextDate ? Math.round((existingNextDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) : 6;
  const kmDiff = initialData ? (initialData.nextChangeKm - initialData.currentKm) : 10000;

  const [kmInterval, setKmInterval] = useState(kmDiff);
  const [monthInterval, setMonthInterval] = useState(monthsDiff);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const serviceDate = initialData ? new Date(initialData.date) : new Date();
      const nextChangeDate = new Date(serviceDate);
      nextChangeDate.setMonth(nextChangeDate.getMonth() + monthInterval);
      
      const oilItems = oilItemsText.split('\n').filter(item => item.trim() !== '');
      const serviceItems = serviceItemsText.split('\n').filter(item => item.trim() !== '');
      
      const payload = {
        vehicleId: selectedVehicleId,
        oilItems,
        serviceItems,
        oilType: oilItems[0] || 'Personalizado', // Fallback for display
        viscosity: serviceItems[0] || 'Personalizado', // Fallback for display
        currentKm,
        nextChangeKm: currentKm + kmInterval,
        nextChangeDate: nextChangeDate.toISOString(),
        totalPrice: price,
      };

      if (initialData) {
        await api.put(`/services/${initialData.id}`, payload);
      } else {
        await api.post('/services', payload);
      }
      onClose();
    } catch (err) {
      alert('Erro ao salvar serviço');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => v.customerId === selectedCustomerId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <div>
             <h2 className="text-xl font-bold text-gray-800 tracking-tight">Troca de óleo/Serviços</h2>
             <p className="text-xs text-gray-400 font-medium tracking-wide prose uppercase">Passo {step} de 3</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
              <X size={24} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
           {step === 1 && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center gap-3 text-amber-600 mb-2">
                   <User size={20} />
                   <h3 className="font-bold">Troca de óleo/Serviços</h3>
                </div>
                
                <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Selecionar Cliente</label>
                      <select 
                        value={selectedCustomerId}
                        onChange={e => {
                          setSelectedCustomerId(e.target.value);
                          setSelectedVehicleId('');
                        }}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none appearance-none"
                      >
                         <option value="">Selecione um cliente...</option>
                         {customers.map(c => (
                           <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                         ))}
                      </select>
                   </div>

                   {selectedCustomerId && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Selecionar Veículo</label>
                        <select 
                          value={selectedVehicleId}
                          onChange={e => setSelectedVehicleId(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                           <option value="">Selecione o veículo...</option>
                           {filteredVehicles.map(v => (
                             <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                           ))}
                        </select>
                        {filteredVehicles.length === 0 && (
                          <p className="text-xs text-amber-600 mt-2 font-medium">Nenhum veículo cadastrado para este cliente.</p>
                        )}
                     </motion.div>
                   )}
                </div>
             </motion.div>
           )}

           {step === 2 && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center gap-3 text-amber-600 mb-2">
                   <Droplets size={20} />
                   <h3 className="font-bold">Troca de óleo/Serviços</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Itens de Óleo (Um por linha)</label>
                        <textarea 
                          value={oilItemsText}
                          onChange={e => setOilItemsText(e.target.value)}
                          className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none font-sans"
                          placeholder="Ex: Motul 5W30&#10;Filtro de Óleo&#10;Filtro de Ar..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Serviços Adicionais (Um por linha)</label>
                        <textarea 
                          value={serviceItemsText}
                          onChange={e => setServiceItemsText(e.target.value)}
                          className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none font-sans"
                          placeholder="Ex: Higienização AC&#10;Troca de Palhetas&#10;Revisão de Freios..."
                        />
                      </div>
                   </div>
 
                   <div className="space-y-4">
                      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Valor Total do Serviço</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-lg">R$</span>
                           <input 
                             type="number"
                             value={price}
                             onChange={e => setPrice(Number(e.target.value))}
                             className="w-full p-4 pl-12 bg-white border border-amber-200 rounded-xl font-black text-2xl text-amber-600 outline-none focus:ring-2 focus:ring-amber-500"
                           />
                        </div>
                      </div>
                   </div>
                </div>
             </motion.div>
           )}

           {step === 3 && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center gap-3 text-amber-600 mb-2">
                   <Gauge size={20} />
                   <h3 className="font-bold">Troca de óleo/Serviços</h3>
                </div>

                <div className="space-y-6">
                   <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">KM Atual do Veículo</p>
                        <input 
                          type="number"
                          value={currentKm}
                          onChange={e => setCurrentKm(Number(e.target.value))}
                          className="text-3xl font-bold bg-transparent outline-none w-full font-mono text-gray-800"
                        />
                      </div>
                      <div className="p-4 bg-white rounded-xl shadow-sm text-amber-500">
                         <Car size={32} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white border border-gray-100 rounded-xl">
                         <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Intervalo de KM</label>
                         <div className="flex items-center gap-2">
                           <input 
                             type="number"
                             value={kmInterval}
                             onChange={e => setKmInterval(Number(e.target.value))}
                             className="w-full text-lg font-bold outline-none font-mono"
                           />
                           <span className="text-xs font-bold text-gray-300">KM</span>
                         </div>
                      </div>
                      <div className="p-4 bg-white border border-gray-100 rounded-xl">
                         <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Intervalo Meses</label>
                         <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              value={monthInterval}
                              onChange={e => setMonthInterval(Number(e.target.value))}
                              className="w-full text-lg font-bold outline-none font-mono"
                            />
                            <span className="text-xs font-bold text-gray-300">MESES</span>
                         </div>
                      </div>
                   </div>

                   <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                      <p className="text-xs font-bold text-amber-600 uppercase mb-3">Previsão Próxima Troca</p>
                      <div className="flex justify-between items-center">
                         <div className="space-y-1">
                            <p className="text-sm font-medium text-amber-800">Por Quilometragem</p>
                            <p className="text-2xl font-black text-amber-900 font-mono">{currentKm + kmInterval} KM</p>
                         </div>
                         <div className="h-10 w-px bg-amber-200" />
                         <div className="space-y-1 text-right">
                            <p className="text-sm font-medium text-amber-800">Por Data Limite</p>
                            <p className="text-2xl font-black text-amber-900 font-mono">
                               {new Date(new Date().setMonth(new Date().getMonth() + monthInterval)).toLocaleDateString()}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
           )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
           <button 
             disabled={step === 1}
             onClick={() => setStep(s => s - 1)}
             className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 disabled:opacity-0 transition-all font-sans"
           >
             VOLTAR
           </button>
           
           <div className="flex gap-3">
              {step < 3 ? (
                <button 
                  disabled={!selectedVehicleId && step === 1}
                  onClick={() => setStep(s => s + 1)}
                  className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-200 transition-all disabled:opacity-50"
                >
                  PRÓXIMO
                </button>
              ) : (
                <button 
                  disabled={loading}
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all flex items-center gap-2"
                >
                  <Save size={18} /> {loading ? 'SALVANDO...' : 'FINALIZAR REGISTRO'}
                </button>
              )}
           </div>
        </div>
      </motion.div>
    </div>
  );
}
