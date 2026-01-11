
import React, { useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Plus, Trash2, Phone, Save, Video, Link as LinkIcon, CheckCircle2, Globe, AlertTriangle, Loader2, Type } from 'lucide-react';
import { db, doc, setDoc, deleteDoc, updateDoc, collections, getDocs, onSnapshot } from '../../firebase';
import { UserProfile } from '../../types';

interface AdminSettingsProps {
  banners: {id: string, url: string, link?: string}[];
  storeWhatsApp: string;
  siteName: string;
  isAr: boolean;
  currentUser: UserProfile;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ banners, storeWhatsApp, siteName, isAr, currentUser }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [waNumber, setWaNumber] = useState(storeWhatsApp);
  const [currentSiteName, setCurrentSiteName] = useState(siteName);
  const [secTitleAr, setSecTitleAr] = useState('');
  const [secTitleEn, setSecTitleEn] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isClearingUsers, setIsClearingUsers] = useState(false);
  
  const [newBannerLink, setNewBannerLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMaster = currentUser.serialId === 1;

  useEffect(() => {
    setWaNumber(storeWhatsApp);
    setCurrentSiteName(siteName);
    
    const unsub = onSnapshot(doc(db, "settings", "store_config"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSecTitleAr(data.sectionTitleAr || 'أحدث الهدايا المتميزة');
        setSecTitleEn(data.sectionTitleEn || 'PREMIUM GIFTS');
      }
    });
    return () => unsub();
  }, [storeWhatsApp, siteName]);

  const isVideo = (url: string) => {
    return url && (url.startsWith('data:video') || url.endsWith('.mp4') || url.includes('video'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadBanner = async () => {
    if (!selectedFile || !filePreview) {
      alert(isAr ? 'يرجى اختيار ملف أولاً' : 'Please select a file first');
      return;
    }
    setIsUploading(true);
    const bannerId = `banner-${Date.now()}`;
    try {
      await setDoc(doc(db, "banners", bannerId), {
        url: filePreview,
        link: newBannerLink.trim(),
        createdAt: new Date().toISOString()
      });
      setSelectedFile(null);
      setFilePreview(null);
      setNewBannerLink('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert(isAr ? 'تم رفع البنر بنجاح' : 'Banner uploaded successfully');
    } catch (err) {
      console.error(err);
      alert(isAr ? 'خطأ في الرفع' : 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا البنر؟' : 'Are you sure you want to delete this banner?')) {
      try {
        await deleteDoc(doc(db, "banners", id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const saveStoreConfig = async () => {
    setIsSavingConfig(true);
    try {
      await setDoc(doc(db, "settings", "store_config"), { 
        whatsapp: waNumber,
        siteName: currentSiteName.trim() || 'GoTher',
        sectionTitleAr: secTitleAr.trim(),
        sectionTitleEn: secTitleEn.trim()
      }, { merge: true });
      alert(isAr ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (err) {
      console.error(err);
      alert(isAr ? 'خطأ في الحفظ' : 'Error saving');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleClearAllUsers = async () => {
    if (!isMaster) return;
    const confirm1 = confirm(isAr ? 'تحذير أمني: هل تريد حذف جميع الحسابات؟' : 'Security Warning: Wipe all users?');
    if (!confirm1) return;
    setIsClearingUsers(true);
    try {
      const snap = await getDocs(collections.users);
      let count = 0;
      for (const userDoc of snap.docs) {
        const data = userDoc.data() as UserProfile;
        if (data.serialId !== 1) {
          await deleteDoc(userDoc.ref);
          count++;
        }
      }
      alert(isAr ? `تم حذف ${count} حساب.` : `${count} accounts deleted.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearingUsers(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Identity & Contact Settings */}
      <div className="bg-[#160a25] border border-white/5 rounded-[2rem] p-8">
        <h3 className="text-xl font-black flex items-center gap-3 mb-6">
          <Globe size={24} className="text-indigo-500" />
          {isAr ? 'إعدادات الهوية والنصوص' : 'Identity & Text Settings'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'اسم الموقع' : 'Site Name'}</label>
            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" value={currentSiteName} onChange={e => setCurrentSiteName(e.target.value)} />
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? 'رقم واتساب المتجر' : 'Store WhatsApp'}</label>
            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" value={waNumber} onChange={e => setWaNumber(e.target.value)} />
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <Type size={14} /> {isAr ? 'اسم قسم المنتجات (بالعربي)' : 'Products Section Name (AR)'}
            </label>
            <input type="text" placeholder="مثلاً: أحدث الهدايا المتميزة" className="w-full bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-bold" value={secTitleAr} onChange={e => setSecTitleAr(e.target.value)} />
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <Type size={14} /> {isAr ? 'اسم قسم المنتجات (بالإنجليزي)' : 'Products Section Name (EN)'}
            </label>
            <input type="text" placeholder="e.g. NEW GIFTS" className="w-full bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-bold" value={secTitleEn} onChange={e => setSecTitleEn(e.target.value)} />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={saveStoreConfig} disabled={isSavingConfig} className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-black flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50">
            {isSavingConfig ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isAr ? 'حفظ إعدادات النصوص' : 'SAVE TEXT SETTINGS'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      {isMaster && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-[2rem] p-8">
          <h3 className="text-xl font-black flex items-center gap-3 mb-4 text-red-500"><AlertTriangle size={24} /> {isAr ? 'منطقة الخطر' : 'Danger Zone'}</h3>
          <div className="p-6 bg-red-600/10 rounded-2xl border border-red-600/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-right">
              <div className="font-black text-white text-sm mb-1">{isAr ? 'حذف جميع المستخدمين' : 'Wipe All Users'}</div>
              <div className="text-[10px] text-slate-400">{isAr ? 'سيتم حذف كل شيء باستثناء حسابك الرئيسي.' : 'Everything except your master account will be erased.'}</div>
            </div>
            <button onClick={handleClearAllUsers} disabled={isClearingUsers} className="bg-red-600 text-white px-8 py-4 rounded-xl font-black text-xs transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
              {isClearingUsers ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
              {isAr ? 'تنفيذ الحذف الشامل' : 'EXECUTE WIPE'}
            </button>
          </div>
        </div>
      )}

      {/* Banner Management */}
      <div className="bg-[#160a25] border border-white/5 rounded-[2rem] p-8">
        <h3 className="text-xl font-black flex items-center gap-3 mb-8"><ImageIcon size={24} className="text-indigo-500" /> {isAr ? 'إدارة بنرات العرض' : 'Carousel Management'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-12">
          <div className="space-y-4">
            <div onClick={() => fileInputRef.current?.click()} className={`relative aspect-[3/1] bg-white/5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${filePreview ? 'border-indigo-500 bg-white/[0.08]' : 'border-white/10 hover:border-indigo-500/50'}`}>
              {filePreview ? (isVideo(filePreview) ? <div className="flex flex-col items-center gap-2 text-indigo-400"><Video size={32} /><span className="text-[10px] font-bold uppercase">Video Ready</span></div> : <img src={filePreview} className="w-full h-full object-cover" />) : <><ImageIcon className="h-8 w-8 text-slate-500 mb-2" /><span className="text-xs text-slate-500 font-bold">{isAr ? 'اختر صورة أو فيديو' : 'Pick Image or Video'}</span></>}
              <input type="file" ref={fileInputRef} hidden accept="image/*,video/mp4" onChange={handleFileChange} />
            </div>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder={isAr ? 'رابط البنر (اختياري)...' : 'Banner link (optional)...'} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-indigo-500 outline-none" value={newBannerLink} onChange={e => setNewBannerLink(e.target.value)} />
            <button onClick={handleUploadBanner} disabled={isUploading || !selectedFile} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-30">
              {isUploading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />} {isAr ? 'رفع البنر' : 'UPLOAD BANNER'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-[3/1] bg-black">
              {isVideo(banner.url) ? <video src={banner.url} className="w-full h-full object-cover opacity-60" muted /> : <img src={banner.url} className="w-full h-full object-cover opacity-80" />}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                <button onClick={() => handleDeleteBanner(banner.id)} className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 shadow-xl"><Trash2 size={20} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
