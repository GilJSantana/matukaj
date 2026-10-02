import { useState, type FormEvent } from 'react'
import { mensagemErro, supabase, type Veiculo } from '../services/supabase'
import { Botao } from './Botao'
import { Campo } from './Campo'

type Props = {
  clienteId: number
  veiculo: Veiculo | null
  onSalvo: () => void
  onCancelar: () => void
}

export function VeiculoForm({ clienteId, veiculo, onSalvo, onCancelar }: Props) {
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const texto = (campo: string) => String(form.get(campo) ?? '').trim() || null

    const dados = {
      cliente_id: clienteId,
      // mesmo formato do banco: maiusculas, sem hifen
      placa: texto('placa')!.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      marca: texto('marca'),
      modelo: texto('modelo'),
      ano: texto('ano') ? Number(texto('ano')) : null,
      cor: texto('cor'),
      numero_motor: texto('numero_motor'),
    }
    setEnviando(true)
    const tabela = supabase!.from('veiculos')
    const { error } = await (veiculo ? tabela.update(dados).eq('id', veiculo.id) : tabela.insert(dados))
    setEnviando(false)
    if (error) return setErro(mensagemErro(error))
    onSalvo()
  }

  return (
    <form onSubmit={salvar} className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
      <Campo
        label="Placa"
        name="placa"
        defaultValue={veiculo?.placa}
        required
        pattern="[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}"
        title="ABC1234 ou ABC1D23"
        placeholder="ABC1D23"
        className="uppercase"
      />
      <Campo label="Marca" name="marca" defaultValue={veiculo?.marca ?? ''} />
      <Campo label="Modelo" name="modelo" defaultValue={veiculo?.modelo ?? ''} />
      <Campo label="Ano" name="ano" type="number" min={1900} max={2100} defaultValue={veiculo?.ano ?? ''} />
      <Campo label="Cor" name="cor" defaultValue={veiculo?.cor ?? ''} />
      <Campo label="Nº do motor" name="numero_motor" defaultValue={veiculo?.numero_motor ?? ''} />
      {erro && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{erro}</p>}
      <div className="flex justify-end gap-2 sm:col-span-3">
        <button type="button" onClick={onCancelar} className="px-4 py-2 text-sm text-slate-600 hover:underline">
          Cancelar
        </button>
        <Botao disabled={enviando}>{veiculo ? 'Salvar veículo' : 'Vincular veículo'}</Botao>
      </div>
    </form>
  )
}
