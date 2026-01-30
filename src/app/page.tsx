"use client";
import Link from 'next/link';
import { BookOpen, ShieldCheck, GraduationCap, ArrowRight, Zap, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <GraduationCap size={24} />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900">BIS <span className="text-blue-600">EXAMS PLATFORM</span></span>
        </div>
        <Link 
          href="/login" 
          className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          Portal Login
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full text-blue-700 text-xs font-bold uppercase tracking-widest mb-6">
            <Zap size={14} /> Next-Gen Academic Management
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
            Secure Exams. <br />
            <span className="text-blue-600">Instant Results.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium">
            The official examination portal for the University for Development Studies. 
            Streamlining the academic experience for both lecturers and students.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              Access Portal <ArrowRight size={20} />
            </Link>
            <Link 
              href="#features" 
              className="bg-slate-50 text-slate-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all border border-slate-200"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10">
          <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all group">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Secure Examinations</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Anti-cheat protocols and restricted kiosk environments ensure total academic integrity.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-2xl hover:border-green-100 transition-all group">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-all">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Grading</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Students receive feedback immediately, and lecturers get automated class performance analytics.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-2xl hover:border-purple-100 transition-all group">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Cloud Accessible</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Securely access results and management tools from any UDS authorized device on campus.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-sm font-medium">
            © 2026 University for Development Studies. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}