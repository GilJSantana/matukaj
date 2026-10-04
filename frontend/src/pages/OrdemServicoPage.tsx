import { ArrowLeft, Ban, ClipboardCheck, MessageCircle, Printer, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Botao } from '../components/Botao'
import { GarantiaForm } from '../components/GarantiaForm'
import { ItemOSForm, type NovoItem } from '../components/ItemOSForm'
import { StatusOS } from '../components/StatusOS'
import { PROXIMO_STATUS, STATUS_OS, reais, totalItens, type StatusOS as Status } from '../services/os'
import { mensagemErro, supabase, type Oficina, type Veiculo } from '../services/supabase'
import { linkWhatsApp } from '../services/whatsapp'

const consultar = (id: number) =>
  supabase!
    .from('ordens_servico')
    .select('*, clientes(nome, telefone), veiculos(*), itens_os(*), vistorias(id), garantias(*)')
    .eq('id', id)
    .order('id', { referencedTable: 'itens_os' })
    .single()
type OS = NonNullable<Awaited<ReturnType<typeof consultar>>['data']>

const ETAPAS: Status[] = ['orcamento', 'aprovada', 'em_execucao', 'concluida', 'entregue']

// saudacao + situacao + resumo; curta para caber na URL do wa.me (ADR 002)
function mensagemWhatsApp(os: OS, oficina: string) {
  const veiculo = [os.veiculos.placa, os.veiculos.modelo].filter(Boolean).join(' ')
  const situacao: Record<Status, string> = {
    orcamento: `Segue o orçamento nº ${os.id} do seu veículo ${veiculo}:`,
    aprovada: `Sua OS nº ${os.id} (${veiculo}) foi aprovada e já está na fila de execução.`,
    em_execucao: `Os serviços da OS nº ${os.id} (${veiculo}) estão em execução.`,
    concluida: `Os serviços da OS nº ${os.id} (${veiculo}) foram concluídos. Seu veículo está pronto para retirada!`,
    entregue: `Obrigado pela confiança! Segue o resumo da OS nº ${os.id} (${veiculo}):`,
    cancelada: `A OS nº ${os.id} (${veiculo}) foi cancelada.`,
  }
  const linhas = [`Olá, ${os.clientes.nome.split(' ')[0]}! Aqui é da ${oficina}.`, situacao[os.status]]
  if (os.itens_os.length > 0 && os.status !== 'cancelada') {
    linhas.push('', ...os.itens_os.map((i) => `• ${i.descricao}: ${reais(i.quantidade * i.valor_unitario)}`))
    linhas.push(`Total: ${reais(totalItens(os.itens_os))}`)
  }
  if (os.garantias) {
    const km = os.garantias.km_limite ? ` ou ${os.garantias.km_limite.toLocaleString('pt-BR')} km` : ''
    linhas.push('', `Garantia: ${os.garantias.prazo_meses} meses${km}, o que ocorrer primeiro.`)
  }
  return linhas.join('\n')
}

const BOTAO_SECUNDARIO =
  'inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50'

type Props = {
  id: number
  onVistoria: (veiculo: Veiculo) => void
  onDocumento: (tipo: 'comprovante' | 'garantia') => void
  onVoltar: (clienteId: number) => void
}

export function OrdemServicoPage({ id, onVistoria, onDocumento, onVoltar }: Props) {
  const [os, setOs] = useState<OS>()
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [oficina, setOficina] = useState<Oficina>()

  useEffect(() => {
    consultar(id).then(({ data }) => data && setOs(data))
    supabase!.from('oficina_config').select().single().then(({ data }) => data && setOficina(data))
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

  async function incluirItem(item: NovoItem) {
    const { data, error } = await supabase!
      .from('itens_os')
      .insert({ ...item, ordem_servico_id: id })
      .select()
      .single()
    if (error) {
      setErro(mensagemErro(error))
      return false
    }
    setErro('')
    setOs((atual) => atual && { ...atual, itens_os: [...atual.itens_os, data] })
    return true
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

        {orcamento && <ItemOSForm onIncluir={incluirItem} />}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">Documentos e envio</h3>
        <div className="flex flex-wrap gap-2">
          {os.vistorias && (
            <button onClick={() => onDocumento('comprovante')} className={BOTAO_SECUNDARIO}>
              <Printer className="size-4" aria-hidden /> Comprovante de vistoria
            </button>
          )}
          {os.garantias && (
            <button onClick={() => onDocumento('garantia')} className={BOTAO_SECUNDARIO}>
              <ShieldCheck className="size-4" aria-hidden /> Certificado de garantia
            </button>
          )}
          {os.clientes.telefone ? (
            <a
              href={linkWhatsApp(os.clientes.telefone, mensagemWhatsApp(os, oficina?.razao_social ?? 'oficina'))}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="size-4" aria-hidden /> Enviar no WhatsApp
            </a>
          ) : (
            <span className="self-center text-sm text-slate-500">Cliente sem telefone cadastrado para WhatsApp.</span>
          )}
        </div>
        {(os.status === 'concluida' || os.status === 'entregue') && !os.garantias && oficina && (
          <GarantiaForm osId={os.id} oficina={oficina} onEmitida={(garantia) => setOs({ ...os, garantias: garantia })} />
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
