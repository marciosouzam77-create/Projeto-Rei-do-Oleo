import { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { CheckIn, Vehicle, Customer, CHECKLIST_ITEMS } from '../types';

interface OSPrintModalProps {
  checkin: CheckIn;
  vehicle: Vehicle;
  customer: Customer;
  onClose: () => void;
}

const CONDITION_SYMBOL: Record<string, string> = {
  'Bom':            '✓',
  'Ruim':           '✗',
  'Não verificado': '—',
};

export default function OSPrintModal({ checkin, vehicle, customer, onClose }: OSPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || '';
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>OS — ${vehicle.plate}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #111;
            padding: 24px;
            max-width: 780px;
            margin: 0 auto;
          }
          .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
          .header h1 { font-size: 20px; font-weight: 900; letter-spacing: 1px; }
          .header p { font-size: 11px; color: #444; margin-top: 2px; }
          .os-title { display: flex; justify-content: space-between; align-items: center; background: #f3f4f6; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; }
          .os-title h2 { font-size: 15px; font-weight: 900; }
          .os-title span { font-size: 11px; color: #555; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .badge-yellow { background: #fef9c3; color: #854d0e; }
          .badge-blue   { background: #dbeafe; color: #1e40af; }
          .badge-green  { background: #dcfce7; color: #166534; }
          .badge-gray   { background: #f3f4f6; color: #6b7280; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
          .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 20px; }
          .field label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #9ca3af; display: block; }
          .field span { font-size: 12px; font-weight: 600; color: #111; }
          .field span.mono { font-family: monospace; font-weight: 900; font-size: 14px; color: #d97706; }
          .notes { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px; font-size: 12px; color: #374151; min-height: 40px; }
          .checklist-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
          .checklist-item { display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; border: 1px solid #e5e7eb; border-radius: 4px; }
          .checklist-item .item-name { font-size: 11px; color: #374151; }
          .checklist-item .cond { font-size: 12px; font-weight: 900; }
          .cond-bom  { color: #16a34a; }
          .cond-ruim { color: #dc2626; }
          .cond-nv   { color: #9ca3af; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
          .sig-box { border-top: 1px solid #111; padding-top: 6px; text-align: center; font-size: 10px; color: #555; height: 60px; display: flex; align-items: flex-end; justify-content: center; }
          .checkout-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 10px; }
          .checkout-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 16px; margin-bottom: 8px; }
          @media print {
            body { padding: 10px; }
            button { display: none !important; }
          }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const statusBadgeClass = {
    'Aguardando': 'badge-yellow',
    'Em serviço': 'badge-blue',
    'Pronto':     'badge-green',
    'Entregue':   'badge-gray',
  }[checkin.status] || 'badge-gray';

  const ruimItems = CHECKLIST_ITEMS.filter(i => checkin.checklist?.[i] === 'Ruim');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Printer size={20} className="text-amber-500" /> Impressão da OS
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-100 transition-all"
            >
              <Printer size={16} /> Imprimir / Salvar PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div ref={printRef as any} className="bg-white shadow-xl rounded-lg p-8 max-w-2xl mx-auto text-sm text-gray-900">

            {/* Header */}
            <div className="header text-center border-b-2 border-gray-900 pb-3 mb-4">
              <h1 className="text-xl font-black tracking-widest uppercase">Rei do Óleo — Santa Terezinha</h1>
              <p className="text-xs text-gray-500 mt-1">Al. Vieira de Carvalho, 145 · Santa Terezinha, Santo André – SP · (11) 2677-8409</p>
            </div>

            {/* OS title bar */}
            <div className="os-title flex justify-between items-center bg-gray-50 px-4 py-3 rounded mb-4">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ordem de Serviço</span>
                <p className="text-lg font-black text-gray-900 font-mono">OS #{checkin.id.slice(-6).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{new Date(checkin.createdAt).toLocaleString('pt-BR')}</p>
                <span className={`badge text-[10px] font-black px-3 py-1 rounded-full mt-1 inline-block ${
                  checkin.status === 'Aguardando' ? 'bg-yellow-100 text-yellow-700' :
                  checkin.status === 'Em serviço' ? 'bg-blue-100 text-blue-700' :
                  checkin.status === 'Pronto'     ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{checkin.status}</span>
              </div>
            </div>

            {/* Cliente e Veículo */}
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="section">
                <p className="section-title text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Cliente</p>
                <div className="space-y-1">
                  <div><span className="text-[9px] font-bold text-gray-400 uppercase">Nome</span><p className="font-bold text-gray-800">{customer.name}</p></div>
                  <div><span className="text-[9px] font-bold text-gray-400 uppercase">Telefone</span><p className="font-mono text-gray-700">{customer.phone}</p></div>
                  {customer.email && <div><span className="text-[9px] font-bold text-gray-400 uppercase">Email</span><p className="text-gray-600">{customer.email}</p></div>}
                </div>
              </div>
              <div className="section">
                <p className="section-title text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Veículo</p>
                <div className="space-y-1">
                  <div><span className="text-[9px] font-bold text-gray-400 uppercase">Placa</span><p className="font-mono font-black text-amber-600 text-base">{vehicle.plate}</p></div>
                  <div><span className="text-[9px] font-bold text-gray-400 uppercase">Veículo</span><p className="font-bold text-gray-800">{vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}</p></div>
                  <div className="flex gap-4">
                    {vehicle.color && <div><span className="text-[9px] font-bold text-gray-400 uppercase">Cor</span><p>{vehicle.color}</p></div>}
                    {vehicle.fuel && <div><span className="text-[9px] font-bold text-gray-400 uppercase">Combustível</span><p>{vehicle.fuel}</p></div>}
                  </div>
                  <div><span className="text-[9px] font-bold text-gray-400 uppercase">KM Entrada</span><p className="font-mono font-bold">{checkin.currentKm.toLocaleString()} km</p></div>
                  {checkin.mechanic && <div><span className="text-[9px] font-bold text-gray-400 uppercase">Mecânico</span><p className="font-semibold">{checkin.mechanic}</p></div>}
                </div>
              </div>
            </div>

            {/* Relato do cliente */}
            {checkin.clientNotes && (
              <div className="section mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Relato do Cliente</p>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700 italic min-h-[36px]">
                  {checkin.clientNotes}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div className="section mb-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Checklist de Inspeção</p>
              <div className="grid grid-cols-2 gap-1.5">
                {CHECKLIST_ITEMS.map(item => {
                  const cond = checkin.checklist?.[item] || 'Não verificado';
                  return (
                    <div key={item} className={`flex justify-between items-center px-3 py-2 rounded border text-xs ${
                      cond === 'Ruim' ? 'bg-red-50 border-red-200' :
                      cond === 'Bom'  ? 'bg-green-50 border-green-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <span className="text-gray-700 font-medium">{item}</span>
                      <span className={`font-black text-sm ${
                        cond === 'Bom'  ? 'text-green-600' :
                        cond === 'Ruim' ? 'text-red-600' : 'text-gray-400'
                      }`}>{CONDITION_SYMBOL[cond]}</span>
                    </div>
                  );
                })}
              </div>
              {ruimItems.length > 0 && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded px-3 py-2">
                  <p className="text-[10px] font-black text-red-600 uppercase">Itens que necessitam atenção: {ruimItems.join(', ')}</p>
                </div>
              )}
            </div>

            {/* Observações técnicas */}
            <div className="section mb-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Observações Técnicas</p>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700 min-h-[48px]">
                {checkin.observations || <span className="text-gray-400 italic">Nenhuma observação registrada.</span>}
              </div>
            </div>

            {/* Check-out (se entregue) */}
            {checkin.checkout && (
              <div className="section mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Registro de Entrega</p>
                <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div><span className="text-[9px] font-bold text-gray-400 uppercase block">KM Saída</span><span className="font-mono font-bold">{checkin.checkout.finalKm.toLocaleString()} km</span></div>
                    <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Pagamento</span><span className="font-bold">{checkin.checkout.paymentMethod}</span></div>
                    <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Valor</span><span className="font-bold text-green-700">R$ {checkin.checkout.amountPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                  </div>
                  {checkin.checkout.observations && (
                    <p className="text-xs text-gray-600 italic pt-1 border-t border-green-200">{checkin.checkout.observations}</p>
                  )}
                  <p className="text-[9px] text-gray-400">Entregue em: {new Date(checkin.checkout.completedAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            )}

            {/* Assinaturas */}
            <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="h-12 border-b border-gray-900 mb-1" />
                <p className="text-[10px] text-gray-500">Assinatura do Cliente</p>
              </div>
              <div className="text-center">
                <div className="h-12 border-b border-gray-900 mb-1" />
                <p className="text-[10px] text-gray-500">Assinatura do Técnico / Responsável</p>
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
