"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase/client';
import { Plus, ArrowLeft, Trash2, Power, FileText, Loader2 } from 'lucide-react';

export default function ExamsManagement() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const level = searchParams.get('level');
  
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExams() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && level) {
        const { data } = await supabase
          .from('exams')
          .select('*')
          .eq('lecturer_id', user.id)
          .eq('level', level)
          .order('created_at', { ascending: false });
        setExams(data || []);
      }
      setLoading(false);
    }
    fetchExams();
  }, [level]);

  const toggleExamStatus = async (examId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('exams')
      .update({ is_active: !currentStatus })
      .eq('id', examId);
    
    if (!error) {
      setExams(exams.map(e => e.id === examId ? { ...e, is_active: !currentStatus } : e));
    } else {
      alert("Failed to update status: " + error.message);
    }
  };

  const handleDelete = async (examId: string, examTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${examTitle}"? \n\nThis will permanently remove all questions and student results for this exam.`
    );

    if (confirmed) {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) {
        alert("Error deleting exam: " + error.message);
      } else {
        setExams(exams.filter(e => e.id !== examId));
        alert("Exam deleted successfully.");
      }
    }
  };

  return (
    <DashboardLayout role={`Level ${level} Exams`}>
      <div className="max-w-6xl mx-auto">
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => router.push('/dashboard/lecturer')} 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-medium"
          >
            <ArrowLeft size={18} /> Back to Levels
          </button>
          <button 
            onClick={() => router.push(`/dashboard/lecturer/create?level=${level}`)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-sm transition-all active:scale-95"
          >
            <Plus size={20} /> Create New Exam
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs uppercase text-slate-500 font-bold tracking-wider">
                <th className="px-8 py-4">Exam Title</th>
                <th className="px-8 py-4">Date Created</th>
                <th className="px-8 py-4 text-center">Marks</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Loader2 className="animate-spin mb-2" />
                      <p>Loading Level {level} exams...</p>
                    </div>
                  </td>
                </tr>
              ) : exams.length > 0 ? (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="font-semibold text-slate-900">{exam.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: {exam.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 text-sm">
                      {new Date(exam.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-8 py-5 font-mono text-slate-600 text-center font-bold">
                      {exam.total_marks}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${exam.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${exam.is_active ? 'bg-green-600 animate-pulse' : 'bg-slate-400'}`} />
                        {exam.is_active ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {/* View Results Action */}
                        <button 
                          onClick={() => router.push(`/dashboard/lecturer/results?level=${level}&examId=${exam.id}`)}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                          title="View Student Results"
                        >
                          <FileText size={18} />
                        </button>

                        {/* Toggle Status Action */}
                        <button 
                          onClick={() => toggleExamStatus(exam.id, exam.is_active)}
                          className={`p-2 rounded-lg transition-colors ${exam.is_active ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-blue-50 text-blue-600'}`}
                          title={exam.is_active ? "Set to Draft" : "Make Live"}
                        >
                          <Power size={18} />
                        </button>

                        {/* Delete Action */}
                        <button 
                          onClick={() => handleDelete(exam.id, exam.title)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          title="Delete Exam"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-24">
                    <div className="flex flex-col items-center">
                      <p className="text-slate-400 font-medium mb-4">No exams found for Level {level}.</p>
                      <button 
                        onClick={() => router.push(`/dashboard/lecturer/create?level=${level}`)}
                        className="text-blue-600 text-sm font-bold hover:underline"
                      >
                        Create your first exam now
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}