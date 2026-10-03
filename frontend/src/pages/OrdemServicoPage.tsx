import { ArrowLeft, Ban, ClipboardCheck, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { StatusOS } from '../components/StatusOS'
import { PROXIMO_STATUS, STATUS_OS, reais, totalItens, type StatusOS as Status } from '../services/os'
import { mensagemErro, supabase, type Veiculo } from '../services/supabase'

const consultar = (id: number) =>
  supabase!
    .from('ordens_servico')
    .select('*, clientes(nome, telefone), veiculos(*), itens_os(*), vistorias(id)')
    .eq('id', id)
    .order('id', { referencedTable: 'itens_os' })
    .single()
type OS = NonNullable<Awaited<ReturnType<typeof consultar>>['data']>

const ETAPAS: Status[] = ['orcamento', 'aprovada', 'em_execucao', 'concluida', 'entregue']

type Props = {
  id: number
  onVistoria: (veiculo: Veiculo) => void
  onVoltar: (clienteId: number) => void
}

export function OrdemServicoPage({ id, onVistoria, onVoltar }: Props) {
  const [os, setOs] = useState<OS>()
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    consultar(id).then(({ data }) => data && setOs(data))
  }, [id])

  if (!os) return null
  const orcamento = os.status === 'orcamento'
  const proximo = PROXIMO_STATUS[os.status]
  const etapaAtual = ETAPAS.indexOf(os.status)

  // atualiza so o que mudou, sem recarregar a tela
  async function mudarStatus(status: Status) {
    setErro('')
    setEnviando(true)
    const { data, error } = await supabase!
      .from('ordens_servico')
      .update({ status })
      .eq('id', id)
      .select('status, concluida_em')
      .single()
    setEnviando(false)
    if (error) return setErro(mensagemErro(error))
    setOs((atual) => atual && { ...atual, ...data })
  }

  function cancelar() {
    if (confirm(`Cancelar ${orcamento ? 'o orçamento' : 'a OS'} nº ${id}?`)) mudarStatus('cancelada')
  }

  async function incluirItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formulario = e.currentTarget
    const form = new FormData(formulario)
    const { data, error } = await supabase!
      .from('itens_os')
      .insert({
        ordem_servico_id: id,
        descricao: String(form.get('descricao')).trim(),
        quantidade: Number(form.get('quantidade')),
        valor_unitario: Number(form.get('valor_unitario')),
      })
      .select()
      .single()
    if (error) return setErro(mensagemErro(error))
    setErro('')
    setOs((atual) => atual && { ...atual, itens_os: [...atual.itens_os, data] })
    formulario.reset()
  }

  async function removerItem(itemId: number) {
    const { error } = await supabase!.from('itens_os').delete().eq('id', itemId)
    if (error) return setErro(mensagemErro(error))
    setOs((atual) => atual && { ...atual, itens_os: atual.itens_os.filter((i) => i.id !== itemId) })
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => onVoltar(os.cliente_id)} className="inline-flex items-center gap-1 self-start text-sm text-slate-600 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Voltar
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-slate-900">
          {orcamento ? 'Orçamento' : 'OS'} nº {os.id}
        </h2>
        <StatusOS status={os.status} />
      </div>

      {os.status !== 'cancelada' && (
        <ol className="grid grid-cols-5 gap-1 text-center text-xs font-medium">
          {ETAPAS.map((etapa, i) => (
            <li
              key={etapa}
              aria-current={i === etapaAtual ? 'step' : undefined}
              className={`rounded-md border-t-4 pt-1 ${i <= etapaAtual ? 'border-emerald-600 text-slate-900' : 'border-slate-200 text-slate-400'}`}
            >
              {STATUS_OS[etapa].rotulo}
            </li>
          ))}
        </ol>
      )}

      <section className="grid gap-2 rounded-2xl bg-white p-4 text-sm shadow-sm sm:grid-cols-2">
        <p>
          <span className="text-slate-500">Cliente: </span>
          {os.clientes.nome}
        </p>
        <p>
          <span className="text-slate-500">Veículo: </span>
          <span className="font-mono font-semibold">{os.veiculos.placa}</span>{' '}
          {[os.veiculos.marca, os.veiculos.modelo].filter(Boolean).join(' ')}
        </p>
        <p>
          <span className="text-slate-500">Aberta em: </span>
          {new Date(os.aberta_em).toLocaleDateString('pt-BR')}
          {os.concluida_em && ` · concluída em ${new Date(os.concluida_em).toLocaleDateString('pt-BR')}`}
        </p>
        <p>
          <span className="text-slate-500">KM de entrada: </span>
          {os.km_entrada?.toLocaleString('pt-BR') ?? '—'}
        </p>
        {os.vistorias && (
          <button
            onClick={() => onVistoria(os.veiculos)}
            className="inline-flex items-center gap-1 justify-self-start font-semibold text-slate-900 hover:underline"
          >
            <ClipboardCheck className="size-4" aria-hidden /> Ver vistoria de recepção
          </button>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">Serviços e peças</h3>
        {os.itens_os.length === 0 && <p className="text-sm text-slate-500">Nenhum item no orçamento.</p>}
        <ul className="divide-y divide-slate-100">
          {os.itens_os.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <p className="text-slate-900">{item.descricao}</p>
                <p className="text-xs text-slate-500">
                  {item.quantidade} × {reais(item.valor_unitario)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                <span className="font-semibold text-slate-900">{reais(item.quantidade * item.valor_unitario)}</span>
                {orcamento && (
                  <button onClick={() => removerItem(item.id)} className="p-1 text-slate-400 hover:text-red-700" aria-label={`Remover ${item.descricao}`}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="text-right font-bold text-slate-900">Total: {reais(totalItens(os.itens_os))}</p>

        {orcamento && (
          <form onSubmit={incluirItem} className="grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-[1fr_6rem_8rem_auto] sm:items-end">
            <Campo label="Descrição" name="descricao" required />
            <Campo label="Qtd." name="quantidade" type="number" min="0.01" step="0.01" defaultValue="1" required />
            <Campo label="Valor unit." name="valor_unitario" type="number" min="0" step="0.01" required />
            <Botao>Incluir</Botao>
          </form>
        )}
      </section>

      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {(os.status === 'orcamento' || os.status === 'aprovada') && (
          <button
            onClick={cancelar}
            disabled={enviando}
            className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Ban className="size-4" aria-hidden /> Cancelar
          </button>
        )}
        {proximo && (
          <Botao
            onClick={() => mudarStatus(proximo.status)}
            disabled={enviando || (orcamento && os.itens_os.length === 0)}
            title={orcamento && os.itens_os.length === 0 ? 'Inclua ao menos um item' : undefined}
          >
            {proximo.acao}
          </Botao>
        )}
      </div>
    </div>
  )
}
