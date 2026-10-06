import { ArrowLeft, ImageUp, Lock } from 'lucide-react'
import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { getOficinaConfig, updateOficinaConfig, uploadLogoOficina, urlLogoOficina } from '../services/configService'
import { formatarDocumento, formatarTelefone } from '../services/formatos'
import { mensagemErro, supabase, type Oficina } from '../services/supabase'
import { normalizarTelefone } from '../services/whatsapp'

// aplica a mascara enquanto digita: cada 0 do padrao recebe um digito
function mascarar(valor: string, padrao: string) {
  const digitos = valor.replace(/\D/g, '')
  let i = 0
  let saida = ''
  for (const c of padrao) {
    if (i >= digitos.length) break
    saida += c === '0' ? digitos[i++] : c
  }
  return saida
}

const mascaraCnpj = (e: ChangeEvent<HTMLInputElement>) => {
  e.target.value = mascarar(e.target.value, '00.000.000/0000-00')
}
// fixo tem 10 digitos, celular 11
const mascaraTelefone = (e: ChangeEvent<HTMLInputElement>) => {
  const n = e.target.value.replace(/\D/g, '').length
  e.target.value = mascarar(e.target.value, n > 10 ? '(00) 00000-0000' : '(00) 0000-0000')
}

function LogoUpload({ logoPath, disabled, onEnviado }: { logoPath: string | null; disabled: boolean; onEnviado: (o: Oficina) => void }) {
  const [preview, setPreview] = useState<string>()
  const [arrastando, setArrastando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (logoPath) urlLogoOficina(logoPath).then(setPreview, () => {})
  }, [logoPath])

  async function enviar(file?: File) {
    if (!file || disabled) return
    setErro('')
    const anterior = preview
    setPreview(URL.createObjectURL(file))
    try {
      onEnviado(await uploadLogoOficina(file))
    } catch (e) {
      setPreview(anterior)
      setErro(e instanceof Error ? e.message : 'Falha ao enviar o logotipo.')
    }
  }

  function soltar(e: DragEvent) {
    e.preventDefault()
    setArrastando(false)
    enviar(e.dataTransfer.files[0])
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">Logotipo</span>
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={soltar}
        className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm text-slate-600 focus-within:border-slate-500 ${
          arrastando ? 'border-slate-500 bg-slate-50' : 'border-slate-300'
        } ${disabled ? 'opacity-50' : 'cursor-pointer hover:bg-slate-50'}`}
      >
        {preview ? (
          <img src={preview} alt="Logotipo da oficina" className="max-h-32 object-contain" />
        ) : (
          <ImageUp className="size-8 text-slate-400" aria-hidden />
        )}
        <span>Clique ou arraste uma imagem PNG ou JPG</span>
        <input
          type="file"
          accept="image/png,image/jpeg"
          disabled={disabled}
          onChange={(e) => enviar(e.target.files?.[0])}
          className="sr-only"
        />
      </label>
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
    </div>
  )
}

export function ConfiguracoesPage({ onVoltar }: { onVoltar: () => void }) {
  const [oficina, setOficina] = useState<Oficina>()
  const [admin, setAdmin] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getOficinaConfig().then(setOficina, (e) => setErro(mensagemErro(e)))
    supabase!.rpc('is_admin').then(({ data }) => setAdmin(Boolean(data)))
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const texto = (campo: string) => String(form.get(campo) ?? '').trim() || null

    const cnpj = texto('cnpj')?.replace(/\D/g, '') || null
    if (cnpj && cnpj.length !== 14) return setErro('O CNPJ deve ter 14 dígitos.')
    const telefone = normalizarTelefone(texto('telefone') ?? '')
    if (telefone && !/^55\d{10,11}$/.test(telefone)) return setErro('Informe o telefone com DDD.')

    setEnviando(true)
    try {
      setOficina(
        await updateOficinaConfig({
          razao_social: texto('razao_social')!,
          cnpj,
          endereco: texto('endereco'),
          telefone,
          garantia_prazo_padrao_meses: Number(form.get('garantia_prazo_padrao_meses')),
          validade_orcamento_dias: Number(form.get('validade_orcamento_dias')),
        }),
      )
      setErro('')
      setToast('Configurações salvas.')
    } catch (e) {
      setErro(mensagemErro(e as { code?: string; message: string }))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onVoltar} className="inline-flex items-center gap-1 self-start text-sm text-slate-600 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Voltar
      </button>
      <h2 className="text-xl font-bold text-slate-900">Configurações da oficina</h2>

      {!admin && (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <Lock className="size-4 shrink-0" aria-hidden />
          Permissão insuficiente: somente administradores alteram as configurações da oficina.
        </p>
      )}

      {oficina ? (
        <form onSubmit={salvar} className="rounded-2xl bg-white p-6 shadow-sm">
          <fieldset disabled={!admin || enviando} className="grid gap-4 sm:grid-cols-2">
            <legend className="sr-only">Dados cadastrais</legend>
            <Campo label="Razão social" name="razao_social" defaultValue={oficina.razao_social} required className="sm:col-span-2" />
            <Campo
              label="CNPJ"
              name="cnpj"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              defaultValue={oficina.cnpj ? formatarDocumento(oficina.cnpj) : ''}
              onChange={mascaraCnpj}
            />
            <Campo
              label="Telefone (WhatsApp)"
              name="telefone"
              type="tel"
              placeholder="(00) 00000-0000"
              defaultValue={oficina.telefone ? formatarTelefone(oficina.telefone) : ''}
              onChange={mascaraTelefone}
            />
            <Campo label="Endereço" name="endereco" defaultValue={oficina.endereco ?? ''} className="sm:col-span-2" />
            <Campo
              label="Prazo padrão da garantia (meses)"
              name="garantia_prazo_padrao_meses"
              type="number"
              min={1}
              required
              defaultValue={oficina.garantia_prazo_padrao_meses}
            />
            <Campo
              label="Validade do orçamento (dias)"
              name="validade_orcamento_dias"
              type="number"
              min={1}
              required
              defaultValue={oficina.validade_orcamento_dias}
            />
            <div className="sm:col-span-2">
              <LogoUpload logoPath={oficina.logo_path} disabled={!admin} onEnviado={setOficina} />
            </div>
            {erro && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{erro}</p>}
            {admin && (
              <Botao className="sm:col-span-2 sm:justify-self-end">{enviando ? 'Salvando…' : 'Salvar'}</Botao>
            )}
          </fieldset>
        </form>
      ) : (
        erro && <p role="alert" className="text-sm text-red-700">{erro}</p>
      )}

      {toast && (
        <p role="status" className="fixed inset-x-4 bottom-4 mx-auto max-w-sm rounded-lg bg-emerald-700 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
          {toast}
        </p>
      )}
    </div>
  )
}
