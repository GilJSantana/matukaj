import { useRef, useState, type FormEvent } from 'react'
import { reais } from '../services/os'
import { AutocompleteServico } from './AutocompleteServico'
import { Botao } from './Botao'
import { Campo } from './Campo'

export type NovoItem = { servico_id: number | null; descricao: string; quantidade: number; valor_unitario: number }

type Props = { onIncluir: (item: NovoItem) => Promise<boolean> }

export function ItemOSForm({ onIncluir }: Props) {
  const [descricao, setDescricao] = useState('')
  // id do catalogo so enquanto a descricao for a sugerida; texto editado vira item livre
  const [servicoId, setServicoId] = useState<number | null>(null)
  const [quantidade, setQuantidade] = useState('1')
  const [valor, setValor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const descricaoRef = useRef<HTMLInputElement>(null)

  async function incluir(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    const ok = await onIncluir({
      servico_id: servicoId,
      descricao: descricao.trim(),
      quantidade: Number(quantidade),
      valor_unitario: Number(valor),
    })
    setEnviando(false)
    if (!ok) return
    setDescricao('')
    setServicoId(null)
    setQuantidade('1')
    setValor('')
    // pronto para o proximo item
    descricaoRef.current?.focus()
  }

  const subtotal = Number(quantidade) * Number(valor)

  return (
    <form onSubmit={incluir} className="grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-[1fr_6rem_8rem_auto] sm:items-end">
      <AutocompleteServico
        inputRef={descricaoRef}
        value={descricao}
        onChange={(texto) => {
          setDescricao(texto)
          setServicoId(null)
        }}
        onSelecionar={(servico) => {
          setDescricao(servico.descricao)
          setServicoId(servico.id)
          setValor(String(servico.valor_sugerido))
        }}
      />
      <Campo
        label="Qtd."
        type="number"
        min="0.01"
        step="0.01"
        required
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
      />
      <Campo
        label="Valor unit."
        type="number"
        min="0"
        step="0.01"
        required
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      <Botao disabled={enviando}>Incluir</Botao>
      {subtotal > 0 && (
        <p className="text-sm text-slate-500 sm:col-span-4">
          Subtotal do item: {reais(subtotal)}
          {servicoId === null && descricao.trim() && ' · item livre (fora do catálogo)'}
        </p>
      )}
    </form>
  )
}
