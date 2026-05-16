import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Plus, Trash2, Package, Wrench, Hammer } from 'lucide-react';
import { api } from '../lib/api';
import {
  Customer, Vehicle, ServiceCatalogItem, Budget, BudgetItem, BudgetItemType,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

interface BudgetFormProps {
  onClose: () => void;
  customers: Customer[];
  vehicles: Vehicle[];
  catalog: ServiceCatalogItem[];
  checkinId?: string;
  preselectedVehicleId?: string;
  initialData?: Budget | null;
}

const TYPE_ICONS: Record<BudgetItemType, typeof Plus> = {
  'Serviço':      Wrench,
  'Peça':         Package,
  'Mão de obra':  Hammer,
};

const TYPE_COLORS: Record<BudgetItemType, string> = {
  'Serviço':     'bg-blue-100 text-blue-700',
  'Peça':        'bg-purple-100 text-purple-700',
  'Mão de obra': 'bg-orange-100 text-orange-700',
};

function newItem(type: BudgetItemType = 'Serviço'): BudgetItem {
  return { id: uuidv4(), description: '', type, quantity: 1, unitPrice: 0 };
}

function itemTotal(item: BudgetItem) {
  return item.quantity * item.unitPrice;
}

export default function BudgetForm({
  onClose, customers, vehicles, catalog,
  checkinId, preselectedVehicleId, initialData,
}: BudgetFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    if (preselectedVehicleId) {
      return vehicles.find(v => v.id === preselectedVehicleId)?.customerId || '';
    }
    if (initialData) {
      return vehicles.find(v => v.id === initialData.vehicleId)?.customerId || '';
    }
    return '';
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    preselectedVehicleId || initialData?.vehicleId || ''
  );

  const [items, setItems] = useState<BudgetItem[]>(initialData?.items || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [validDays, setValidDays] = useState(7);

  const filteredVehicles = vehicles.filter(v => v.customerId === selectedCustomerId);
  const total = items.reduce((acc, i) => acc + itemTotal(i), 0);

  // Catalog chips — add service from catalog
  const addFromCatalog = (service: ServiceCatalogItem) => {
    const existing = items.findIndex(i => i.description === service.name && i.type === 'Serviço');
    if (existing !== -1) return; // already added
    setItems(prev => [...prev, {
      id: uuidv4(),
      description: service.name,
      type: 'Serviço',
      quantity: 1,
      unitPrice: service.basePrice,
    }]);
  };

  const addBlankItem = (type: BudgetItemType) => {
    setItems(prev => [...prev, newItem(type)]);
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSubmit = async () => {
    if (items.length === 0) { alert('Adicione ao menos um item ao orçamento.'); return; }
    setLoading(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      const payload = {
        vehicleId: selectedVehicleId,
        checkinId: checkinId || undefined,
        items,
        notes,
        validUntil: validUntil.toISOString(),
      };

      if (initialData) {
        await api.put(`/budgets/${initialData.id}`, payload);
      } else {
        await api.post('/budgets', payload);
      }
      onClose();
    } catch {
      alert('Erro ao salvar orçamento');
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
              {initialData ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h2>
            <div className="flex gap-1 mt-2">
              {[1, 2].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all ${s <= step ? 'bg-amber-500 w-8' : 'bg-gray-200 w-4'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1 — Veículo + Itens */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">

              {/* Veículo (só mostra se não vier pré-selecionado) */}
              {!preselectedVehicleId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Cliente</label>
                    <select
                      value={selectedCustomerId}
                      onChange={e => { setSelectedCustomerId(e.target.value); setSelectedVehicleId(''); }}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="">Selecione...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Veículo</label>
                    <select
                      value={selectedVehicleId}
                      onChange={e => setSelectedVehicleId(e.target.value)}
                      disabled={!selectedCustomerId}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50"
                    >
                      <option value="">Selecione...</option>
                      {filteredVehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Catálogo de serviços */}
              {catalog.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Adicionar do Catálogo</label>
                  <div className="flex flex-wrap gap-2">
                    {catalog.map(s => {
                      const alreadyAdded = items.some(i => i.description === s.name);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => addFromCatalog(s)}
                          disabled={alreadyAdded}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            alreadyAdded
                              ? 'bg-amber-500 text-white border-amber-500 opacity-70 cursor-not-allowed'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-700'
                          }`}
                        >
                          {alreadyAdded ? '✓ ' : '+ '}{s.name}
                          <span className="ml-1 text-[10px] opacity-70">R$ {s.basePrice}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Itens do orçamento */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Itens do Orçamento</label>
                  <div className="flex gap-1">
                    {(['Serviço', 'Peça', 'Mão de obra'] as BudgetItemType[]).map(type => {
                      const Icon = TYPE_ICONS[type];
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => addBlankItem(type)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${TYPE_COLORS[type]} border-transparent hover:opacity-80`}
                        >
                          <Icon size={12} /> {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {items.length === 0 && (
                  <div className="p-8 text-center text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-sm">
                    Adicione itens do catálogo ou clique nos botões acima.
                  </div>
                )}

                <div className="space-y-2">
                  {items.map(item => {
                    const Icon = TYPE_ICONS[item.type];
                    return (
                      <div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <span className={`p-1.5 rounded-lg shrink-0 ${TYPE_COLORS[item.type]}`}>
                          <Icon size={14} />
                        </span>
                        <input
                          value={item.description}
                          onChange={e => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Descrição..."
                          className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-800 min-w-0"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                            className="w-12 text-center bg-white border border-gray-200 rounded-lg p-1 text-xs font-mono outline-none"
                          />
                          <span className="text-xs text-gray-400">×</span>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                            <input
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                              className="w-24 pl-7 pr-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono outline-none"
                            />
                          </div>
                          <span className="text-xs font-bold text-green-600 w-20 text-right">
                            R$ {itemTotal(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {items.length > 0 && (
                  <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-bold">Total</p>
                      <p className="text-2xl font-black text-green-600">
                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Detalhes e validade */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Validade do Orçamento</label>
                <div className="flex gap-2">
                  {[3, 7, 15, 30].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setValidDays(d)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        validDays === d
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      {d} dias
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Válido até: <strong>{new Date(Date.now() + validDays * 86400000).toLocaleDateString('pt-BR')}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Observações</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Condições, garantia, informações adicionais..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Resumo */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-black text-amber-600 uppercase">Resumo do Orçamento</p>
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.quantity}× {item.description}</span>
                    <span className="font-semibold">R$ {itemTotal(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-base border-t border-amber-200 pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-green-600">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button
            disabled={step === 1}
            onClick={() => setStep(1)}
            className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 disabled:opacity-0 transition-all"
          >
            VOLTAR
          </button>
          {step === 1 ? (
            <button
              disabled={!selectedVehicleId || items.length === 0}
              onClick={() => setStep(2)}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-200 transition-all disabled:opacity-50"
            >
              PRÓXIMO →
            </button>
          ) : (
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all flex items-center gap-2"
            >
              <Save size={18} /> {loading ? 'SALVANDO...' : 'GERAR ORÇAMENTO'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
