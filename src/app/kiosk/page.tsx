"use client";
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AlertTriangle, Clock, Loader2 } from 'lucide-react';

// 1. Separate the logic into a content component
function KioskContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Exam Data
  useEffect(() => {
    async function loadExam() {
      if (!examId) return;
      
      const { data: exam } = await supabase.from('exams').select('*').eq('id', examId).single();
      const { data: qs } = await supabase.from('questions').select('*').eq('exam_id', examId);

      if (exam && qs) {
        setQuestions(qs);
        setTimeLeft(exam.duration_minutes * 60);
      }
      setLoading(false);
    }
    loadExam();
  }, [examId]);

  // Handle Submission
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let totalScore = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_index) {
        totalScore += parseFloat(q.marks_per_question);
      }
    });

    const { error } = await supabase.from('submissions').insert([{
      exam_id: examId,
      student_id: user.id,
      score: totalScore.toFixed(2)
    }]);

    if (!error) {
      if (document.fullscreenElement) document.exitFullscreen();
      alert(`Exam Submitted! Your score: ${totalScore.toFixed(2)}`);
      router.push('/dashboard/student/my-exams');
    }
    setIsSubmitting(false);
  }, [answers, examId, questions, router, isSubmitting]);

  // Timer Hook
  useEffect(() => {
    if (!isFullScreen || timeLeft <= 0) {
      if (isFullScreen && timeLeft === 0) handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFullScreen, handleSubmit]);

  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => setIsFullScreen(true));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
      <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Securing Connection...</p>
    </div>
  );

  if (!isFullScreen) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-2xl border border-slate-800">
          <AlertTriangle className="mx-auto text-amber-500 mb-6" size={56} />
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Lockdown Mode</h1>
          <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
            You are entering a secure testing environment. Switching tabs or exiting fullscreen will result in an immediate submission. 
          </p>
          <button 
            onClick={enterFullScreen} 
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            Acknowledge & Start Exam
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">
      <header className="bg-white border-b p-5 flex justify-between items-center px-10 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
          <div className="text-sm font-bold text-slate-900">
            Question <span className="text-blue-600 font-black">{currentIdx + 1}</span> of {questions.length}
          </div>
        </div>

        <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl bg-slate-50 border border-slate-100 font-mono text-2xl font-black ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
          <Clock size={24} /> {formatTime(timeLeft)}
        </div>

        <button 
          onClick={() => { if(confirm("Submit all answers and end exam?")) handleSubmit() }}
          disabled={isSubmitting}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wide hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-100"
        >
          {isSubmitting ? "Processing..." : "Finish Exam"}
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full py-16 px-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 min-h-[450px] flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 leading-tight">
            {q?.question_text}
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {q?.options.map((option: string, idx: number) => (
              <label 
                key={idx} 
                className={`flex items-center gap-5 p-6 border-2 rounded-2xl cursor-pointer transition-all ${answers[q.id] === idx ? 'border-blue-600 bg-blue-50/50 shadow-sm shadow-blue-50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
              >
                <input 
                  type="radio" 
                  name={`q-${q.id}`} 
                  checked={answers[q.id] === idx}
                  onChange={() => setAnswers({...answers, [q.id]: idx})}
                  className="w-6 h-6 text-blue-600 border-slate-300 focus:ring-blue-500" 
                />
                <span className={`font-bold ${answers[q.id] === idx ? 'text-blue-900' : 'text-slate-600'}`}>{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between mt-10 px-4">
          <button 
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="px-8 py-3 font-black text-slate-400 uppercase tracking-widest text-xs hover:text-slate-900 disabled:opacity-10 transition-all"
          >
            Previous
          </button>
          <button 
            disabled={currentIdx === questions.length - 1}
            onClick={() => setCurrentIdx(prev => prev + 1)}
            className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 shadow-xl transition-all disabled:opacity-10"
          >
            Next Question
          </button>
        </div>
      </main>
    </div>
  );
}

// 2. Wrap the logic in Suspense to fix the Vercel Build
export default function KioskPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Initializing Secure Portal</p>
      </div>
    }>
      <KioskContent />
    </Suspense>
  );
}