import { useEffect, useState } from 'react'
import { DiagramaVeiculo, type Avaria } from '../components/DiagramaVeiculo'
import { Assinaturas, Dado, Documento, Secao, TabelaItens } from '../components/Documento'
import { formatarDataHora, formatarDocumento, formatarTelefone } from '../services/formatos'
import { supabase } from '../services/supabase'
import { COMBUSTIVEL, VISTAS, type ModeloChecklist } from '../services/vistoria'

const consultar = (id: number) =>
  supabase!
    .from('ordens_servico')
    .select('*, clientes(*), veiculos(*), itens_os(*), vistorias(*, checklist_modelos(definicao))')
    .eq('id', id)
    .order('id', { referencedTable: 'itens_os' })
    .single()
type OS = NonNullable<Awaited<ReturnType<typeof consultar>>['data']>

export function ComprovanteVistoriaPage({ osId, onVoltar }: { osId: number; onVoltar: () => void }) {
  const [os, setOs] = useState<OS>()

  useEffect(() => {
    consultar(osId).then(({ data }) => data && setOs(data))
  }, [osId])

  if (!os) return null
  const { clientes: cliente, veiculos: veiculo, vistorias: vistoria } = os
  const modelo = vistoria?.checklist_modelos.definicao as unknown as ModeloChecklist | undefined
  const checklist = (vistoria?.checklist ?? {}) as Record<string, { ok: boolean }>
  const avarias = (vistoria?.avarias ?? []) as Avaria[]
  const simbolos = Object.fromEntries(modelo?.tipos_avaria.map((t) => [t.chave, t.simbolo]) ?? [])

  return (
    <Documento titulo="Comprovante de vistoria" subtitulo={`OS de entrada nº ${os.id}`} onVoltar={onVoltar}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Secao titulo="Cliente">
          <Dado rotulo="Nome">{cliente.nome}</Dado>
          <Dado rotulo="CPF/CNPJ">{formatarDocumento(cliente.cpf_cnpj)}</Dado>
          <Dado rotulo="Telefone">{formatarTelefone(cliente.telefone)}</Dado>
        </Secao>
        <Secao titulo="Veículo">
          <Dado rotulo="Placa">{veiculo.placa}</Dado>
          <Dado rotulo="Modelo">{[veiculo.marca, veiculo.modelo, veiculo.ano, veiculo.cor].filter(Boolean).join(' · ') || '—'}</Dado>
          <Dado rotulo="Nº do motor">{veiculo.numero_motor ?? '—'}</Dado>
        </Secao>
      </div>

      {!vistoria ? (
        <p>Esta OS não tem vistoria de recepção registrada.</p>
      ) : (
        <>
          <Secao titulo="Entrada">
            <div className="grid gap-2 sm:grid-cols-3">
              <Dado rotulo="Data">{formatarDataHora(vistoria.realizada_em)}</Dado>
              <Dado rotulo="KM">{os.km_entrada?.toLocaleString('pt-BR') ?? '—'}</Dado>
              <Dado rotulo="Combustível">
                {vistoria.nivel_combustivel === null ? '—' : COMBUSTIVEL[vistoria.nivel_combustivel]}
              </Dado>
            </div>
          </Secao>

          <Secao titulo="Checklist de acessórios">
            <ul className="grid gap-x-6 sm:grid-cols-2">
              {modelo?.itens.map((item) => (
                <li key={item.chave} className="flex justify-between border-b border-slate-100 py-1">
                  {item.rotulo}
                  <span className="font-semibold">{checklist[item.chave]?.ok ? '✓ Sim' : '✗ Não'}</span>
                </li>
              ))}
            </ul>
          </Secao>

          <Secao titulo={`Avarias na lataria (${avarias.length})`}>
            <p className="mb-2 text-xs text-slate-600">
              Legenda: {modelo?.tipos_avaria.map((t) => `[${t.simbolo}] ${t.rotulo}`).join('   ')}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {VISTAS.map((v) => (
                <figure key={v.vista}>
                  <DiagramaVeiculo
                    vista={v.vista}
                    rotulo={v.rotulo}
                    simbolos={simbolos}
                    avarias={avarias.filter((a) => a.vista === v.vista)}
                  />
                  <figcaption className="text-center text-xs text-slate-600">{v.rotulo}</figcaption>
                </figure>
              ))}
            </div>
          </Secao>

          {vistoria.observacoes && (
            <Secao titulo="Observações">
              <p className="whitespace-pre-line">{vistoria.observacoes}</p>
            </Secao>
          )}
        </>
      )}

      {os.itens_os.length > 0 && (
        <Secao titulo="Serviços previstos">
          <TabelaItens itens={os.itens_os} />
        </Secao>
      )}

      <p className="text-xs text-slate-600">
        Declaro que as informações acima conferem com o estado do veículo no momento da entrega à oficina.
      </p>
      <Assinaturas nomes={['Cliente', 'Responsável pela vistoria']} />
    </Documento>
  )
}
