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
      almacenes: {
        Row: {
          activo: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          descripcion: string | null
          es_principal: boolean
          id: string
          nombre: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          es_principal?: boolean
          id?: string
          nombre: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          es_principal?: boolean
          id?: string
          nombre?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
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
      equivalencias: {
        Row: {
          created_at: string
          created_by: string | null
          factor: number
          id: string
          insumo_id: string
          unidad_desde: string
          unidad_hacia: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          factor: number
          id?: string
          insumo_id: string
          unidad_desde: string
          unidad_hacia: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          factor?: number
          id?: string
          insumo_id?: string
          unidad_desde?: string
          unidad_hacia?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equivalencias_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equivalencias_unidad_desde_fkey"
            columns: ["unidad_desde"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equivalencias_unidad_hacia_fkey"
            columns: ["unidad_hacia"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          es_demo: boolean
          estado: "borrador" | "en_revision" | "publicado" | "archivado"
          id: string
          orden: number
          pregunta: string
          respuesta: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          orden?: number
          pregunta: string
          respuesta: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          orden?: number
          pregunta?: string
          respuesta?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      galeria: {
        Row: {
          alt: string
          categoria: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          es_demo: boolean
          estado: "borrador" | "en_revision" | "publicado" | "archivado"
          id: string
          orden: number
          ruta: string
          titulo: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alt: string
          categoria: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          orden?: number
          ruta: string
          titulo?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alt?: string
          categoria?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          orden?: number
          ruta?: string
          titulo?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      guias: {
        Row: {
          contenido: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          es_demo: boolean
          estado: "borrador" | "en_revision" | "publicado" | "archivado"
          id: string
          imagen_url: string | null
          orden: number
          resumen: string | null
          slug: string
          titulo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          contenido: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          imagen_url?: string | null
          orden?: number
          resumen?: string | null
          slug: string
          titulo: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          contenido?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          imagen_url?: string | null
          orden?: number
          resumen?: string | null
          slug?: string
          titulo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      insumos: {
        Row: {
          activo: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          descripcion: string | null
          es_demo: boolean
          es_perecible: boolean
          id: string
          imagen_url: string | null
          nombre: string
          presentacion: string | null
          proveedor_habitual_id: string | null
          stock_minimo: number
          unidad_base_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          es_demo?: boolean
          es_perecible?: boolean
          id?: string
          imagen_url?: string | null
          nombre: string
          presentacion?: string | null
          proveedor_habitual_id?: string | null
          stock_minimo?: number
          unidad_base_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          es_demo?: boolean
          es_perecible?: boolean
          id?: string
          imagen_url?: string | null
          nombre?: string
          presentacion?: string | null
          proveedor_habitual_id?: string | null
          stock_minimo?: number
          unidad_base_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insumos_proveedor_habitual_id_fkey"
            columns: ["proveedor_habitual_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insumos_unidad_base_id_fkey"
            columns: ["unidad_base_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes_insumo: {
        Row: {
          codigo: string | null
          created_at: string
          created_by: string | null
          fecha_vencimiento: string | null
          id: string
          insumo_id: string
          observacion: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          fecha_vencimiento?: string | null
          id?: string
          insumo_id: string
          observacion?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          fecha_vencimiento?: string | null
          id?: string
          insumo_id?: string
          observacion?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lotes_insumo_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_insumo: {
        Row: {
          almacen_id: string
          area_turno: string | null
          autorizado_por: string | null
          cantidad: number
          cantidad_base: number
          costo_total: number | null
          created_at: string
          created_by: string | null
          destino_lote: string | null
          documento_numero: string | null
          documento_tipo: string | null
          id: string
          insumo_id: string
          lote_id: string | null
          motivo_baja:
            | "merma"
            | "vencimiento"
            | "danado"
            | "devolucion_proveedor"
            | "consumo_interno"
            | null
          observacion: string | null
          ocurrido_en: string
          origen_consumo: "produccion" | "retiro_directo" | null
          precio_unitario: number | null
          proveedor_id: string | null
          responsable_id: string
          secuencia: number
          tipo: "ingreso" | "consumo" | "baja"
          unidad_id: string
        }
        Insert: {
          almacen_id: string
          area_turno?: string | null
          autorizado_por?: string | null
          cantidad: number
          cantidad_base: number
          costo_total?: number | null
          created_at?: string
          created_by?: string | null
          destino_lote?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          id?: string
          insumo_id: string
          lote_id?: string | null
          motivo_baja?:
            | "merma"
            | "vencimiento"
            | "danado"
            | "devolucion_proveedor"
            | "consumo_interno"
            | null
          observacion?: string | null
          ocurrido_en?: string
          origen_consumo?: "produccion" | "retiro_directo" | null
          precio_unitario?: number | null
          proveedor_id?: string | null
          responsable_id: string
          secuencia?: never
          tipo: "ingreso" | "consumo" | "baja"
          unidad_id: string
        }
        Update: {
          almacen_id?: string
          area_turno?: string | null
          autorizado_por?: string | null
          cantidad?: number
          cantidad_base?: number
          costo_total?: number | null
          created_at?: string
          created_by?: string | null
          destino_lote?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          id?: string
          insumo_id?: string
          lote_id?: string | null
          motivo_baja?:
            | "merma"
            | "vencimiento"
            | "danado"
            | "devolucion_proveedor"
            | "consumo_interno"
            | null
          observacion?: string | null
          ocurrido_en?: string
          origen_consumo?: "produccion" | "retiro_directo" | null
          precio_unitario?: number | null
          proveedor_id?: string | null
          responsable_id?: string
          secuencia?: never
          tipo?: "ingreso" | "consumo" | "baja"
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_insumo_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_insumo_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_insumo_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes_insumo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_insumo_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_insumo_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      novedades: {
        Row: {
          aprobada_en: string | null
          aprobada_por: string | null
          contenido: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          es_demo: boolean
          estado: "borrador" | "en_revision" | "publicado" | "archivado"
          id: string
          imagen_url: string | null
          resumen: string | null
          slug: string
          tipo: "promocion" | "nuevo_producto" | "campania" | "evento" | "aviso"
          titulo: string
          updated_at: string
          updated_by: string | null
          vigencia_fin: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          aprobada_en?: string | null
          aprobada_por?: string | null
          contenido: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          imagen_url?: string | null
          resumen?: string | null
          slug: string
          tipo: "promocion" | "nuevo_producto" | "campania" | "evento" | "aviso"
          titulo: string
          updated_at?: string
          updated_by?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          aprobada_en?: string | null
          aprobada_por?: string | null
          contenido?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          imagen_url?: string | null
          resumen?: string | null
          slug?: string
          tipo?:
            | "promocion"
            | "nuevo_producto"
            | "campania"
            | "evento"
            | "aviso"
          titulo?: string
          updated_at?: string
          updated_by?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
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
      proveedores: {
        Row: {
          activo: boolean
          contacto: string | null
          correo: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          direccion: string | null
          id: string
          nombre: string
          observacion: string | null
          telefono: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activo?: boolean
          contacto?: string | null
          correo?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          direccion?: string | null
          id?: string
          nombre: string
          observacion?: string | null
          telefono?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activo?: boolean
          contacto?: string | null
          correo?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          direccion?: string | null
          id?: string
          nombre?: string
          observacion?: string | null
          telefono?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
      saldos_insumo: {
        Row: {
          actualizado_en: string
          almacen_id: string
          cantidad_base: number
          insumo_id: string
        }
        Insert: {
          actualizado_en?: string
          almacen_id: string
          cantidad_base?: number
          insumo_id: string
        }
        Update: {
          actualizado_en?: string
          almacen_id?: string
          cantidad_base?: number
          insumo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saldos_insumo_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saldos_insumo_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      slides: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          enlace_url: string | null
          es_demo: boolean
          estado: "borrador" | "en_revision" | "publicado" | "archivado"
          id: string
          imagen_alt: string | null
          imagen_movil_url: string | null
          imagen_url: string
          orden: number
          subtitulo: string | null
          texto_boton: string | null
          titulo: string
          updated_at: string
          updated_by: string | null
          vigencia_fin: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          enlace_url?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          imagen_alt?: string | null
          imagen_movil_url?: string | null
          imagen_url: string
          orden?: number
          subtitulo?: string | null
          texto_boton?: string | null
          titulo: string
          updated_at?: string
          updated_by?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          enlace_url?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          imagen_alt?: string | null
          imagen_movil_url?: string | null
          imagen_url?: string
          orden?: number
          subtitulo?: string | null
          texto_boton?: string | null
          titulo?: string
          updated_at?: string
          updated_by?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: []
      }
      testimonios: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          es_demo: boolean
          estado: "borrador" | "en_revision" | "publicado" | "archivado"
          id: string
          nombre: string
          orden: number
          procedencia: string | null
          texto: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          nombre: string
          orden?: number
          procedencia?: string | null
          texto: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          es_demo?: boolean
          estado?: "borrador" | "en_revision" | "publicado" | "archivado"
          id?: string
          nombre?: string
          orden?: number
          procedencia?: string | null
          texto?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      unidades_medida: {
        Row: {
          codigo: string
          created_at: string
          es_base: boolean
          id: string
          nombre: string
          tipo: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          es_base?: boolean
          id?: string
          nombre: string
          tipo: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          es_base?: boolean
          id?: string
          nombre?: string
          tipo?: string
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

