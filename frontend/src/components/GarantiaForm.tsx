import { useState, type FormEvent } from 'react'
import { mensagemErro, supabase, type Garantia, type Oficina } from '../services/supabase'
import { Botao } from './Botao'
import { Campo } from './Campo'

type Props = { osId: number; oficina: Oficina; onEmitida: (garantia: Garantia) => void }

// valores padrao vem de oficina_config e podem ser ajustados por OS
export function GarantiaForm({ osId, oficina, onEmitida }: Props) {
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function emitir(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setEnviando(true)
    const { data, error } = await supabase!
      .from('garantias')
      .insert({
        ordem_servico_id: osId,
        prazo_meses: Number(form.get('prazo_meses')),
        km_limite: Number(form.get('km_limite')) || null,
        condicoes: String(form.get('condicoes')).trim() || null,
      })
      .select()
      .single()
    setEnviando(false)
    if (error) return setErro(mensagemErro(error))
    onEmitida(data)
  }

  return (
    <form onSubmit={emitir} className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
      <h4 className="font-semibold text-slate-900 sm:col-span-2">Emitir garantia</h4>
      <Campo label="Prazo (meses)" name="prazo_meses" type="number" min={1} required defaultValue={oficina.garantia_prazo_padrao_meses} />
      <Campo label="Limite de km (opcional)" name="km_limite" type="number" min={1} defaultValue={oficina.garantia_km_padrao ?? ''} />
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
        Condições e regras do motor
        <textarea
          name="condicoes"
          rows={8}
          defaultValue={oficina.garantia_condicoes_padrao ?? ''}
          className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </label>
      {erro && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{erro}</p>}
      <Botao disabled={enviando} className="sm:col-span-2 sm:justify-self-end">
        Emitir certificado de garantia
      </Botao>
    </form>
  )
}
