import type { LucideIcon } from 'lucide-react'

type StatusBadgeProps = {
  icon: LucideIcon
  label: string
  ok: boolean
}

export function StatusBadge({ icon: Icon, label, ok }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </span>
  )
}
