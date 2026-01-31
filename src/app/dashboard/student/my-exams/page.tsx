"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Award, Calendar, CheckCircle, FileSearch, Loader2, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MyExamsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyResults() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('submissions')
          .select(`
            score,
            submitted_at,
            exams!rel_submission_to_exam (
              id,
              title,
              course,
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

  // Group Submissions by Course Name
  const groupedSubmissions = submissions.reduce((acc: any, sub: any) => {
    const courseName = sub.exams?.course || 'General Courses';
    if (!acc[courseName]) acc[courseName] = [];
    acc[courseName].push(sub);
    return acc;
  }, {});

  return (
    <DashboardLayout role="My Results">
      <div className="max-w-4xl mx-auto pb-20">
        <header className="mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Academic Records</h2>
          <p className="text-slate-500 font-medium">Review your performance across all registered courses.</p>
        </header>

        <div className="space-y-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-bold uppercase tracking-widest text-xs">Fetching Records...</p>
            </div>
          ) : Object.keys(groupedSubmissions).length > 0 ? (
            Object.entries(groupedSubmissions).map(([courseName, courseSubs]: [string, any]) => (
              <div key={courseName} className="space-y-4">
                {/* Course Container Header */}
                <div className="flex items-center gap-3 px-2">
                  <BookOpen size={20} className="text-blue-600" />
                  <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">
                    {courseName}
                  </h3>
                  <div className="h-px flex-1 bg-slate-100 ml-2"></div>
                </div>

                <div className="grid gap-4">
                  {courseSubs.map((sub: any, idx: number) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-md hover:border-blue-100 transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle size={28} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg leading-tight">{sub.exams?.title}</h4>
                          <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-slate-300"/> 
                              {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5 text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                              <Award size={14}/> Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-6 border-t sm:border-t-0 pt-6 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em] mb-1">Earned Marks</p>
                          <p className="text-2xl font-black text-blue-600 tabular-nums">
                            {sub.score} <span className="text-slate-200 text-sm font-normal">/ {sub.exams?.total_marks}</span>
                          </p>
                        </div>
                        
                        <button 
                          onClick={() => router.push(`/dashboard/student/review?id=${sub.exams?.id}`)}
                          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                        >
                          <FileSearch size={16} /> Review Paper
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Award className="text-slate-200" size={40} />
              </div>
              <p className="text-slate-900 font-black text-xl uppercase tracking-tighter">No Results Found</p>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mt-3 font-medium">
                Complete your scheduled examinations to see your performance records here.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}