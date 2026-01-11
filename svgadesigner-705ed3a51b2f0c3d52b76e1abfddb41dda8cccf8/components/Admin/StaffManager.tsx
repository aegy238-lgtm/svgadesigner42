
import React, { useState, useEffect } from 'react';
// Fix: Removed writeBatch from imports as it's not exported from firebase.ts and not used in this file.
import { db, collections, onSnapshot, doc, updateDoc, query, where, getDocs } from '../../firebase';
import { UserProfile } from '../../types';
import { ShieldCheck, UserPlus, Trash2, CheckCircle2, Lock, Search, Loader2, Shield, Trash } from 'lucide-react';

interface StaffManagerProps {
  isAr: boolean;
}

const StaffManager: React.FC<StaffManagerProps> = ({ isAr }) => {
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [searchId, setSearchId] = useState('');
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const availablePermissions = [
    { id: 'dashboard', label: isAr ? 'الإحصائيات' : 'Stats' },
    { id: 'orders', label: isAr ? 'الطلبات' : 'Orders' },
    { id: 'users', label: isAr ? 'المستخدمين' : 'Users' },
    { id: 'linker', label: isAr ? 'ربط الحسابات' : 'Linker' },
    { id: 'categories', label: isAr ? 'الأقسام' : 'Categories' },
    { id: 'list', label: isAr ? 'المنتجات' : 'Products' },
    { id: 'add', label: isAr ? 'إضافة منتج' : 'Add Product' },
    { id: 'settings', label: isAr ? 'الإعدادات' : 'Settings' },
  ];

  useEffect(() => {
    const unsub = onSnapshot(query(collections.users, where("role", "==", "moderator")), (snap) => {
      setStaff(snap.docs.map(doc => doc.data() as UserProfile));
    });
    return () => unsub();
  }, []);

  const handleSearchUser = async () => {
    if (!searchId) return;
    setLoading(true);
    setFoundUser(null);
    try {
      const q = query(collections.users, where("serialId", "==", parseInt(searchId)));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userData = snap.docs[0].data() as UserProfile;
        if (userData.serialId === 1) {
          alert(isAr ? 'لا يمكن تعديل صلاحيات المدير العام الرئيسي' : 'Cannot edit Master Admin permissions');
        } else {
          setFoundUser(userData);
        }
      } else {
        alert(isAr ? 'المستخدم غير موجود' : 'User not found');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cleanOldAdmins = async () => {
    if (!confirm(isAr ? 'سيتم سحب صلاحيات الإدارة من جميع الحسابات عدا ID 1. هل أنت متأكد؟' : 'This will revoke admin permissions from all accounts except ID 1. Proceed?')) return;
    setCleaning(true);
    try {
      const q = query(collections.users, where("role", "==", "admin"));
      const snap = await getDocs(q);
      
      for (const userDoc of snap.docs) {
        const data = userDoc.data() as UserProfile;
        if (data.serialId !== 1) {
          await updateDoc(userDoc.ref, { role: 'user', permissions: [] });
        }
      }
      alert(isAr ? 'تم تنظيف حسابات الإدارة بنجاح' : 'Admin accounts cleaned successfully');
    } catch (err) {
      console.error(err);
    } finally {
      setCleaning(false);
    }
  };

  const togglePermission = (permId: string) => {
    if (!foundUser) return;
    const current = foundUser.permissions || [];
    const updated = current.includes(permId) 
      ? current.filter(p => p !== permId) 
      : [...current, permId];
    setFoundUser({ ...foundUser, permissions: updated });
  };

  const saveStaffMember = async () => {
    if (!foundUser) return;
    setUpdating(true);
    try {
      const isRemoving = !foundUser.permissions || foundUser.permissions.length === 0;
      await updateDoc(doc(db, "users", foundUser.uid), {
        role: isRemoving ? 'user' : 'moderator',
        permissions: foundUser.permissions || []
      });
      alert(isAr ? 'تم تحديث دور المشرف بنجاح' : 'Staff role updated successfully');
      setFoundUser(null);
      setSearchId('');
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const removeStaff = async (uid: string) => {
    if (confirm(isAr ? 'هل تريد سحب الصلاحيات من هذا المشرف؟' : 'Revoke permissions from this staff member?')) {
      await updateDoc(doc(db, "users", uid), {
        role: 'user',
        permissions: []
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Controls */}
      <div className="flex justify-end">
        <button 
          onClick={cleanOldAdmins}
          disabled={cleaning}
          className="flex items-center gap-2 px-6 py-3 bg-red-600/10 text-red-500 rounded-2xl border border-red-600/20 font-black text-xs hover:bg-red-600 hover:text-white transition-all shadow-lg"
        >
          {cleaning ? <Loader2 className="animate-spin" size={16} /> : <Trash size={16} />}
          {isAr ? 'تنظيف جميع المديرين (عدا ID 1)' : 'CLEAN ALL ADMINS (EXCEPT ID 1)'}
        </button>
      </div>

      {/* Search & Assign Box */}
      <div className="bg-[#160a25] border border-white/5 rounded-[2rem] p-8">
        <h3 className="text-xl font-black flex items-center gap-3 mb-6 text-indigo-400">
          <UserPlus />
          {isAr ? 'إضافة مشرف جديد' : 'Assign New Staff'}
        </h3>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="number" 
              placeholder={isAr ? 'أدخل الـ ID الخاص بالمستخدم...' : 'Enter User Serial ID...'}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm outline-none focus:border-indigo-500 text-white"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSearchUser}
            disabled={loading}
            className="bg-indigo-600 px-8 py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all text-white"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            {isAr ? 'بحث' : 'FIND'}
          </button>
        </div>

        {foundUser && (
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl animate-scale-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-lg font-black text-white">{foundUser.displayName}</div>
                <div className="text-xs text-slate-500">ID: {foundUser.serialId} | {foundUser.email}</div>
              </div>
              <button onClick={() => setFoundUser(null)} className="text-slate-500 hover:text-white transition-colors">
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {availablePermissions.map(p => (
                <button
                  key={p.id}
                  onClick={() => togglePermission(p.id)}
                  className={`p-3 rounded-xl text-[10px] font-black border transition-all flex items-center justify-between ${
                    foundUser.permissions?.includes(p.id) 
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                      : 'bg-black/20 border-white/5 text-slate-500'
                  }`}
                >
                  {p.label}
                  {foundUser.permissions?.includes(p.id) && <CheckCircle2 size={12} />}
                </button>
              ))}
            </div>

            <button 
              onClick={saveStaffMember}
              disabled={updating}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-black shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              {updating ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
              {isAr ? 'تحديث صلاحيات المشرف' : 'CONFIRM STAFF ROLE'}
            </button>
          </div>
        )}
      </div>

      {/* Staff List */}
      <div className="bg-[#160a25] border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center gap-3 bg-[#1a0a2a]">
          <Shield className="text-indigo-400" />
          <h3 className="text-xl font-black">{isAr ? 'طاقم الإشراف الحالي' : 'Current Staff List'}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-8 py-4">{isAr ? 'المشرف' : 'Staff'}</th>
                <th className="px-8 py-4">{isAr ? 'الصلاحيات' : 'Permissions'}</th>
                <th className="px-8 py-4">{isAr ? 'إجراء' : 'Control'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-slate-500 font-bold italic">
                    {isAr ? 'لا يوجد مشرفين حالياً' : 'No staff members assigned'}
                  </td>
                </tr>
              ) : (
                staff.map(user => (
                  <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-4">
                      <div className="font-bold text-white text-sm">{user.displayName}</div>
                      <div className="text-[10px] text-indigo-400">ID: {user.serialId}</div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.permissions?.map(p => (
                          <span key={p} className="px-2 py-0.5 bg-indigo-600/10 text-indigo-400 text-[8px] font-bold rounded-md uppercase border border-indigo-600/20">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setFoundUser(user)}
                          className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <Lock size={16} />
                        </button>
                        <button 
                          onClick={() => removeStaff(user.uid)}
                          className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"
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
    </div>
  );
};

export default StaffManager;
