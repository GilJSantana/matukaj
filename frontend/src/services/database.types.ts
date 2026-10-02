
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "auditoria": {
                  Row: {
                    "acao": string,"created_at": string,"dados_anteriores": Json | null,"id": number,"registro_id": number,"tabela": string,"usuario_id": string | null
                  }
                  Insert: {
                    "acao": string,"created_at"?: string,"dados_anteriores"?: Json | null,"id"?: never,"registro_id": number,"tabela": string,"usuario_id"?: string | null
                  }
                  Update: {
                    "acao"?: string,"created_at"?: string,"dados_anteriores"?: Json | null,"id"?: never,"registro_id"?: number,"tabela"?: string,"usuario_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"catalogo_servicos": {
                  Row: {
                    "ativo": boolean,"descricao": string,"id": number,"valor_sugerido": number
                  }
                  Insert: {
                    "ativo"?: boolean,"descricao": string,"id"?: never,"valor_sugerido"?: number
                  }
                  Update: {
                    "ativo"?: boolean,"descricao"?: string,"id"?: never,"valor_sugerido"?: number
                  }
                  Relationships: [
                    
                  ]
                },"checklist_modelos": {
                  Row: {
                    "ativo": boolean,"created_at": string,"definicao": NonNullable<Json>,"id": number,"versao": number
                  }
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"definicao": NonNullable<Json>,"id"?: never,"versao": number
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"definicao"?: NonNullable<Json>,"id"?: never,"versao"?: number
                  }
                  Relationships: [
                    
                  ]
                },"clientes": {
                  Row: {
                    "cpf_cnpj": string | null,"created_at": string,"data_nascimento": string | null,"email": string | null,"endereco": string | null,"id": number,"nome": string,"telefone": string | null
                  }
                  Insert: {
                    "cpf_cnpj"?: string | null,"created_at"?: string,"data_nascimento"?: string | null,"email"?: string | null,"endereco"?: string | null,"id"?: never,"nome": string,"telefone"?: string | null
                  }
                  Update: {
                    "cpf_cnpj"?: string | null,"created_at"?: string,"data_nascimento"?: string | null,"email"?: string | null,"endereco"?: string | null,"id"?: never,"nome"?: string,"telefone"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"garantias": {
                  Row: {
                    "condicoes": string | null,"emitida_em": string,"id": number,"km_limite": number | null,"ordem_servico_id": number,"pdf_path": string | null,"prazo_dias": number
                  }
                  Insert: {
                    "condicoes"?: string | null,"emitida_em"?: string,"id"?: never,"km_limite"?: number | null,"ordem_servico_id": number,"pdf_path"?: string | null,"prazo_dias": number
                  }
                  Update: {
                    "condicoes"?: string | null,"emitida_em"?: string,"id"?: never,"km_limite"?: number | null,"ordem_servico_id"?: number,"pdf_path"?: string | null,"prazo_dias"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "garantias_ordem_servico_id_fkey"
      columns: ["ordem_servico_id"]
isOneToOne: false
      referencedRelation: "ordens_servico"
      referencedColumns: ["id"]
    }
                  ]
                },"itens_os": {
                  Row: {
                    "descricao": string,"id": number,"ordem_servico_id": number,"quantidade": number,"servico_id": number | null,"valor_unitario": number
                  }
                  Insert: {
                    "descricao": string,"id"?: never,"ordem_servico_id": number,"quantidade"?: number,"servico_id"?: number | null,"valor_unitario": number
                  }
                  Update: {
                    "descricao"?: string,"id"?: never,"ordem_servico_id"?: number,"quantidade"?: number,"servico_id"?: number | null,"valor_unitario"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "itens_os_ordem_servico_id_fkey"
      columns: ["ordem_servico_id"]
isOneToOne: false
      referencedRelation: "ordens_servico"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "itens_os_servico_id_fkey"
      columns: ["servico_id"]
isOneToOne: false
      referencedRelation: "catalogo_servicos"
      referencedColumns: ["id"]
    }
                  ]
                },"ordens_servico": {
                  Row: {
                    "aberta_em": string,"cliente_id": number,"concluida_em": string | null,"created_by": string | null,"id": number,"km_entrada": number | null,"pdf_path": string | null,"status": Database["public"]['Enums']["os_status"],"veiculo_id": number
                  }
                  Insert: {
                    "aberta_em"?: string,"cliente_id": number,"concluida_em"?: string | null,"created_by"?: string | null,"id"?: never,"km_entrada"?: number | null,"pdf_path"?: string | null,"status"?: Database["public"]['Enums']["os_status"],"veiculo_id": number
                  }
                  Update: {
                    "aberta_em"?: string,"cliente_id"?: number,"concluida_em"?: string | null,"created_by"?: string | null,"id"?: never,"km_entrada"?: number | null,"pdf_path"?: string | null,"status"?: Database["public"]['Enums']["os_status"],"veiculo_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "ordens_servico_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordens_servico_veiculo_id_fkey"
      columns: ["veiculo_id"]
isOneToOne: false
      referencedRelation: "veiculos"
      referencedColumns: ["id"]
    }
                  ]
                },"perfis": {
                  Row: {
                    "ativo": boolean,"id": string,"nome": string,"papel": Database["public"]['Enums']["papel_usuario"]
                  }
                  Insert: {
                    "ativo"?: boolean,"id": string,"nome": string,"papel": Database["public"]['Enums']["papel_usuario"]
                  }
                  Update: {
                    "ativo"?: boolean,"id"?: string,"nome"?: string,"papel"?: Database["public"]['Enums']["papel_usuario"]
                  }
                  Relationships: [
                    
                  ]
                },"veiculos": {
                  Row: {
                    "ano": number | null,"chassi": string | null,"cliente_id": number,"cor": string | null,"created_at": string,"id": number,"marca": string | null,"modelo": string | null,"numero_motor": string | null,"placa": string
                  }
                  Insert: {
                    "ano"?: number | null,"chassi"?: string | null,"cliente_id": number,"cor"?: string | null,"created_at"?: string,"id"?: never,"marca"?: string | null,"modelo"?: string | null,"numero_motor"?: string | null,"placa": string
                  }
                  Update: {
                    "ano"?: number | null,"chassi"?: string | null,"cliente_id"?: number,"cor"?: string | null,"created_at"?: string,"id"?: never,"marca"?: string | null,"modelo"?: string | null,"numero_motor"?: string | null,"placa"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "veiculos_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    }
                  ]
                },"vistorias": {
                  Row: {
                    "avarias": NonNullable<Json>,"checklist": NonNullable<Json>,"checklist_modelo_id": number,"id": number,"nivel_combustivel": number | null,"observacoes": string | null,"ordem_servico_id": number,"realizada_em": string,"realizada_por": string | null
                  }
                  Insert: {
                    "avarias"?: NonNullable<Json>,"checklist"?: NonNullable<Json>,"checklist_modelo_id": number,"id"?: never,"nivel_combustivel"?: number | null,"observacoes"?: string | null,"ordem_servico_id": number,"realizada_em"?: string,"realizada_por"?: string | null
                  }
                  Update: {
                    "avarias"?: NonNullable<Json>,"checklist"?: NonNullable<Json>,"checklist_modelo_id"?: number,"id"?: never,"nivel_combustivel"?: number | null,"observacoes"?: string | null,"ordem_servico_id"?: number,"realizada_em"?: string,"realizada_por"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "vistorias_checklist_modelo_id_fkey"
      columns: ["checklist_modelo_id"]
isOneToOne: false
      referencedRelation: "checklist_modelos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "vistorias_ordem_servico_id_fkey"
      columns: ["ordem_servico_id"]
isOneToOne: true
      referencedRelation: "ordens_servico"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "aniversariantes_do_dia":
{ Args: Record<PropertyKey, never>; Returns: {
              "cpf_cnpj": string | null,
"created_at": string,
"data_nascimento": string | null,
"email": string | null,
"endereco": string | null,
"id": number,
"nome": string,
"telefone": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "clientes"
        isOneToOne: false
        isSetofReturn: true
      } },
"buscar_clientes":
{ Args: { "termo": string }; Returns: {
              "cpf_cnpj": string | null,
"created_at": string,
"data_nascimento": string | null,
"email": string | null,
"endereco": string | null,
"id": number,
"nome": string,
"telefone": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "clientes"
        isOneToOne: false
        isSetofReturn: true
      } },
"expurgar_auditoria":
{ Args: { "retencao"?: string }; Returns: number
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"registrar_vistoria":
{ Args: { "avarias": Json,"checklist": Json,"checklist_modelo_id": number,"km_entrada"?: number,"nivel_combustivel"?: number,"observacoes"?: string,"veiculo_id": number }; Returns: number
                           },
"usuario_ativo":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            "os_status": "orcamento"|"aprovada"|"em_execucao"|"concluida"|"entregue"|"cancelada","papel_usuario": "admin"|"atendente"|"mecanico"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "os_status": ["orcamento", "aprovada", "em_execucao", "concluida", "entregue", "cancelada"],"papel_usuario": ["admin", "atendente", "mecanico"]
          }
        }
} as const
