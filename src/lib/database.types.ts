export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Farmers table
      farmers: {
        Row: {
          id: string
          display_id: number
          nombre_completo: string | null
          cedula: string | null
          rif: string | null
          telefono: string | null
          email: string | null
          direccion: string | null
          risk: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          display_id?: number
          nombre_completo?: string | null
          cedula?: string | null
          rif?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          risk?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          display_id?: number
          nombre_completo?: string | null
          cedula?: string | null
          rif?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          risk?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }

      // Users table (for auth)
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'operador' | 'productor'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role: 'admin' | 'operador' | 'productor'
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'operador' | 'productor'
          created_at?: string
          updated_at?: string | null
        }
      }

      // Parcelas table
      parcelas: {
        Row: {
          id: string
          display_id: number
          farmer_id: string
          nombre: string
          area: number
          cultivo: string
          estado: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          display_id?: number
          farmer_id: string
          nombre: string
          area: number
          cultivo: string
          estado: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          display_id?: number
          farmer_id?: string
          nombre?: string
          area?: number
          cultivo?: string
          estado?: string
          created_at?: string
          updated_at?: string | null
        }
      }

      // Add other tables as needed
    }
  }
}
