
import React from 'react';
import { Order } from '../../types';
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, Trash2, Package } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  isAr: boolean;
  onUpdateStatus: (id: string, status: Order['status']) => void;
  onDelete: (id: string) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, isAr, onUpdateStatus, onDelete }) => {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'cancelled': return 'text-red-400 bg-red-400/10';
      default: return 'text-orange-400 bg-orange-400/10';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
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
    <div className="bg-[#160a25] border border-white/5 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-right min-w-[900px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'العميل' : 'Customer'}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'المنتجات المطلوبة' : 'Ordered Items'}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'إجمالي الفاتورة' : 'Total Invoice'}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'الحالة' : 'Status'}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-bold italic">
                  {isAr ? 'لا توجد طلبات حالياً في السجل' : 'No orders found in history'}
                </td>
              </tr>
            ) : (
              orders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-sm">{order.customerName}</div>
                    <div className="text-[10px] text-indigo-400 flex items-center gap-1 justify-end font-mono">
                      <MessageSquare size={10} />
                      {order.customerWhatsApp}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1 justify-end">
                      <Clock size={8} />
                      {new Date(order.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 max-w-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/5 p-1.5 rounded-xl border border-white/5">
                          <div className="h-10 w-10 bg-black rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                            <img src={item.previewUrl} className="h-full w-full object-contain" alt="" />
                          </div>
                          <div className="flex flex-col text-right overflow-hidden">
                            <span className="text-[10px] font-black text-white truncate">{isAr ? item.nameAr : item.name}</span>
                            <span className="text-[8px] text-indigo-400 font-bold uppercase">Qty: {item.quantity} | ID: {item.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-white text-base">$ {order.total.toFixed(2)}</div>
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest">{order.items.length} {isAr ? 'منتجات' : 'Items'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        title={isAr ? "إتمام الطلب" : "Complete Order"}
                        onClick={() => onUpdateStatus(order.id, 'completed')}
                        className="p-2.5 bg-green-600/10 text-green-400 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-lg shadow-green-600/5"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button 
                        title={isAr ? "إلغاء الطلب" : "Cancel Order"}
                        onClick={() => onUpdateStatus(order.id, 'cancelled')}
                        className="p-2.5 bg-red-600/10 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-600/5"
                      >
                        <XCircle size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(order.id)}
                        className="p-2.5 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;
