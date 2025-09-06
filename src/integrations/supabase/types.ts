export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      archivos: {
        Row: {
          created_at: string | null
          entrada_id: string | null
          hash: string | null
          id: string
          tipo: string
          url_privada: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entrada_id?: string | null
          hash?: string | null
          id?: string
          tipo: string
          url_privada: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entrada_id?: string | null
          hash?: string | null
          id?: string
          tipo?: string
          url_privada?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archivos_entrada_id_fkey"
            columns: ["entrada_id"]
            isOneToOne: false
            referencedRelation: "entradas"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas: {
        Row: {
          año: number | null
          ciudad: string | null
          color_hex: string | null
          confianza_modelo: number | null
          confianza_ubicacion: number | null
          created_at: string | null
          dia_semana: number | null
          emocion_principal: string | null
          emociones_secundarias: string[] | null
          emoji: string | null
          estado_validacion: string | null
          fecha: string
          fuente: string
          hash_archivo: string | null
          id: string
          intensidad: number | null
          lugar_nombre: string | null
          lugar_tipo: string | null
          mes: number | null
          origen_ubicacion: string | null
          pais: string | null
          region: string | null
          tags_comportamiento: string[] | null
          tags_tema: string[] | null
          texto_ocr: string | null
          ubicacion_lat: number | null
          ubicacion_lon: number | null
          user_id: string | null
          valencia: string | null
        }
        Insert: {
          año?: number | null
          ciudad?: string | null
          color_hex?: string | null
          confianza_modelo?: number | null
          confianza_ubicacion?: number | null
          created_at?: string | null
          dia_semana?: number | null
          emocion_principal?: string | null
          emociones_secundarias?: string[] | null
          emoji?: string | null
          estado_validacion?: string | null
          fecha?: string
          fuente: string
          hash_archivo?: string | null
          id?: string
          intensidad?: number | null
          lugar_nombre?: string | null
          lugar_tipo?: string | null
          mes?: number | null
          origen_ubicacion?: string | null
          pais?: string | null
          region?: string | null
          tags_comportamiento?: string[] | null
          tags_tema?: string[] | null
          texto_ocr?: string | null
          ubicacion_lat?: number | null
          ubicacion_lon?: number | null
          user_id?: string | null
          valencia?: string | null
        }
        Update: {
          año?: number | null
          ciudad?: string | null
          color_hex?: string | null
          confianza_modelo?: number | null
          confianza_ubicacion?: number | null
          created_at?: string | null
          dia_semana?: number | null
          emocion_principal?: string | null
          emociones_secundarias?: string[] | null
          emoji?: string | null
          estado_validacion?: string | null
          fecha?: string
          fuente?: string
          hash_archivo?: string | null
          id?: string
          intensidad?: number | null
          lugar_nombre?: string | null
          lugar_tipo?: string | null
          mes?: number | null
          origen_ubicacion?: string | null
          pais?: string | null
          region?: string | null
          tags_comportamiento?: string[] | null
          tags_tema?: string[] | null
          texto_ocr?: string | null
          ubicacion_lat?: number | null
          ubicacion_lon?: number | null
          user_id?: string | null
          valencia?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
