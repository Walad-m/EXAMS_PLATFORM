"use client";
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AlertTriangle, Clock, Loader2, CheckCircle } from 'lucide-react';

export default function KioskPage() {
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

  // 1. Fetch Exam Data & Questions
  useEffect(() => {
    async function loadExam() {
      if (!examId) return;
      
      const { data: exam } = await supabase.from('exams').select('*').eq('id', examId).single();
      const { data: qs } = await supabase.from('questions').select('*').eq('exam_id', examId);

      if (exam && qs) {
        setQuestions(qs);
        setTimeLeft(exam.duration_minutes * 60); // Convert mins to seconds
      }
      setLoading(false);
    }
    loadExam();
  }, [examId]);

  // 2. Auto-Submit Logic
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Calculate score: Compare student index with correct_index
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

  // 3. Timer Effect
  useEffect(() => {
    if (!isFullScreen || timeLeft <= 0) {
      if (isFullScreen && timeLeft === 0) handleSubmit(); // Auto-submit on timeout
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!isFullScreen) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-2xl">
          <AlertTriangle className="mx-auto text-amber-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Examination Lockdown</h1>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            You are about to start the exam. The timer will begin once you enter fullscreen. 
            Do not exit fullscreen or switch tabs until you submit.
          </p>
          <button onClick={enterFullScreen} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all">
            Enter Fullscreen & Start
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">
      <header className="bg-white border-b p-4 flex justify-between items-center px-8 sticky top-0 z-10 shadow-sm">
        <div className="text-sm font-bold text-slate-500">
          Question <span className="text-blue-600">{currentIdx + 1}</span> of {questions.length}
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
          <Clock size={24} /> {formatTime(timeLeft)}
        </div>
        <button 
          onClick={() => { if(confirm("Are you sure you want to submit?")) handleSubmit() }}
          disabled={isSubmitting}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Exam"}
        </button>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full py-12 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
          <h2 className="text-xl font-semibold text-slate-800 mb-8 leading-snug">
            {q?.question_text}
          </h2>

          <div className="space-y-3">
            {q?.options.map((option: string, idx: number) => (
              <label 
                key={idx} 
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${answers[q.id] === idx ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <input 
                  type="radio" 
                  name={`q-${q.id}`} 
                  checked={answers[q.id] === idx}
                  onChange={() => setAnswers({...answers, [q.id]: idx})}
                  className="w-5 h-5 text-blue-600" 
                />
                <span className="text-slate-700 font-medium">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button 
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="px-6 py-2 font-bold text-slate-500 disabled:opacity-20 transition-all"
          >
            Previous
          </button>
          <button 
            disabled={currentIdx === questions.length - 1}
            onClick={() => setCurrentIdx(prev => prev + 1)}
            className="bg-slate-900 text-white px-10 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-20 transition-all"
          >
            Next Question
          </button>
        </div>
      </main>
    </div>
  );
}