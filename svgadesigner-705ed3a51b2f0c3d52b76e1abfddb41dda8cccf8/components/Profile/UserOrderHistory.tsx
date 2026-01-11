
import React from 'react';
import { Order } from '../../types';
import { X, Package, Clock, CheckCircle, XCircle, ChevronLeft, ArrowLeft, Receipt, ExternalLink } from 'lucide-react';

interface UserOrderHistoryProps {
  orders: Order[];
  isAr: boolean;
  onClose: () => void;
}

const UserOrderHistory: React.FC<UserOrderHistoryProps> = ({ orders, isAr, onClose }) => {
  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    }
  };

  const getStatusText = (status: Order['status']) => {
    if (isAr) {
      switch (status) {
        case 'completed': return 'مكتمل';
        case 'cancelled': return 'ملغى';
        default: return 'قيد الانتظار';
      }
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="fixed inset-0 z-[180] bg-[#0f0518] flex flex-col animate-fade-in overflow-y-auto">
      {/* Page Header */}
      <header className="sticky top-0 z-10 p-6 bg-[#0f0518]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-indigo-400">
               {isAr ? <ArrowLeft size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
                <Receipt className="text-indigo-500" />
                {isAr ? 'سجل الفواتير والمشتريات' : 'Purchase Invoices'}
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {isAr ? 'تاريخ كامل لعملياتك في المتجر' : 'Your complete store history'}
              </p>
            </div>
          </div>
          <div className="hidden md:flex px-4 py-2 bg-indigo-600/10 rounded-xl border border-indigo-600/20 text-indigo-400 font-black text-xs">
            {orders.length} {isAr ? 'فواتير' : 'Invoices'}
          </div>
        </div>
      </header>

      {/* Main List */}
      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {orders.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
              <Package size={80} className="text-slate-700" />
              <div className="space-y-1">
                <div className="text-lg font-black">{isAr ? 'لا توجد مشتريات سابقة' : 'No purchase history'}</div>
                <div className="text-xs">{isAr ? 'ابدأ التسوق الآن لتظهر فواتيرك هنا' : 'Start shopping to see your invoices here'}</div>
              </div>
              <button onClick={onClose} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs">{isAr ? 'تصفح المتجر' : 'Browse Shop'}</button>
            </div>
          ) : (
            orders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((order) => (
              <div key={order.id} className="bg-[#160a25] border border-white/5 rounded-3xl p-6 md:p-8 hover:border-indigo-500/30 transition-all shadow-xl shadow-black/20 group">
                {/* Order Header */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 border-b border-white/[0.03] pb-6">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{isAr ? 'رقم الفاتورة' : 'Invoice ID'}</div>
                    <div className="font-mono text-indigo-400 font-black">#{order.id.split('-')[1]}</div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                       <div className="text-[10px] font-black text-slate-500 uppercase">{isAr ? 'التاريخ' : 'Date'}</div>
                       <div className="text-xs font-bold text-white">{new Date(order.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</div>
                     </div>
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(order.status)}`}>
                        {getStatusText(order.status)}
                     </span>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="space-y-4 mb-8">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/[0.02]">
                      <div className="h-12 w-12 bg-black rounded-xl overflow-hidden border border-white/5 flex-shrink-0">
                        <img src={item.previewUrl} className="h-full w-full object-contain" alt="" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-black text-white">{isAr ? item.nameAr : item.name}</div>
                        <div className="text-[10px] text-slate-500">Qty: {item.quantity} | ${item.price.toFixed(2)}</div>
                      </div>
                      <div className="text-xs font-black text-indigo-400">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer / Total */}
                <div className="flex justify-between items-end">
                   <div className="text-[10px] font-black text-slate-600 uppercase">
                     {isAr ? 'سياسة GoTher للنخبة' : 'GoTher Elite Policy'}
                   </div>
                   <div className="bg-indigo-600/10 border border-indigo-600/20 px-6 py-3 rounded-2xl">
                     <div className="text-[9px] font-black text-slate-500 uppercase mb-0.5 text-center">{isAr ? 'الإجمالي المدفوع' : 'Total Paid'}</div>
                     <div className="text-xl font-black text-white">$ {order.total.toFixed(2)}</div>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="p-12 text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">
         GoTher Digital Assets Ledger &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default UserOrderHistory;
