
import React, { useState } from 'react';
import { auth, db, doc, setDoc, getDoc, collections, getDocs, query, where, orderBy, limit } from '../../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signOut
} from 'firebase/auth';
import { X, Mail, Lock, User, Loader2, AlertCircle, ShieldCheck, Hash, UserPlus, LogIn } from 'lucide-react';
import { UserProfile } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, isAr }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ADMIN_EMAIL = 'admin@1gother.com';

  if (!isOpen) return null;

  const generateNewSerialId = async () => {
    try {
      const q = query(collections.users, orderBy("serialId", "desc"), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return 1001;
      const lastUser = snap.docs[0].data() as UserProfile;
      return (lastUser.serialId || 1000) + 1;
    } catch (e) {
      console.error("ID Generation Error:", e);
      return Math.floor(Math.random() * 9000) + 2000;
    }
  };

  const handleIdentifierLogin = async () => {
    const cleanIdentifier = identifier.trim();
    const isNumericId = /^\d+$/.test(cleanIdentifier);
    
    if (isNumericId) {
      const serialIdNum = parseInt(cleanIdentifier, 10);
      const q = query(collections.users, where("serialId", "==", serialIdNum));
      const querySnap = await getDocs(q);
      
      if (querySnap.empty) {
        if (cleanIdentifier === '111' || cleanIdentifier === '1') {
          return await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
        }
        throw new Error(isAr ? 'المعرف (ID) غير مسجل' : 'ID is not registered');
      }
      const userData = querySnap.docs[0].data() as UserProfile;
      return await signInWithEmailAndPassword(auth, userData.email, password);
    } else {
      return await signInWithEmailAndPassword(auth, cleanIdentifier.toLowerCase(), password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const userCred = await handleIdentifierLogin();
        const userDocRef = doc(db, "users", userCred.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          if (data.status === 'blocked') {
            await signOut(auth);
            throw new Error(isAr ? 'هذا الحساب محظور حالياً' : 'Account is blocked');
          }
        }
      } else {
        const targetEmail = identifier.toLowerCase().trim();
        if (!targetEmail.includes('@')) throw new Error(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Invalid email format');
        if (password.length < 6) throw new Error(isAr ? 'كلمة المرور قصيرة جداً (6 رموز على الأقل)' : 'Password too short');
        
        const userCred = await createUserWithEmailAndPassword(auth, targetEmail, password);
        await updateProfile(userCred.user, { displayName: name || 'User' });
        const assignedId = (targetEmail === ADMIN_EMAIL) ? 111 : await generateNewSerialId();
        const profile: UserProfile = {
          uid: userCred.user.uid,
          email: targetEmail,
          displayName: name || 'User',
          status: 'active',
          role: targetEmail === ADMIN_EMAIL ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          serialId: assignedId,
          linkedPassword: password
        };
        await setDoc(doc(db, "users", userCred.user.uid), profile);
      }
      onClose();
    } catch (err: any) {
      let msg = isAr ? 'فشل العملية، تأكد من صحة البيانات' : 'Operation failed';
      if (err.code === 'auth/email-already-in-use') msg = isAr ? 'البريد مسجل بالفعل' : 'Email in use';
      setError(err.message || msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#160a25] border border-white/10 rounded-[3rem] p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-scale-up overflow-hidden">
        
        {/* التبديل العلوي */}
        <div className="flex bg-black/40 p-1.5 rounded-[1.5rem] mb-10 border border-white/5">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[11px] font-black transition-all duration-500 ${isLogin ? 'bg-indigo-600 text-white shadow-[0_4px_20px_rgba(79,70,229,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LogIn size={16} />
            {isAr ? 'تسجيل دخول' : 'LOGIN'}
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[11px] font-black transition-all duration-500 ${!isLogin ? 'bg-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <UserPlus size={16} />
            {isAr ? 'حساب جديد' : 'REGISTER'}
          </button>
        </div>

        <button onClick={onClose} className="absolute top-6 right-8 text-slate-500 hover:text-white transition-colors z-20">
          <X size={20}/>
        </button>
        
        <div className="text-center mb-8">
          <h2 className={`text-4xl font-black mb-2 uppercase tracking-tighter transition-colors duration-500 ${isLogin ? 'text-indigo-400' : 'text-emerald-400'}`}>
            {isLogin ? (isAr ? 'مرحباً بك' : 'Welcome') : (isAr ? 'عضوية جديدة' : 'Join Us')}
          </h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">
            {isLogin ? (isAr ? 'ادخل عالم الهدايا الرقمية' : 'Enter digital heaven') : (isAr ? 'أنشئ هويتك الخاصة الآن' : 'Create your identity')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-pulse">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <span className="text-red-400 text-[10px] font-black leading-tight uppercase tracking-wide">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <User className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors`} />
              <input required type="text" placeholder={isAr ? 'الاسم بالكامل / اللقب' : 'Display Name'} className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-sm focus:border-emerald-500 focus:bg-white/[0.08] focus:outline-none transition-all text-white placeholder:text-slate-600 font-bold" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          
          <div className="relative group">
            {isLogin ? <Hash className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors`} /> : 
                      <Mail className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors`} />}
            <input required type="text" placeholder={isLogin ? (isAr ? 'المعرف (ID) أو البريد الإلكتروني' : 'ID or Email') : (isAr ? 'البريد الإلكتروني' : 'Email Address')} className={`w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-sm ${isLogin ? 'focus:border-indigo-500' : 'focus:border-emerald-500'} focus:bg-white/[0.08] focus:outline-none transition-all text-white placeholder:text-slate-600 font-bold`} value={identifier} onChange={e => setIdentifier(e.target.value)} />
          </div>

          <div className="relative group">
            <Lock className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 ${isLogin ? 'group-focus-within:text-indigo-400' : 'group-focus-within:text-emerald-400'} transition-colors`} />
            <input required type="password" placeholder={isAr ? 'كلمة المرور' : 'Password'} className={`w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-sm ${isLogin ? 'focus:border-indigo-500' : 'focus:border-emerald-500'} focus:bg-white/[0.08] focus:outline-none transition-all text-white placeholder:text-slate-600 font-bold`} value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full py-4.5 rounded-[1.2rem] font-black text-xs tracking-[0.2em] shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-6 border-b-4 ${
              isLogin 
                ? 'bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-500 shadow-indigo-900/40' 
                : 'bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-500 shadow-emerald-900/40'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
            {isLogin ? (isAr ? 'دخول آمن' : 'SECURE LOGIN') : (isAr ? 'إنشاء حساب' : 'CREATE ACCOUNT')}
          </button>
        </form>

        <div className="mt-12 text-center border-t border-white/5 pt-8">
           <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed opacity-60">
             {isAr ? 'بالتسجيل أنت توافق على كافة شروط وقوانين GOTHER' : 'By signing in you agree to all GOTHER terms'}
           </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
