import { ArrowLeft, Cake, Car, FilePlus, Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ClienteForm } from '../components/ClienteForm'
import { StatusOS } from '../components/StatusOS'
import { VeiculoForm } from '../components/VeiculoForm'
import { reais, totalItens, type StatusOS as Status } from '../services/os'
import { supabase, type Cliente, type Veiculo } from '../services/supabase'

type VeiculoComOS = Veiculo & {
  ordens_servico: {
    id: number
    aberta_em: string
    status: Status
    itens_os: { descricao: string; quantidade: number; valor_unitario: number }[]
  }[]
}

type Props = {
  id: number | null
  onAbrir: (id: number) => void
  onAbrirOrcamento: (veiculo: Veiculo) => void
  onAbrirOS: (id: number) => void
  onVoltar: () => void
}

function fazAniversarioHoje(dataNascimento: string | null) {
  const hoje = new Date()
  const mmdd = `${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
  return dataNascimento?.slice(5) === mmdd
}

export function ClientePage({ id, onAbrir, onAbrirOrcamento, onAbrirOS, onVoltar }: Props) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [veiculos, setVeiculos] = useState<VeiculoComOS[]>([])
  const [editando, setEditando] = useState<number | 'novo' | null>(null)

  // incrementar recarrega cliente e veiculos do banco
  const [versao, setVersao] = useState(0)
  const recarregar = () => setVersao((v) => v + 1)

  useEffect(() => {
    if (id === null) return
    supabase!
      .from('clientes')
      .select('*, veiculos(*, ordens_servico(id, aberta_em, status, itens_os(descricao, quantidade, valor_unitario)))')
      .order('id', { referencedTable: 'veiculos.ordens_servico', ascending: false })
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const { veiculos, ...dados } = data
        setCliente(dados)
        setVeiculos(veiculos)
        setEditando(null)
      })
  }, [id, versao])

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onVoltar} className="inline-flex items-center gap-1 self-start text-sm text-slate-600 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Voltar
      </button>

      <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
        {id === null ? 'Novo cliente' : cliente?.nome}
        {cliente && fazAniversarioHoje(cliente.data_nascimento) && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
            <Cake className="size-4" aria-hidden /> Aniversário hoje
          </span>
        )}
      </h2>

      {(id === null || cliente) && (
        <ClienteForm
          key={cliente?.id ?? 'novo'}
          cliente={cliente}
          onSalvo={(salvo) => (id === null ? onAbrir(salvo.id) : setCliente(salvo))}
        />
      )}

      {cliente && (
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Car className="size-5" aria-hidden /> Veículos
            </h3>
            {editando === null && (
              <button
                onClick={() => setEditando('novo')}
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:underline"
              >
                <Plus className="size-4" aria-hidden /> Vincular veículo
              </button>
            )}
          </div>

          {veiculos.length === 0 && editando === null && (
            <p className="text-sm text-slate-500">Nenhum veículo vinculado.</p>
          )}
          {veiculos.map((v) =>
            editando === v.id ? (
              <VeiculoForm key={v.id} clienteId={cliente.id} veiculo={v} onSalvo={recarregar} onCancelar={() => setEditando(null)} />
            ) : (
              <div key={v.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono font-semibold text-slate-900">{v.placa}</p>
                    <p className="text-sm text-slate-600">
                      {[v.marca, v.modelo, v.ano, v.cor].filter(Boolean).join(' · ')}
                      {v.numero_motor && ` · Motor ${v.numero_motor}`}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => onAbrirOrcamento(v)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                    >
                      <FilePlus className="size-4" aria-hidden /> Abrir orçamento
                    </button>
                    <button onClick={() => setEditando(v.id)} className="p-2 text-slate-500 hover:text-slate-900" aria-label={`Editar ${v.placa}`}>
                      <Pencil className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
                {v.ordens_servico.length > 0 && (
                  <div className="border-t border-slate-100 pt-2">
                    <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Histórico de serviços</h4>
                    <ul>
                      {v.ordens_servico.map((os) => (
                        <li key={os.id}>
                          <button
                            onClick={() => onAbrirOS(os.id)}
                            className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-1 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span className="font-semibold text-slate-900">nº {os.id}</span>
                            <span className="text-slate-500">{new Date(os.aberta_em).toLocaleDateString('pt-BR')}</span>
                            <span className="min-w-0 flex-1 truncate text-slate-600">
                              {os.itens_os.map((i) => i.descricao).join(', ')}
                            </span>
                            <span className="text-slate-900">{reais(totalItens(os.itens_os))}</span>
                            <StatusOS status={os.status} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ),
          )}
          {editando === 'novo' && (
            <VeiculoForm clienteId={cliente.id} veiculo={null} onSalvo={recarregar} onCancelar={() => setEditando(null)} />
          )}
        </section>
      )}
    </div>
  )
}
