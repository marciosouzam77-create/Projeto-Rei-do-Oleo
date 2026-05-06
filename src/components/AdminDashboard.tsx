
import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Car, Plus, Search, Bell, History, 
  MessageCircle, TrendingUp, Calendar, AlertTriangle,
  ChevronRight, X
} from 'lucide-react';
import { api } from '../lib/api';
import { Customer, Vehicle, Service } from '../types';
import ServiceForm from './ServiceForm';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'vehicles' | 'services'>('overview');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const [c, v, s, r] = await Promise.all([
        api.get('/customers'),
        api.get('/vehicles'),
        api.get('/services'),
        api.get('/reminders')
      ]);
      setCustomers(c || []);
      setVehicles(v || []);
      setServices(s || []);
      setReminders(r || []);

      // Automatic Notification Prompt
      const overdue = (r || []).filter((rem: any) => rem.daysLeft <= 0 || rem.kmRemaining <= 0);
      if (overdue.length > 0) {
        if (confirm(`Existem ${overdue.length} notificações de vencimento pendentes. Deseja iniciar o envio automático via WhatsApp?\n\n(Isso abrirá os diálogos de envio um por um)`)) {
          // Send first one to start the flow
          handleSendWhatsApp(overdue[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  };

  // Monthly Stats Calculations
  const currentMonthServices = services.filter(s => {
    const serviceDate = new Date(s.date);
    const now = new Date();
    return serviceDate.getMonth() === now.getMonth() && serviceDate.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = currentMonthServices.reduce((acc, s) => acc + s.totalPrice, 0);
  const averageTicket = currentMonthServices.length > 0 ? monthlyIncome / currentMonthServices.length : 0;
  const monthlyGoal = 15000;
  const goalProgress = Math.min((monthlyIncome / monthlyGoal) * 100, 100);

  const handleSendWhatsApp = (reminder: any) => {
    const message = `Olá, ${reminder.customerName}!\n\nAqui é do *Rei do Óleo - Santa Terezinha*.\n\nPassando para avisar que seu veículo *${reminder.brand} ${reminder.model} (Placa: ${reminder.plate})* está próximo da data ou KM da nova troca de óleo.\n\nStatus: ${reminder.reason}\nKM Atual: ${reminder.currentKm.toLocaleString()} KM\nPróxima Troca: ${reminder.nextChangeKm?.toLocaleString()} KM ou ${new Date(reminder.nextChangeDate).toLocaleDateString()}\n\nDeseja agendar um horário para garantir a saúde do seu motor?\n\nPor favor ligar para Telefone: (11) 2677-8409 ou compareça em nossa loja:\n\nEndereço: Alameda Vieira de Carvalho, 145 - Santa Terezinha, Santo André - SP, 09210-630\n\n*HORÁRIOS DE FUNCIONAMENTO*\n\nsegunda-feira 08:00–19:00\nterça-feira 08:00–19:00\nquarta-feira 08:00–19:00\nquinta-feira 08:00–19:00\nsexta-feira 08:00–19:00\nsábado 08:00–16:00\ndomingo: Fechado`;
    const url = `https://wa.me/55${reminder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'N/A';

  return (
    <div className="space-y-6">
      {/* Mini Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clientes', val: customers.length, color: 'blue' },
          { label: 'Veículos', val: vehicles.length, color: 'purple' },
          { label: 'Serviços Total', val: services.length, color: 'green' },
          { label: 'Avisos Pendentes', val: reminders.length, color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-3 h-12 bg-${stat.color}-500 rounded-full`} />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold">{stat.val}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
        {(['overview', 'customers', 'vehicles', 'services'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab 
              ? 'bg-amber-500 text-white shadow-md shadow-amber-200' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {tab === 'overview' ? 'Início' : 
             tab === 'customers' ? 'Clientes' : 
             tab === 'vehicles' ? 'Veículos' : 'Histórico'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reminders List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
               Avisos Sugeridos
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               {reminders.length === 0 ? (
                 <div className="p-12 text-center text-gray-400">
                    Nenhum aviso pendente para os próximos 7 dias.
                 </div>
               ) : (
                 <div className="divide-y divide-gray-50">
                    {reminders.map(r => (
                      <div key={r.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                           <div>
                              <h4 className="font-bold text-gray-800">{r.customerName}</h4>
                              <p className="text-xs text-gray-500 font-medium">
                                {r.brand} {r.model} • <span className="font-mono text-amber-600">{r.plate}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${r.daysLeft <= 0 || r.kmRemaining <= 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                  {r.reason}
                                </span>
                                <span className="text-[10px] text-gray-400">Póx: {r.nextChangeKm} KM</span>
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (confirm(`Deseja enviar a mensagem de agradecimento para ${r.customerName}?`)) {
                              const url = `https://wa.me/55${r.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${r.customerName}! Agradecemos a preferência!`)}`;
                              window.open(url, '_blank');
                            } else {
                              handleSendWhatsApp(r);
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
                        >
                          Enviar WhatsApp
                        </button>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>

          {/* Quick Actions / Recent Activity */}
          <div className="space-y-4">
             <h2 className="text-xl font-bold">Ações Rápidas</h2>
             <div className="space-y-2">
                <button 
                  onClick={() => setShowServiceForm(true)}
                  className="w-full p-4 bg-white hover:bg-amber-50 border border-gray-100 rounded-2xl flex items-center justify-between group transition-all"
                >
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-100 text-amber-600 rounded-xl group-hover:bg-amber-200 transition-colors">
                         <Plus size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold">Nova Troca</p>
                        <p className="text-xs text-gray-400">Registrar serviço novo</p>
                      </div>
                   </div>
                   <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold mb-4 flex items-center gap-2">
                      Rendimento Mensal
                   </h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                         <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Total do Mês</p>
                            <p className="font-bold text-lg text-green-600">
                               R$ {monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Média / Serviço</p>
                            <p className="font-bold text-gray-700">
                               R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                         </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                           <span>Progresso da Meta</span>
                           <span>{goalProgress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-50">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${goalProgress}%` }}
                             className="bg-green-500 h-full shadow-sm" 
                           />
                        </div>
                        <p className="text-[10px] text-gray-400 italic">Meta mensal: R$ {monthlyGoal.toLocaleString('pt-BR')} ({goalProgress.toFixed(1)}% atingido)</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
           <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Base de Clientes</h2>
              <button 
                onClick={() => setShowCustomerForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-100"
              >
                 <Plus size={18} /> Novo Cliente
              </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-gray-50 text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                   <th className="px-6 py-4 font-bold">Nome</th>
                   <th className="px-6 py-4 font-bold">Telefone</th>
                   <th className="px-6 py-4 font-bold">Email</th>
                   <th className="px-6 py-4 font-bold">Cadastro</th>
                   <th className="px-6 py-4 font-bold"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {customers.map(c => (
                   <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4 font-bold text-gray-800">{c.name}</td>
                     <td className="px-6 py-4 text-sm text-gray-600 font-mono">{c.phone}</td>
                     <td className="px-6 py-4 text-sm text-gray-500">{c.email || '-'}</td>
                     <td className="px-6 py-4 text-sm text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                     <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditingCustomer(c); setShowCustomerForm(true); }}
                          className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                          title="Editar Cliente"
                        >
                           <Search size={18} />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
           <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Frota de Veículos</h2>
              <button 
                onClick={() => setShowVehicleForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-100"
              >
                 <Plus size={18} /> Novo Veículo
              </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-gray-50 text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                   <th className="px-6 py-4 font-bold">Placa</th>
                   <th className="px-6 py-4 font-bold">Modelo</th>
                   <th className="px-6 py-4 font-bold">Proprietário</th>
                   <th className="px-6 py-4 font-bold">KM Atual</th>
                   <th className="px-6 py-4 font-bold">Próx. Troca</th>
                   <th className="px-6 py-4 font-bold"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {vehicles.map(v => (
                   <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4 font-mono font-bold text-amber-600">{v.plate}</td>
                     <td className="px-6 py-4 text-sm text-gray-800">{v.brand} {v.model}</td>
                     <td className="px-6 py-4 text-sm text-gray-600">{getCustomerName(v.customerId)}</td>
                     <td className="px-6 py-4 text-sm font-mono">{v.currentKm.toLocaleString()}</td>
                     <td className="px-6 py-4 text-sm font-mono text-orange-600 font-bold">{v.nextChangeKm?.toLocaleString() || '-'}</td>
                     <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditingVehicle(v); setShowVehicleForm(true); }}
                          className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                          title="Editar Veículo"
                        >
                           <Search size={18} />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
           <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Troca de óleo/Serviços</h2>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-gray-50 text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                   <th className="px-6 py-4 font-bold">Data</th>
                   <th className="px-6 py-4 font-bold">Placa</th>
                   <th className="px-6 py-4 font-bold">Óleo</th>
                    <th className="px-6 py-4 font-bold">Serviços</th>
                   <th className="px-6 py-4 font-bold">KM Atual</th>
                   <th className="px-6 py-4 font-bold">Valor</th>
                   <th className="px-6 py-4 font-bold">Status</th>
                   <th className="px-6 py-4 font-bold"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {services.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(s => {
                   const vehicle = vehicles.find(v => v.id === s.vehicleId);
                   
                   // Status Alert
                   const nextDate = new Date(s.nextChangeDate);
                   const today = new Date();
                   const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                   const kmRemaining = vehicle ? s.nextChangeKm - vehicle.currentKm : 9999;
                   const needsAttention = daysLeft <= 7 || kmRemaining <= 500;

                   return (
                     <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-6 py-4 text-sm text-gray-500">{new Date(s.date).toLocaleDateString()}</td>
                       <td className="px-6 py-4 font-mono font-bold text-gray-700">{vehicle?.plate || '-'}</td>
                       <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col">
                              {s.oilItems && s.oilItems.length > 0 ? (
                                s.oilItems.map((item: string, i: number) => (
                                  <span key={i} className="font-bold text-gray-800 text-xs leading-tight">{item}</span>
                                ))
                              ) : (
                                <span className="font-bold text-gray-800">{s.oilType}</span>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                           <div className="flex flex-col">
                              {s.serviceItems && s.serviceItems.length > 0 ? (
                                s.serviceItems.map((item: string, i: number) => (
                                  <p key={i} className="text-[10px] text-gray-400 uppercase leading-tight mt-0.5">{item}</p>
                                ))
                              ) : (
                                <p className="text-[10px] text-gray-400 uppercase">{s.viscosity}</p>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">{s.currentKm.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600">R$ {s.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] uppercase font-black ${needsAttention ? 'text-red-600' : 'text-green-600'}`}>
                                 {needsAttention ? 'Atenção' : 'OK'}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-1">
                           <button 
                             onClick={() => {
                               const customer = customers.find(c => c.id === (vehicles.find(v => v.id === s.vehicleId)?.customerId));
                               const vehicle = vehicles.find(v => v.id === s.vehicleId);
                               if (!customer || !vehicle) return;

                               if (confirm(`Deseja enviar a mensagem de agradecimento para ${customer.name}?`)) {
                                 const url = `https://wa.me/55${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${customer.name}! Agradecemos a preferência!`)}`;
                                 window.open(url, '_blank');
                               } else {
                                 const nextDateStr = new Date(s.nextChangeDate).toLocaleDateString();
                                 const statusMsg = needsAttention 
                                   ? `notamos que sua troca está PRÓXIMA (${s.nextChangeKm.toLocaleString()} KM ou ${nextDateStr})`
                                   : `sua próxima troca está prevista para ${s.nextChangeKm.toLocaleString()} KM ou ${nextDateStr}`;

                                 const message = `Olá, ${customer.name}!\n\nAqui é do *Rei do Óleo - Santa Terezinha*.\n\nPassando para avisar que seu veículo *${vehicle.brand} ${vehicle.model} (Placa: ${vehicle.plate})* ${statusMsg}.\n\nDeseja agendar um horário?\n\nPor favor ligar para Telefone: (11) 2677-8409 ou compareça em nossa loja:\n\nEndereço: Alameda Vieira de Carvalho, 145 - Santa Terezinha, Santo André - SP, 09210-630\n\n*HORÁRIOS DE FUNCIONAMENTO*\n\nsegunda-feira 08:00–19:00\nterça-feira 08:00–19:00\nquarta-feira 08:00–19:00\nquinta-feira 08:00–19:00\nsexta-feira 08:00–19:00\nsábado 08:00–16:00\ndomingo: Fechado`;
                                 const url = `https://wa.me/55${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                                 window.open(url, '_blank');
                               }
                             }}
                             className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all"
                             title="Enviar WhatsApp"
                           >
                              <div className="flex items-center gap-1">
                                 <span className="text-[10px] font-bold">ZAP</span>
                              </div>
                           </button>
                           <button 
                             onClick={async () => {
                               if (confirm('Tem certeza que deseja excluir este registro de serviço?')) {
                                 try {
                                   await api.delete(`/services/${s.id}`);
                                   fetchData();
                                 } catch (err) { alert('Erro ao excluir'); }
                               }
                             }}
                             className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                             title="Excluir Serviço"
                           >
                              <X size={18} />
                           </button>
                           <button 
                             onClick={() => { setEditingService(s); setShowServiceForm(true); }}
                             className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                           >
                              <Search size={18} />
                           </button>
                        </td>
                      </tr>
                     );
                   })}
                   {services.length === 0 && (
                     <tr>
                       <td colSpan={8} className="px-6 py-20 text-center text-gray-400">
                         Nenhum registro de serviço encontrado.
                       </td>
                     </tr>
                   )}
                </tbody>
             </table>
           </div>
        </div>
      )}
      
      {showServiceForm && (
        <ServiceForm 
          onClose={() => {
            setShowServiceForm(false);
            setEditingService(null);
            fetchData();
          }} 
          customers={customers}
          vehicles={vehicles}
          initialData={editingService}
        />
      )}

      {showCustomerForm && (
        <CustomerForm 
          onClose={() => {
            setShowCustomerForm(false);
            setEditingCustomer(null);
            fetchData();
          }}
          initialData={editingCustomer}
        />
      )}

      {showVehicleForm && (
        <VehicleForm 
          onClose={() => {
            setShowVehicleForm(false);
            setEditingVehicle(null);
            fetchData();
          }}
          customers={customers}
          initialData={editingVehicle}
        />
      )}
    </div>
  );
}

// --- Local Components for Admin Forms ---

function CustomerForm({ onClose, initialData }: { onClose: () => void, initialData?: Customer | null }) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData) {
        await api.put(`/customers/${initialData.id}`, { name, phone, email });
      } else {
        await api.post('/customers', { name, phone, email });
      }
      onClose();
    } catch (err) { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h2 className="text-xl font-bold mb-6">{initialData ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Nome Completo</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">WhatsApp (com DDD)</label>
            <input required value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Email (Opcional)</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
          </div>
          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold">Cancelar</button>
             <button disabled={loading} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 uppercase text-sm">
                {loading ? 'Salvando...' : 'Cadastrar'}
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function VehicleForm({ onClose, customers, initialData }: { onClose: () => void, customers: Customer[], initialData?: Vehicle | null }) {
  const [customerId, setCustomerId] = useState(initialData?.customerId || '');
  const [plate, setPlate] = useState(initialData?.plate || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [currentKm, setCurrentKm] = useState(initialData?.currentKm || 0);
  const [password, setPassword] = useState('');
  const [mustChange, setMustChange] = useState(initialData ? false : true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { customerId, plate, brand, model, currentKm, mustChangePassword: mustChange };
      if (password) payload.password = password;

      if (initialData) {
        await api.put(`/vehicles/${initialData.id}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }
      onClose();
    } catch (err) { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h2 className="text-xl font-bold mb-6">{initialData ? 'Editar Veículo' : 'Novo Veículo'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Dono do Carro</label>
            <select required value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none appearance-none">
                <option value="">Selecione o Cliente</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase">Placa</label>
               <input required value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono" />
             </div>
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase">KM Atual</label>
               <input type="number" required value={currentKm} onChange={e => setCurrentKm(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Marca</label>
              <input required value={brand} onChange={e => setBrand(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Modelo</label>
              <input required value={model} onChange={e => setModel(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            </div>
          </div>

          <div className="pt-2">
             <label className="text-xs font-bold text-gray-400 uppercase">Senha de Acesso {initialData && '(Deixe vazio para manter)'}</label>
             <input 
               type="password" 
               placeholder={initialData ? "Sua nova senha" : "Senha padrão (inicial)"}
               value={password} 
               onChange={e => setPassword(e.target.value)} 
               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
             />
             <div className="mt-2 flex items-center gap-2">
                <input 
                   type="checkbox" 
                   id="mustChange"
                   checked={mustChange}
                   onChange={e => setMustChange(e.target.checked)}
                   className="w-4 h-4 accent-amber-500"
                />
                <label htmlFor="mustChange" className="text-xs font-bold text-gray-500 cursor-pointer">Trocar senha no primeiro acesso</label>
             </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold">Cancelar</button>
             <button disabled={loading} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 uppercase text-sm">
                {loading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Cadastrar')}
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
