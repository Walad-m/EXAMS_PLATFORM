"use client";
import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AlertTriangle, Clock, Loader2, ShieldAlert, UserCheck } from 'lucide-react';

function KioskContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Inactivity State
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 Minutes
  const WARNING_TIME = 4 * 60 * 1000;   // Show warning at 4 minutes (1 min remaining)

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
    if (!user) return;

    let totalScore = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswerText) {
        // PRODUCTION FIX: Ensure marks are treated as Numbers, fallback to 0 if null
        totalScore += Number(q.marks_per_question || 0);
      }
    });

    const { error } = await supabase.from('submissions').insert([{
      exam_id: examId,
      student_id: user.id,
      score: Number(totalScore.toFixed(2)) // Ensure score is sent as a numeric type
    }]);

    if (!error) {
      if (document.fullscreenElement) document.exitFullscreen();
      alert(isAutoSubmit ? "Session expired! Your exam has been auto-submitted." : `Exam Submitted! Score: ${totalScore.toFixed(2)}`);
      router.push('/dashboard/student/my-exams');
    } else {
      console.error("Submission Error:", error.message);
      alert("Error saving submission. Please alert your lecturer.");
    }
    setIsSubmitting(false);
  }, [answers, examId, questions, router, isSubmitting]);

  // 3. Inactivity Logic
  const resetInactivityTimer = useCallback(() => {
    setShowInactivityWarning(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    warningRef.current = setTimeout(() => {
      if (isFullScreen) setShowInactivityWarning(true);
    }, WARNING_TIME);

    timeoutRef.current = setTimeout(() => {
      if (isFullScreen) handleSubmit(true);
    }, INACTIVITY_LIMIT);
  }, [isFullScreen, handleSubmit]);

  useEffect(() => {
    if (isFullScreen) {
      window.addEventListener('mousemove', resetInactivityTimer);
      window.addEventListener('keydown', resetInactivityTimer);
      resetInactivityTimer();
    }
    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [isFullScreen, resetInactivityTimer]);

  // 4. Main Timer
  useEffect(() => {
    if (!isFullScreen || timeLeft <= 0) {
      if (isFullScreen && timeLeft === 0) handleSubmit(true);
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-blue-500" /></div>;

  if (!isFullScreen) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-2xl">
          <ShieldAlert className="mx-auto text-blue-600 mb-6" size={56} />
          <h1 className="text-3xl font-black text-slate-900 mb-4">Lockdown</h1>
          <p className="text-slate-500 mb-8 text-sm font-medium">Auto-submission enabled for inactivity (5 mins).</p>
          <button onClick={enterFullScreen} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all">Start Exam</button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none relative">
      {showInactivityWarning && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Are you still there?</h2>
            <p className="text-slate-500 text-sm mb-6">Your session will expire in <span className="text-red-600 font-bold italic">1 minute</span> due to inactivity.</p>
            <button 
              onClick={resetInactivityTimer}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all"
            >
              <UserCheck size={18} /> I am still here
            </button>
          </div>
        </div>
      )}

      <header className="bg-white border-b p-5 flex justify-between items-center px-10 sticky top-0 z-10 shadow-sm">
        <div className="text-sm font-bold text-slate-900">Question <span className="text-blue-600">{currentIdx + 1}</span> of {questions.length}</div>
        <div className={`font-mono text-2xl font-black ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}><Clock className="inline mr-2" /> {formatTime(timeLeft)}</div>
        <button onClick={() => { if(confirm("Submit exam?")) handleSubmit() }} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-emerald-700">Finish</button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full py-16 px-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 min-h-[400px] flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 leading-tight">{q?.question_text}</h2>
          <div className="grid grid-cols-1 gap-4">
            {q?.options.map((option: string, idx: number) => (
              <label key={idx} className={`flex items-center gap-5 p-6 border-2 rounded-2xl cursor-pointer transition-all ${answers[q.id] === option ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-100 bg-white'}`}>
                <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === option} onChange={() => setAnswers({...answers, [q.id]: option})} className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-10 px-4">
          <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="px-8 py-3 font-black text-slate-400 text-xs uppercase tracking-widest disabled:opacity-10">Previous</button>
          <button disabled={currentIdx === questions.length - 1} onClick={() => setCurrentIdx(prev => prev + 1)} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 shadow-xl transition-all">Next</button>
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