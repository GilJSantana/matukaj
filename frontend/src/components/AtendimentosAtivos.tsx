import { useEffect, useState } from 'react'
import { listarAtendimentosAtivos, reais, totalItens } from '../services/os'
import { StatusOS } from './StatusOS'

const POR_PAGINA = 10

type Resultado = Awaited<ReturnType<typeof listarAtendimentosAtivos>>

export function AtendimentosAtivos({ onAbrir }: { onAbrir: (id: number) => void }) {
  const [pagina, setPagina] = useState(0)
  // guarda a pagina carregada: enquanto a nova nao chega, os dados sao da anterior
  const [resultado, setResultado] = useState<Resultado & { pagina: number }>()
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarAtendimentosAtivos(pagina, POR_PAGINA)
      .then((r) => {
        // pagina ficou vazia (OS encerrada enquanto navegava): volta para a ultima
        if (r.atendimentos.length === 0 && pagina > 0) return setPagina(Math.max(0, Math.ceil(r.total / POR_PAGINA) - 1))
        setResultado({ ...r, pagina })
      })
      .catch(() => setErro('Não foi possível carregar os atendimentos.'))
  }, [pagina])

  const totalPaginas = Math.max(1, Math.ceil((resultado?.total ?? 0) / POR_PAGINA))
  const carregando = resultado?.pagina !== pagina

  return (
    <section aria-busy={carregando}>
      <h2 className="text-lg font-semibold text-slate-900">Atendimentos em andamento</h2>
      {erro && <p className="mt-2 text-sm text-red-700">{erro}</p>}
      {resultado && (
        <ul className={`mt-2 divide-y divide-slate-100 rounded-xl bg-white shadow-sm ${carregando ? 'opacity-50' : ''}`}>
          {resultado.atendimentos.length === 0 && <li className="p-3 text-sm text-slate-500">Nenhum atendimento em andamento.</li>}
          {resultado.atendimentos.map((os) => (
            <li key={os.id}>
              <button className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-slate-50" onClick={() => onAbrir(os.id)}>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{os.clientes.nome}</span>
                  <span className="block text-sm text-slate-500">
                    OS nº {os.id} · {os.veiculos.placa}
                    {os.veiculos.modelo && ` · ${os.veiculos.modelo}`}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <StatusOS status={os.status} />
                  <span className="text-sm font-semibold text-slate-900">{reais(totalItens(os.itens_os))}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {totalPaginas > 1 && (
        <nav aria-label="Paginação" className="mt-3 flex items-center justify-between text-sm">
          <button
            disabled={carregando || pagina === 0}
            onClick={() => setPagina(pagina - 1)}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-slate-600" aria-live="polite">
            Página {pagina + 1} de {totalPaginas}
          </span>
          <button
            disabled={carregando || pagina >= totalPaginas - 1}
            onClick={() => setPagina(pagina + 1)}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            Próxima
          </button>
        </nav>
      )}
    </section>
  )
}
