"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, FileSpreadsheet, Search, Loader2, BarChart3, TrendingUp, Users } from 'lucide-react';

export default function ResultsPage() {
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

      const numericLevel = parseInt(level, 10);

      const { data, error } = await supabase
        .from('submissions')
        .select(`
          score,
          submitted_at,
          profiles (
            full_name,
            index_number
          ),
          exams!inner (
            title,
            level
          )
        `)
        .eq('exams.level', numericLevel)
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

  // Statistics Calculations
  const totalSubmissions = results.length;
  const passCount = results.filter(r => r.score >= 12.5).length;
  const passRate = totalSubmissions > 0 ? ((passCount / totalSubmissions) * 100).toFixed(1) : 0;
  const classAverage = totalSubmissions > 0 
    ? (results.reduce((acc, curr) => acc + curr.score, 0) / totalSubmissions).toFixed(1) 
    : 0;

  const filteredResults = results.filter((res) => {
    const s = res.profiles;
    const search = searchTerm.toLowerCase();
    return (
      (s?.full_name || "").toLowerCase().includes(search) ||
      (s?.index_number || "").toLowerCase().includes(search)
    );
  });

  // EXCEL (CSV) EXPORT - INDEX & SCORE ONLY
  const exportToExcel = () => {
    const headers = ["Index Number", "Score"];
    
    const rows = filteredResults.map(res => [
      res.profiles?.index_number || "N/A",
      res.score
    ]);

    const csvContent = [
      headers.join(","), 
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UDS_L${level}_Results_Upload.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout role={`Level ${level} Results`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => router.push('/dashboard/lecturer')} 
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-all"
          >
            <ArrowLeft size={18} /> Back
          </button>
          
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg transition-all active:scale-95"
          >
            <FileSpreadsheet size={20} /> Export Excel (Index & Score)
          </button>
        </div>

        {/* Analytics Cards - FIXED COLORS FOR VISIBILITY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 p-6 rounded-3xl shadow-md flex items-center gap-4 border border-blue-500">
            <div className="bg-white/20 p-4 rounded-2xl text-white">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Submissions</p>
              <p className="text-3xl font-black text-white">{totalSubmissions}</p>
            </div>
          </div>

          <div className="bg-emerald-600 p-6 rounded-3xl shadow-md flex items-center gap-4 border border-emerald-500">
            <div className="bg-white/20 p-4 rounded-2xl text-white">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Pass Rate</p>
              <p className="text-3xl font-black text-white">{passRate}%</p>
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-3xl shadow-md flex items-center gap-4 border border-indigo-500">
            <div className="bg-white/20 p-4 rounded-2xl text-white">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Avg Score</p>
              <p className="text-3xl font-black text-white">{classAverage}<span className="text-indigo-200 text-lg">/25</span></p>
            </div>
          </div>
        </div>

        {/* Results Table Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
            <div>
              <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight">Level {level} Academic Results</h3>
              <p className="text-sm text-slate-500 font-medium tracking-wide">Showing {filteredResults.length} Verified Submissions</p>
            </div>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search index or name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase text-slate-400 font-black border-b border-slate-100">
                  <th className="px-8 py-5">Student Identity</th>
                  <th className="px-8 py-5">Examination</th>
                  <th className="px-8 py-4 text-center">Score</th>
                  <th className="px-8 py-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((res, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-all">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-900 uppercase leading-none mb-1">{res.profiles?.full_name}</div>
                        <div className="text-xs text-blue-600 font-black tracking-widest font-mono">
                          {res.profiles?.index_number}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-500 text-xs font-bold uppercase">
                        {res.exams?.title}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`text-lg font-black ${res.score >= 12.5 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {res.score}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-slate-400 text-[10px] font-bold uppercase tracking-tighter leading-none">
                        {new Date(res.submitted_at).toLocaleDateString('en-GB')}<br/>
                        {new Date(res.submitted_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="text-center py-24 text-slate-400 italic">No matching records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}