"use client";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Folder, GraduationCap, ChevronRight, BookOpen, Users, Award } from 'lucide-react';
import Link from 'next/link';

export default function LecturerDashboard() {
  const levels = ['100', '200', '300', '400'];

  return (
    <DashboardLayout role="Lecturer">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 h-8 w-2 rounded-full"></div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Academic Management</h2>
          </div>
          <p className="text-slate-500 font-medium">Select a level to manage examinations and review student performance.</p>
        </header>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Levels</p>
              <p className="text-2xl font-black text-slate-900">4 Levels</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-xl text-green-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Status</p>
              <p className="text-2xl font-black text-slate-900">Online</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
              <Award size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</p>
              <p className="text-2xl font-black text-slate-900">Course Admin</p>
            </div>
          </div>
        </div>

        {/* Level Grid */}
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <GraduationCap className="text-blue-600" /> Departmental Levels
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {levels.map((level) => (
            <div key={level} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all duration-300 shadow-inner">
                <Folder size={32} />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-1">Level {level}</h3>
              <p className="text-sm font-medium text-slate-400 mb-8">UDS Academic Year</p>
              
              <div className="space-y-3">
                <Link 
                  href={`/dashboard/lecturer/exams?level=${level}`}
                  className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-2xl text-sm font-bold transition-all border border-transparent hover:border-blue-100"
                >
                  Set Exams <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href={`/dashboard/lecturer/results?level=${level}`}
                  className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-green-50 text-slate-700 hover:text-green-700 rounded-2xl text-sm font-bold transition-all border border-transparent hover:border-green-100"
                >
                  View Results <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}