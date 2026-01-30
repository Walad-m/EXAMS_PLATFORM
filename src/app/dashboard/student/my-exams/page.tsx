"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Award, Calendar, CheckCircle, FileSearch, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MyExamsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyResults() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // ALIGNMENT FIX: Using the explicit 'rel_submission_to_exam' constraint
        const { data, error } = await supabase
          .from('submissions')
          .select(`
            score,
            submitted_at,
            exams!rel_submission_to_exam (
              id,
              title,
              total_marks
            )
          `)
          .eq('student_id', user.id)
          .order('submitted_at', { ascending: false });

        if (error) {
          console.error("Student Results Query Error:", error.message);
        } else {
          setSubmissions(data || []);
        }
      }
      setLoading(false);
    }
    fetchMyResults();
  }, []);

  return (
    <DashboardLayout role="Student">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Completed Exams</h2>
          <p className="text-slate-500 font-medium">Review your past performance and marks.</p>
        </header>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="font-medium">Loading your academic records...</p>
            </div>
          ) : submissions.length > 0 ? (
            submissions.map((sub, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="bg-green-50 p-3 rounded-full text-green-600 shadow-inner group-hover:scale-110 transition-transform">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{sub.exams?.title || "Unknown Examination"}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar size={14}/> {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award size={14}/> Verified Result
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1">Final Mark</p>
                    <p className="text-xl font-black text-blue-600 leading-none">
                      {sub.score} <span className="text-slate-300 text-sm font-normal">/ {sub.exams?.total_marks || 25}</span>
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => router.push(`/dashboard/student/review?id=${sub.exams?.id}`)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
                  >
                    <FileSearch size={14} /> Review Paper
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-500 font-bold text-lg">No Results Available</p>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">
                You haven't completed any examinations for this level yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}