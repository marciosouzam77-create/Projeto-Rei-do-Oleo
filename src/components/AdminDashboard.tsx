
import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  Users, Car, Plus, Search, Bell, History,
  MessageCircle, TrendingUp, Calendar, AlertTriangle,
  ChevronRight, X, ClipboardList, CheckCircle, XCircle, MinusCircle, ChevronDown,
  Settings, Trash2, Edit3, Clock
} from 'lucide-react';
import { api } from '../lib/api';
import {
  Customer, Vehicle, Service, CheckIn, ServiceCatalogItem,
  FUEL_TYPES, COLORS, OS_STATUS_FLOW, OSStatus, CHECKLIST_ITEMS,
  SERVICE_CATEGORIES, ServiceCategory,
} from '../types';
import ServiceForm from './ServiceForm';
import CheckInForm from './CheckInForm';
import CheckOutForm from './CheckOutForm';

const STATUS_COLORS: Record<OSStatus, string> = {
  'Aguardando':  'bg-yellow-100 text-yellow-700',
  'Em serviço':  'bg-blue-100 text-blue-700',
  'Pronto':      'bg-green-100 text-green-700',
  'Entregue':    'bg-gray-100 text-gray-500',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'checkins' | 'customers' | 'vehicles' | 'services' | 'catalog'>('overview');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<CheckIn | null>(null);
  const [expandedCheckIn, setExpandedCheckIn] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
    setSearchQuery('');
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const [c, v, s, r, ci, cat] = await Promise.all([
        api.get('/customers'),
        api.get('/vehicles'),
        api.get('/services'),
        api.get('/reminders'),
        api.get('/checkins'),
        api.get('/catalog'),
      ]);
      setCustomers(c || []);
      setVehicles(v || []);
      setServices(s || []);
      setReminders(r || []);
      setCheckins(ci || []);
      setCatalog(cat || []);

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Clientes', val: customers.length, color: 'blue' },
          { label: 'Veículos', val: vehicles.length, color: 'purple' },
          { label: 'Serviços Total', val: services.length, color: 'green' },
          { label: 'OS Abertas', val: checkins.filter(c => c.status !== 'Entregue').length, color: 'amber' },
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

      <div className="flex flex-wrap bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit gap-0.5">
        {([
          { key: 'overview',   label: 'Início' },
          { key: 'checkins',   label: 'Ordens de Serviço' },
          { key: 'customers',  label: 'Clientes' },
          { key: 'vehicles',   label: 'Veículos' },
          { key: 'services',   label: 'Histórico' },
          { key: 'catalog',    label: 'Catálogo' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
              ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.key === 'checkins' && checkins.filter(c => c.status !== 'Entregue').length > 0 && (
              <span className="ml-2 bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {checkins.filter(c => c.status !== 'Entregue').length}
              </span>
            )}
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
                  onClick={() => setShowCheckInForm(true)}
                  className="w-full p-4 bg-white hover:bg-blue-50 border border-gray-100 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <ClipboardList size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Check-in de Veículo</p>
                      <p className="text-xs text-gray-400">Abrir nova ordem de serviço</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                </button>

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
                        <p className="text-xs text-gray-400">Registrar serviço no histórico</p>
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

      {activeTab === 'checkins' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList size={22} className="text-amber-500" /> Ordens de Serviço
            </h2>
            <button
              onClick={() => setShowCheckInForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-100 whitespace-nowrap"
            >
              <Plus size={18} /> Novo Check-in
            </button>
          </div>

          {/* Status columns — kanban-lite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OS_STATUS_FLOW.map(status => {
              const statusCheckins = checkins.filter(ci => ci.status === status);
              return (
                <div key={status} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className={`px-4 py-3 flex items-center justify-between ${
                    status === 'Aguardando' ? 'bg-yellow-50 border-b border-yellow-100' :
                    status === 'Em serviço' ? 'bg-blue-50 border-b border-blue-100' :
                    status === 'Pronto'     ? 'bg-green-50 border-b border-green-100' :
                    'bg-gray-50 border-b border-gray-100'
                  }`}>
                    <span className={`text-xs font-black uppercase tracking-wider ${
                      status === 'Aguardando' ? 'text-yellow-700' :
                      status === 'Em serviço' ? 'text-blue-700' :
                      status === 'Pronto'     ? 'text-green-700' :
                      'text-gray-500'
                    }`}>{status}</span>
                    <span className="text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      {statusCheckins.length}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {statusCheckins.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-6">Nenhuma OS</p>
                    )}
                    {statusCheckins.map(ci => {
                      const vehicle = vehicles.find(v => v.id === ci.vehicleId);
                      const customer = customers.find(c => c.id === vehicle?.customerId);
                      const ruimCount = Object.values(ci.checklist || {}).filter(v => v === 'Ruim').length;
                      const isExpanded = expandedCheckIn === ci.id;

                      return (
                        <div key={ci.id} className="p-3 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 text-sm truncate">{customer?.name || '—'}</p>
                              <p className="text-xs text-amber-600 font-mono font-bold">{vehicle?.plate || '—'}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {vehicle?.brand} {vehicle?.model} · {ci.currentKm.toLocaleString()} km
                              </p>
                              {ci.mechanic && (
                                <p className="text-[10px] text-gray-400">Mec: {ci.mechanic}</p>
                              )}
                              {ruimCount > 0 && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                                  <XCircle size={10} /> {ruimCount} item(s) com atenção
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setExpandedCheckIn(isExpanded ? null : ci.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5 shrink-0"
                            >
                              <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>

                          {/* Expanded checklist */}
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3 pt-3 border-t border-gray-100 space-y-1"
                            >
                              {CHECKLIST_ITEMS.map(item => {
                                const cond = ci.checklist?.[item] || 'Não verificado';
                                return (
                                  <div key={item} className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500">{item}</span>
                                    <span className={`text-[10px] font-bold ${
                                      cond === 'Bom' ? 'text-green-600' :
                                      cond === 'Ruim' ? 'text-red-500' : 'text-gray-400'
                                    }`}>{cond}</span>
                                  </div>
                                );
                              })}
                              {ci.clientNotes && (
                                <div className="pt-2 border-t border-gray-100">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Relato</p>
                                  <p className="text-xs text-gray-600 italic">{ci.clientNotes}</p>
                                </div>
                              )}
                              {ci.observations && (
                                <div className="pt-1">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Observações</p>
                                  <p className="text-xs text-gray-600 italic">{ci.observations}</p>
                                </div>
                              )}
                            </motion.div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
                            {/* Status advance / checkout */}
                            {status === 'Pronto' ? (
                              <button
                                onClick={() => setCheckoutTarget(ci)}
                                className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                              >
                                Entregar →
                              </button>
                            ) : status !== 'Entregue' ? (
                              <button
                                onClick={async () => {
                                  const nextStatus = OS_STATUS_FLOW[OS_STATUS_FLOW.indexOf(status) + 1];
                                  await api.put(`/checkins/${ci.id}`, { status: nextStatus });
                                  fetchData();
                                }}
                                className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                              >
                                → {OS_STATUS_FLOW[OS_STATUS_FLOW.indexOf(status) + 1]}
                              </button>
                            ) : null}
                            <button
                              onClick={() => { setEditingCheckIn(ci); setShowCheckInForm(true); }}
                              className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Search size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Excluir esta OS?')) {
                                  await api.delete(`/checkins/${ci.id}`);
                                  fetchData();
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
           <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h2 className="text-xl font-bold">Base de Clientes</h2>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome, tel..."
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-56"
                  />
                </div>
                <button
                  onClick={() => setShowCustomerForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-100 whitespace-nowrap"
                >
                  <Plus size={18} /> Novo Cliente
                </button>
              </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-gray-50 text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                   <th className="px-6 py-4 font-bold">Nome</th>
                   <th className="px-6 py-4 font-bold">Tipo</th>
                   <th className="px-6 py-4 font-bold">CPF / CNPJ</th>
                   <th className="px-6 py-4 font-bold">Telefone</th>
                   <th className="px-6 py-4 font-bold">Email</th>
                   <th className="px-6 py-4 font-bold">Cadastro</th>
                   <th className="px-6 py-4 font-bold"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {customers
                   .filter(c => {
                     if (!searchQuery) return true;
                     const q = searchQuery.toLowerCase();
                     return (
                       c.name.toLowerCase().includes(q) ||
                       c.phone.includes(q) ||
                       (c.email || '').toLowerCase().includes(q)
                     );
                   })
                   .map(c => (
                   <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4 font-bold text-gray-800">{c.name}</td>
                     <td className="px-6 py-4">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.personType === 'PJ' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                         {c.personType || 'PF'}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-sm font-mono text-gray-500">{c.cpf || c.cnpj || '-'}</td>
                     <td className="px-6 py-4 text-sm text-gray-600 font-mono">{c.phone}</td>
                     <td className="px-6 py-4 text-sm text-gray-500">{c.email || '-'}</td>
                     <td className="px-6 py-4 text-sm text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                     <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => setViewingCustomer(c)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Histórico do Cliente"
                        >
                          <History size={18} />
                        </button>
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
           <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h2 className="text-xl font-bold">Frota de Veículos</h2>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar por placa, modelo..."
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-56"
                  />
                </div>
                <button
                  onClick={() => setShowVehicleForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-100 whitespace-nowrap"
                >
                  <Plus size={18} /> Novo Veículo
                </button>
              </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-gray-50 text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50/50">
                   <th className="px-6 py-4 font-bold">Placa</th>
                   <th className="px-6 py-4 font-bold">Veículo</th>
                   <th className="px-6 py-4 font-bold">Ano</th>
                   <th className="px-6 py-4 font-bold">Combustível</th>
                   <th className="px-6 py-4 font-bold">Proprietário</th>
                   <th className="px-6 py-4 font-bold">KM Atual</th>
                   <th className="px-6 py-4 font-bold">Próx. Troca</th>
                   <th className="px-6 py-4 font-bold"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {vehicles
                   .filter(v => {
                     if (!searchQuery) return true;
                     const q = searchQuery.toLowerCase();
                     return (
                       v.plate.toLowerCase().includes(q) ||
                       v.brand.toLowerCase().includes(q) ||
                       v.model.toLowerCase().includes(q) ||
                       getCustomerName(v.customerId).toLowerCase().includes(q)
                     );
                   })
                   .map(v => (
                   <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4 font-mono font-bold text-amber-600">{v.plate}</td>
                     <td className="px-6 py-4 text-sm text-gray-800">
                       <div>{v.brand} {v.model}</div>
                       {v.color && <div className="text-[10px] text-gray-400">{v.color}</div>}
                     </td>
                     <td className="px-6 py-4 text-sm text-gray-500">{v.year || '-'}</td>
                     <td className="px-6 py-4 text-sm text-gray-500">{v.fuel || '-'}</td>
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
      
      {/* Catálogo de Serviços */}
      {activeTab === 'catalog' && (
        <ServiceCatalogTab catalog={catalog} onRefresh={fetchData} />
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

      {showCheckInForm && (
        <CheckInForm
          onClose={() => {
            setShowCheckInForm(false);
            setEditingCheckIn(null);
            fetchData();
          }}
          customers={customers}
          vehicles={vehicles}
          initialData={editingCheckIn}
        />
      )}

      {checkoutTarget && (() => {
        const vehicle = vehicles.find(v => v.id === checkoutTarget.vehicleId);
        const customer = customers.find(c => c.id === vehicle?.customerId);
        if (!vehicle || !customer) return null;
        return (
          <CheckOutForm
            checkin={checkoutTarget}
            vehicle={vehicle}
            customer={customer}
            onClose={() => { setCheckoutTarget(null); fetchData(); }}
          />
        );
      })()}

      {viewingCustomer && (
        <CustomerHistoryModal
          customer={viewingCustomer}
          vehicles={vehicles.filter(v => v.customerId === viewingCustomer.id)}
          services={services}
          onClose={() => setViewingCustomer(null)}
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
  const [personType, setPersonType] = useState<'PF' | 'PJ'>(initialData?.personType || 'PF');
  const [name, setName] = useState(initialData?.name || '');
  const [cpf, setCpf] = useState(initialData?.cpf || '');
  const [cnpj, setCnpj] = useState(initialData?.cnpj || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { name, phone, email, personType, address };
      if (personType === 'PF') payload.cpf = cpf;
      else payload.cnpj = cnpj;

      if (initialData) {
        await api.put(`/customers/${initialData.id}`, payload);
      } else {
        await api.post('/customers', payload);
      }
      onClose();
    } catch { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">{initialData ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PF / PJ toggle */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Tipo de Pessoa</label>
            <div className="flex gap-3">
              {(['PF', 'PJ'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPersonType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    personType === type
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">
              {personType === 'PF' ? 'Nome Completo' : 'Razão Social'}
            </label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none mt-1" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">
              {personType === 'PF' ? 'CPF' : 'CNPJ'}
            </label>
            {personType === 'PF' ? (
              <input
                value={cpf}
                onChange={e => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono mt-1"
              />
            ) : (
              <input
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono mt-1"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">WhatsApp (com DDD)</label>
            <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Email (Opcional)</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Endereço (Opcional)</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none mt-1" />
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

function VehicleForm({ onClose, customers, initialData }: { onClose: () => void, customers: Customer[], initialData?: Vehicle | null }) {
  const [customerId, setCustomerId] = useState(initialData?.customerId || '');
  const [plate, setPlate] = useState(initialData?.plate || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [year, setYear] = useState<number | ''>(initialData?.year || '');
  const [color, setColor] = useState(initialData?.color || '');
  const [fuel, setFuel] = useState(initialData?.fuel || '');
  const [chassis, setChassis] = useState(initialData?.chassis || '');
  const [currentKm, setCurrentKm] = useState(initialData?.currentKm || 0);
  const [password, setPassword] = useState('');
  const [mustChange, setMustChange] = useState(initialData ? false : true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { customerId, plate, brand, model, currentKm, mustChangePassword: mustChange };
      if (year) payload.year = Number(year);
      if (color) payload.color = color;
      if (fuel) payload.fuel = fuel;
      if (chassis) payload.chassis = chassis;
      if (password) payload.password = password;

      if (initialData) {
        await api.put(`/vehicles/${initialData.id}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }
      onClose();
    } catch { alert("Erro ao salvar"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">{initialData ? 'Editar Veículo' : 'Novo Veículo'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Dono do Carro</label>
            <select required value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none appearance-none mt-1">
              <option value="">Selecione o Cliente</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Placa</label>
              <input required value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">KM Atual</label>
              <input type="number" required value={currentKm} onChange={e => setCurrentKm(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Marca</label>
              <input required value={brand} onChange={e => setBrand(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Modelo</label>
              <input required value={model} onChange={e => setModel(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Ano</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="2020"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Cor</label>
              <select value={color} onChange={e => setColor(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none mt-1">
                <option value="">Selecione</option>
                {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Combustível</label>
              <select value={fuel} onChange={e => setFuel(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none mt-1">
                <option value="">Selecione</option>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Chassi (Opcional)</label>
            <input value={chassis} onChange={e => setChassis(e.target.value.toUpperCase())} placeholder="9BWZZZ377VT004251" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono mt-1" />
          </div>

          <div className="pt-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Senha de Acesso {initialData && '(Deixe vazio para manter)'}</label>
            <input
              type="password"
              placeholder={initialData ? "Nova senha (opcional)" : "Senha inicial"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none mt-1"
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

// --- Catálogo de Serviços ---

function ServiceCatalogTab({ catalog, onRefresh }: { catalog: ServiceCatalogItem[], onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServiceCatalogItem | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este serviço do catálogo?')) return;
    await api.delete(`/catalog/${id}`);
    onRefresh();
  };

  const grouped = SERVICE_CATEGORIES.map(cat => ({
    category: cat,
    items: catalog.filter(s => s.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings size={22} className="text-amber-500" /> Catálogo de Serviços
        </h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-100"
        >
          <Plus size={18} /> Novo Serviço
        </button>
      </div>

      {grouped.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100 shadow-sm">
          Nenhum serviço cadastrado. Clique em "Novo Serviço" para começar.
        </div>
      )}

      {grouped.map(g => (
        <div key={g.category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{g.category}</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-6 py-3 font-bold">Serviço</th>
                <th className="px-6 py-3 font-bold">Preço Base</th>
                <th className="px-6 py-3 font-bold">Tempo Est.</th>
                <th className="px-6 py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {g.items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                    R$ {item.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.estimatedMinutes ? (
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        {item.estimatedMinutes} min
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => { setEditing(item); setShowForm(true); }}
                      className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {showForm && (
        <CatalogItemForm
          initialData={editing}
          onClose={() => { setShowForm(false); setEditing(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

function CatalogItemForm({ initialData, onClose }: { initialData?: ServiceCatalogItem | null; onClose: () => void }) {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<ServiceCategory>(initialData?.category || 'Geral');
  const [basePrice, setBasePrice] = useState<number>(initialData?.basePrice || 0);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(initialData?.estimatedMinutes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { name, category, basePrice };
      if (estimatedMinutes !== '') payload.estimatedMinutes = Number(estimatedMinutes);

      if (initialData) {
        await api.put(`/catalog/${initialData.id}`, payload);
      } else {
        await api.post('/catalog', payload);
      }
      onClose();
    } catch { alert('Erro ao salvar'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h2 className="text-xl font-bold mb-6">{initialData ? 'Editar Serviço' : 'Novo Serviço'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Nome do Serviço</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value as ServiceCategory)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none mt-1">
              {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Preço Base (R$)</label>
              <input type="number" required value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Tempo (min)</label>
              <input type="number" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Opcional" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono mt-1" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold">Cancelar</button>
            <button disabled={loading} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 uppercase text-sm">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// --- Histórico do Cliente ---

function CustomerHistoryModal({ customer, vehicles, services, onClose }: {
  customer: Customer;
  vehicles: Vehicle[];
  services: Service[];
  onClose: () => void;
}) {
  const customerServices = services.filter(s => vehicles.some(v => v.id === s.vehicleId));
  const totalSpent = customerServices.reduce((acc, s) => acc + s.totalPrice, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{customer.name}</h2>
            <p className="text-sm text-gray-500">{customer.phone} {customer.email ? `· ${customer.email}` : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Veículos', val: vehicles.length },
              { label: 'Serviços', val: customerServices.length },
              { label: 'Total gasto', val: `R$ ${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase">{stat.label}</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{stat.val}</p>
              </div>
            ))}
          </div>

          {/* Vehicles and their services */}
          {vehicles.map(vehicle => {
            const vehicleServices = services
              .filter(s => s.vehicleId === vehicle.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return (
              <div key={vehicle.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                  <Car size={18} className="text-amber-500" />
                  <div>
                    <p className="font-bold text-gray-800">{vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}</p>
                    <p className="text-xs font-mono text-amber-600">{vehicle.plate} · {vehicle.currentKm.toLocaleString()} km</p>
                  </div>
                </div>

                {vehicleServices.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-400">Nenhum serviço registrado.</p>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-50">
                        <th className="px-5 py-3 font-bold">Data</th>
                        <th className="px-5 py-3 font-bold">Óleo</th>
                        <th className="px-5 py-3 font-bold">KM</th>
                        <th className="px-5 py-3 font-bold">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {vehicleServices.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 text-sm text-gray-600">{new Date(s.date).toLocaleDateString()}</td>
                          <td className="px-5 py-3 text-sm font-semibold text-gray-700">
                            {s.oilItems?.[0] || s.oilType}
                          </td>
                          <td className="px-5 py-3 text-sm font-mono text-gray-500">{s.currentKm.toLocaleString()}</td>
                          <td className="px-5 py-3 text-sm font-bold text-green-600">
                            R$ {s.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}

          {vehicles.length === 0 && (
            <p className="text-center text-gray-400 py-8">Nenhum veículo cadastrado para este cliente.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
