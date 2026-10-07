import { FunctionsHttpError } from '@supabase/supabase-js'
import type { Enums } from './database.types'
import { supabase } from './supabase'

export type Papel = Enums<'papel_usuario'>

export const PAPEIS: Record<Papel, { rotulo: string; cor: string }> = {
  admin: { rotulo: 'Administrador', cor: 'bg-purple-100 text-purple-800' },
  atendente: { rotulo: 'Atendente', cor: 'bg-blue-100 text-blue-800' },
  mecanico: { rotulo: 'Mecânico', cor: 'bg-amber-100 text-amber-800' },
}

// e-mail vem de auth.users: so via funcao do banco, restrita a admin
export async function listarUsuarios() {
  const { data, error } = await supabase!.rpc('listar_usuarios')
  if (error) throw error
  return data
}

export async function atualizarPerfilUsuario(userId: string, payload: { papel?: Papel; ativo?: boolean }) {
  const { data, error } = await supabase!.from('perfis').update(payload).eq('id', userId).select().single()
  if (error) throw error
  return data
}

// Edge Function: o convite exige a service_role, que nao pode ir para o navegador (ADR 004)
export async function convidarUsuario(email: string, papel: Papel) {
  const { error } = await supabase!.functions.invoke('convidar-usuario', { body: { email, papel } })
  if (error instanceof FunctionsHttpError) throw new Error((await error.context.json()).error)
  if (error) throw error
}
