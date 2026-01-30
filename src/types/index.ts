export type UserRole = 'student' | 'staff';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  index_number?: string; // Optional because staff don't have one
  level?: '100' | '200' | '300' | '400';
}

export interface Exam {
  id: string;
  title: string;
  lecturer_id: string;
  duration_minutes: number;
  total_marks: number; // Usually 25 as per your requirement
  is_active: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  options: string[]; // Array of choices
  correct_option_index: number;
  marks: number;
}