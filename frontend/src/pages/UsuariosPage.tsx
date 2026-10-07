import { ArrowLeft, UserPlus } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { mensagemErro } from '../services/supabase'
import { atualizarPerfilUsuario, convidarUsuario, listarUsuarios, PAPEIS, type Papel } from '../services/userService'

type Usuario = Awaited<ReturnType<typeof listarUsuarios>>[number]

const erroTexto = (e: unknown) => mensagemErro(e as { code?: string; message: string })

function ConviteDialog({ dialog, onConvidado }: { dialog: RefObject<HTMLDialogElement | null>; onConvidado: () => void }) {
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function convidar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formulario = e.currentTarget
    const form = new FormData(formulario)
    setEnviando(true)
    try {
      await convidarUsuario(String(form.get('email')).trim(), form.get('papel') as Papel)
      setErro('')
      formulario.reset()
      dialog.current?.close()
      onConvidado()
    } catch (e) {
      setErro(erroTexto(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <dialog ref={dialog} aria-labelledby="titulo-convite" className="m-auto w-full max-w-sm rounded-2xl p-6 shadow-xl backdrop:bg-slate-900/40">
      <form onSubmit={convidar} className="flex flex-col gap-4">
        <h3 id="titulo-convite" className="font-semibold text-slate-900">Convidar usuário</h3>
        <Campo label="E-mail" name="email" type="email" required autoFocus />
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Papel inicial
          <select name="papel" defaultValue="mecanico" className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900">
            {Object.entries(PAPEIS).map(([papel, { rotulo }]) => (
              <option key={papel} value={papel}>{rotulo}</option>
            ))}
          </select>
        </label>
        {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => dialog.current?.close()} className="px-3 py-2 text-sm text-slate-600 hover:underline">
            Cancelar
          </button>
          <Botao disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar convite'}</Botao>
        </div>
      </form>
    </dialog>
  )
}

export function UsuariosPage({ onVoltar }: { onVoltar: () => void }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)

  const carregar = () => listarUsuarios().then(setUsuarios, (e) => setErro(erroTexto(e)))
  useEffect(() => {
    carregar()
  }, [])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 3000)
    return () => clearTimeout(t)
  }, [aviso])

  // salva na hora: RLS avalia o papel a cada requisicao, entao a permissao muda imediatamente
  async function alterar(usuario: Usuario, payload: { papel?: Papel; ativo?: boolean }) {
    try {
      const salvo = await atualizarPerfilUsuario(usuario.id, payload)
      setUsuarios((lista) => lista.map((u) => (u.id === salvo.id ? { ...u, ...salvo } : u)))
      setErro('')
      setAviso(`${usuario.nome} atualizado.`)
    } catch (e) {
      setErro(erroTexto(e))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onVoltar} className="inline-flex items-center gap-1 self-start text-sm text-slate-600 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Voltar
      </button>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-900">Usuários</h2>
        <Botao onClick={() => dialog.current?.showModal()}>
          <UserPlus className="size-4" aria-hidden /> Convidar
        </Botao>
      </div>

      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}

      <ul className="divide-y divide-slate-100 rounded-2xl bg-white px-4 shadow-sm">
        {usuarios.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span className="min-w-0">
              <span className={`block font-medium ${u.ativo ? 'text-slate-900' : 'text-slate-400'}`}>{u.nome}</span>
              <span className="block truncate text-slate-500">{u.email}</span>
            </span>
            <span className="flex items-center gap-3">
              <select
                aria-label={`Papel de ${u.nome}`}
                value={u.papel}
                onChange={(e) => alterar(u, { papel: e.target.value as Papel })}
                className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${PAPEIS[u.papel].cor}`}
              >
                {Object.entries(PAPEIS).map(([papel, { rotulo }]) => (
                  <option key={papel} value={papel}>{rotulo}</option>
                ))}
              </select>
              <button
                role="switch"
                aria-checked={u.ativo}
                aria-label={`Acesso de ${u.nome}`}
                onClick={() => alterar(u, { ativo: !u.ativo })}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-600"
              >
                <span className={`relative h-5 w-9 rounded-full transition ${u.ativo ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${u.ativo ? 'left-4.5' : 'left-0.5'}`} />
                </span>
                {u.ativo ? 'Ativo' : 'Inativo'}
              </button>
            </span>
          </li>
        ))}
      </ul>

      <ConviteDialog dialog={dialog} onConvidado={() => (carregar(), setAviso('Convite enviado.'))} />

      {aviso && (
        <p role="status" className="fixed inset-x-4 bottom-4 mx-auto max-w-sm rounded-lg bg-emerald-700 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
          {aviso}
        </p>
      )}
    </div>
  )
}
