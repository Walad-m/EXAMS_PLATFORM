"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle2, XCircle, ArrowLeft, Info } from 'lucide-react';

export default function ExamReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('id');

  const [questions, setQuestions] = useState<any[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviewData() {
      if (!examId) return;

      // 1. Fetch Exam Title
      const { data: exam } = await supabase
        .from('exams')
        .select('title')
        .eq('id', examId)
        .single();
      
      if (exam) setExamTitle(exam.title);

      // 2. Fetch Questions (which include the correct_index)
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId);

      setQuestions(qs || []);
      setLoading(false);
    }
    fetchReviewData();
  }, [examId]);

  if (loading) return <div className="p-10 text-center">Loading Corrections...</div>;

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
          <p className="text-slate-500">Review the correct answers for this examination.</p>
        </div>

        <div className="space-y-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="font-bold text-slate-700">Question {idx + 1}</span>
                <span className="text-xs font-bold text-slate-400">{q.marks_per_question} Mark(s)</span>
              </div>
              
              <div className="p-6">
                <p className="text-lg text-slate-900 font-medium mb-6">{q.question_text}</p>
                
                <div className="grid grid-cols-1 gap-3">
                  {q.options.map((option: string, oIdx: number) => {
                    const isCorrect = oIdx === q.correct_index;
                    
                    return (
                      <div 
                        key={oIdx}
                        className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                          isCorrect 
                            ? 'border-green-500 bg-green-50 text-green-800' 
                            : 'border-slate-100 bg-white text-slate-600'
                        }`}
                      >
                        <span className="font-medium">{option}</span>
                        {isCorrect && (
                          <div className="flex items-center gap-2 text-xs font-bold uppercase">
                            <CheckCircle2 size={18} /> Correct Answer
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

        <div className="mt-10 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4">
          <Info className="text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800 italic">
            Note: This review is provided for academic growth. If you believe there is a marking error, please visit the Lecturer's office with your index number.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}