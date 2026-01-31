"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle2, ArrowLeft, Info, Loader2, BookOpen } from 'lucide-react';

// 1. Logic Component
function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('id');

  const [questions, setQuestions] = useState<any[]>([]);
  const [examDetails, setExamDetails] = useState<{title: string, course: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviewData() {
      if (!examId) return;

      // Updated to fetch both Title and Course
      const { data: exam } = await supabase
        .from('exams')
        .select('title, course')
        .eq('id', examId)
        .single();
      
      if (exam) setExamDetails(exam);

      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId);

      setQuestions(qs || []);
      setLoading(false);
    }
    fetchReviewData();
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Corrections...</p>
      </div>
    );
  }

  return (
    <DashboardLayout role="Exam Review">
      <div className="max-w-3xl mx-auto pb-20">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 transition-all font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Back to Results
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              {examDetails?.course || 'General Course'}
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{examDetails?.title}</h2>
          <p className="text-slate-500 font-medium mt-1">Reviewing the master marking scheme for this paper.</p>
        </div>

        <div className="space-y-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center px-8">
                <span className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Question {idx + 1}</span>
                <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-4 py-1.5 rounded-full uppercase italic border border-blue-100">
                  {q.marks_per_question} Points
                </span>
              </div>
              
              <div className="p-10">
                <p className="text-xl text-slate-900 font-bold mb-10 leading-snug">{q.question_text}</p>
                
                <div className="grid grid-cols-1 gap-4">
                  {q.options.map((option: string, oIdx: number) => {
                    const isCorrect = oIdx === q.correct_index;
                    
                    return (
                      <div 
                        key={oIdx}
                        className={`p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${
                          isCorrect 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm' 
                            : 'border-slate-50 bg-white text-slate-400 opacity-60'
                        }`}
                      >
                        <span className="font-bold">{option}</span>
                        {isCorrect && (
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-white px-3 py-1 rounded-lg border border-emerald-100 shadow-sm">
                            <CheckCircle2 size={16} /> Verified Answer
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl flex gap-6 items-center border border-slate-800">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
            <Info size={24} className="text-white" />
          </div>
          <div>
             <h4 className="font-black uppercase text-xs tracking-widest mb-1 text-blue-400">Academic Growth Note</h4>
             <p className="text-sm font-medium text-slate-400 leading-relaxed">
              This review is intended for personal correction and academic growth. For official grade disputes, please visit the Lecturer's office during office hours.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// 2. Main Page Export
export default function ExamReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}

