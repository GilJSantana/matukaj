import type { TablesUpdate } from './database.types'
import { supabase } from './supabase'

const BUCKET = 'documentos-os'
const EXTENSOES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg' }

// linha unica (id = true), ver ADR 003
export async function getOficinaConfig() {
  const { data, error } = await supabase!.from('oficina_config').select().single()
  if (error) throw error
  return data
}

// .single() transforma update de 0 linhas em erro, em vez de "salvo" sem gravar nada
export async function updateOficinaConfig(payload: Omit<TablesUpdate<'oficina_config'>, 'id'>) {
  const { data, error } = await supabase!.from('oficina_config').update(payload).eq('id', true).select().single()
  if (error) throw error
  return data
}

// sobrescreve o logo anterior de mesma extensao (US-33, regra 3)
export async function uploadLogoOficina(file: File) {
  const ext = EXTENSOES[file.type]
  if (!ext) throw new Error('Envie uma imagem PNG ou JPG.')
  const path = `logos/logo_oficina.${ext}`
  const { error } = await supabase!.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  return updateOficinaConfig({ logo_path: path })
}

// bucket privado: link temporario para exibir o logo salvo
export async function urlLogoOficina(path: string) {
  const { data, error } = await supabase!.storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}
