
import React, { useState } from 'react';
import { auth, db, doc, setDoc, getDoc, collections, getDocs, query, where, googleProvider } from '../../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signOut,
  signInWithPopup
} from 'firebase/auth';
import { X, Mail, Lock, User, Loader2, AlertCircle, ShieldCheck, Hash } from 'lucide-react';
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

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setIdentifier('');
    setPassword('');
  };

  const generateNewSerialId = async () => {
    const qAll = query(collections.users);
    const allUsersSnap = await getDocs(qAll);
    let maxId = 1000;
    allUsersSnap.forEach(doc => {
      const u = doc.data() as UserProfile;
      if (u.serialId && u.serialId > maxId) maxId = u.serialId;
    });
    return maxId + 1;
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      // استخدام Popup هو الأفضل عند الرفع على رابط خارجي
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;
        const assignedId = isAdmin ? 1 : await generateNewSerialId();
        
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || (isAdmin ? 'Admin' : 'New User'),
          status: 'active',
          role: isAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          serialId: assignedId,
          linkedPassword: Math.random().toString(36).slice(-8) // كلمة سر عشوائية يمكن للمدير تغييرها لاحقاً
        };
        await setDoc(userDocRef, profile);
      } else {
        const data = userDoc.data() as UserProfile;
        if (data.status === 'blocked') {
          await signOut(auth);
          throw new Error(isAr ? 'عذراً، هذا الحساب محظور' : 'This account is blocked.');
        }
      }
      onClose();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      let msg = isAr ? 'فشل الاتصال بجوجل، حاول مرة أخرى' : 'Google connection failed, try again';
      if (err.message) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
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
        if (serialIdNum === 1) {
          // محاولة الدخول ببريد المدير إذا لم يكن مسجلاً في الداتابيز بعد
          return await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
        }
        throw new Error(isAr ? 'عذراً، هذا المعرف (ID) غير موجود' : 'This ID is not registered.');
      }
      
      const userData = querySnap.docs[0].data() as UserProfile;
      
      // التحقق من كلمة السر المربوطة (Linked Password)
      if (userData.linkedPassword && userData.linkedPassword !== password) {
         throw new Error(isAr ? 'كلمة المرور غير صحيحة لهذا المعرف' : 'Incorrect password for this ID.');
      }

      // الدخول الفعلي باستخدام البريد المخزن وكلمة السر المدخلة
      return await signInWithEmailAndPassword(auth, userData.email, password);
    } else {
      // تسجيل دخول عادي بالبريد
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
            throw new Error(isAr ? 'الحساب محظور حالياً' : 'Account is blocked.');
          }
          if (data.email.toLowerCase() === ADMIN_EMAIL && data.serialId !== 1) {
             await setDoc(userDocRef, { serialId: 1, role: 'admin' }, { merge: true });
          }
        }
      } else {
        if (password.length < 6) throw new Error(isAr ? 'كلمة المرور قصيرة جداً' : 'Password too short.');
        
        const targetEmail = identifier.toLowerCase().trim();
        const isAdmin = targetEmail === ADMIN_EMAIL;
        
        const userCred = await createUserWithEmailAndPassword(auth, targetEmail, password);
        await updateProfile(userCred.user, { displayName: name || 'User' });
        
        const assignedId = isAdmin ? 1 : await generateNewSerialId();

        const profile: UserProfile = {
          uid: userCred.user.uid,
          email: targetEmail,
          displayName: name || (isAdmin ? 'Admin' : 'User'),
          status: 'active',
          role: isAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          serialId: assignedId,
          linkedPassword: password
        };
        
        await setDoc(doc(db, "users", userCred.user.uid), profile);
      }
      onClose();
    } catch (err: any) {
      console.error("Auth Error:", err.code);
      let errMsg = isAr ? 'فشل تسجيل الدخول، تأكد من البيانات' : 'Login failed, check your data';
      if (err.code === 'auth/invalid-credential') {
        errMsg = isAr ? 'البيانات المدخلة (ID/Email) أو كلمة السر خاطئة' : 'Invalid ID/Email or Password';
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const isMasterLogin = identifier === '1' || identifier.toLowerCase() === ADMIN_EMAIL;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#160a25] border border-white/10 rounded-3xl p-8 shadow-2xl animate-scale-up">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
        
        <div className="text-center mb-8">
          <div className={`h-16 w-16 ${isMasterLogin ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.6)] animate-pulse' : 'bg-white/5'} rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 transition-all duration-500`}>
             {isMasterLogin ? <ShieldCheck className="text-white" size={32} /> : isLogin ? <Hash className="text-indigo-400" /> : <User className="text-indigo-400" />}
          </div>
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">
            {isLogin ? (isAr ? 'تسجيل الدخول' : 'Access Hub') : (isAr ? 'عضوية جديدة' : 'New Identity')}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {isLogin ? (isAr ? 'ادخل بالمعرف (ID) وكلمة السر المربوطة' : 'Login with ID and Linked Password') : (isAr ? 'انضم إلى نخبة GoTher' : 'Join the elite club')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-3 text-red-400 text-[11px] font-bold">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <User className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 transition-colors`} />
              <input required type="text" placeholder={isAr ? 'الاسم المعروض' : 'Display Name'} className={`w-full bg-white/5 border border-white/10 rounded-xl ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 text-sm focus:border-indigo-500 focus:outline-none transition-all`} value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="relative group">
            {isLogin ? <Hash className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500`} /> : <Mail className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500`} />}
            <input required type="text" placeholder={isLogin ? (isAr ? 'المعرف (ID) أو البريد' : 'Serial ID or Email') : (isAr ? 'البريد الإلكتروني' : 'Email Address')} className={`w-full bg-white/5 border border-white/10 rounded-xl ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 text-sm focus:border-indigo-500 focus:outline-none transition-all`} value={identifier} onChange={e => setIdentifier(e.target.value)} />
          </div>
          <div className="relative group">
            <Lock className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500`} />
            <input required type="password" placeholder={isAr ? 'كلمة المرور' : 'Password'} className={`w-full bg-white/5 border border-white/10 rounded-xl ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 text-sm focus:border-indigo-500 focus:outline-none transition-all`} value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <button type="submit" disabled={loading} className={`w-full py-4 rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${isMasterLogin ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-white text-black'}`}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            {isLogin ? (isAr ? 'دخول آمن' : 'SECURE LOGIN') : (isAr ? 'إنشاء حساب' : 'REGISTER')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-[#160a25] px-4 text-slate-500">{isAr ? 'أو عبر' : 'Or via'}</span></div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-xl font-black hover:bg-white/10 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.9 0 3.51.64 4.85 1.91l3.6-3.6C18.23 1.34 15.37 0 12 0 7.31 0 3.32 2.69 1.39 6.6l4.21 3.27C6.6 6.89 9.09 5.04 12 5.04z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.86-.07-1.69-.21-2.5H12v4.73h6.44c-.28 1.48-1.13 2.74-2.4 3.58l3.73 2.89c2.18-2.01 3.72-4.97 3.72-8.7z"/>
            <path fill="#FBBC05" d="M5.6 14.86c-.24-.73-.38-1.5-.38-2.3 0-.8.14-1.57.38-2.3L1.39 6.6C.51 8.21 0 10.05 0 12c0 1.95.51 3.79 1.39 5.4l4.21-3.27z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.73-2.89c-1.03.69-2.35 1.1-4.2 1.1-3.21 0-5.93-2.17-6.9-5.1l-4.21 3.27C3.32 21.31 7.31 24 12 24z"/>
          </svg>
          {isAr ? 'الدخول عبر جوجل' : 'LOGIN WITH GOOGLE'}
        </button>

        <div className="mt-8 text-center">
          <button onClick={toggleMode} className="text-[10px] font-black text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest">
            {isLogin ? (isAr ? 'ليس لديك حساب؟ انضم الآن' : 'No account? Join now') : (isAr ? 'لديك حساب؟ سجل دخولك' : 'Already a member? Login')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
