
import React, { useState, useEffect } from 'react';
import { auth, db, doc, updateDoc, onSnapshot, collections, query, where, getDocs } from '../../firebase';
import { updateProfile } from 'firebase/auth';
import { X, User, Mail, Save, Loader2, Shield, Phone, Hash, Fingerprint, Lock } from 'lucide-react';
import { UserProfile } from '../../types';

interface ProfileCenterProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
}

const ProfileCenter: React.FC<ProfileCenterProps> = ({ isOpen, onClose, isAr }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        setName(data.displayName);
        setPhone(data.phoneNumber || '');
      }
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen || !profile) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, "users", auth.currentUser.uid), { 
        displayName: name,
        phoneNumber: phone
      });
      
      alert(isAr ? 'تم تحديث ملفك بنجاح' : 'Profile updated successfully');
    } catch (err) {
      console.error(err);
      alert(isAr ? 'حدث خطأ أثناء الحفظ' : 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = profile.role === 'admin' || profile.serialId === 1 || profile.serialId === 111;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#160a25] border border-white/10 rounded-3xl p-8 animate-fade-in shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
        
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className={`h-20 w-20 ${isAdmin ? 'bg-indigo-600/30 border-indigo-500' : 'bg-white/5 border-white/10'} rounded-full flex items-center justify-center mb-4 border-2 overflow-hidden transition-all shadow-xl`}>
               {isAdmin ? <Shield size={40} className="text-indigo-400" /> : <User size={40} className="text-indigo-400" />}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#160a25]">
               ID: {profile.serialId}
            </div>
          </div>
          <h2 className="text-xl font-black">{isAr ? 'إعدادات الحساب' : 'Account Settings'}</h2>
          <div className="flex items-center gap-1.5 mt-1">
             <span className={`h-2 w-2 rounded-full ${profile.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{profile.role} Member</span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          {/* User ID Display (Read Only) */}
          <div className="space-y-2">
            <div className="flex justify-between px-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Fingerprint size={12} />
                {isAr ? 'المعرف الشخصي (ID)' : 'Personal Identity ID'}
              </label>
              <Lock size={12} className="text-slate-600" />
            </div>
            <div className="relative">
              <div className={`w-full bg-white/[0.02] border border-white/5 rounded-xl ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3.5 text-sm text-slate-400 font-mono shadow-inner flex items-center`}>
                <Hash className={`absolute ${isAr ? 'right-4' : 'left-4'} h-4 w-4 text-slate-600`} />
                {profile.serialId || '---'}
              </div>
            </div>
            <p className="text-[8px] text-slate-600 px-2 font-bold leading-relaxed italic">
              {isAr ? '* هذا المعرف ثابت ولا يمكن تغييره إلا من خلال الإدارة.' : '* This ID is fixed and can only be changed by admin.'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">{isAr ? 'الاسم المعروض' : 'Display Name'}</label>
            <div className="relative group">
              <User className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 transition-all`} />
              <input 
                required
                type="text"
                className={`w-full bg-white/5 border border-white/10 rounded-xl ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 text-sm focus:border-indigo-500 focus:outline-none transition-all`}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">{isAr ? 'رقم التواصل' : 'Contact Number'}</label>
            <div className="relative group">
              <Phone className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 transition-all`} />
              <input 
                type="text"
                className={`w-full bg-white/5 border border-white/10 rounded-xl ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 text-sm focus:border-indigo-500 focus:outline-none transition-all`}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+20..."
              />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isAr ? 'حفظ كافة التغييرات' : 'SAVE CHANGES'}
            </button>
            <button 
              type="button"
              onClick={() => auth.signOut()}
              className="w-full py-2 text-[10px] font-black text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
            >
              {isAr ? 'تسجيل الخروج من الجهاز' : 'Log Out from Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCenter;
