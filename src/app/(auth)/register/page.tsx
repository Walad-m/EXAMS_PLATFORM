"use client";
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

// 1. Create a sub-component for the form logic
function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isStaff = searchParams.get('type') === 'staff';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    indexNumber: '',
    level: '100'
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isStaff && !formData.email.endsWith('@uds.edu.gh')) {
      alert("Staff registration requires a @uds.edu.gh email address.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: isStaff ? 'staff' : 'student',
          index_number: isStaff ? null : formData.indexNumber,
          level: isStaff ? null : formData.level,
        }
      }
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Registration successful! Please check your email for verification.");
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">UDS Exam Portal</h1>
        <p className="text-slate-500 text-sm">
          {isStaff ? 'Lecturer Onboarding' : 'Create Student Account'}
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <Input 
          label="Full Name" 
          placeholder="Enter full name" 
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          required 
        />
        <Input 
          label="Email Address" 
          type="email" 
          placeholder={isStaff ? "official@uds.edu.gh" : "personal@email.com"}
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required 
        />

        {!isStaff && (
          <>
            <Input 
              label="Index Number" 
              placeholder="UDS/TCH/21/0001" 
              value={formData.indexNumber}
              onChange={(e) => setFormData({...formData, indexNumber: e.target.value})}
              required 
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Level</label>
              <select 
                className="px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm"
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
              >
                <option value="100">Level 100</option>
                <option value="200">Level 200</option>
                <option value="300">Level 300</option>
                <option value="400">Level 400</option>
              </select>
            </div>
          </>
        )}

        <Input 
          label="Password" 
          type="password" 
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required 
        />

        <button 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-all mt-6 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Register'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-slate-600">
          Already have an account? <Link href="/login" className="text-blue-600 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}

// 2. The main export that Vercel needs (Wrapped in Suspense)
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-48 bg-slate-200 rounded mb-4"></div>
            <div className="h-4 w-32 bg-slate-100 rounded"></div>
            <div className="mt-8 space-y-4 w-full">
              <div className="h-10 bg-slate-50 rounded"></div>
              <div className="h-10 bg-slate-50 rounded"></div>
              <div className="h-10 bg-slate-50 rounded"></div>
            </div>
          </div>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}