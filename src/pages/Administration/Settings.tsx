import { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Save, LogOut, Mail, RefreshCcw, GraduationCap, Building2, UploadCloud, MapPin, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { auth, googleProvider, db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { 
  updatePassword, 
  updateProfile, 
  reauthenticateWithPopup, 
  EmailAuthProvider, 
  linkWithCredential
} from 'firebase/auth';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, branding, setBranding, unit, phone, setProfileData } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'branding'>('profile');

  // Provider checks
  const hasPasswordProvider = auth.currentUser?.providerData.some(p => p.providerId === 'password');
  const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');

  // Profile Form
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profileUnit, setProfileUnit] = useState(unit || '');
  const [profilePhone, setProfilePhone] = useState(phone || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.photoURL || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Sync profile form when store data loads
  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setProfilePhotoUrl(user?.photoURL || '');
    setProfileUnit(unit || '');
    setProfilePhone(phone || '');
  }, [user, unit, phone]);

  // Password Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [requiresReauth, setRequiresReauth] = useState(false);

  // Branding Form
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [brandingForm, setBrandingForm] = useState({
    name: branding?.name || '',
    shortName: branding?.shortName || '',
    logoUrl: branding?.logoUrl || '',
    address: branding?.address || '',
    phone: branding?.phone || '',
    email: branding?.email || '',
    principalName: branding?.principalName || '',
    website: branding?.website || ''
  });

  // Sync form with store when branding loads
  useEffect(() => {
    if (branding) {
      setBrandingForm({
        name: branding.name || '',
        shortName: branding.shortName || '',
        logoUrl: branding.logoUrl || '',
        address: branding.address || '',
        phone: branding.phone || '',
        email: branding.email || '',
        principalName: branding.principalName || '',
        website: branding.website || ''
      });
    }
  }, [branding]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !user) return;
    
    setIsUpdatingProfile(true);
    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(auth.currentUser, { 
        displayName,
        photoURL: profilePhotoUrl
      });

      // 2. Update Firestore User Document
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName,
        photoURL: profilePhotoUrl,
        unit: profileUnit,
        phone: profilePhone,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 3. Update Global Store
      setProfileData({ unit: profileUnit, phone: profilePhone });
      
      toast.success('Your profile has been synchronized!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile metadata');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile photo must be less than 2MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      setProfilePhotoUrl(url);
      toast.success('Profile photo uploaded. Save to apply changes.');
    } catch (err) {
      toast.error('Upload failed. Check your Cloudinary configuration.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setBrandingForm(prev => ({ ...prev, logoUrl: url }));
      toast.success('Logo uploaded successfully');
    } catch (err) {
      toast.error('Upload failed. Check Cloudinary settings.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingBranding(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        branding: brandingForm,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setBranding(brandingForm as any);
      toast.success('Institutional branding synchronized!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save branding settings');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleReauthenticate = async () => {
    if (!auth.currentUser) return;
    try {
      if (isGoogleUser) {
        await reauthenticateWithPopup(auth.currentUser, googleProvider);
      } else {
        toast.error('Please logout and login again to verify your session');
        return;
      }
      setRequiresReauth(false);
      toast.success('Identity verified');
    } catch (err) {
      toast.error('Verification failed');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (!hasPasswordProvider) {
        const credential = EmailAuthProvider.credential(currentUser.email!, newPassword);
        await linkWithCredential(currentUser, credential);
        toast.success('Password set successfully!');
      } else {
        await updatePassword(currentUser, newPassword);
        toast.success('Password updated successfully');
      }
      setNewPassword('');
      setConfirmPassword('');
      setRequiresReauth(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setRequiresReauth(true);
        toast.error('Security Timeout: Please verify your identity first');
      } else {
        toast.error('Failed to update password');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: UserIcon },
    { id: 'branding', label: 'Institute Branding', icon: Building2 },
    { id: 'security', label: 'Security & Access', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display tracking-tight">System Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Configure your institutional identity and security credentials.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:w-64 flex flex-col gap-2">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                 activeTab === tab.id 
                   ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                   : 'text-gray-500 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-100'
               }`}
             >
               <tab.icon className="w-4 h-4" />
               <span className="uppercase tracking-widest text-[10px]">{tab.label}</span>
             </button>
           ))}

           <div className="mt-8 pt-8 border-t border-gray-100">
             <button 
               onClick={() => auth.signOut()}
               className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-danger hover:bg-danger/5 transition-all w-full group"
             >
               <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
               <span className="uppercase tracking-widest text-[10px]">Terminate Session</span>
             </button>
           </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 max-w-4xl">
           <GlassCard className="p-8 border-white/50 bg-white/40 shadow-xl shadow-primary/5">
              
              {activeTab === 'profile' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-gray-100">
                     <div className="relative group">
                        <div className="w-28 h-28 rounded-3xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-white transition-transform group-hover:scale-105 duration-300">
                            <img 
                              src={profilePhotoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher"} 
                              alt="Profile" 
                              className="w-full h-full object-cover" 
                            />
                            {isUploadingPhoto && (
                               <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                  <RefreshCcw className="w-6 h-6 text-primary animate-spin" />
                               </div>
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                             <UploadCloud className="w-4 h-4" />
                             <input type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoUpload} />
                        </label>
                        <div className="absolute top-2 right-2 p-1.5 bg-success rounded-lg shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                     </div>
                     <div className="text-center md:text-left">
                        <h2 className="text-2xl font-bold text-gray-900 font-display tracking-tight">{displayName || 'Set your name'}</h2>
                        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mt-1 bg-primary/5 px-2 py-0.5 rounded-lg inline-block">Faculty Member</p>
                        <p className="text-xs text-gray-400 font-medium mt-2 flex items-center justify-center md:justify-start gap-1.5">
                            <Mail className="w-3 h-3" />
                            {user?.email}
                        </p>
                     </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                          label="Full Name" 
                          placeholder="Your official name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                        <Input 
                          label="Primary Email" 
                          value={user?.email || ''}
                          disabled
                        />
                        <Input 
                          label="Institutional Unit" 
                          placeholder="e.g. Computer Science"
                          value={profileUnit}
                          onChange={(e) => setProfileUnit(e.target.value)}
                        />
                        <Input 
                          label="Mobile Contact" 
                          placeholder="+880 1XXX XXXXXX"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                        />
                     </div>
                     <div className="pt-4">
                        <Button type="submit" className="gap-2 h-12 px-10 rounded-2xl shadow-xl shadow-primary/20 uppercase font-bold text-[10px] tracking-widest" isLoading={isUpdatingProfile}>
                           <Save className="w-5 h-5" /> Sync Profile Metadata
                        </Button>
                     </div>
                  </form>
                </div>
              )}

              {activeTab === 'branding' && (
                <form onSubmit={handleSaveBranding} className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-gray-100">
                    <div className="flex flex-col items-center gap-4">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Institute Logo</p>
                       <div className="relative group">
                          <div className="w-32 h-32 rounded-3xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-primary/50 transition-colors">
                            {brandingForm.logoUrl ? (
                              <img src={brandingForm.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                              <Building2 className="w-10 h-10 text-gray-300" />
                            )}
                            {isUploading && (
                               <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                  <RefreshCcw className="w-6 h-6 text-primary animate-spin" />
                               </div>
                            )}
                          </div>
                          <label className="absolute -bottom-2 -right-2 p-2.5 bg-primary text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                             <UploadCloud className="w-4 h-4" />
                             <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          </label>
                       </div>
                       <p className="text-[9px] text-gray-400 text-center max-w-[120px]">Recommended: Square PNG with transparent background.</p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                           label="Institute Name" 
                           placeholder="Full Institutional Title"
                           value={brandingForm.name}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, name: e.target.value }))}
                           required
                        />
                        <Input 
                           label="Abbreviation" 
                           placeholder="Short Name (e.g. RPI)"
                           value={brandingForm.shortName}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, shortName: e.target.value }))}
                        />
                        <Input 
                           label="Official Address" 
                           placeholder="Full geographical location"
                           value={brandingForm.address}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, address: e.target.value }))}
                        />
                        <Input 
                           label="Contact Email" 
                           placeholder="admin@institute.edu"
                           value={brandingForm.email}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                        <Input 
                           label="Contact Phone" 
                           placeholder="+880 1XXX XXXXXX"
                           value={brandingForm.phone}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                        <Input 
                           label="Principal Signature Name" 
                           placeholder="Primary Signatory Title"
                           value={brandingForm.principalName}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, principalName: e.target.value }))}
                        />
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl space-y-4">
                     <div className="flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Academic Document Preview</h3>
                     </div>
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                              {brandingForm.logoUrl ? (
                                <img src={brandingForm.logoUrl} className="w-8 h-8 object-contain" />
                              ) : <Building2 className="w-6 h-6 text-gray-300" />}
                           </div>
                           <div>
                              <p className="text-xs font-black text-gray-900 uppercase tracking-tighter italic">
                                 {brandingForm.name || "YOUR INSTITUTE NAME"}
                              </p>
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                 <MapPin className="w-2 h-2" /> {brandingForm.address || "Institutional Address"}
                              </p>
                           </div>
                        </div>
                        <div className="text-right border-t border-gray-900 pt-2 w-32">
                           <p className="text-[8px] font-bold text-gray-900 uppercase tracking-tighter">{brandingForm.principalName || "Signatory Title"}</p>
                        </div>
                     </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="gap-2 h-12 px-10 rounded-2xl shadow-xl shadow-primary/20" isLoading={isSavingBranding}>
                       <Save className="w-5 h-5" /> Sync Institutional Assets
                    </Button>
                  </div>
                </form>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                   <div className="flex justify-between items-start">
                      <div className="max-w-xs">
                         <h2 className="text-2xl font-bold text-gray-900 font-display tracking-tight">
                            {hasPasswordProvider ? 'Update Access Code' : 'Link Password Access'}
                         </h2>
                         <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2 leading-relaxed">
                            {hasPasswordProvider 
                                ? 'Ensure your credentials remain robust and unique.'
                                : 'Establish a password so you can login without Google in the future.'}
                         </p>
                      </div>
                      <Badge variant={hasPasswordProvider ? 'success' : 'warning'} className="uppercase font-bold text-[9px] tracking-widest h-6 px-3">
                         {hasPasswordProvider ? 'Password Linked' : 'Google Auth Only'}
                      </Badge>
                   </div>

                   {requiresReauth ? (
                     <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col items-center text-center gap-5 scale-in animate-in duration-300">
                        <div className="p-4 bg-white rounded-2xl shadow-sm text-amber-500">
                            <RefreshCcw className="w-8 h-8 animate-spin-slow" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-900 mb-1">Session Expired</p>
                            <p className="text-xs text-amber-700 max-w-xs leading-relaxed">
                                For your security, please verify your identity before making sensitive changes.
                            </p>
                        </div>
                        <Button onClick={handleReauthenticate} className="gap-2 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-200 uppercase font-bold text-[10px] tracking-widest h-11 px-8 rounded-xl">
                           <Shield className="w-4 h-4" /> Verify Identity
                        </Button>
                     </div>
                   ) : (
                     <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-sm">
                        <Input 
                          label="New Password" 
                          type="password" 
                          placeholder="••••••••"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Input 
                          label="Confirm Secret Code" 
                          type="password" 
                          placeholder="••••••••"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <div className="pt-4">
                          <Button type="submit" className="w-full h-12 gap-2 rounded-2xl shadow-xl shadow-primary/20 uppercase font-bold text-[10px] tracking-widest" isLoading={isUpdatingPassword}>
                             <Shield className="w-5 h-5" /> {hasPasswordProvider ? 'Sync New Password' : 'Activate Password Access'}
                          </Button>
                        </div>
                     </form>
                   )}
                </div>
              )}
           </GlassCard>
        </div>
      </div>
    </div>
  );
}
