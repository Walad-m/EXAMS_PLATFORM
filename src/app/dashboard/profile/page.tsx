"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { User, Mail, Hash, GraduationCap, ShieldCheck, Edit3, Save, X, Loader2, Info } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit State
  const [formData, setFormData] = useState({
    full_name: '',
    index_number: '',
    level: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        index_number: data.index_number || '',
        level: data.level || ''
      });
    }
    setLoading(false);
  }

  const handleSave = async () => {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        index_number: formData.index_number,
        level: formData.level
      })
      .eq('id', user?.id);

    if (error) {
      alert("Error updating profile: " + error.message);
    } else {
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <DashboardLayout role={profile?.role === 'staff' ? 'Lecturer' : 'Student'}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-32 bg-blue-600 relative">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Edit3 size={16} /> Edit Profile
              </button>
            )}
          </div>
          
          <div className="px-8 pb-8">
            <div className="relative -mt-12 mb-6">
              <div className="h-24 w-24 bg-white rounded-full p-1 shadow-lg">
                <div className="h-full w-full bg-slate-100 rounded-full flex items-center justify-center text-blue-600">
                  <User size={40} />
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                  <input 
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile?.role === 'student' && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Index Number</label>
                        <input 
                          className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.index_number}
                          onChange={(e) => setFormData({...formData, index_number: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Level</label>
                        <select 
                          className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          value={formData.level}
                          onChange={(e) => setFormData({...formData, level: e.target.value})}
                        >
                          <option value="100">100</option>
                          <option value="200">200</option>
                          <option value="300">300</option>
                          <option value="400">400</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Changes
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <X size={18} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-900">{profile?.full_name}</h2>
                <p className="text-slate-500 capitalize mb-8">{profile?.role} Account</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <Mail size={14} /> Email Address
                    </label>
                    <p className="text-slate-900 font-medium">{profile?.email}</p>
                  </div>

                  {profile?.role === 'student' ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                          <Hash size={14} /> Index Number
                        </label>
                        <p className="text-slate-900 font-medium">{profile?.index_number}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                          <GraduationCap size={14} /> Academic Level
                        </label>
                        <p className="text-slate-900 font-medium">Level {profile?.level}</p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                        <ShieldCheck size={14} /> Verification
                      </label>
                      <p className="text-green-600 font-medium">UDS Staff Verified</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 italic text-sm text-amber-700">
          <Info size={18} className="shrink-0" />
          Note: Ensure your Index Number and Level are correct to see your specific Mid-Semester examinations.
        </div>
      </div>
    </DashboardLayout>
  );
}