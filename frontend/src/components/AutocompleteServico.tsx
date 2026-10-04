import { useEffect, useId, useState, type KeyboardEvent, type Ref } from 'react'
import { reais } from '../services/os'
import { supabase, type Servico } from '../services/supabase'

type Props = {
  value: string
  // texto digitado: quem usa trata como descricao livre
  onChange: (texto: string) => void
  onSelecionar: (servico: Servico) => void
  inputRef?: Ref<HTMLInputElement>
}

// combobox ARIA: setas navegam, Enter escolhe, Esc fecha; sem escolha, vale o texto digitado
export function AutocompleteServico({ value, onChange, onSelecionar, inputRef }: Props) {
  const id = useId()
  const [sugestoes, setSugestoes] = useState<{ termo: string; itens: Servico[] }>()
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(-1)

  useEffect(() => {
    if (!value.trim()) return
    const timer = setTimeout(() => {
      supabase!.rpc('buscar_servicos', { termo: value }).then(({ data }) => setSugestoes({ termo: value, itens: data ?? [] }))
    }, 200)
    return () => clearTimeout(timer)
  }, [value])

  // resposta de um termo antigo nao aparece: a lista sempre corresponde ao que esta digitado
  const lista = aberto && sugestoes?.termo === value ? sugestoes.itens : []

  function selecionar(servico: Servico) {
    onSelecionar(servico)
    setAberto(false)
    setAtivo(-1)
  }

  function teclas(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') return setAberto(false)
    if (!lista.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAtivo((i) => (i + 1) % lista.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo((i) => (i <= 0 ? lista.length - 1 : i - 1))
    } else if (e.key === 'Enter' && ativo >= 0) {
      e.preventDefault()
      selecionar(lista[ativo])
    }
  }

  return (
    <div className="relative min-w-0">
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Descrição
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={lista.length > 0}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={ativo >= 0 ? `${id}-${ativo}` : undefined}
          autoComplete="off"
          required
          value={value}
          placeholder="Digite ou escolha um serviço"
          onChange={(e) => {
            onChange(e.target.value)
            setAberto(true)
            setAtivo(-1)
          }}
          onKeyDown={teclas}
          onBlur={() => setAberto(false)}
          className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </label>
      {lista.length > 0 && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {lista.map((servico, i) => (
            <li
              key={servico.id}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === ativo}
              // mousedown em vez de click: escolhe antes do blur fechar a lista
              onMouseDown={(e) => {
                e.preventDefault()
                selecionar(servico)
              }}
              className={`flex cursor-pointer justify-between gap-2 px-3 py-2 text-sm ${i === ativo ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
            >
              <span className="text-slate-900">{servico.descricao}</span>
              <span className="whitespace-nowrap text-slate-500">{reais(servico.valor_sugerido)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
