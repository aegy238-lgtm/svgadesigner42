
import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import AdminDashboard from './components/Admin/AdminDashboard';
import AuthModal from './components/Auth/AuthModal';
import ProfileCenter from './components/Profile/ProfileCenter';
import CartDrawer from './components/Cart/CartDrawer'; 
import UserOrderHistory from './components/Profile/UserOrderHistory';
import { Product, CartItem, Order, UserProfile, Category } from './types';
import { db, collections, onSnapshot, doc, setDoc, auth, getDoc } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  ShoppingCart, X, Plus, Minus, MessageCircle, ShoppingBag, 
  ShieldCheck, User, Phone, Globe, Package, CheckCircle, Clock, Home, LogIn, LayoutDashboard, FileCheck, Crown, Layers, ExternalLink
} from 'lucide-react';

const App: React.FC = () => {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<{id: string, url: string, link?: string}[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [storeWhatsApp, setStoreWhatsApp] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('GoTher');
  const [sectionTitleAr, setSectionTitleAr] = useState<string>('أحدث الهدايا المتميزة');
  const [sectionTitleEn, setSectionTitleEn] = useState<string>('PREMIUM GIFTS');
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserOrders, setShowUserOrders] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', whatsapp: '' });
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const isAr = lang === 'ar';

  const isVideo = (url: string) => {
    return url && (url.startsWith('data:video') || url.endsWith('.mp4') || url.endsWith('.webm'));
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const profileData = userSnap.data() as UserProfile;
          if (profileData.status === 'blocked') {
            await auth.signOut();
            setCurrentUser(null);
          } else {
            const effectiveRole = (profileData.serialId === 1 || profileData.serialId === 111) ? 'admin' : profileData.role;
            setCurrentUser({
              ...profileData,
              role: effectiveRole
            } as UserProfile);
            setCustomerInfo(prev => ({ ...prev, name: profileData.displayName, whatsapp: profileData.phoneNumber || '' }));
          }
        }
      } else {
        setCurrentUser(null);
        setIsAdminMode(false);
      }
    });

    const unsubProducts = onSnapshot(collections.products, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const unsubCategories = onSnapshot(collections.categories, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    const unsubOrders = onSnapshot(collections.orders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    const unsubBanners = onSnapshot(collections.banners, (snapshot) => {
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, url: doc.data().url, link: doc.data().link })));
    });

    const unsubConfig = onSnapshot(doc(db, "settings", "store_config"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreWhatsApp(data.whatsapp || '');
        setSiteName(data.siteName || 'GoTher');
        setSectionTitleAr(data.sectionTitleAr || 'أحدث الهدايا المتميزة');
        setSectionTitleEn(data.sectionTitleEn || 'PREMIUM GIFTS');
      }
    });

    return () => {
      unsubAuth(); unsubProducts(); unsubCategories(); unsubOrders(); unsubBanners(); unsubConfig();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category === activeCategory);
  }, [activeCategory, products]);

  const userFilteredOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(o => (o as any).userId === currentUser.uid);
  }, [orders, currentUser]);

  const uiCategories = useMemo(() => [
    { id: 'all', name: 'All', nameAr: 'الكل', icon: '🛍️' },
    ...categories
  ], [categories]);

  const addToCart = (product: Product) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    if (currentUser.status === 'frozen') return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async (method: 'site' | 'whatsapp') => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    
    const orderId = `ORD-${Date.now()}`;
    const orderData = {
      id: orderId,
      userId: currentUser.uid, 
      customerName: customerInfo.name,
      customerWhatsApp: customerInfo.whatsapp,
      items: cart,
      total: cartTotal,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (method === 'site') {
      await setDoc(doc(db, "orders", orderId), orderData);
    }
    
    setCart([]); 
    setShowCheckoutForm(false); 
    setIsCartOpen(false);
    setOrderSuccess(true);
    setIsMenuOpen(true);
  };

  const isUserAdmin = currentUser?.serialId === 1 || currentUser?.serialId === 111 || currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  return (
    <div className={`min-h-screen bg-[#0f0518] ${isAr ? 'rtl' : 'ltr'} flex flex-col`}>
      
      {isAdminMode && isUserAdmin && currentUser && (
        <AdminDashboard 
          products={products} orders={orders} bannerUrl={banners[0]?.url || ''} banners={banners}
          storeWhatsApp={storeWhatsApp} siteName={siteName} onProductsUpdate={() => {}} onOrdersUpdate={() => {}}
          onUpdateBanner={() => {}} onExit={() => setIsAdminMode(false)} isAr={isAr}
          currentUser={currentUser}
        />
      )}

      {showUserOrders && currentUser && (
        <UserOrderHistory 
          orders={userFilteredOrders} 
          isAr={isAr} 
          onClose={() => setShowUserOrders(false)} 
        />
      )}

      <Navbar cartCount={cart.reduce((s, i) => s + i.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} onOpenMenu={() => setIsMenuOpen(true)} lang={lang} setLang={setLang} siteName={siteName} />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} isAr={isAr} />
      <ProfileCenter isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} isAr={isAr} />
      
      <CartDrawer 
        isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} 
        onUpdateQuantity={updateQuantity} onRemove={(id) => setCart(c => c.filter(i => i.id !== id))}
        onPlaceOrder={handlePlaceOrder} isAr={isAr} total={cartTotal}
        customerInfo={customerInfo} setCustomerInfo={setCustomerInfo}
        showCheckout={showCheckoutForm} setShowCheckout={setShowCheckoutForm}
        storeWhatsApp={storeWhatsApp}
      />

      {/* Side Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[150] flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className={`relative w-72 bg-[#12071d] h-full shadow-2xl flex flex-col border-r border-white/5 animate-slide-in-${isAr ? 'right' : 'left'}`}>
            <div className="p-6 border-b border-white/5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="text-lg font-black text-indigo-400 uppercase">{siteName}</div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={18}/></button>
              </div>
              {currentUser && (
                <div onClick={() => { setIsMenuOpen(false); setIsProfileOpen(true); }} className="mt-2 flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                  <div className="h-8 w-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 text-xs font-bold">
                    {(currentUser.serialId === 1 || currentUser.serialId === 111) ? <ShieldCheck size={16} /> : currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-[11px] font-black text-white truncate">{currentUser.displayName}</div>
                </div>
              )}
            </div>
            <nav className="p-4 space-y-2">
              <button onClick={() => { setIsMenuOpen(false); setShowUserOrders(false); window.scrollTo(0,0); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 font-bold transition-all text-xs">
                <Home size={16} className="text-indigo-400" /> {isAr ? 'الرئيسية' : 'Home'}
              </button>
              
              {!currentUser ? (
                <button onClick={() => { setIsMenuOpen(false); setIsAuthModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-white text-black font-black text-xs transition-all shadow-lg active:scale-95">
                  <LogIn size={16} /> {isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Login / Create Account'}
                </button>
              ) : (
                <>
                  <button onClick={() => { setIsMenuOpen(false); setShowUserOrders(true); setOrderSuccess(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 font-bold transition-all text-xs group relative">
                    <Package size={16} className="text-indigo-400" /> 
                    <span>{isAr ? 'سجل مشترياتي' : 'Order History'}</span>
                    {orderSuccess && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 bg-green-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                         {isAr ? 'تم استلام طلبك بنجاح!' : 'Order Received!'}
                      </span>
                    )}
                  </button>
                  <button onClick={() => { setIsMenuOpen(false); setIsCartOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 font-bold transition-all text-xs">
                    <ShoppingBag size={16} className="text-indigo-400" /> {isAr ? 'حقيبة المشتريات' : 'Shopping Bag'}
                  </button>
                </>
              )}

              {isUserAdmin && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <button onClick={() => { setIsMenuOpen(false); setIsAdminMode(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs transition-all shadow-lg shadow-indigo-600/20">
                    <LayoutDashboard size={16} /> {isAr ? 'لوحة التحكم' : 'Admin Panel'}
                  </button>
                </div>
              )}
            </nav>
            <div className="mt-auto p-6 border-t border-white/5">
               <div className="text-[10px] text-slate-500 font-bold text-center uppercase tracking-widest">GoTher Store Elite</div>
            </div>
          </div>
        </div>
      )}

      {!showUserOrders ? (
        <main className="pt-24 pb-8 flex-1 max-w-7xl mx-auto w-full px-4">
          {/* Banner Section */}
          {banners.length > 0 && (
            <section className="mb-10 flex justify-center w-full">
              <div className="relative w-full max-w-4xl aspect-[4/1] md:aspect-[5/1] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.2)] border border-white/10 bg-black/20">
                {banners.map((banner, index) => (
                  <div key={banner.id} className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === activeBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    {banner.link ? (
                      <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer hover:brightness-110 transition-all">
                        {isVideo(banner.url) ? 
                          <video src={banner.url} className="w-full h-full object-cover" autoPlay muted loop playsInline /> : 
                          <img src={banner.url} className="w-full h-full object-cover" alt="Banner" />
                        }
                        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink size={14} className="text-white" />
                        </div>
                      </a>
                    ) : (
                      isVideo(banner.url) ? 
                        <video src={banner.url} className="w-full h-full object-cover" autoPlay muted loop playsInline /> : 
                        <img src={banner.url} className="w-full h-full object-cover" alt="Banner" />
                    )}
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-[15] pointer-events-none" />
              </div>
            </section>
          )}

          {/* Products Section */}
          <section id="products">
             <div className="flex flex-col items-center gap-6 mb-10">
              <h2 className="text-xl font-black text-white tracking-widest uppercase text-center border-b-2 border-indigo-600 pb-2">
                {isAr ? sectionTitleAr : sectionTitleEn}
              </h2>
              <div className="flex flex-wrap justify-center gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
                {uiCategories.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${activeCategory === cat.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                    {isAr ? cat.nameAr : cat.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 min-h-[400px]">
              {products.length > 0 ? filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} lang={lang} onAddToCart={addToCart} onPreview={setPreviewProduct} />
              )) : (
                Array(4).fill(0).map((_, idx) => (
                  <div key={idx} className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse" />
                ))
              )}
            </div>
          </section>
        </main>
      ) : null}

      <footer className="py-6 border-t border-white/5 text-center px-4">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">&copy; {new Date().getFullYear()} {siteName}</div>
      </footer>

      {/* Preview Product Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setPreviewProduct(null)} />
          <div className="relative w-full max-w-3xl bg-[#160a25] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl animate-scale-up">
            <button onClick={() => setPreviewProduct(null)} className="absolute top-4 right-4 z-50 text-white p-2 rounded-full bg-black/50"><X size={20}/></button>
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 bg-black aspect-square flex items-center justify-center overflow-hidden">
                {isVideo(previewProduct.videoUrl || '') ? (
                  <video src={previewProduct.videoUrl} autoPlay loop playsInline controls className="w-full h-full object-contain" />
                ) : (
                  <img src={previewProduct.previewUrl} className="w-full h-full object-contain" alt="Preview" />
                )}
              </div>
              <div className="md:w-1/2 p-8 flex flex-col justify-center">
                <h2 className="text-xl font-black text-white mb-1">{isAr ? previewProduct.nameAr : previewProduct.name}</h2>
                <div className="text-indigo-400 font-bold mb-4">$ {previewProduct.price.toFixed(2)}</div>
                
                {previewProduct.formats && previewProduct.formats.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {previewProduct.formats.map(fmt => (
                      <span key={fmt} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <Layers size={10} className="text-indigo-500" />
                        {fmt}
                      </span>
                    ))}
                  </div>
                )}

                <button 
                  onClick={() => { addToCart(previewProduct); setPreviewProduct(null); }}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={18} /> {isAr ? 'إضافة إلى السلة' : 'ADD TO CART'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
