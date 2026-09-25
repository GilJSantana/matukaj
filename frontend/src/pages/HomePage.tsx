import { Database, Wifi, WifiOff, Wrench } from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { isSupabaseConfigured } from '../services/supabase'

export function HomePage() {
  const online = useOnlineStatus()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <Wrench className="mx-auto size-12 text-slate-700" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Matukaj</h1>
        <p className="mt-2 text-slate-600">Gestao de ordens de servico e vistoria veicular</p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <StatusBadge icon={online ? Wifi : WifiOff} label={online ? 'Online' : 'Offline'} ok={online} />
          <StatusBadge
            icon={Database}
            label={isSupabaseConfigured ? 'Supabase configurado' : 'Supabase nao configurado'}
            ok={isSupabaseConfigured}
          />
        </div>
      </section>
    </main>
  )
}
