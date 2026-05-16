import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Car, ClipboardList, User, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { api } from '../lib/api';
import {
  Customer, Vehicle, CheckIn,
  CHECKLIST_ITEMS, ChecklistItem, ChecklistCondition,
} from '../types';

interface CheckInFormProps {
  onClose: () => void;
  customers: Customer[];
  vehicles: Vehicle[];
  initialData?: CheckIn | null;
}

const CONDITION_OPTIONS: { value: ChecklistCondition; label: string; icon: typeof CheckCircle; color: string }[] = [
  { value: 'Bom',           label: 'Bom',         icon: CheckCircle,  color: 'text-green-500' },
  { value: 'Ruim',          label: 'Ruim',         icon: XCircle,      color: 'text-red-500' },
  { value: 'Não verificado',label: 'N/V',          icon: MinusCircle,  color: 'text-gray-400' },
];

function buildEmptyChecklist(): Record<ChecklistItem, ChecklistCondition> {
  return Object.fromEntries(
    CHECKLIST_ITEMS.map(item => [item, 'Não verificado'])
  ) as Record<ChecklistItem, ChecklistCondition>;
}

export default function CheckInForm({ onClose, customers, vehicles, initialData }: CheckInFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    if (initialData) {
      return vehicles.find(v => v.id === initialData.vehicleId)?.customerId || '';
    }
    return '';
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialData?.vehicleId || '');
  const [currentKm, setCurrentKm] = useState<number>(initialData?.currentKm || 0);
  const [clientNotes, setClientNotes] = useState(initialData?.clientNotes || '');
  const [mechanic, setMechanic] = useState(initialData?.mechanic || '');
  const [checklist, setChecklist] = useState<Record<ChecklistItem, ChecklistCondition>>(
    initialData?.checklist || buildEmptyChecklist()
  );
  const [observations, setObservations] = useState(initialData?.observations || '');

  const filteredVehicles = vehicles.filter(v => v.customerId === selectedCustomerId);
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const ruimItems = CHECKLIST_ITEMS.filter(item => checklist[item] === 'Ruim');
  const naoVerificados = CHECKLIST_ITEMS.filter(item => checklist[item] === 'Não verificado');

  const setCondition = (item: ChecklistItem, value: ChecklistCondition) => {
    setChecklist(prev => ({ ...prev, [item]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        vehicleId: selectedVehicleId,
        currentKm,
        clientNotes,
        mechanic,
        checklist,
        observations,
        status: initialData?.status || 'Aguardando',
      };

      if (initialData) {
        await api.put(`/checkins/${initialData.id}`, payload);
      } else {
        await api.post('/checkins', payload);
      }
      onClose();
    } catch {
      alert('Erro ao salvar check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {initialData ? 'Editar Check-in' : 'Check-in de Veículo'}
            </h2>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`h-1 rounded-full transition-all ${
                    s <= step ? 'bg-amber-500 w-8' : 'bg-gray-200 w-4'
                  }`}
                />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {/* STEP 1 — Identificação */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="flex items-center gap-3 text-amber-600 mb-2">
                <User size={20} />
                <h3 className="font-bold">Identificação</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Cliente</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => { setSelectedCustomerId(e.target.value); setSelectedVehicleId(''); }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
              </div>

              {selectedCustomerId && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Veículo</label>
                  <select
                    value={selectedVehicleId}
                    onChange={e => {
                      setSelectedVehicleId(e.target.value);
                      const v = vehicles.find(vv => vv.id === e.target.value);
                      if (v && !initialData) setCurrentKm(v.currentKm);
                    }}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">Selecione o veículo...</option>
                    {filteredVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} {v.year ? `(${v.year})` : ''} — {v.plate}
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}

              {selectedVehicleId && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">KM de Entrada</label>
                      <div className="flex items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                        <Car size={18} className="text-amber-500 shrink-0" />
                        <input
                          type="number"
                          value={currentKm}
                          onChange={e => setCurrentKm(Number(e.target.value))}
                          className="w-full bg-transparent text-xl font-bold font-mono outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Mecânico</label>
                      <input
                        value={mechanic}
                        onChange={e => setMechanic(e.target.value)}
                        placeholder="Nome do técnico"
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Relato do Cliente</label>
                    <textarea
                      value={clientNotes}
                      onChange={e => setClientNotes(e.target.value)}
                      rows={3}
                      placeholder="O que o cliente relatou? (barulhos, problemas, pedidos...)"
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none resize-none text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 2 — Checklist de Fluidos e Filtros */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="flex items-center gap-3 text-amber-600 mb-2">
                <ClipboardList size={20} />
                <h3 className="font-bold">Checklist de Fluidos e Filtros</h3>
              </div>

              <div className="grid gap-2">
                {CHECKLIST_ITEMS.map(item => {
                  const current = checklist[item];
                  return (
                    <div
                      key={item}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        current === 'Ruim'
                          ? 'bg-red-50 border-red-200'
                          : current === 'Bom'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="text-sm font-semibold text-gray-700 w-44">{item}</span>
                      <div className="flex gap-1">
                        {CONDITION_OPTIONS.map(opt => {
                          const Icon = opt.icon;
                          const active = current === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setCondition(item, opt.value)}
                              title={opt.value}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                active
                                  ? opt.value === 'Bom'
                                    ? 'bg-green-500 text-white border-green-500'
                                    : opt.value === 'Ruim'
                                    ? 'bg-red-500 text-white border-red-500'
                                    : 'bg-gray-400 text-white border-gray-400'
                                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Icon size={14} />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Resumo e Observações */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-amber-600 mb-2">
                <ClipboardList size={20} />
                <h3 className="font-bold">Resumo da Inspeção</h3>
              </div>

              {/* Vehicle summary */}
              {selectedVehicle && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
                  <Car size={28} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="font-bold text-gray-800">{selectedVehicle.brand} {selectedVehicle.model}</p>
                    <p className="text-sm text-gray-500 font-mono">{selectedVehicle.plate} · {currentKm.toLocaleString()} km</p>
                  </div>
                </div>
              )}

              {/* Items needing attention */}
              {ruimItems.length > 0 && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                  <p className="text-xs font-black text-red-500 uppercase mb-2 flex items-center gap-1">
                    <XCircle size={14} /> Itens que necessitam atenção ({ruimItems.length})
                  </p>
                  <ul className="space-y-1">
                    {ruimItems.map(item => (
                      <li key={item} className="text-sm font-semibold text-red-700">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {ruimItems.length === 0 && naoVerificados.length < CHECKLIST_ITEMS.length && (
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                  <p className="text-xs font-black text-green-600 uppercase flex items-center gap-1">
                    <CheckCircle size={14} /> Todos os itens verificados estão em bom estado
                  </p>
                </div>
              )}

              {naoVerificados.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase">{naoVerificados.length} item(s) não verificado(s)</p>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Observações do Técnico</label>
                <textarea
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  rows={4}
                  placeholder="Detalhes adicionais observados durante a inspeção..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none resize-none text-sm"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button
            disabled={step === 1}
            onClick={() => setStep(s => s - 1)}
            className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 disabled:opacity-0 transition-all"
          >
            VOLTAR
          </button>
          <div className="flex gap-3">
            {step < 3 ? (
              <button
                disabled={step === 1 && !selectedVehicleId}
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
                <Save size={18} /> {loading ? 'ABRINDO OS...' : 'ABRIR ORDEM DE SERVIÇO'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
