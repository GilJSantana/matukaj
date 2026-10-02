import { Cake, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase, type Cliente } from '../services/supabase'
import { linkWhatsApp } from '../services/whatsapp'

export function Aniversariantes({ onAbrir }: { onAbrir: (id: number) => void }) {
  const [clientes, setClientes] = useState<Cliente[]>([])

  useEffect(() => {
    supabase!.rpc('aniversariantes_do_dia').then(({ data }) => setClientes(data ?? []))
  }, [])

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <h2 className="flex items-center gap-2 font-semibold text-amber-900">
        <Cake className="size-5" aria-hidden /> Aniversariantes do dia
      </h2>
      {clientes.length === 0 ? (
        <p className="mt-2 text-sm text-amber-800">Nenhum cliente faz aniversário hoje.</p>
      ) : (
        <ul className="mt-3 divide-y divide-amber-200">
          {clientes.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
              <button className="text-left font-medium text-slate-900 hover:underline" onClick={() => onAbrir(c.id)}>
                {c.nome}
              </button>
              {c.telefone ? (
                <a
                  href={linkWhatsApp(
                    c.telefone,
                    `Olá, ${c.nome}! A Retífica de Motores Matukaj deseja a você um feliz aniversário! 🎉`,
                  )}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <MessageCircle className="size-4" aria-hidden /> Parabenizar
                </a>
              ) : (
                <span className="text-sm text-amber-800">Sem telefone</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
