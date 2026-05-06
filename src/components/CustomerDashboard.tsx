
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Car, Droplets, Calendar, History, TrendingUp, ShieldCheck, MapPin, ExternalLink, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { Vehicle, Service } from '../types';

interface CustomerDashboardProps {
  vehiclePlate: string;
}

export default function CustomerDashboard({ vehiclePlate }: CustomerDashboardProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Rei do Óleo - Santa Terezinha, Santo André coordinates
  const storeLocation = { lat: -23.6421, lng: -46.5298 };

  useEffect(() => {
    fetchData();
  }, [vehiclePlate]);

  const fetchData = async () => {
    try {
      const allVehicles = await api.get('/vehicles');
      const v = allVehicles.find((vh: any) => vh.plate.toUpperCase() === vehiclePlate.toUpperCase());
      setVehicle(v);
      if (v) {
        const s = await api.get(`/services?plate=${vehiclePlate}`);
        setServices(s.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400">Carregando dados do veículo...</div>;
  if (!vehicle) return <div className="p-20 text-center text-red-500 font-bold">Veículo não encontrado.</div>;

  const latestService = services[0];
  const nextDate = vehicle.nextChangeDate ? new Date(vehicle.nextChangeDate) : null;
  const isOverdue = nextDate && nextDate < new Date();

  const handleBookWhatsApp = () => {
    const message = `Olá! Gostaria de agendar uma troca de óleo para meu veículo ${vehicle.brand} ${vehicle.model} (Placa: ${vehicle.plate}).\n\nMinha última troca foi aos ${vehicle.lastOilChangeKm?.toLocaleString()} KM.`;
    const url = `https://wa.me/5511956880535?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
         <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black text-gray-800">Seu Carro está em Boas Mãos.</h2>
            <p className="text-gray-500 font-medium">Confira abaixo o status da sua última revisão e programe-se.</p>
         </div>

         <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center shrink-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Seu Veículo</p>
            <h3 className="font-mono text-xl font-bold text-gray-700">{vehicle.brand} {vehicle.model}</h3>
            <div className="mt-2 bg-white px-3 py-1 rounded-lg border border-gray-200 inline-block font-mono font-bold text-amber-600 shadow-sm">
               {vehicle.plate}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Main Status */}
         <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  Próxima Troca Sugerida
               </h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Por Quilometragem</p>
                     <p className="text-4xl font-black text-gray-800 font-mono tracking-tighter">
                        {vehicle.nextChangeKm?.toLocaleString()} <span className="text-lg">KM</span>
                     </p>
                     <div className="w-full h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '80%' }}
                          className="h-full bg-amber-500 rounded-full"
                        />
                     </div>
                     <p className="text-[10px] text-gray-400 italic mt-2">Baseado no último serviço aos {vehicle.lastOilChangeKm?.toLocaleString()} KM</p>
                  </div>

                  <div className="space-y-2">
                     <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-right sm:text-left">Por Tempo Limite</p>
                     <div className={`text-right sm:text-left flex items-baseline gap-2 ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                        <p className="text-4xl font-black font-mono tracking-tighter">
                           {nextDate?.toLocaleDateString()}
                        </p>
                     </div>
                     {isOverdue && (
                       <p className="text-[10px] font-bold text-red-500 uppercase mt-4 flex items-center gap-1">
                          Prazo vencido! Recomendamos a troca imediata.
                       </p>
                     )}
                  </div>
               </div>


            </div>

            {/* History Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 border-b border-gray-100">
                  <h3 className="font-bold flex items-center gap-2">
                     Histórico de Manutenções
                  </h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                           <th className="px-6 py-4">Data</th>
                           <th className="px-6 py-4">KM Serv.</th>
                           <th className="px-6 py-4">Óleo Utilizado</th>
                           <th className="px-6 py-4">Serviços</th>
                           <th className="px-6 py-4">Próxima Troca (KM)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {services.map(s => (
                           <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 text-sm font-bold text-gray-700">{new Date(s.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-sm font-mono text-gray-500">{s.currentKm.toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm">
                                 <div className="flex flex-col">
                                    {s.oilItems && s.oilItems.length > 0 ? (
                                      s.oilItems.map((item, i) => (
                                        <span key={i} className="font-bold text-gray-700 leading-tight">{item}</span>
                                      ))
                                    ) : (
                                      <span className="font-bold text-gray-700">{s.oilType}</span>
                                    )}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                 <div className="flex flex-col">
                                    {s.serviceItems && s.serviceItems.length > 0 ? (
                                      s.serviceItems.map((item, i) => (
                                        <p key={i} className="text-[10px] text-gray-400 uppercase leading-tight">{item}</p>
                                      ))
                                    ) : (
                                      <p className="text-[10px] text-gray-400 uppercase">{s.viscosity}</p>
                                    )}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-amber-600 font-mono">{s.nextChangeKm.toLocaleString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <div className="w-20 h-20 bg-amber-50 rounded-full mx-auto mb-6 flex items-center justify-center text-amber-500 border border-amber-100 shadow-sm">
                  <MapPin size={32} />
               </div>
               
               <div className="text-center">
                 <h4 className="font-bold text-gray-800 text-lg uppercase tracking-tight">Nossa Loja</h4>
                 <p className="text-sm text-gray-500 mt-2">Al. Vieira de Carvalho, 145<br />Santa Terezinha, Santo André - SP</p>
                 <p className="text-sm font-bold text-amber-600 mt-2 font-mono">(11) 2677-8409</p>
               </div>

               <div className="mt-6 pt-6 border-t border-gray-100 flex gap-2 justify-center items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
               </div>
               
               <button 
                 onClick={handleBookWhatsApp}
                 className="w-full mt-8 py-4 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-2xl font-bold shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 active:scale-95"
               >
                  Agendar via WhatsApp
               </button>
               

            </div>

            <div className="bg-[#1C1E21] p-8 rounded-3xl shadow-sm text-white">
               <h4 className="font-bold flex items-center gap-2 mb-4">
                  Dica do Especialista
               </h4>
               <p className="text-sm text-gray-400 leading-relaxed italic">
                 "Trocar o óleo no prazo correto prolonga a vida útil do seu motor e economiza combustível."
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
