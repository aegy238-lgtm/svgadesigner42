
import React from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, MessageCircle, ArrowRight, ArrowLeft, PackageCheck } from 'lucide-react';
import { CartItem, Product } from '../../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onPlaceOrder: (method: 'site' | 'whatsapp') => void;
  isAr: boolean;
  total: number;
  customerInfo: { name: string; whatsapp: string };
  setCustomerInfo: (info: { name: string; whatsapp: string }) => void;
  showCheckout: boolean;
  setShowCheckout: (show: boolean) => void;
  storeWhatsApp: string;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, onClose, cart, onUpdateQuantity, onRemove, onPlaceOrder, 
  isAr, total, customerInfo, setCustomerInfo, showCheckout, setShowCheckout,
  storeWhatsApp
}) => {
  if (!isOpen) return null;

  const handleWhatsAppCheckout = () => {
    if (!customerInfo.name || !customerInfo.whatsapp) {
      alert(isAr ? 'يرجى ملء بيانات التواصل أولاً' : 'Please fill contact info first');
      return;
    }
    
    const itemsText = cart.map(i => `- ${isAr ? i.nameAr : i.name} (x${i.quantity})`).join('%0A');
    const message = `*طلب جديد من متجر GoTher*%0A%0A*العميل:* ${customerInfo.name}%0A*المنتجات:*%0A${itemsText}%0A%0A*الإجمالي:* $${total.toFixed(2)}%0A%0Aيرجى تأكيد الطلب.`;
    window.open(`https://wa.me/${storeWhatsApp}?text=${message}`, '_blank');
    onPlaceOrder('whatsapp');
  };

  return (
    <div className="fixed inset-0 z-[250] flex">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-md bg-[#0f0518] h-full shadow-2xl flex flex-col border-l border-white/5 animate-slide-in-${isAr ? 'right' : 'left'}`}>
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#160a25]">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-indigo-500" />
            <h2 className="text-lg font-black uppercase tracking-tighter">
              {isAr ? 'سلة المشتريات' : 'Shopping Cart'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20}/></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <ShoppingBag size={64} className="text-slate-700" />
              <div className="font-bold text-slate-500">{isAr ? 'سلتك فارغة حالياً' : 'Your cart is empty'}</div>
              <button onClick={onClose} className="text-indigo-400 font-black text-xs uppercase tracking-widest">{isAr ? 'ابدأ التسوق' : 'Start Shopping'}</button>
            </div>
          ) : !showCheckout ? (
            cart.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 group animate-fade-in">
                <div className="h-20 w-20 bg-black rounded-xl overflow-hidden border border-white/5 flex-shrink-0">
                  <img src={item.previewUrl} className="h-full w-full object-contain" alt={item.name} />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-black text-white">{isAr ? item.nameAr : item.name}</div>
                      <div className="text-[10px] text-indigo-400 font-bold">$ {item.price.toFixed(2)}</div>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center bg-black/40 rounded-lg border border-white/5 px-2 py-1 gap-3">
                      <button onClick={() => onUpdateQuantity(item.id, -1)} className="hover:text-indigo-400 transition-colors"><Minus size={12}/></button>
                      <span className="text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)} className="hover:text-indigo-400 transition-colors"><Plus size={12}/></button>
                    </div>
                    <div className="text-[10px] font-black text-slate-500 ml-auto">
                      $ {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-6 animate-scale-up">
              <h3 className="font-black text-white flex items-center gap-2">
                <PackageCheck className="text-green-500" />
                {isAr ? 'بيانات الاستلام' : 'Delivery Details'}
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder={isAr ? 'أدخل اسمك هنا...' : 'Enter your name...'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{isAr ? 'رقم الواتساب / المعرف' : 'WhatsApp / ID'}</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                    value={customerInfo.whatsapp}
                    onChange={e => setCustomerInfo({...customerInfo, whatsapp: e.target.value})}
                    placeholder="e.g. 201234567890"
                  />
                </div>
              </div>
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                 <div className="text-[10px] font-bold text-indigo-300 leading-relaxed">
                   {isAr ? 'سيتم إرسال تفاصيل الطلب إلى الإدارة لتجهيزه لك بأسرع وقت ممكن.' : 'Order details will be sent to admin for preparation.'}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-white/5 bg-[#160a25] space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'الإجمالي النهائي' : 'GRAND TOTAL'}</div>
              <div className="text-2xl font-black text-indigo-400">$ {total.toFixed(2)}</div>
            </div>

            {!showCheckout ? (
              <button 
                onClick={() => setShowCheckout(true)}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {isAr ? 'المتابعة لإتمام الطلب' : 'CONTINUE TO CHECKOUT'}
                {isAr ? <ArrowLeft size={18}/> : <ArrowRight size={18}/>}
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => onPlaceOrder('site')}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <PackageCheck size={20} />
                  {isAr ? 'تأكيد الطلب عبر الموقع' : 'CONFIRM VIA SITE'}
                </button>
                <button 
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <MessageCircle size={20} />
                  {isAr ? 'طلب عبر الواتساب' : 'ORDER VIA WHATSAPP'}
                </button>
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-2 hover:text-white transition-colors"
                >
                  {isAr ? 'العودة لتعديل السلة' : 'Back to Edit Cart'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
