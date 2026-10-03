import type { Enums } from './database.types'

export type StatusOS = Enums<'os_status'>

// "aprovada" e a OS gerada a partir do orcamento, aguardando execucao
export const STATUS_OS: Record<StatusOS, { rotulo: string; cor: string }> = {
  orcamento: { rotulo: 'Orçamento', cor: 'bg-slate-100 text-slate-700' },
  aprovada: { rotulo: 'Pendente', cor: 'bg-amber-100 text-amber-800' },
  em_execucao: { rotulo: 'Em execução', cor: 'bg-blue-100 text-blue-800' },
  concluida: { rotulo: 'Concluída', cor: 'bg-emerald-100 text-emerald-800' },
  entregue: { rotulo: 'Entregue', cor: 'bg-slate-800 text-white' },
  cancelada: { rotulo: 'Cancelada', cor: 'bg-red-100 text-red-800' },
}

// mesma ordem validada pelo trigger validar_status_os
export const PROXIMO_STATUS: Partial<Record<StatusOS, { status: StatusOS; acao: string }>> = {
  orcamento: { status: 'aprovada', acao: 'Aprovar orçamento ➔ Gerar OS' },
  aprovada: { status: 'em_execucao', acao: 'Iniciar execução' },
  em_execucao: { status: 'concluida', acao: 'Concluir serviço' },
  concluida: { status: 'entregue', acao: 'Registrar entrega' },
}

export const totalItens = (itens: { quantidade: number; valor_unitario: number }[]) =>
  itens.reduce((soma, i) => soma + i.quantidade * i.valor_unitario, 0)

export const reais = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
