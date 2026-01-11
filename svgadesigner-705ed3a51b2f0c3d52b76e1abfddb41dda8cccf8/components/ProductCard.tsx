
import React from 'react';
import { ShoppingBag, Play } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  lang: 'ar' | 'en';
  onAddToCart: (p: Product) => void;
  onPreview: (p: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, lang, onAddToCart, onPreview }) => {
  const isAr = lang === 'ar';

  return (
    <div className="relative group bg-[#160a25] rounded-2xl neon-border overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] border border-white/5">
      {/* Top Header Section */}
      <div className="flex justify-between items-center px-4 py-3 text-[10px] font-black tracking-tighter border-b border-white/[0.03]">
        <span className="text-slate-500">ID #{product.id}</span>
        <span className={`px-2 py-0.5 rounded-md text-white ${product.level === 'Elite' ? 'bg-indigo-600' : 'bg-orange-600'}`}>
          {isAr ? 'مميز' : 'PRO'}
        </span>
      </div>

      {/* Image Preview Section */}
      <div className="relative aspect-square px-8 py-6 flex items-center justify-center overflow-hidden bg-radial-gradient from-indigo-900/10 to-transparent">
        <img 
          src={product.previewUrl} 
          alt={product.name}
          className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(168,85,241,0.4)] group-hover:scale-110 transition-transform duration-700"
        />
      </div>

      {/* Pricing and Play Action */}
      <div className="px-5 py-5 space-y-4">
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-white text-xs font-black leading-tight line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {isAr ? product.nameAr : product.name}
          </h3>
          <div className="text-indigo-400 font-black text-sm">
            $ {product.price.toFixed(2)}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onPreview(product)}
            className="flex-1 play-button text-white h-11 rounded-xl text-[10px] font-black tracking-widest uppercase hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Play size={14} fill="currentColor" />
            {isAr ? 'عرض' : 'VIEW'}
          </button>
          
          <button 
            onClick={() => onAddToCart(product)}
            className="h-11 w-11 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-500 text-white rounded-xl transition-all flex items-center justify-center group/btn active:scale-90"
            title={isAr ? 'إضافة للسلة' : 'Add to cart'}
          >
            <ShoppingBag size={18} className="group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
