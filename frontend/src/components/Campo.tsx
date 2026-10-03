import type { InputHTMLAttributes } from 'react'

type CampoProps = InputHTMLAttributes<HTMLInputElement> & { label: string }

export function Campo({ label, className = '', ...props }: CampoProps) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 text-sm font-medium text-slate-700 ${className}`}>
      {label}
      <input
        className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-slate-500 focus:outline-none"
        {...props}
      />
    </label>
  )
}
