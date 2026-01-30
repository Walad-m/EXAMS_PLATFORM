"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(''); // Email or Index Number
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let loginEmail = identifier;

    // 1. Check if the user entered an Index Number instead of an Email
    if (!identifier.includes('@')) {
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('index_number', identifier)
        .single();

      if (lookupError || !profile) {
        alert("No account found with that Index Number.");
        setLoading(false);
        return;
      }
      loginEmail = profile.email;
    }

    // 2. Perform the actual login with the Email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      // 3. Fetch role from profiles to redirect correctly
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">UDS Exam Portal</h1>
          <p className="text-slate-500 text-sm">Sign in to your portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            label="Email or Index Number" 
            placeholder="UDS/TCH/XX/XXXX or Email" 
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required 
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />

          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md mt-4 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-slate-600">
            Don't have an account? <Link href="/register" className="text-blue-600 font-medium hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}