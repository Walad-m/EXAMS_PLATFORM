"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, BookOpen, LayoutDashboard, User, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children, role }: { children: React.ReactNode, role: string }) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setUserRole(data?.role);
      }
    }
    checkRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Logic: Ensure the path is strictly based on the database role
  const dashboardPath = userRole === 'staff' ? '/dashboard/lecturer' : '/dashboard/student';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-blue-600 tracking-tight">Exams Dashboard</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href={dashboardPath}>
            <div className="flex items-center gap-3 w-full px-4 py-2 hover:bg-blue-50 text-slate-700 rounded-lg font-medium cursor-pointer">
              <LayoutDashboard size={20} /> Dashboard
            </div>
          </Link>

          {userRole === 'student' && (
            <Link href="/dashboard/student/my-exams">
              <div className="flex items-center gap-3 w-full px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer">
                <BookOpen size={20} /> My Exams
              </div>
            </Link>
          )}

          <Link href="/dashboard/profile">
            <div className="flex items-center gap-3 w-full px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer">
              <User size={20} /> Profile
            </div>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="font-semibold text-slate-800">{role} Panel</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}