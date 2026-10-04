import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { DiagramaVeiculo, type Avaria, type Vista } from '../components/DiagramaVeiculo'
import { mensagemErro, supabase } from '../services/supabase'
import { COMBUSTIVEL, VISTAS, type ModeloChecklist } from '../services/vistoria'

type Modelo = { id: number; definicao: ModeloChecklist }

type Props = {
  veiculo: { id: number; placa: string }
  // OS ja vistoriada: abre em modo leitura
  osId: number | null
  onSalva: (osId: number) => void
  onVoltar: () => void
}

export function VistoriaPage({ veiculo, osId, onSalva, onVoltar }: Props) {
  const leitura = osId !== null
  const [modelo, setModelo] = useState<Modelo>()
  const [km, setKm] = useState<number | null>(null)
  const [combustivel, setCombustivel] = useState<number | null>(null)
  const [checklist, setChecklist] = useState<Record<string, { ok: boolean }>>({})
  const [avarias, setAvarias] = useState<Avaria[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [vista, setVista] = useState<Vista>('teto')
  const [tipo, setTipo] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (osId === null) {
      supabase!
        .from('checklist_modelos')
        .select('id, definicao')
        .eq('ativo', true)
        .single()
        .then(({ data }) => {
          if (!data) return
          const def = data.definicao as unknown as ModeloChecklist
          setModelo({ id: data.id, definicao: def })
          setTipo(def.tipos_avaria[0].chave)
          // todo item vai para o JSON, inclusive os ausentes
          setChecklist(Object.fromEntries(def.itens.map((i) => [i.chave, { ok: false }])))
        })
      return
    }
    // vistoria antiga e exibida com a versao do modelo usada nela (ADR 003)
    supabase!
      .from('vistorias')
      .select('*, checklist_modelos(id, definicao), ordens_servico(km_entrada)')
      .eq('ordem_servico_id', osId)
      .single()
      .then(({ data }) => {
        if (!data) return
        setModelo({
          id: data.checklist_modelos.id,
          definicao: data.checklist_modelos.definicao as unknown as ModeloChecklist,
        })
        setKm(data.ordens_servico.km_entrada)
        setCombustivel(data.nivel_combustivel)
        setChecklist(data.checklist as Record<string, { ok: boolean }>)
        setAvarias(data.avarias as Avaria[])
        setObservacoes(data.observacoes ?? '')
      })
  }, [osId])

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    const { data, error } = await supabase!.rpc('registrar_vistoria', {
      veiculo_id: veiculo.id,
      checklist_modelo_id: modelo!.id,
      checklist,
      avarias,
      km_entrada: km ?? undefined,
      nivel_combustivel: combustivel ?? undefined,
      observacoes: observacoes.trim() || undefined,
    })
    setEnviando(false)
    if (error) return setErro(mensagemErro(error))
    onSalva(data)
  }

  if (!modelo) return null
  const def = modelo.definicao
  const simbolos = Object.fromEntries(def.tipos_avaria.map((t) => [t.chave, t.simbolo]))
  const rotuloVista = VISTAS.find((v) => v.vista === vista)!.rotulo

  return (
    <form onSubmit={salvar} className="flex flex-col gap-6">
      <button type="button" onClick={onVoltar} className="inline-flex items-center gap-1 self-start text-sm text-slate-600 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Voltar
      </button>

      <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
        <ClipboardCheck className="size-6" aria-hidden />
        {leitura ? `Vistoria da OS nº ${osId}` : 'Abrir orçamento: vistoria de recepção'}
        <span className="font-mono text-slate-600">{veiculo.placa}</span>
      </h2>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">Avarias na lataria</h3>
        <div role="tablist" className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {VISTAS.map((v) => (
            <button
              key={v.vista}
              type="button"
              role="tab"
              aria-selected={vista === v.vista}
              onClick={() => setVista(v.vista)}
              className={`flex-1 rounded-md px-2 py-2 text-sm font-medium ${vista === v.vista ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
            >
              {v.rotulo}
            </button>
          ))}
        </div>

        {!leitura && (
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="sr-only">Tipo de avaria</legend>
            {def.tipos_avaria.map((t) => (
              <label
                key={t.chave}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium has-focus-visible:ring-2 ${tipo === t.chave ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-300 text-slate-700'}`}
              >
                <input type="radio" name="tipo" value={t.chave} checked={tipo === t.chave} onChange={() => setTipo(t.chave)} className="sr-only" />
                <span className="font-mono font-bold">[{t.simbolo}]</span> {t.rotulo}
              </label>
            ))}
          </fieldset>
        )}

        <DiagramaVeiculo
          vista={vista}
          rotulo={rotuloVista}
          simbolos={simbolos}
          avarias={avarias.filter((a) => a.vista === vista)}
          onMarcar={leitura ? undefined : (x, y) => setAvarias((lista) => [...lista, { vista, x, y, tipo }])}
          onRemover={leitura ? undefined : (avaria) => setAvarias((lista) => lista.filter((a) => a !== avaria))}
        />
        <p className="text-sm text-slate-500">
          {leitura
            ? `${avarias.length} avaria(s) registrada(s).`
            : `Toque no desenho para marcar; toque na marca para remover. ${avarias.length} marcada(s).`}
        </p>
      </section>

      <fieldset disabled={leitura} className="flex min-w-0 flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <legend className="sr-only">Checklist</legend>
        <h3 className="font-semibold text-slate-900">Checklist</h3>
        {def.itens.map((item) => (
          <label key={item.chave} className="flex items-center justify-between gap-4 text-slate-700">
            {item.rotulo}
            <input
              type="checkbox"
              role="switch"
              checked={checklist[item.chave]?.ok ?? false}
              onChange={(e) => setChecklist((c) => ({ ...c, [item.chave]: { ok: e.target.checked } }))}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-500 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"
            />
          </label>
        ))}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Combustível</span>
          <div className="grid grid-cols-5 gap-1">
            {COMBUSTIVEL.map((rotulo, nivel) => (
              <label
                key={nivel}
                className={`cursor-pointer rounded-lg border py-2 text-center text-sm font-medium has-focus-visible:ring-2 ${combustivel === nivel ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700'}`}
              >
                <input type="radio" name="combustivel" checked={combustivel === nivel} onChange={() => setCombustivel(nivel)} className="sr-only" />
                {rotulo}
              </label>
            ))}
          </div>
        </div>

        <Campo
          label="KM de entrada"
          type="number"
          min={0}
          value={km ?? ''}
          onChange={(e) => setKm(e.target.value ? Number(e.target.value) : null)}
        />
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Observações
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-slate-500 focus:outline-none"
          />
        </label>
      </fieldset>

      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      {!leitura && (
        <Botao disabled={enviando} className="self-end">
          Salvar vistoria e abrir orçamento
        </Botao>
      )}
    </form>
  )
}
