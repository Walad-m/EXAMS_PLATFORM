"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle2, ArrowLeft, Info, Loader2 } from 'lucide-react';

// 1. Logic Component
function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('id');

  const [questions, setQuestions] = useState<any[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviewData() {
      if (!examId) return;

      const { data: exam } = await supabase
        .from('exams')
        .select('title')
        .eq('id', examId)
        .single();
      
      if (exam) setExamTitle(exam.title);

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
        <p className="text-slate-500 font-bold animate-pulse">Loading Corrections...</p>
      </div>
    );
  }

  return (
    <DashboardLayout role="Exam Review">
      <div className="max-w-3xl mx-auto pb-20">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-all"
        >
          <ArrowLeft size={18} /> Back to Results
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">{examTitle}</h2>
          <p className="text-slate-500 font-medium">Review the correct answers for this examination.</p>
        </div>

        <div className="space-y-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="font-black text-slate-700 uppercase text-xs tracking-widest">Question {idx + 1}</span>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase italic">
                  {q.marks_per_question} Mark(s)
                </span>
              </div>
              
              <div className="p-8">
                <p className="text-lg text-slate-900 font-bold mb-8 leading-relaxed">{q.question_text}</p>
                
                <div className="grid grid-cols-1 gap-4">
                  {q.options.map((option: string, oIdx: number) => {
                    const isCorrect = oIdx === q.correct_index;
                    
                    return (
                      <div 
                        key={oIdx}
                        className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                          isCorrect 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm' 
                            : 'border-slate-100 bg-white text-slate-500 opacity-60'
                        }`}
                      >
                        <span className="font-bold">{option}</span>
                        {isCorrect && (
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
                            <CheckCircle2 size={18} className="text-emerald-600" /> Correct Choice
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

        <div className="mt-12 p-8 bg-blue-600 text-white rounded-[2.5rem] shadow-xl shadow-blue-100 flex gap-6 items-center">
          <div className="bg-white/20 p-3 rounded-2xl">
            <Info size={24} />
          </div>
          <div>
             <h4 className="font-black uppercase text-xs tracking-widest mb-1">Academic Integrity Note</h4>
             <p className="text-sm font-medium text-blue-50 leading-relaxed">
              This review is provided for academic growth. If you believe there is a marking error, please visit the Lecturer's office with your official index number.
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