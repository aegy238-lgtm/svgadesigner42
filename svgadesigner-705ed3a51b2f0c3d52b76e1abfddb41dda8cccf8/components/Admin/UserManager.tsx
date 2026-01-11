
import React, { useState, useEffect } from 'react';
import { db, collections, onSnapshot, doc, updateDoc, deleteDoc } from '../../firebase';
import { UserProfile } from '../../types';
import { ShieldAlert, ShieldCheck, Snowflake, Trash2, Mail, User, Hash, Phone } from 'lucide-react';

interface UserManagerProps {
  isAr: boolean;
}

const UserManager: React.FC<UserManagerProps> = ({ isAr }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collections.users, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateUserStatus = async (uid: string, status: UserProfile['status']) => {
    try {
      await updateDoc(doc(db, "users", uid), { status });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUserAccount = async (uid: string, displayName: string) => {
    if (confirm(isAr ? `هل أنت متأكد من حذف حساب ${displayName} نهائياً من قاعدة البيانات؟` : `Are you sure you want to permanently delete ${displayName}'s account?`)) {
      try {
        await deleteDoc(doc(db, "users", uid));
        alert(isAr ? 'تم حذف الحساب بنجاح' : 'Account deleted successfully');
      } catch (err) {
        console.error(err);
        alert(isAr ? 'فشل حذف الحساب' : 'Failed to delete account');
      }
    }
  };

  return (
    <div className="bg-[#160a25] border border-white/5 rounded-[2rem] overflow-hidden animate-fade-in">
      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1a0a2a]">
        <h3 className="text-xl font-black flex items-center gap-3">
          <User className="text-indigo-500" />
          {isAr ? 'إدارة المستخدمين' : 'User Management'}
        </h3>
        <span className="bg-indigo-600/10 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold border border-indigo-600/20">
          {users.length} {isAr ? 'عضو مسجل' : 'Registered Members'}
        </span>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-right min-w-[1000px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'المعرف (ID)' : 'Serial ID'}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'المستخدم' : 'User'}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'رقم الهاتف/الشبكة' : 'Phone/Network'}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'الحالة' : 'Status'}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'تاريخ الانضمام' : 'Joined'}</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'الإجراءات' : 'Control'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.sort((a,b) => (a.serialId || 0) - (b.serialId || 0)).map((user) => (
              <tr key={user.uid} className={`hover:bg-white/[0.02] transition-colors ${user.serialId === 1 ? 'bg-indigo-500/5' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 font-black text-indigo-400">
                    <Hash size={12} />
                    {user.serialId || '---'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-white text-sm">{user.displayName}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                    <Mail size={10} />
                    {user.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-slate-300 flex items-center gap-2 justify-end">
                    {user.phoneNumber ? (
                      <>
                        <span>{user.phoneNumber}</span>
                        <Phone size={12} className="text-green-500" />
                      </>
                    ) : (
                      <span className="text-slate-600 italic">{isAr ? 'غير مسجل' : 'Not set'}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                    user.status === 'active' ? 'bg-green-500/10 text-green-400' : 
                    user.status === 'blocked' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {user.status === 'active' ? (isAr ? 'نشط' : 'Active') : 
                     user.status === 'blocked' ? (isAr ? 'محظور' : 'Blocked') : (isAr ? 'مجمد' : 'Frozen')}
                  </span>
                </td>
                <td className="px-6 py-4 text-[10px] text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-end">
                    {user.status !== 'active' && (
                      <button 
                        onClick={() => updateUserStatus(user.uid, 'active')}
                        className="p-2 bg-green-600/10 text-green-400 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                        title={isAr ? 'تنشيط' : 'Activate'}
                      >
                        <ShieldCheck size={16} />
                      </button>
                    )}
                    {user.status === 'active' && (
                      <button 
                        onClick={() => updateUserStatus(user.uid, 'frozen')}
                        className="p-2 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                        title={isAr ? 'تجميد' : 'Freeze'}
                      >
                        <Snowflake size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => updateUserStatus(user.uid, 'blocked')}
                      className="p-2 bg-orange-600/10 text-orange-400 rounded-lg hover:bg-orange-600 hover:text-white transition-all"
                      title={isAr ? 'حظر' : 'Block'}
                    >
                      <ShieldAlert size={16} />
                    </button>
                    {user.serialId !== 1 && (
                      <button 
                        onClick={() => deleteUserAccount(user.uid, user.displayName)}
                        className="p-2 bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                        title={isAr ? 'حذف نهائي' : 'Permanent Delete'}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManager;
