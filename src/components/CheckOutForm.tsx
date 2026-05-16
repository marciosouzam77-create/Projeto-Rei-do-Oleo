import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Car, CreditCard, CheckCircle, XCircle, Clock, Banknote } from 'lucide-react';
import { api } from '../lib/api';
import {
  CheckIn, Vehicle, Customer,
  CHECKLIST_ITEMS, ChecklistCondition,
  PAYMENT_METHODS, PaymentMethod, ServiceExecutionStatus,
} from '../types';

interface CheckOutFormProps {
  checkin: CheckIn;
  vehicle: Vehicle;
  customer: Customer;
  onClose: () => void;
}

const EXEC_OPTIONS: { value: ServiceExecutionStatus; label: string; color: string }[] = [
  { value: 'Realizado',      label: 'Realizado',    color: 'bg-green-500 text-white border-green-500' },
  { value: 'Não realizado',  label: 'Não realizado', color: 'bg-red-500 text-white border-red-500' },
  { value: 'Adiado',         label: 'Adiado',       color: 'bg-yellow-400 text-white border-yellow-400' },
];

const PAYMENT_ICONS: Record<PaymentMethod, typeof Banknote> = {
  'Dinheiro': Banknote,
  'Cartão Débito': CreditCard,
  'Cartão Crédito': CreditCard,
  'Pix': CreditCard,
};

export default function CheckOutForm({ checkin, vehicle, customer, onClose }: CheckOutFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Only items flagged as "Ruim" in check-in are candidates for execution
  const ruimItems = CHECKLIST_ITEMS.filter(item => checkin.checklist?.[item] === 'Ruim');

  const [finalKm, setFinalKm] = useState<number>(checkin.currentKm);
  const [servicesExecuted, setServicesExecuted] = useState<Record<string, ServiceExecutionStatus>>(() =>
    Object.fromEntries(ruimItems.map(item => [item, 'Realizado']))
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [observations, setObservations] = useState('');

  const setExecution = (item: string, value: ServiceExecutionStatus) => {
    setServicesExecuted(prev => ({ ...prev, [item]: value }));
  };

  const realizados = Object.values(servicesExecuted).filter(v => v === 'Realizado').length;
  const troco = paymentMethod === 'Dinheiro' ? Math.max(0, amountPaid - amountPaid) : 0;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const checkout = {
        finalKm,
        paymentMethod,
        amountPaid,
        servicesExecuted,
        observations,
        completedAt: new Date().toISOString(),
      };
      await api.put(`/checkins/${checkin.id}`, { checkout, status: 'Entregue' });
      onClose();
    } catch {
      alert('Erro ao registrar check-out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Check-out — Entrega do Veículo</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {vehicle.brand} {vehicle.model} <span className="font-mono text-amber-600">{vehicle.plate}</span>
            </p>
            <div className="flex gap-1 mt-2">
              {[1, 2].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all ${s <= step ? 'bg-green-500 w-8' : 'bg-gray-200 w-4'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {/* STEP 1 — Serviços e KM */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              {/* KM final */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">KM de Saída</label>
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                  <Car size={20} className="text-amber-500 shrink-0" />
                  <input
                    type="number"
                    value={finalKm}
                    onChange={e => setFinalKm(Number(e.target.value))}
                    className="w-full bg-transparent text-2xl font-bold font-mono outline-none"
                  />
                </div>
              </div>

              {/* Serviços realizados */}
              {ruimItems.length > 0 ? (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-3">
                    Serviços Realizados ({realizados}/{ruimItems.length})
                  </label>
                  <div className="space-y-2">
                    {ruimItems.map(item => {
                      const current = servicesExecuted[item] || 'Realizado';
                      return (
                        <div key={item} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                          <span className="text-sm font-semibold text-gray-700">{item}</span>
                          <div className="flex gap-1">
                            {EXEC_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setExecution(item, opt.value)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  current === opt.value ? opt.color : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-500 shrink-0" />
                  <p className="text-sm font-semibold text-green-700">Nenhum item crítico identificado no check-in.</p>
                </div>
              )}

              {/* Observações técnicas */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Observações Técnicas</label>
                <textarea
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  rows={3}
                  placeholder="Pendências, recomendações para próxima visita..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Pagamento */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map(method => {
                    const Icon = PAYMENT_ICONS[method];
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                          paymentMethod === method
                            ? 'border-green-400 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={20} />
                        {method}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-green-50 p-5 rounded-2xl border border-green-100">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Valor Recebido</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold text-lg">R$</span>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={e => setAmountPaid(Number(e.target.value))}
                    className="w-full p-4 pl-12 bg-white border border-green-200 rounded-xl font-black text-2xl text-green-700 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Resumo */}
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <p className="text-xs font-black text-gray-400 uppercase mb-3">Resumo do Atendimento</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cliente</span>
                  <span className="font-bold text-gray-800">{customer.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Veículo</span>
                  <span className="font-mono font-bold text-amber-600">{vehicle.plate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">KM Saída</span>
                  <span className="font-mono font-bold">{finalKm.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Serviços realizados</span>
                  <span className="font-bold text-green-600">{realizados} de {ruimItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pagamento</span>
                  <span className="font-bold">{paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-700">Valor pago</span>
                  <span className="font-black text-green-600 text-lg">
                    R$ {amountPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
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
          {step < 2 ? (
            <button
              onClick={() => setStep(2)}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all"
            >
              PAGAMENTO →
            </button>
          ) : (
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all flex items-center gap-2"
            >
              <Save size={18} /> {loading ? 'REGISTRANDO...' : 'CONFIRMAR ENTREGA'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
