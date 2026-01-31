"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(''); // Email or Index Number
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let loginEmail = identifier.trim();

    // 1. Handle Index Number Login (If no '@' is present)
    if (!loginEmail.includes('@')) {
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('index_number', loginEmail.toUpperCase()) // UDS Index numbers are usually uppercase
        .single();

      if (lookupError || !profile) {
        alert("No account found with this Index Number. Please register or use your email.");
        setLoading(false);
        return;
      }
      loginEmail = profile.email;
    }

    // 2. Auth Execution
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.toLowerCase(),
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      // 3. Smart Redirect based on Role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single();

      if (profile?.role === 'staff') {
        router.push('/dashboard/lecturer');
      } else {
        router.push('/dashboard/student');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-xl mb-6">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 font-medium mt-2">UDS Academic Management Portal</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-5">
            <Input 
              label="Student ID or Email" 
              placeholder="Index Number or @uds.edu.gh" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required 
              className="rounded-xl"
            />
            
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <Link href="#" className="text-[11px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-700">Forgot?</Link>
              </div>
              <Input 
                label="Password"
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="rounded-xl"
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-slate-500 text-sm font-medium">
              New to the portal?{" "}
              <Link href="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                Register Student Account
              </Link>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
          <Lock size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Kiosk Environment</span>
        </div>
      </div>
    </div>
  );
}