
import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import AdminDashboard from './components/Admin/AdminDashboard';
import AuthModal from './components/Auth/AuthModal';
import ProfileCenter from './components/Profile/ProfileCenter';
import CartDrawer from './components/Cart/CartDrawer'; // المكون الجديد
import { Product, CartItem, Order, UserProfile, Category } from './types';
import { db, collections, onSnapshot, doc, setDoc, auth, getDoc } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  ShoppingCart, X, Plus, Minus, MessageCircle, ShoppingBag, 
  ShieldCheck, User, Phone, Globe, Loader2, Package, CheckCircle, Clock, Home, LogIn, LayoutDashboard, FileCheck
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth & Profile State
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

  const isAr = lang === 'ar';

  const isVideo = (url: string) => {
    return url && (url.startsWith('data:video') || url.endsWith('.mp4') || url.endsWith('.webm'));
  };

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
            alert(isAr ? 'هذا الحساب محظور' : 'This account is blocked');
          } else {
            const isAuthorized = profileData.serialId === 1 || profileData.role === 'admin' || profileData.role === 'moderator';
            setCurrentUser({
              ...profileData,
              role: profileData.serialId === 1 ? 'admin' : profileData.role
            } as UserProfile);
            setCustomerInfo(prev => ({ ...prev, name: profileData.displayName, whatsapp: profileData.phoneNumber || '' }));
          }
        }
      } else {
        setCurrentUser(null);
        setIsAdminMode(false);
      }
    });

    let productsLoaded = false;
    let ordersLoaded = false;
    let bannersLoaded = false;
    let categoriesLoaded = false;

    const checkLoading = () => {
      if (productsLoaded && ordersLoaded && bannersLoaded && categoriesLoaded) {
        setIsLoading(false);
      }
    };

    const unsubProducts = onSnapshot(collections.products, (snapshot) => {
      const prodsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prodsData);
      productsLoaded = true;
      checkLoading();
    });

    const unsubCategories = onSnapshot(collections.categories, (snapshot) => {
      const catsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(catsData);
      categoriesLoaded = true;
      checkLoading();
    });

    const unsubOrders = onSnapshot(collections.orders, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
      ordersLoaded = true;
      checkLoading();
    });

    const unsubBanners = onSnapshot(collections.banners, (snapshot) => {
      const bannersData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        url: doc.data().url,
        link: doc.data().link
      }));
      setBanners(bannersData);
      bannersLoaded = true;
      checkLoading();
    });

    const unsubConfig = onSnapshot(doc(db, "settings", "store_config"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreWhatsApp(data.whatsapp || '');
        setSiteName(data.siteName || 'GoTher');
        document.title = `${data.siteName || 'GoTher'} – Animated Gifts Store`;
      }
    });

    return () => {
      unsubAuth(); unsubProducts(); unsubCategories(); unsubOrders(); unsubBanners(); unsubConfig();
    };
  }, [isAr]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category === activeCategory);
  }, [activeCategory, products]);

  const uiCategories = useMemo(() => [
    { id: 'all', name: 'All', nameAr: 'الكل', icon: '🛍️' },
    ...categories
  ], [categories]);

  const addToCart = (product: Product) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    if (currentUser.status === 'frozen') {
      alert(isAr ? 'حسابك مجمد حالياً' : 'Account frozen');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async (method: 'site' | 'whatsapp') => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    if (!customerInfo.name || !customerInfo.whatsapp) {
      alert(isAr ? 'يرجى ملء جميع البيانات' : 'Please fill all details');
      return;
    }

    if (method === 'site') {
      const orderId = `ORD-${Date.now()}`;
      const newOrder: Order = {
        id: orderId,
        customerName: customerInfo.name,
        customerWhatsApp: customerInfo.whatsapp,
        items: cart,
        total: cartTotal,
        status: 'pending',
        createdAt: new Date().toISOString(),
        notes: 'Ordered via Site'
      };

      try {
        await setDoc(doc(db, "orders", orderId), newOrder);
        setCart([]); setShowCheckoutForm(false); setIsCartOpen(false);
        alert(isAr ? 'تم استلام طلبك بنجاح!' : 'Order received!');
      } catch (err) {
        alert(isAr ? 'خطأ في إرسال الطلب' : 'Error placing order');
      }
    } else {
      // Logic for WhatsApp is handled inside CartDrawer, we just clear cart here
      setCart([]); setShowCheckoutForm(false); setIsCartOpen(false);
    }
  };

  const isUserAdmin = currentUser?.serialId === 1 || currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0518] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-bold tracking-widest uppercase animate-pulse">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0f0518] ${isAr ? 'rtl' : 'ltr'}`}>
      
      {isAdminMode && isUserAdmin && currentUser && (
        <AdminDashboard 
          products={products} orders={orders} bannerUrl={banners[0]?.url || ''} banners={banners}
          storeWhatsApp={storeWhatsApp} siteName={siteName} onProductsUpdate={() => {}} onOrdersUpdate={() => {}}
          onUpdateBanner={() => {}} onExit={() => setIsAdminMode(false)} isAr={isAr}
          currentUser={currentUser}
        />
      )}

      <Navbar cartCount={cart.reduce((s, i) => s + i.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} onOpenMenu={() => setIsMenuOpen(true)} lang={lang} setLang={setLang} siteName={siteName} />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} isAr={isAr} />
      <ProfileCenter isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} isAr={isAr} />
      
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart} 
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onPlaceOrder={handlePlaceOrder}
        isAr={isAr}
        total={cartTotal}
        customerInfo={customerInfo}
        setCustomerInfo={setCustomerInfo}
        showCheckout={showCheckoutForm}
        setShowCheckout={setShowCheckoutForm}
        storeWhatsApp={storeWhatsApp}
      />

      {/* Side Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[150] flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className={`relative w-80 bg-[#12071d] h-full shadow-2xl flex flex-col border-r border-white/5 animate-slide-in-${isAr ? 'right' : 'left'}`}>
            <div className="p-8 border-b border-white/5 flex flex-col gap-4 bg-[#1a0a2a]">
              <div className="flex justify-between items-center">
                <div className="text-xl font-black text-indigo-400 uppercase">{siteName}</div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
              </div>
              {currentUser && (
                <div onClick={() => { setIsMenuOpen(false); setIsProfileOpen(true); }} className="mt-4 flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                  <div className="h-10 w-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 font-bold">
                    {currentUser.serialId === 1 ? <ShieldCheck size={20} /> : currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white truncate max-w-[120px]">{currentUser.displayName}</div>
                    <div className="text-[9px] text-slate-500 truncate max-w-[150px]">ID: {currentUser.serialId}</div>
                  </div>
                </div>
              )}
            </div>
            <nav className="p-4 space-y-2 flex-1">
              <button onClick={() => { setIsMenuOpen(false); window.scrollTo(0,0); }} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-300 hover:bg-white/5 font-bold transition-all"><Home size={20} className="text-indigo-500" /> {isAr ? 'الرئيسية' : 'Home'}</button>
              {!currentUser ? (
                <button onClick={() => { setIsMenuOpen(false); setIsAuthModalOpen(true); }} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-white hover:bg-indigo-600 font-black transition-all bg-indigo-600/20 border border-indigo-600/30"><LogIn size={20} className="text-indigo-400" /> {isAr ? 'تسجيل الدخول' : 'Sign In'}</button>
              ) : (
                <>
                  <button onClick={() => { setIsMenuOpen(false); setShowUserOrders(true); }} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-300 hover:bg-white/5 font-bold transition-all"><Package size={20} className="text-indigo-500" /> {isAr ? 'سجل مشترياتي' : 'Order History'}</button>
                  {isUserAdmin && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <button onClick={() => { setIsMenuOpen(false); setIsAdminMode(true); }} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-white hover:bg-indigo-600 font-black transition-all bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-white/10">
                        <LayoutDashboard size={20} className="text-white" /> {isAr ? 'لوحة المسؤول' : 'Admin Panel'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Section */}
        {banners.length > 0 && (
          <section className="mb-12 flex justify-center relative group px-2">
            <div className="relative w-full aspect-[16/9] md:aspect-[3/1] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-black/20">
              {banners.map((banner, index) => (
                <div key={banner.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === activeBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                  {isVideo(banner.url) ? <video src={banner.url} className="w-full h-full object-cover" autoPlay muted loop playsInline /> : <img src={banner.url} className="w-full h-full object-cover" alt="Banner" />}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Products Section */}
        <section id="products">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase">{isAr ? 'أحدث الهدايا المتميزة' : 'PREMIUM GIFTS'}</h2>
            <div className="flex flex-wrap justify-center gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
              {uiCategories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all border whitespace-nowrap ${activeCategory === cat.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'}`}>
                  {isAr ? cat.nameAr : cat.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} lang={lang} onAddToCart={addToCart} onPreview={setPreviewProduct} />
            ))}
          </div>
        </section>
      </main>

      {/* Preview Product Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setPreviewProduct(null)} />
          <div className="relative w-full max-w-4xl bg-[#160a25] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl animate-scale-up">
            <button onClick={() => setPreviewProduct(null)} className="absolute top-6 right-6 z-50 text-white hover:text-indigo-400 transition-colors bg-black/40 p-2 rounded-full"><X/></button>
            
            <div className="flex flex-col md:flex-row">
              <div className="md:w-3/5 bg-black aspect-video md:aspect-auto flex items-center justify-center overflow-hidden">
                {isVideo(previewProduct.videoUrl || '') ? (
                  <video src={previewProduct.videoUrl} autoPlay loop playsInline controls className="w-full h-full object-contain" />
                ) : (
                  <img src={previewProduct.previewUrl} className="w-full h-full object-contain" alt="Preview" />
                )}
              </div>
              <div className="md:w-2/5 p-8 md:p-12 space-y-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{isAr ? previewProduct.nameAr : previewProduct.name}</h2>
                  <div className="text-indigo-400 font-bold text-lg">$ {previewProduct.price.toFixed(2)}</div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isAr ? 'التنسيقات المتاحة' : 'AVAILABLE FORMATS'}</div>
                  <div className="flex flex-wrap gap-2">
                    {previewProduct.formats.map(f => (
                      <span key={f} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-slate-300">{f}</span>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
                  <button 
                    onClick={() => { addToCart(previewProduct); setPreviewProduct(null); }}
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <ShoppingBag size={20} />
                    {isAr ? 'إضافة إلى السلة' : 'ADD TO CART'}
                  </button>
                  <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                    {isAr ? 'دفع آمن واستلام فوري عبر الواتساب' : 'Secure payment & instant delivery'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
