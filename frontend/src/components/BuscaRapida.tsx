import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase, type Cliente } from '../services/supabase'

export function BuscaRapida({ onAbrir, onNovo }: { onAbrir: (id: number) => void; onNovo: () => void }) {
  const [termo, setTermo] = useState('')
  // guarda o termo buscado: enquanto a digitacao nao para, o resultado e de outro termo
  const [resultado, setResultado] = useState<{ termo: string; clientes: Cliente[] }>()

  useEffect(() => {
    if (!termo.trim()) return
    // espera a digitacao parar para nao consultar a cada tecla
    const timer = setTimeout(() => {
      supabase!.rpc('buscar_clientes', { termo }).then(({ data }) => setResultado({ termo, clientes: data ?? [] }))
    }, 300)
    return () => clearTimeout(timer)
  }, [termo])

  return (
    <section className="flex-1">
      <label className="relative block">
        <span className="sr-only">Buscar cliente</span>
        <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar por nome, CPF/CNPJ ou placa"
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-3 pl-10 focus:border-slate-500 focus:outline-none"
        />
      </label>
      {termo.trim() && resultado?.termo === termo && (
        <ul className="mt-2 divide-y divide-slate-100 rounded-xl bg-white shadow-sm">
          {resultado.clientes.length === 0 && (
            <li className="flex items-center justify-between gap-2 p-3 text-sm text-slate-500">
              Nenhum cliente encontrado.
              <button onClick={onNovo} className="font-semibold text-slate-900 hover:underline">
                Cadastrar novo cliente
              </button>
            </li>
          )}
          {resultado.clientes.map((c) => (
            <li key={c.id}>
              <button className="w-full p-3 text-left hover:bg-slate-50" onClick={() => onAbrir(c.id)}>
                <span className="font-medium text-slate-900">{c.nome}</span>
                {c.cpf_cnpj && <span className="ml-2 text-sm text-slate-500">{c.cpf_cnpj}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
