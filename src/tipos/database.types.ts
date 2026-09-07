export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categorias_producto: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          descripcion: string | null
          estado: "borrador" | "en_revision" | "publicado" | "archivado"
          id: string
          imagen_url: string | null
          nombre: string
          orden: number
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          imagen_url?: string | null
          nombre: string
          orden?: number
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          imagen_url?: string | null
          nombre?: string
          orden?: number
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      configuracion_sitio: {
        Row: {
          clave: string
          descripcion: string
          es_publico: boolean
          grupo: string
          orden: number
          updated_at: string
          updated_by: string | null
          valor: Json
        }
        Insert: {
          clave: string
          descripcion: string
          es_publico?: boolean
          grupo: string
          orden?: number
          updated_at?: string
          updated_by?: string | null
          valor: Json
        }
        Update: {
          clave?: string
          descripcion?: string
          es_publico?: boolean
          grupo?: string
          orden?: number
          updated_at?: string
          updated_by?: string | null
          valor?: Json
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          activo: boolean
          celular: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          nombre_completo: string
          rol: "superadmin" | "administrador" | "ingeniero" | "repartidor"
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activo?: boolean
          celular?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id: string
          nombre_completo: string
          rol: "superadmin" | "administrador" | "ingeniero" | "repartidor"
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activo?: boolean
          celular?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          nombre_completo?: string
          rol?: "superadmin" | "administrador" | "ingeniero" | "repartidor"
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_rol_fkey"
            columns: ["rol"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["codigo"]
          },
        ]
      }
      precio_historial: {
        Row: {
          id: number
          moneda: string
          precio: number
          registrado_por: string | null
          variante_id: string
          vigente_desde: string
        }
        Insert: {
          id?: never
          moneda?: string
          precio: number
          registrado_por?: string | null
          variante_id: string
          vigente_desde?: string
        }
        Update: {
          id?: never
          moneda?: string
          precio?: number
          registrado_por?: string | null
          variante_id?: string
          vigente_desde?: string
        }
        Relationships: [
          {
            foreignKeyName: "precio_historial_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "producto_variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      producto_imagenes: {
        Row: {
          alt: string | null
          created_at: string
          created_by: string | null
          es_principal: boolean
          id: string
          orden: number
          producto_id: string
          ruta: string
          updated_at: string
          updated_by: string | null
          variante_id: string | null
        }
        Insert: {
          alt?: string | null
          created_at?: string
          created_by?: string | null
          es_principal?: boolean
          id?: string
          orden?: number
          producto_id: string
          ruta: string
          updated_at?: string
          updated_by?: string | null
          variante_id?: string | null
        }
        Update: {
          alt?: string | null
          created_at?: string
          created_by?: string | null
          es_principal?: boolean
          id?: string
          orden?: number
          producto_id?: string
          ruta?: string
          updated_at?: string
          updated_by?: string | null
          variante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producto_imagenes_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producto_imagenes_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "producto_variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      producto_variantes: {
        Row: {
          activo: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          es_predeterminada: boolean
          id: string
          moneda: string
          nombre: string
          orden: number
          peso_gramos: number | null
          precio: number
          producto_id: string
          sku: string | null
          stock_disponible: number | null
          unidad_venta: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_predeterminada?: boolean
          id?: string
          moneda?: string
          nombre: string
          orden?: number
          peso_gramos?: number | null
          precio: number
          producto_id: string
          sku?: string | null
          stock_disponible?: number | null
          unidad_venta?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_predeterminada?: boolean
          id?: string
          moneda?: string
          nombre?: string
          orden?: number
          peso_gramos?: number | null
          precio?: number
          producto_id?: string
          sku?: string | null
          stock_disponible?: number | null
          unidad_venta?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producto_variantes_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          descripcion: string | null
          destacado: boolean
          es_demo: boolean
          estado: "borrador" | "en_revision" | "publicado" | "archivado"
          id: string
          nombre: string
          orden: number
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          categoria_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          destacado?: boolean
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          nombre: string
          orden?: number
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          categoria_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          destacado?: boolean
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          nombre?: string
          orden?: number
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_producto"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          codigo: "superadmin" | "administrador" | "ingeniero" | "repartidor"
          created_at: string
          descripcion: string
          nombre: string
          orden: number
          updated_at: string
        }
        Insert: {
          codigo: "superadmin" | "administrador" | "ingeniero" | "repartidor"
          created_at?: string
          descripcion: string
          nombre: string
          orden?: number
          updated_at?: string
        }
        Update: {
          codigo?: "superadmin" | "administrador" | "ingeniero" | "repartidor"
          created_at?: string
          descripcion?: string
          nombre?: string
          orden?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      auditoria: {
        Row: {
          datos_antes: Json | null
          datos_despues: Json | null
          id: number | null
          ocurrido_en: string | null
          operacion: string | null
          registro_id: string | null
          rol: string | null
          tabla: string | null
          usuario_correo: string | null
          usuario_id: string | null
          usuario_nombre: string | null
        }
        Relationships: []
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

