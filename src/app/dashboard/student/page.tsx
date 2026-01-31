"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PlayCircle, Clock, Award, CheckCircle, Loader2, FileText, BookOpen } from 'lucide-react';
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      if (profileData) {
        // Fetch exams including the new 'course' field
        const { data: examData } = await supabase
          .from('exams')
          .select('*')
          .eq('level', profileData.level)
          .eq('is_active', true);

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

  const hasTakenExam = (examId: string) => submissions.some(s => s.exam_id === examId);

  // Group Exams by Course Name
  const groupedExams = exams.reduce((acc: any, exam: any) => {
    const courseName = exam.course || 'General Courses';
    if (!acc[courseName]) acc[courseName] = [];
    acc[courseName].push(exam);
    return acc;
  }, {});

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
    <DashboardLayout role="Student Dashboard">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {profile?.full_name}!
          </h2>
          <p className="text-slate-500 font-medium">
            Level {profile?.level} Student • {profile?.index_number}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><PlayCircle /></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Available</p>
              <h3 className="text-xl font-bold text-slate-900">{availableExamsCount} Exams</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-orange-100 p-4 rounded-xl text-orange-600"><Clock /></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Completed</p>
              <h3 className="text-xl font-bold text-slate-900">{submissions.length} Tasks</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-green-100 p-4 rounded-xl text-green-600"><Award /></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg. Score</p>
              <h3 className="text-xl font-bold text-slate-900">{avgScore}</h3>
            </div>
          </div>
        </div>

        {/* Course Containers */}
        <div className="space-y-10">
          {Object.keys(groupedExams).length > 0 ? (
            Object.entries(groupedExams).map(([courseName, courseExams]: [string, any]) => (
              <div key={courseName} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg text-white">
                    <BookOpen size={18} />
                  </div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-tight">{courseName}</h3>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {courseExams.map((exam: any) => {
                    const completed = hasTakenExam(exam.id);
                    return (
                      <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50/50 transition-all gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0 ${completed ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                            {exam.title.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 leading-tight">{exam.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                              {exam.duration_minutes} mins • <span className="text-blue-600 font-bold">{exam.total_marks} Marks</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {completed ? (
                            <>
                              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                                <CheckCircle size={16} /> COMPLETED
                              </div>
                              <button 
                                onClick={() => router.push('/dashboard/student/my-exams')}
                                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 text-xs font-bold border border-slate-200 px-4 py-2 rounded-lg hover:bg-white transition-all shadow-sm"
                              >
                                <FileText size={14} /> RESULTS
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => router.push(`/kiosk?id=${exam.id}`)}
                              className="w-full sm:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-md transition-all active:scale-95"
                            >
                              Take Exam
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-20 rounded-2xl border border-dashed border-slate-200 text-center">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No exams scheduled for Level {profile?.level}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}