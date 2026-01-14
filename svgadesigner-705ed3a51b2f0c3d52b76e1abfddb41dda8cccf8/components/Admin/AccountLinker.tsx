
import React, { useState, useEffect } from 'react';
import { db, collections, onSnapshot, doc, updateDoc, query, where, getDocs } from '../../firebase';
import { UserProfile } from '../../types';
import { Key, User, Hash, Save, RefreshCw, Search, ShieldCheck, Loader2, CheckCircle2, Lock, Edit3, Eye, EyeOff } from 'lucide-react';

interface AccountLinkerProps {
  isAr: boolean;
}

const AccountLinker: React.FC<AccountLinkerProps> = ({ isAr }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editingIdUid, setEditingIdUid] = useState<string | null>(null);
  const [editPass, setEditPass] = useState('');
  const [editId, setEditId] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const ADMIN_EMAIL = 'admin@1gother.com';

  useEffect(() => {
    const unsub = onSnapshot(collections.users, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLinkAccount = async (uid: string) => {
    if (!editPass) return;
    try {
      await updateDoc(doc(db, "users", uid), { linkedPassword: editPass });
      setEditingUid(null);
      setEditPass('');
      alert(isAr ? 'تم ربط الحساب بكلمة المرور بنجاح' : 'Account linked successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateId = async (uid: string) => {
    const newIdNum = parseInt(editId);
    if (isNaN(newIdNum)) {
      alert(isAr ? 'يرجى إدخال رقم صحيح' : 'Please enter a valid number');
      return;
    }

    // التحقق من تكرار الـ ID
    const isTaken = users.find(u => u.serialId === newIdNum && u.uid !== uid);
    if (isTaken) {
      alert(isAr ? 'هذا المعرف (ID) مستخدم بالفعل' : 'This ID is already taken');
      return;
    }

    try {
      await updateDoc(doc(db, "users", uid), { serialId: newIdNum });
      setEditingIdUid(null);
      setEditId('');
      alert(isAr ? 'تم تحديث المعرف بنجاح' : 'ID updated successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleShowPass = (uid: string) => {
    setShowPasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const syncSystem = async () => {
    setSyncing(true);
    try {
      for (const user of users) {
        if (user.email.toLowerCase() === ADMIN_EMAIL && user.serialId !== 111) {
          await updateDoc(doc(db, "users", user.uid), { serialId: 111, role: 'admin' });
        }
      }
      alert(isAr ? 'تمت مزامنة النظام وتثبيت المدير على ID 111' : 'System synced. Admin fixed at ID 111');
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.serialId?.toString() === searchTerm
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#160a25] border border-white/5 rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-black flex items-center gap-3 text-indigo-400">
            <ShieldCheck />
            {isAr ? 'إدارة الهويات ومعرفات الدخول' : 'Identity & ID Management'}
          </h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
            {isAr ? 'تحكم في أرقام المستخدمين وكلمات مرور الدخول الخاصة بهم' : 'Control user IDs and their login passwords'}
          </p>
        </div>
        <button onClick={syncSystem} disabled={syncing} className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/10 transition-all text-xs">
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {isAr ? 'مزامنة وتثبيت المدير (111)' : 'Sync & Fix Admin (111)'}
        </button>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input type="text" placeholder={isAr ? 'بحث بالاسم أو البريد أو الـ ID...' : 'Search by Name, Email or ID...'} className="w-full bg-[#160a25] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm focus:border-indigo-500 outline-none transition-all shadow-xl shadow-black/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-[#160a25] border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? 'المعرف (ID)' : 'SERIAL ID'}</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? 'المستخدم' : 'USER'}</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? 'كلمة السر' : 'LOGIN PASS'}</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? 'الإجراءات' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.sort((a,b) => (a.serialId || 0) - (b.serialId || 0)).map(user => (
                <tr key={user.uid} className={`hover:bg-white/[0.02] transition-colors ${user.serialId === 111 ? 'bg-indigo-600/5' : ''}`}>
                  <td className="px-8 py-4">
                    {editingIdUid === user.uid ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white w-20 outline-none focus:border-indigo-500" 
                          value={editId} 
                          onChange={e => setEditId(e.target.value)} 
                        />
                        <button onClick={() => handleUpdateId(user.uid)} className="text-green-500 hover:text-green-400"><Save size={14} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setEditingIdUid(user.uid); setEditId(user.serialId?.toString() || ''); }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black border flex items-center gap-2 ${user.serialId === 111 ? 'bg-orange-600/20 text-orange-400 border-orange-600/30' : 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30'} hover:scale-105 transition-transform`}
                      >
                        {user.serialId === 111 && <ShieldCheck size={12} />}
                        ID: {user.serialId}
                        <Edit3 size={10} className="opacity-40" />
                      </button>
                    )}
                  </td>
                  <td className="px-8 py-4">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      {user.displayName}
                      {user.serialId === 111 && <span className="bg-indigo-500 text-white text-[8px] px-1.5 py-0.5 rounded uppercase">Master</span>}
                    </div>
                    <div className="text-[10px] text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-8 py-4">
                    {editingUid === user.uid ? (
                      <div className="relative">
                        <input type="text" className="bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500" value={editPass} onChange={e => setEditPass(e.target.value)} />
                        <Lock className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs font-mono">
                          {showPasswords[user.uid] ? (user.linkedPassword || '---') : '••••••••'}
                        </span>
                        <button onClick={() => toggleShowPass(user.uid)} className="text-slate-600 hover:text-slate-400">
                          {showPasswords[user.uid] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex gap-2">
                      {editingUid === user.uid ? (
                        <button onClick={() => handleLinkAccount(user.uid)} className="p-2 bg-green-600/10 text-green-400 rounded-lg hover:bg-green-600 hover:text-white transition-all"><Save size={16} /></button>
                      ) : (
                        <button onClick={() => { setEditingUid(user.uid); setEditPass(user.linkedPassword || ''); }} className="px-4 py-2 bg-indigo-600/10 text-indigo-400 rounded-xl text-[10px] font-black border border-indigo-600/20 hover:bg-indigo-600 hover:text-white transition-all uppercase whitespace-nowrap">
                          {isAr ? 'تعديل كلمة السر' : 'EDIT PASS'}
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
    </div>
  );
};

export default AccountLinker;
