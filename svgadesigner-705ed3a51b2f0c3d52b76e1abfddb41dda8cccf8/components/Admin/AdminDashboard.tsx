
import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminProductList from './ProductList';
import ProductForm from './ProductForm';
import OrderList from './OrderList';
import UserManager from './UserManager';
import CategoryManager from './CategoryManager';
import AdminSettings from './AdminSettings';
import StaffManager from './StaffManager'; 
import AccountLinker from './AccountLinker';
import { Product, Order, UserProfile } from '../../types';
import { db, doc, setDoc, deleteDoc, updateDoc } from '../../firebase';
import { Menu, X } from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  bannerUrl: string;
  banners: {id: string, url: string}[];
  storeWhatsApp: string;
  siteName: string;
  onProductsUpdate: (newProducts: Product[]) => void;
  onOrdersUpdate: (newOrders: Order[]) => void;
  onUpdateBanner: (url: string) => void;
  onExit: () => void;
  isAr: boolean;
  currentUser: UserProfile; 
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, 
  orders, 
  banners,
  storeWhatsApp,
  siteName,
  onExit, 
  isAr,
  currentUser
}) => {
  // اعتبار ID 1 و 111 كـ Master Admin
  const isMaster = currentUser.serialId === 1 || currentUser.serialId === 111 || currentUser.role === 'admin';
  const initialTab = isMaster || currentUser.permissions?.includes('dashboard') ? 'dashboard' : (currentUser.permissions?.[0] || 'dashboard');
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // التحقق من صلاحية الوصول مع منح الأولوية للمدير العام
  const hasAccess = (tab: string) => {
    if (isMaster) return true;
    if (tab === 'dashboard' && currentUser.permissions?.includes('dashboard')) return true;
    return currentUser.permissions?.includes(tab);
  };

  const handleSaveProduct = async (p: Product) => {
    try {
      await setDoc(doc(db, "products", p.id), p);
      setEditingProduct(null);
      setActiveTab('list');
      setIsSidebarOpen(false);
    } catch (err) {
      console.error("Error saving product:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (err) {
        console.error("Error deleting product:", err);
      }
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, "orders", id), { status });
    } catch (err) {
      console.error("Error updating order:", err);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this order?')) {
      try {
        await deleteDoc(doc(db, "orders", id));
      } catch (err) {
        console.error("Error deleting order:", err);
      }
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f0518] flex text-white overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-[210] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 right-0 z-[220] transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <AdminSidebar 
          activeTab={editingProduct ? 'edit' : activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }} 
          onExit={onExit} 
          isAr={isAr} 
          orderCount={pendingCount}
          siteName={siteName}
          currentUser={currentUser} 
        />
      </div>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-12 relative">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-3 bg-white/5 rounded-xl mb-6 hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </button>

        <header className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-black mb-2 uppercase tracking-tighter">
            {editingProduct 
              ? (isAr ? 'تعديل المنتج' : 'Edit Product') 
              : activeTab === 'orders' 
                ? (isAr ? 'طلبات العملاء' : 'Client Orders')
                : activeTab === 'users'
                  ? (isAr ? 'المستخدمين' : 'Users Center')
                  : activeTab === 'staff'
                    ? (isAr ? 'طاقم الإشراف' : 'Staff Center')
                    : activeTab === 'linker'
                      ? (isAr ? 'ربط الحسابات' : 'Account Linker')
                      : activeTab === 'categories'
                        ? (isAr ? 'إدارة الأقسام' : 'Categories Management')
                        : activeTab === 'settings'
                          ? (isAr ? 'إعدادات المتجر' : 'Store Settings')
                          : (isAr ? 'لوحة التحكم المركزية' : 'Admin Control Center')}
          </h1>
        </header>

        {(activeTab === 'dashboard' && hasAccess('dashboard')) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12">
            {[
              { label: isAr ? 'إجمالي المنتجات' : 'Total Products', value: products.length, color: 'indigo' },
              { label: isAr ? 'الطلبات الجديدة' : 'New Orders', value: pendingCount, color: 'orange' },
              { label: isAr ? 'المبيعات المكتملة' : 'Sales Completed', value: orders.filter(o => o.status === 'completed').length, color: 'green' },
              { label: isAr ? 'إجمالي الدخل' : 'Total Revenue', value: `$${orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0).toFixed(0)}`, color: 'purple' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-[#160a25] border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-3xl">
                <div className="text-slate-500 text-[8px] md:text-[10px] font-bold uppercase mb-1 md:mb-2">{stat.label}</div>
                <div className={`text-xl md:text-4xl font-black text-${stat.color}-500`}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="min-w-0">
          {(activeTab === 'users' && hasAccess('users')) && <UserManager isAr={isAr} />}
          {(activeTab === 'staff' && isMaster) && <StaffManager isAr={isAr} />}
          {(activeTab === 'linker' && hasAccess('linker')) && <AccountLinker isAr={isAr} />}
          {(activeTab === 'categories' && hasAccess('categories')) && <CategoryManager isAr={isAr} />}
          
          {(activeTab === 'orders' && hasAccess('orders')) && (
            <OrderList 
              orders={orders} 
              isAr={isAr} 
              onUpdateStatus={handleUpdateOrderStatus} 
              onDelete={handleDeleteOrder} 
            />
          )}

          {(activeTab === 'list' && !editingProduct && hasAccess('list')) && (
            <AdminProductList 
              products={products} 
              onEdit={(p) => setEditingProduct(p)} 
              onDelete={handleDeleteProduct} 
              isAr={isAr} 
            />
          )}

          {((activeTab === 'add' || editingProduct) && (hasAccess('add') || hasAccess('list'))) && (
            <ProductForm 
              isAr={isAr} 
              initialData={editingProduct || undefined}
              onSave={handleSaveProduct}
              onCancel={() => {
                setEditingProduct(null);
                setActiveTab('list');
              }}
            />
          )}

          {(activeTab === 'settings' && hasAccess('settings')) && (
            <AdminSettings 
              banners={banners}
              storeWhatsApp={storeWhatsApp}
              siteName={siteName}
              isAr={isAr} 
              currentUser={currentUser}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
