
import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Car, User, Droplets, Gauge, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { OIL_PRESETS, Customer, Vehicle, Service } from '../types';

interface ServiceFormProps {
  onClose: () => void;
  customers: Customer[];
  vehicles: Vehicle[];
  initialData?: Service | null;
}

const EXTRA_SERVICES = [
  'Higienização A/C',
  'Troca de Palhetas',
  'Revisão de Freios',
  'Alinhamento',
  'Balanceamento',
  'Troca de Filtro de Cabine',
  'Troca de Filtro de Ar',
  'Troca de Filtro de Combustível',
  'Troca de Velas',
  'Troca de Correia Dentada',
  'Troca de Fluido de Freio',
  'Troca de Fluido de Direção',
  'Troca de Fluido de Arrefecimento',
];

export default function ServiceForm({ onClose, customers, vehicles, initialData }: ServiceFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    if (initialData) {
      const vehicle = vehicles.find(v => v.id === initialData.vehicleId);
      return vehicle?.customerId || '';
    }
    return '';
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialData?.vehicleId || '');
  const [currentKm, setCurrentKm] = useState<number>(initialData?.currentKm || 0);

  const existingNextDate = initialData?.nextChangeDate ? new Date(initialData.nextChangeDate) : null;
  const existingDate = initialData?.date ? new Date(initialData.date) : new Date();
  const monthsDiff = existingNextDate
    ? Math.round((existingNextDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 6;
  const kmDiff = initialData ? initialData.nextChangeKm - initialData.currentKm : 10000;

  const [selectedOilPreset, setSelectedOilPreset] = useState(() => {
    if (initialData?.oilItems?.[0]) {
      const match = Object.keys(OIL_PRESETS).find(k => k === initialData.oilItems![0]);
      return match || 'Óleo Motor - Sintético';
    }
    return 'Óleo Motor - Sintético';
  });
  const [viscosity, setViscosity] = useState(initialData?.viscosity || '5W30');
  const [kmInterval, setKmInterval] = useState(kmDiff);
  const [monthInterval, setMonthInterval] = useState(monthsDiff);
  const [customIntervals, setCustomIntervals] = useState(false);

  const [selectedServices, setSelectedServices] = useState<string[]>(initialData?.serviceItems || []);
  const [customServiceInput, setCustomServiceInput] = useState('');

  const [price, setPrice] = useState<number>(initialData?.totalPrice || 0);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const applyPreset = (presetKey: string) => {
    setSelectedOilPreset(presetKey);
    if (!customIntervals) {
      const preset = OIL_PRESETS[presetKey];
      if (preset) {
        setKmInterval(preset.kmInterval);
        setMonthInterval(preset.monthInterval);
      }
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const addCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (trimmed && !selectedServices.includes(trimmed)) {
      setSelectedServices(prev => [...prev, trimmed]);
    }
    setCustomServiceInput('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const serviceDate = initialData ? new Date(initialData.date) : new Date();
      const nextChangeDate = new Date(serviceDate);
      nextChangeDate.setMonth(nextChangeDate.getMonth() + monthInterval);

      const payload = {
        vehicleId: selectedVehicleId,
        oilItems: [selectedOilPreset],
        serviceItems: selectedServices,
        oilType: selectedOilPreset,
        viscosity,
        currentKm,
        nextChangeKm: currentKm + kmInterval,
        nextChangeDate: nextChangeDate.toISOString(),
        totalPrice: price,
        notes,
      };

      if (initialData) {
        await api.put(`/services/${initialData.id}`, payload);
      } else {
        await api.post('/services', payload);
      }
      onClose();
    } catch {
      alert('Erro ao salvar serviço');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => v.customerId === selectedCustomerId);
  const canAdvanceStep1 = !!selectedVehicleId;
  const preset = OIL_PRESETS[selectedOilPreset];

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
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
              {initialData ? 'Editar Serviço' : 'Novo Registro de Serviço'}
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
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {/* STEP 1 — Cliente e Veículo */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-amber-600 mb-2">
                <User size={20} />
                <h3 className="font-bold">Cliente e Veículo</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Cliente</label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => { setSelectedCustomerId(e.target.value); setSelectedVehicleId(''); }}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none appearance-none"
                  >
                    <option value="">Selecione um cliente...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                    ))}
                  </select>
                </div>

                {selectedCustomerId && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Veículo</label>
                    <select
                      value={selectedVehicleId}
                      onChange={e => setSelectedVehicleId(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="">Selecione o veículo...</option>
                      {filteredVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.brand} {v.model} {v.year ? `(${v.year})` : ''} — {v.plate}
                        </option>
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

          {/* STEP 2 — Tipo de Serviço e Itens */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-amber-600 mb-2">
                <Droplets size={20} />
                <h3 className="font-bold">Serviço Realizado</h3>
              </div>

              {/* Oil preset selection */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Tipo de Óleo / Fluido Principal</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(OIL_PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyPreset(key)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedOilPreset === key
                          ? 'border-amber-400 bg-amber-50 text-amber-800'
                          : 'border-gray-200 bg-gray-50 hover:border-amber-200 text-gray-700'
                      }`}
                    >
                      <span className="font-semibold text-sm">{key}</span>
                      <span className="text-xs text-gray-400 font-mono">
                        {p.kmInterval.toLocaleString()} km / {p.monthInterval} meses
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Viscosity (only for motor oil) */}
              {selectedOilPreset.startsWith('Óleo Motor') && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Viscosidade</label>
                  <select
                    value={viscosity}
                    onChange={e => setViscosity(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    {['5W30', '5W40', '10W40', '15W40', '20W50', 'Outra'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Additional services */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Serviços Adicionais</label>
                <div className="flex flex-wrap gap-2">
                  {EXTRA_SERVICES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleService(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedServices.includes(s)
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    value={customServiceInput}
                    onChange={e => setCustomServiceInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomService())}
                    placeholder="Outro serviço..."
                    className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomService}
                    className="p-2.5 bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-200 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {selectedServices.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedServices.map(s => (
                      <span key={s} className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {s}
                        <button type="button" onClick={() => toggleService(s)} className="hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Valor Total</label>
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
            </motion.div>
          )}

          {/* STEP 3 — KM e Intervalos */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-amber-600 mb-2">
                <Gauge size={20} />
                <h3 className="font-bold">Quilometragem e Próxima Revisão</h3>
              </div>

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

              {/* Preset info banner */}
              {preset && !customIntervals && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <span className="text-xs text-blue-700 font-semibold">
                    Intervalos automáticos: <strong>{selectedOilPreset}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomIntervals(true)}
                    className="text-xs text-blue-500 underline"
                  >
                    Personalizar
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 border rounded-xl ${customIntervals ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Intervalo de KM</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={kmInterval}
                      onChange={e => { setKmInterval(Number(e.target.value)); setCustomIntervals(true); }}
                      className="w-full text-lg font-bold outline-none font-mono bg-transparent"
                    />
                    <span className="text-xs font-bold text-gray-300">KM</span>
                  </div>
                </div>
                <div className={`p-4 border rounded-xl ${customIntervals ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Intervalo Meses</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={monthInterval}
                      onChange={e => { setMonthInterval(Number(e.target.value)); setCustomIntervals(true); }}
                      className="w-full text-lg font-bold outline-none font-mono bg-transparent"
                    />
                    <span className="text-xs font-bold text-gray-300">MESES</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                <p className="text-xs font-bold text-amber-600 uppercase mb-3">Previsão Próxima Revisão</p>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800">Por Quilometragem</p>
                    <p className="text-2xl font-black text-amber-900 font-mono">{(currentKm + kmInterval).toLocaleString()} KM</p>
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

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Observações Técnicas</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Pendências, recomendações ou observações do técnico..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none"
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
                disabled={step === 1 && !canAdvanceStep1}
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
                <Save size={18} /> {loading ? 'SALVANDO...' : 'FINALIZAR'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
