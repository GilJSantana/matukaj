import { Wrench } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { supabase } from '../services/supabase'

export function LoginPage() {
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setEnviando(true)
    const { error } = await supabase!.auth.signInWithPassword({
      email: String(form.get('email')),
      password: String(form.get('senha')),
    })
    setEnviando(false)
    setErro(error ? 'E-mail ou senha inválidos.' : '')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form onSubmit={entrar} className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-8 shadow-sm">
        <Wrench className="mx-auto size-10 text-slate-700" aria-hidden />
        <h1 className="text-center text-2xl font-bold text-slate-900">Matukaj</h1>
        <Campo label="E-mail" name="email" type="email" autoComplete="username" required />
        <Campo label="Senha" name="senha" type="password" autoComplete="current-password" required />
        {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
        <Botao disabled={enviando}>Entrar</Botao>
      </form>
    </main>
  )
}
