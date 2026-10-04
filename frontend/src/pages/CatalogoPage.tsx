import { ArrowLeft, Pencil } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { reais } from '../services/os'
import { mensagemErro, supabase, type Servico } from '../services/supabase'

function ServicoForm({ servico, onSalvo, onCancelar }: { servico: Servico | null; onSalvo: (s: Servico) => void; onCancelar?: () => void }) {
  const [erro, setErro] = useState('')

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formulario = e.currentTarget
    const form = new FormData(formulario)
    const dados = { descricao: String(form.get('descricao')).trim(), valor_sugerido: Number(form.get('valor_sugerido')) }
    const tabela = supabase!.from('catalogo_servicos')
    const { data, error } = await (servico ? tabela.update(dados).eq('id', servico.id) : tabela.insert(dados)).select().single()
    if (error) return setErro(mensagemErro(error))
    setErro('')
    if (!servico) formulario.reset()
    onSalvo(data)
  }

  return (
    <form onSubmit={salvar} className="grid gap-2 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
      <Campo label="Serviço" name="descricao" defaultValue={servico?.descricao} required placeholder="Ex.: Retífica de bloco" />
      <Campo label="Valor padrão" name="valor_sugerido" type="number" min="0" step="0.01" defaultValue={servico?.valor_sugerido ?? ''} required />
      <div className="flex gap-2">
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="px-3 py-2 text-sm text-slate-600 hover:underline">
            Cancelar
          </button>
        )}
        <Botao>{servico ? 'Salvar' : 'Cadastrar'}</Botao>
      </div>
      {erro && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{erro}</p>}
    </form>
  )
}

export function CatalogoPage({ onVoltar }: { onVoltar: () => void }) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [admin, setAdmin] = useState(false)
  const [editando, setEditando] = useState<number | null>(null)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    supabase!.from('catalogo_servicos').select().order('descricao').then(({ data }) => setServicos(data ?? []))
    supabase!.rpc('is_admin').then(({ data }) => setAdmin(Boolean(data)))
  }, [])

  function aplicar(salvo: Servico) {
    setServicos((lista) =>
      [...lista.filter((s) => s.id !== salvo.id), salvo].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR')),
    )
    setEditando(null)
  }

  async function alternarAtivo(servico: Servico) {
    const { data } = await supabase!.from('catalogo_servicos').update({ ativo: !servico.ativo }).eq('id', servico.id).select().single()
    if (data) aplicar(data)
  }

  // mesma comparacao da busca do banco: sem acento e sem caixa
  const normalizar = (texto: string) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const visiveis = servicos.filter((s) => normalizar(s.descricao).includes(normalizar(filtro)))

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onVoltar} className="inline-flex items-center gap-1 self-start text-sm text-slate-600 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Voltar
      </button>
      <h2 className="text-xl font-bold text-slate-900">Catálogo de serviços</h2>

      {admin ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-semibold text-slate-900">Novo serviço</h3>
          <ServicoForm servico={null} onSalvo={aplicar} />
        </section>
      ) : (
        <p className="text-sm text-slate-500">Somente administradores alteram o catálogo.</p>
      )}

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <Campo label="Filtrar" type="search" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        {visiveis.length === 0 && <p className="text-sm text-slate-500">Nenhum serviço encontrado.</p>}
        <ul className="divide-y divide-slate-100">
          {visiveis.map((s) =>
            editando === s.id ? (
              <li key={s.id} className="py-3">
                <ServicoForm servico={s} onSalvo={aplicar} onCancelar={() => setEditando(null)} />
              </li>
            ) : (
              <li key={s.id} className="flex items-center justify-between gap-2 py-3 text-sm">
                <span className={`min-w-0 ${s.ativo ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{s.descricao}</span>
                <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                  <span className="font-semibold text-slate-900">{reais(s.valor_sugerido)}</span>
                  {admin && (
                    <>
                      <button
                        onClick={() => alternarAtivo(s)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        {s.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => setEditando(s.id)} className="p-1 text-slate-500 hover:text-slate-900" aria-label={`Editar ${s.descricao}`}>
                        <Pencil className="size-4" aria-hidden />
                      </button>
                    </>
                  )}
                </span>
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  )
}
