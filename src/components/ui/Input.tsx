// src/components/ui/Input.tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        className={cn(
          "px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
          "placeholder:text-slate-400 text-slate-900 text-sm transition-all", // Added text-slate-900
          className
        )}
        {...props}
      />
    </div>
  );
}