import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// null enquanto o .env.local nao estiver preenchido, para o app subir sem backend.
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, anonKey!)
  : null

export type Cliente = Tables<'clientes'>
export type Veiculo = Tables<'veiculos'>
export type Servico = Tables<'catalogo_servicos'>
export type Oficina = Tables<'oficina_config'>
export type Garantia = Tables<'garantias'>

// mensagem amigavel para os erros esperados de cadastro
export function mensagemErro(error: { code?: string; message: string }) {
  if (error.code === '23505') return 'Já existe um cadastro com esse CPF/CNPJ, placa ou chassi.'
  if (error.code === '23514') return 'Algum campo está em formato inválido.'
  return error.message
}
