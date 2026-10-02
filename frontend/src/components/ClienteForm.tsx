import { useState, type FormEvent } from 'react'
import { mensagemErro, supabase, type Cliente } from '../services/supabase'
import { normalizarTelefone } from '../services/whatsapp'
import { Botao } from './Botao'
import { Campo } from './Campo'

type Props = { cliente: Cliente | null; onSalvo: (cliente: Cliente) => void }

export function ClienteForm({ cliente, onSalvo }: Props) {
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const texto = (campo: string) => String(form.get(campo) ?? '').trim() || null

    const cpfCnpj = texto('cpf_cnpj')?.replace(/\D/g, '') || null
    if (cpfCnpj && cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
      return setErro('CPF deve ter 11 dígitos e CNPJ 14.')
    }
    const telefone = normalizarTelefone(texto('telefone') ?? '')
    if (telefone && !/^55\d{10,11}$/.test(telefone)) return setErro('Informe o telefone com DDD.')

    const dados = {
      nome: texto('nome')!,
      cpf_cnpj: cpfCnpj,
      telefone,
      email: texto('email'),
      data_nascimento: texto('data_nascimento'),
      endereco: texto('endereco'),
    }
    setEnviando(true)
    const tabela = supabase!.from('clientes')
    const { data, error } = await (cliente
      ? tabela.update(dados).eq('id', cliente.id)
      : tabela.insert(dados)
    )
      .select()
      .single()
    setEnviando(false)
    setErro(error ? mensagemErro(error) : '')
    if (data) onSalvo(data)
  }

  return (
    <form onSubmit={salvar} className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2">
      <Campo label="Nome" name="nome" defaultValue={cliente?.nome} required className="sm:col-span-2" />
      <Campo label="CPF/CNPJ" name="cpf_cnpj" defaultValue={cliente?.cpf_cnpj ?? ''} inputMode="numeric" />
      <Campo
        label="Telefone (WhatsApp)"
        name="telefone"
        type="tel"
        defaultValue={cliente?.telefone?.slice(2) ?? ''}
        placeholder="(11) 98765-4321"
      />
      <Campo label="Data de nascimento" name="data_nascimento" type="date" defaultValue={cliente?.data_nascimento ?? ''} />
      <Campo label="E-mail" name="email" type="email" defaultValue={cliente?.email ?? ''} />
      <Campo label="Endereço" name="endereco" defaultValue={cliente?.endereco ?? ''} className="sm:col-span-2" />
      {erro && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{erro}</p>}
      <Botao disabled={enviando} className="sm:col-span-2 sm:justify-self-end">
        {cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
      </Botao>
    </form>
  )
}
