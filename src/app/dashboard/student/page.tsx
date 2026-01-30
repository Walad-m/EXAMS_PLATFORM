"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PlayCircle, Clock, Award, CheckCircle, Loader2, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      // 1. Get User Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // 2. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      if (profileData) {
        // 3. Fetch Active Exams for Student's Level
        const { data: examData } = await supabase
          .from('exams')
          .select('*')
          .eq('level', profileData.level)
          .eq('is_active', true);

        // 4. Fetch Student's Submissions (to check if already taken)
        const { data: subData } = await supabase
          .from('submissions')
          .select('exam_id, score')
          .eq('student_id', user.id);

        setExams(examData || []);
        setSubmissions(subData || []);
      }
      setLoading(false);
    }
    loadDashboardData();
  }, [router]);

  // Helper: Check if exam is already submitted
  const hasTakenExam = (examId: string) => submissions.some(s => s.exam_id === examId);

  // Stats Calculations
  const availableExamsCount = exams.filter(e => !hasTakenExam(e.id)).length;
  const avgScore = submissions.length > 0 
    ? (submissions.reduce((acc, curr) => acc + parseFloat(curr.score), 0) / submissions.length).toFixed(1)
    : "N/A";

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <DashboardLayout role="Student">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
            Welcome back, {profile?.full_name}!
          </h2>
          <p className="text-slate-500 font-medium">
            Level {profile?.level} Student • {profile?.index_number}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><PlayCircle /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Available Exams</p>
              <h3 className="text-xl font-bold text-slate-900">{availableExamsCount} Active</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg text-orange-600"><Clock /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Exams Completed</p>
              <h3 className="text-xl font-bold text-slate-900">{submissions.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg text-green-600"><Award /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Average Score</p>
              <h3 className="text-xl font-bold text-slate-900">{avgScore}</h3>
            </div>
          </div>
        </div>

        {/* Dynamic Exams Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Active Mid-Semester Exams</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">
              Level {profile?.level}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {exams.length > 0 ? exams.map((exam) => {
              const completed = hasTakenExam(exam.id);
              return (
                <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50 transition-all gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold shadow-sm shrink-0 ${completed ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white'}`}>
                      {exam.title.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">{exam.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {exam.duration_minutes} mins • {exam.total_marks} Marks
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {completed ? (
                      <>
                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-4 py-2 rounded-lg">
                          <CheckCircle size={18} /> Completed
                        </div>
                        <button 
                          onClick={() => router.push('/dashboard/student/my-exams')}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-bold border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all"
                        >
                          <FileText size={16} /> View Mark
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => router.push(`/kiosk?id=${exam.id}`)}
                        className="w-full sm:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all active:scale-95"
                      >
                        Start Exam
                      </button>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="p-12 text-center">
                <p className="text-slate-400 font-medium">No exams currently scheduled for Level {profile?.level}.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}