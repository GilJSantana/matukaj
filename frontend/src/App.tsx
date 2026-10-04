import type { Session } from '@supabase/supabase-js'
import { BookOpen, LogOut, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Aniversariantes } from './components/Aniversariantes'
import { StatusBadge } from './components/StatusBadge'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { CatalogoPage } from './pages/CatalogoPage'
import { CertificadoGarantiaPage } from './pages/CertificadoGarantiaPage'
import { ClientePage } from './pages/ClientePage'
import { ComprovanteVistoriaPage } from './pages/ComprovanteVistoriaPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { OrdemServicoPage } from './pages/OrdemServicoPage'
import { VistoriaPage } from './pages/VistoriaPage'
import { supabase, type Veiculo } from './services/supabase'

// ponytail: navegacao por estado, sem URL; adotar um router quando houver mais telas
type Tela =
  | { nome: 'inicio' }
  | { nome: 'cliente'; id: number | null }
  | { nome: 'vistoria'; veiculo: Veiculo; osId: number | null }
  | { nome: 'os'; id: number }
  | { nome: 'catalogo' }
  | { nome: 'documento'; tipo: 'comprovante' | 'garantia'; osId: number }

function App() {
  const online = useOnlineStatus()
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(Boolean(supabase))
  const [tela, setTela] = useState<Tela>({ nome: 'inicio' })

  useEffect(() => {
    if (!supabase) return
    // dispara de imediato com a sessao salva (INITIAL_SESSION)
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSession(s)
      setCarregando(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabase) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 text-slate-600">
        Supabase não configurado: preencha o frontend/.env.local.
      </main>
    )
  }
  if (carregando) return null
  if (!session) return <LoginPage />

  const abrirCliente = (id: number | null) => setTela({ nome: 'cliente', id })
  const abrirOS = (id: number) => setTela({ nome: 'os', id })

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 p-4">
          <button onClick={() => setTela({ nome: 'inicio' })} className="text-xl font-bold text-slate-900">
            Matukaj
          </button>
          <div className="flex items-center gap-2">
            <StatusBadge icon={online ? Wifi : WifiOff} label={online ? 'Online' : 'Offline'} ok={online} />
            <Aniversariantes onAbrir={abrirCliente} />
            <button
              onClick={() => setTela({ nome: 'catalogo' })}
              className="inline-flex items-center gap-1 rounded-lg p-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <BookOpen className="size-5" aria-hidden />
              <span className="max-sm:sr-only">Catálogo</span>
            </button>
            <button onClick={() => supabase!.auth.signOut()} className="p-2 text-slate-500 hover:text-slate-900" aria-label="Sair">
              <LogOut className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4 print:max-w-none print:p-0">
        {tela.nome === 'inicio' && <HomePage onAbrirCliente={abrirCliente} onAbrirOS={abrirOS} />}
        {tela.nome === 'cliente' && (
          <ClientePage
            key={tela.id ?? 'novo'}
            id={tela.id}
            onAbrir={abrirCliente}
            onAbrirOrcamento={(veiculo) => setTela({ nome: 'vistoria', veiculo, osId: null })}
            onAbrirOS={abrirOS}
            onVoltar={() => setTela({ nome: 'inicio' })}
          />
        )}
        {tela.nome === 'vistoria' && (
          <VistoriaPage
            key={tela.osId ?? 'nova'}
            veiculo={tela.veiculo}
            osId={tela.osId}
            onSalva={abrirOS}
            onVoltar={() => (tela.osId ? abrirOS(tela.osId) : abrirCliente(tela.veiculo.cliente_id))}
          />
        )}
        {tela.nome === 'catalogo' && <CatalogoPage onVoltar={() => setTela({ nome: 'inicio' })} />}
        {tela.nome === 'documento' && tela.tipo === 'comprovante' && (
          <ComprovanteVistoriaPage osId={tela.osId} onVoltar={() => abrirOS(tela.osId)} />
        )}
        {tela.nome === 'documento' && tela.tipo === 'garantia' && (
          <CertificadoGarantiaPage osId={tela.osId} onVoltar={() => abrirOS(tela.osId)} />
        )}
        {tela.nome === 'os' && (
          <OrdemServicoPage
            key={tela.id}
            id={tela.id}
            onVistoria={(veiculo) => setTela({ nome: 'vistoria', veiculo, osId: tela.id })}
            onDocumento={(tipo) => setTela({ nome: 'documento', tipo, osId: tela.id })}
            onVoltar={abrirCliente}
          />
        )}
      </main>
    </div>
  )
}

export default App
