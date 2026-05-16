import { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { Budget, Customer, Vehicle } from '../types';

interface BudgetPrintModalProps {
  budget: Budget;
  vehicle: Vehicle;
  customer: Customer;
  onClose: () => void;
}

export default function BudgetPrintModal({ budget, vehicle, customer, onClose }: BudgetPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const total = budget.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || '';
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html lang="pt-BR">
      <head><meta charset="UTF-8"/><title>Orçamento — ${vehicle.plate}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;padding:24px;max-width:780px;margin:0 auto}
        .header{text-align:center;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:16px}
        .header h1{font-size:20px;font-weight:900;letter-spacing:1px}
        .header p{font-size:11px;color:#444;margin-top:2px}
        .title-bar{display:flex;justify-content:space-between;align-items:flex-start;background:#f3f4f6;padding:12px 16px;border-radius:4px;margin-bottom:16px}
        .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase}
        .badge-pending{background:#fef9c3;color:#854d0e}
        .badge-approved{background:#dcfce7;color:#166534}
        .badge-rejected{background:#fee2e2;color:#991b1b}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
        .section-title{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:8px}
        .field label{font-size:9px;font-weight:700;text-transform:uppercase;color:#9ca3af;display:block}
        .field span{font-size:12px;font-weight:600}
        .field span.plate{font-family:monospace;font-size:16px;font-weight:900;color:#d97706}
        table{width:100%;border-collapse:collapse;margin-bottom:16px}
        thead tr{background:#f9fafb;border-bottom:2px solid #e5e7eb}
        th{font-size:10px;font-weight:900;text-transform:uppercase;color:#6b7280;padding:8px 10px;text-align:left}
        td{padding:8px 10px;font-size:12px;border-bottom:1px solid #f3f4f6}
        .total-row td{font-weight:900;font-size:14px;border-top:2px solid #e5e7eb;background:#f0fdf4}
        .total-row .amount{color:#16a34a}
        .notes-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:10px;font-size:12px;color:#374151;min-height:40px;margin-bottom:16px}
        .validity{font-size:11px;color:#6b7280;text-align:center;margin-bottom:16px}
        .validity strong{color:#111}
        .signatures{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}
        .sig-box{text-align:center}
        .sig-line{border-top:1px solid #111;padding-top:6px;font-size:10px;color:#555}
        .sig-space{height:50px}
        @media print{button{display:none!important}}
      </style></head>
      <body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const statusBadge = { Pendente: 'badge-pending', Aprovado: 'badge-approved', Recusado: 'badge-rejected' }[budget.status];
  const statusLabel = budget.status;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Printer size={20} className="text-amber-500" /> Impressão do Orçamento
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md transition-all"
            >
              <Printer size={16} /> Imprimir / Salvar PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div ref={printRef} className="bg-white shadow-xl rounded-lg p-8 max-w-2xl mx-auto text-sm">
            {/* Header */}
            <div className="header text-center border-b-2 border-gray-900 pb-3 mb-4">
              <h1 className="text-xl font-black tracking-widest uppercase">Rei do Óleo — Santa Terezinha</h1>
              <p className="text-xs text-gray-500 mt-1">Al. Vieira de Carvalho, 145 · Santa Terezinha, Santo André – SP · (11) 2677-8409</p>
            </div>

            {/* Title bar */}
            <div className="flex justify-between items-start bg-gray-50 px-4 py-3 rounded mb-4">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Orçamento</span>
                <p className="text-lg font-black text-gray-900 font-mono">ORC #{budget.id.slice(-6).toUpperCase()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Emitido em {new Date(budget.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                budget.status === 'Aprovado' ? 'bg-green-100 text-green-700' :
                budget.status === 'Recusado' ? 'bg-red-100 text-red-600' :
                'bg-yellow-100 text-yellow-700'
              }`}>{statusLabel}</span>
            </div>

            {/* Cliente e Veículo */}
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Cliente</p>
                <div className="space-y-1">
                  <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Nome</span><p className="font-bold">{customer.name}</p></div>
                  <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Telefone</span><p className="font-mono">{customer.phone}</p></div>
                  {customer.email && <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Email</span><p>{customer.email}</p></div>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Veículo</p>
                <div className="space-y-1">
                  <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Placa</span><p className="font-mono font-black text-amber-600 text-base">{vehicle.plate}</p></div>
                  <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Veículo</span><p className="font-bold">{vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}</p></div>
                  {vehicle.fuel && <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Combustível</span><p>{vehicle.fuel}</p></div>}
                </div>
              </div>
            </div>

            {/* Itens */}
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Itens do Orçamento</p>
            <table className="w-full mb-4">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-3 py-2 text-left text-[10px] font-black text-gray-400 uppercase">Descrição</th>
                  <th className="px-3 py-2 text-left text-[10px] font-black text-gray-400 uppercase">Tipo</th>
                  <th className="px-3 py-2 text-center text-[10px] font-black text-gray-400 uppercase">Qtd</th>
                  <th className="px-3 py-2 text-right text-[10px] font-black text-gray-400 uppercase">Unit.</th>
                  <th className="px-3 py-2 text-right text-[10px] font-black text-gray-400 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {budget.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-semibold text-gray-800">{item.description}</td>
                    <td className="px-3 py-2 text-gray-500">{item.type}</td>
                    <td className="px-3 py-2 text-center font-mono">{item.quantity}</td>
                    <td className="px-3 py-2 text-right font-mono">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right font-bold">R$ {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                <tr className="bg-green-50 border-t-2 border-gray-200">
                  <td colSpan={4} className="px-3 py-3 font-black text-gray-700 text-right text-sm uppercase">Total Geral</td>
                  <td className="px-3 py-3 text-right font-black text-green-600 text-lg">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            {/* Validade */}
            <p className="text-center text-xs text-gray-500 mb-4">
              Orçamento válido até <strong>{new Date(budget.validUntil).toLocaleDateString('pt-BR')}</strong>
            </p>

            {/* Observações */}
            {budget.notes && (
              <div className="mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Observações</p>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700">
                  {budget.notes}
                </div>
              </div>
            )}

            {/* Assinaturas */}
            <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="h-12 border-b border-gray-900 mb-1" />
                <p className="text-[10px] text-gray-500">Assinatura do Cliente — Aprovação</p>
              </div>
              <div className="text-center">
                <div className="h-12 border-b border-gray-900 mb-1" />
                <p className="text-[10px] text-gray-500">Assinatura do Responsável</p>
              </div>
            </div>

            <p className="text-center text-[9px] text-gray-400 mt-6 pt-3 border-t border-gray-100">
              Rei do Óleo — Santa Terezinha · Al. Vieira de Carvalho, 145 · Santo André – SP · (11) 2677-8409 · Seg–Sex 08–19h · Sáb 08–16h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
