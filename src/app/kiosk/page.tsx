"use client";
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Clock, Loader2 } from 'lucide-react';

function KioskContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const examReady = !loading && questions.length > 0;

  // 1. Fetch & Shuffle Logic
  useEffect(() => {
    async function loadExam() {
      if (!examId) return;
      const { data: exam } = await supabase.from('exams').select('*').eq('id', examId).single();
      const { data: qs } = await supabase.from('questions').select('*').eq('exam_id', examId);

      if (exam && qs) {
        const shuffledQs = [...qs].sort(() => Math.random() - 0.5).map(q => {
          const correctAnswerText = q.options[q.correct_index];
          const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
          return { ...q, options: shuffledOptions, correctAnswerText };
        });
        setQuestions(shuffledQs);
        setTimeLeft(exam.duration_minutes * 60);
      }
      setLoading(false);
    }
    loadExam();
  }, [examId]);

  // 2. Handle Submission (Type-Safe Score Fix)
  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    let totalScore = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswerText) {
        totalScore += Number(q.marks_per_question || 0);
      }
    });

    const { error } = await supabase.from('submissions').insert([{
      exam_id: examId,
      student_id: user.id,
      score: Number(totalScore.toFixed(2))
    }]);

    if (!error) {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        /* iOS / unsupported fullscreen */
      }
      alert(isAutoSubmit ? "Time is up. Your exam was submitted automatically." : `Exam Submitted! Score: ${totalScore.toFixed(2)}`);
      router.push('/dashboard/student/my-exams');
    } else {
      console.error("Submission Error:", error.message);
      alert("Error saving submission. Please alert your lecturer.");
    }
    setIsSubmitting(false);
  }, [answers, examId, questions, router, isSubmitting]);

  // 3. Exam duration timer (no fullscreen gate — works reliably on iPhone)
  useEffect(() => {
    if (!examReady || timeLeft <= 0) {
      if (examReady && timeLeft === 0) handleSubmit(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, examReady, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center text-slate-600 font-medium">
        This exam could not be loaded. Check the link or try again from your exam list.
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      <header className="bg-white border-b p-4 sm:p-5 flex flex-wrap justify-between items-center gap-3 px-4 sm:px-10 sticky top-0 z-10 shadow-sm">
        <div className="text-sm font-bold text-slate-900">
          Question <span className="text-blue-600">{currentIdx + 1}</span> of {questions.length}
        </div>
        <div className={`font-mono text-xl sm:text-2xl font-black ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
          <Clock className="inline mr-2" /> {formatTime(timeLeft)}
        </div>
        <button
          type="button"
          onClick={() => { if (confirm("Submit exam?")) handleSubmit(); }}
          className="bg-emerald-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-black text-sm hover:bg-emerald-700"
        >
          Finish
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full py-8 sm:py-16 px-4 sm:px-6">
        <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 min-h-[280px] sm:min-h-[400px] flex flex-col justify-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-8 sm:mb-10 leading-tight">{q?.question_text}</h2>
          <div className="grid grid-cols-1 gap-4">
            {q?.options.map((option: string, idx: number) => (
              <label
                key={idx}
                className={`flex items-center gap-4 sm:gap-5 p-4 sm:p-6 border-2 rounded-2xl cursor-pointer transition-all ${answers[q.id] === option ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-100 bg-white'}`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={answers[q.id] === option}
                  onChange={() => setAnswers({ ...answers, [q.id]: option })}
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0"
                />
                <span className="font-bold text-slate-700 text-sm sm:text-base">{option}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-8 sm:mt-10 px-1 sm:px-4">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="px-4 sm:px-8 py-3 font-black text-slate-400 text-xs uppercase tracking-widest disabled:opacity-10"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={currentIdx === questions.length - 1}
            onClick={() => setCurrentIdx(prev => prev + 1)}
            className="bg-slate-900 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 shadow-xl transition-all"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}

export default function KioskPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin" /></div>}>
      <KioskContent />
    </Suspense>
  );
}
