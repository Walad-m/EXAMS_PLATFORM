"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, FileSpreadsheet, Search, Loader2, BookOpen } from 'lucide-react';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const level = searchParams.get('level');
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !level) return;

      // PRODUCTION FIX: Ensure we filter by lecturer_id so lecturers only see their own data
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          score,
          submitted_at,
          profiles (full_name, index_number),
          exams!inner (
            id,
            title,
            course,
            level,
            total_marks,
            lecturer_id
          )
        `)
        .eq('exams.level', level) // Use the string level from DB
        .eq('exams.lecturer_id', user.id) // SECURITY: Only this lecturer's exams
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error("Query Error:", error.message);
      } else {
        setResults(data || []);
      }
      setLoading(false);
    }
    fetchResults();
  }, [level]);

  // Grouping logic with defensive checks for production stability
  const groupedResults = results.reduce((acc: any, curr: any) => {
    if (!curr.exams) return acc; // Skip if exam data is missing
    const examId = curr.exams.id;
    if (!acc[examId]) {
      acc[examId] = {
        details: curr.exams,
        submissions: []
      };
    }
    acc[examId].submissions.push(curr);
    return acc;
  }, {});

  const exportToExcel = (examId: string) => {
    const group = groupedResults[examId];
    if (!group) return;

    const headers = ["Index Number", "Score"];
    const rows = group.submissions.map((res: any) => [
      res.profiles?.index_number || "N/A",
      res.score
    ]);

    const csvContent = [headers.join(","), ...rows.map((row: any) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${group.details.course || 'Results'}_Level_${level}.csv`;
    link.click();
  };

  return (
    <DashboardLayout role={`Level ${level} Results`}>
      <div className="max-w-6xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => router.push('/dashboard/lecturer')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all">
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by student..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : Object.keys(groupedResults).length > 0 ? (
          Object.values(groupedResults).map((group: any) => {
            const filteredSubmissions = group.submissions.filter((s: any) => 
              s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              s.profiles?.index_number?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredSubmissions.length === 0 && searchTerm) return null;

            return (
              <div key={group.details.id} className="mb-12 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen size={16} className="text-blue-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{group.details.course}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-none">{group.details.title}</h3>
                  </div>
                  
                  <button 
                    onClick={() => exportToExcel(group.details.id)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                  >
                    <FileSpreadsheet size={18} /> Export Index & Scores
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] uppercase text-slate-400 font-black border-b border-slate-50 tracking-widest">
                        <th className="px-10 py-5">Student Identity</th>
                        <th className="px-10 py-5 text-center">Final Score</th>
                        <th className="px-10 py-5">Submission Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredSubmissions.map((res: any, idx: number) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-all group">
                          <td className="px-10 py-5">
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{res.profiles?.full_name}</div>
                            <div className="text-xs font-mono text-slate-400">{res.profiles?.index_number}</div>
                          </td>
                          <td className="px-10 py-5 text-center">
                            <div className="inline-flex items-baseline gap-1 bg-slate-100 px-4 py-1.5 rounded-full font-black text-slate-700">
                              <span className="text-lg">{res.score}</span>
                              <span className="text-[10px] opacity-40">/ {group.details.total_marks}</span>
                            </div>
                          </td>
                          <td className="px-10 py-5">
                            <div className="text-xs font-bold text-slate-400">
                              {new Date(res.submitted_at).toLocaleDateString('en-GB')}
                            </div>
                            <div className="text-[10px] text-slate-300">
                              {new Date(res.submitted_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No examination data found for this level</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
      <ResultsContent />
    </Suspense>
  );
}