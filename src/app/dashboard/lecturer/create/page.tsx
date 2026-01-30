"use client";
import { useState, Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MousePointer2, FileSpreadsheet, ArrowLeft, Save, Plus, Trash2, Info, Clock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

// 1. Separate the logic into a content component to handle useSearchParams safely
function CreateExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = searchParams.get('level'); 
  
  const [method, setMethod] = useState<'choice' | 'manual' | 'excel'>('choice');
  const [loading, setLoading] = useState(false);
  
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState(45); 
  const [questions, setQuestions] = useState([
    { question_text: '', options: ['', '', '', ''], correct_index: 0 }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_index: 0 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    const newQs = questions.filter((_, i) => i !== index);
    setQuestions(newQs);
  };

  const handlePublish = async () => {
    if (!examTitle) return alert("Please enter an exam title.");
    if (questions.some(q => !q.question_text)) return alert("Please fill in all question texts.");
    if (!level) return alert("Level not detected. Please return to dashboard.");

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert([{
          title: examTitle,
          lecturer_id: user.id,
          level: level,
          total_marks: 25,
          duration_minutes: duration,
          is_active: true
        }])
        .select()
        .single();

      if (examError) throw examError;

      const questionsToInsert = questions.map(q => ({
        exam_id: exam.id,
        question_text: q.question_text,
        options: q.options,
        correct_index: q.correct_index,
        marks_per_question: 25 / questions.length
      }));

      const { error: qError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (qError) throw qError;

      alert("Exam Published Successfully!");
      router.push(`/dashboard/lecturer/exams?level=${level}`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (method === 'choice') {
    return (
      <DashboardLayout role={`Level ${level} - Create Exam`}>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-all">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="max-w-4xl mx-auto py-12">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">How would you like to add questions?</h2>
          <p className="text-slate-500 text-center mb-10">Choose the method that works best for Level {level}.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button onClick={() => setMethod('manual')} className="group p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all text-left">
              <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <MousePointer2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Manual Entry</h3>
              <p className="text-slate-500">Type in your questions and options one by one.</p>
            </button>
            <button onClick={() => setMethod('excel')} className="group p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-green-500 hover:shadow-xl transition-all text-left">
              <div className="h-14 w-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-all">
                <FileSpreadsheet size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bulk Excel Upload</h3>
              <p className="text-slate-500">Upload a pre-filled Excel template.</p>
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (method === 'excel') {
    return (
      <DashboardLayout role="Excel Upload">
        <div className="max-w-4xl mx-auto py-12">
          <button onClick={() => setMethod('choice')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6">
            <ArrowLeft size={18} /> Back to Choice
          </button>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Bulk Upload Questions</h2>
            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 border border-blue-100 mb-8">
              <Info className="text-blue-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-blue-800 font-bold">Excel Formatting Note:</p>
                <p className="text-xs text-blue-700">Headers must be: <strong>Question, Option A, Option B, Option C, Option D, Correct Index</strong> (0=A, 1=B, 2=C, 3=D).</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input label="Exam Title" placeholder="Enter title before uploading" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
                </div>
                <div>
                  <Input label="Time (Mins)" type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
                </div>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:border-blue-400 transition-all">
                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" id="excel-upload" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !examTitle) return alert("Please enter a title and select a file.");
                  setLoading(true);
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);
                    const formattedQuestions = data.map((row: any) => ({
                      question_text: row['Question'],
                      options: [row['Option A'], row['Option B'], row['Option C'], row['Option D']],
                      correct_index: parseInt(row['Correct Index'])
                    }));
                    setQuestions(formattedQuestions);
                    setMethod('manual'); 
                    setLoading(false);
                  };
                  reader.readAsBinaryString(file);
                }} />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <FileSpreadsheet className="mx-auto text-blue-500 mb-4" size={48} />
                  <span className="text-blue-600 font-bold">Click to upload file</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="Manual Entry">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setMethod('choice')} className="flex items-center gap-2 text-slate-500"><ArrowLeft size={18} /> Back</button>
          <button onClick={handlePublish} disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
            <Save size={18} /> {loading ? 'Publishing...' : 'Publish Exam'}
          </button>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 mb-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Input label="Exam Title" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
          </div>
          <div className="relative">
            <Input label="Duration (Mins)" type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
            <Clock className="absolute right-3 top-9 text-slate-400" size={18} />
          </div>
        </div>
        <div className="space-y-6">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-sm font-bold">Question {qIdx + 1}</span>
                <button onClick={() => removeQuestion(qIdx)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
              </div>
              <textarea className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 mb-4 transition-all" rows={2} value={q.question_text} onChange={(e) => {
                const newQs = [...questions];
                newQs[qIdx].question_text = e.target.value;
                setQuestions(newQs);
              }} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${qIdx}`} checked={q.correct_index === oIdx} onChange={() => {
                      const newQs = [...questions];
                      newQs[qIdx].correct_index = oIdx;
                      setQuestions(newQs);
                    }} className="w-4 h-4 text-blue-600" />
                    <input className="flex-1 p-2 border border-slate-200 rounded-md text-sm text-slate-900" value={opt} onChange={(e) => {
                      const newQs = [...questions];
                      newQs[qIdx].options[oIdx] = e.target.value;
                      setQuestions(newQs);
                    }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={addQuestion} className="w-full mt-6 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 font-medium flex items-center justify-center gap-2 transition-all">
          <Plus size={20} /> Add Question
        </button>
      </div>
    </DashboardLayout>
  );
}

// 2. The main export that wraps everything in Suspense
export default function CreateExamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    }>
      <CreateExamContent />
    </Suspense>
  );
}