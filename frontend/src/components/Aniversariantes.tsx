import { Cake, MessageCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { supabase, type Cliente } from '../services/supabase'
import { linkWhatsApp } from '../services/whatsapp'

// popover nativo (atributo popover): abre por clique/toque, fecha ao clicar fora e com Esc
export function Aniversariantes({ onAbrir }: { onAbrir: (id: number) => void }) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const popover = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase!.rpc('aniversariantes_do_dia').then(({ data }) => setClientes(data ?? []))
  }, [])

  return (
    <>
      <button
        popoverTarget="aniversariantes"
        className="relative rounded-lg p-2 text-slate-600 hover:text-slate-900"
        aria-label={`Aniversariantes do dia: ${clientes.length}`}
      >
        <Cake className="size-5" aria-hidden />
        {clientes.length > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white"
            aria-hidden
          >
            {clientes.length}
          </span>
        )}
      </button>
      <div
        ref={popover}
        id="aniversariantes"
        popover="auto"
        className="inset-auto top-16 right-4 m-0 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
      >
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Cake className="size-5 text-amber-600" aria-hidden /> Aniversariantes do dia
        </h2>
        {clientes.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhum cliente faz aniversário hoje.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {clientes.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                <button
                  className="text-left font-medium text-slate-900 hover:underline"
                  onClick={() => {
                    popover.current?.hidePopover()
                    onAbrir(c.id)
                  }}
                >
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
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <MessageCircle className="size-4" aria-hidden /> WhatsApp
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">Sem telefone</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
