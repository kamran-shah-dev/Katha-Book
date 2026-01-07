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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_name: string
          address: string | null
          balance_status: Database["public"]["Enums"]["balance_status_type"]
          cell_no: string | null
          created_at: string
          id: string
          is_active: boolean
          limit_amount: number | null
          limit_status: Database["public"]["Enums"]["limit_status_type"]
          opening_balance: number
          remarks: string | null
          sub_head: Database["public"]["Enums"]["account_sub_head_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          address?: string | null
          balance_status?: Database["public"]["Enums"]["balance_status_type"]
          cell_no?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          limit_amount?: number | null
          limit_status?: Database["public"]["Enums"]["limit_status_type"]
          opening_balance?: number
          remarks?: string | null
          sub_head?: Database["public"]["Enums"]["account_sub_head_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          address?: string | null
          balance_status?: Database["public"]["Enums"]["balance_status_type"]
          cell_no?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          limit_amount?: number | null
          limit_status?: Database["public"]["Enums"]["limit_status_type"]
          opening_balance?: number
          remarks?: string | null
          sub_head?: Database["public"]["Enums"]["account_sub_head_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cashbook_entries: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          entry_date: string
          id: string
          is_deleted: boolean
          pay_status: Database["public"]["Enums"]["balance_status_type"]
          payment_detail: string | null
          remarks: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          created_at?: string
          entry_date?: string
          id?: string
          is_deleted?: boolean
          pay_status?: Database["public"]["Enums"]["balance_status_type"]
          payment_detail?: string | null
          remarks?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          entry_date?: string
          id?: string
          is_deleted?: boolean
          pay_status?: Database["public"]["Enums"]["balance_status_type"]
          payment_detail?: string | null
          remarks?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashbook_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      export_entries: {
        Row: {
          account_id: string | null
          amount: number | null
          bags_qty: number | null
          created_at: string
          entry_date: string
          export_no: number
          gd_no: string | null
          id: string
          is_deleted: boolean
          product_id: string | null
          rate_per_kg: number | null
          remarks: string | null
          total_weight: number | null
          updated_at: string
          user_id: string
          vehicle_numbers: string | null
          weight_per_bag: number | null
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          bags_qty?: number | null
          created_at?: string
          entry_date?: string
          export_no?: number
          gd_no?: string | null
          id?: string
          is_deleted?: boolean
          product_id?: string | null
          rate_per_kg?: number | null
          remarks?: string | null
          total_weight?: number | null
          updated_at?: string
          user_id: string
          vehicle_numbers?: string | null
          weight_per_bag?: number | null
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          bags_qty?: number | null
          created_at?: string
          entry_date?: string
          export_no?: number
          gd_no?: string | null
          id?: string
          is_deleted?: boolean
          product_id?: string | null
          rate_per_kg?: number | null
          remarks?: string | null
          total_weight?: number | null
          updated_at?: string
          user_id?: string
          vehicle_numbers?: string | null
          weight_per_bag?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "export_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_received: {
        Row: {
          account_id: string | null
          challan_difference: number | null
          commission: number | null
          created_at: string
          custom_tax: number | null
          entry_date: string
          expense_amount: number | null
          expense_name: string | null
          gd_no: string | null
          id: string
          is_deleted: boolean
          net_weight: number | null
          nlc_difference: number | null
          port_expenses: number | null
          product_id: string | null
          remarks: string | null
          serial_no: number
          shipment: string | null
          taftan_difference: number | null
          total_amount: number | null
          total_weight: number | null
          updated_at: string
          user_id: string
          vehicle_no: string | null
        }
        Insert: {
          account_id?: string | null
          challan_difference?: number | null
          commission?: number | null
          created_at?: string
          custom_tax?: number | null
          entry_date?: string
          expense_amount?: number | null
          expense_name?: string | null
          gd_no?: string | null
          id?: string
          is_deleted?: boolean
          net_weight?: number | null
          nlc_difference?: number | null
          port_expenses?: number | null
          product_id?: string | null
          remarks?: string | null
          serial_no?: number
          shipment?: string | null
          taftan_difference?: number | null
          total_amount?: number | null
          total_weight?: number | null
          updated_at?: string
          user_id: string
          vehicle_no?: string | null
        }
        Update: {
          account_id?: string | null
          challan_difference?: number | null
          commission?: number | null
          created_at?: string
          custom_tax?: number | null
          entry_date?: string
          expense_amount?: number | null
          expense_name?: string | null
          gd_no?: string | null
          id?: string
          is_deleted?: boolean
          net_weight?: number | null
          nlc_difference?: number | null
          port_expenses?: number | null
          product_id?: string | null
          remarks?: string | null
          serial_no?: number
          shipment?: string | null
          taftan_difference?: number | null
          total_amount?: number | null
          total_weight?: number | null
          updated_at?: string
          user_id?: string
          vehicle_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_received_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_received_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number | null
          bags_qty: number | null
          created_at: string
          id: string
          invoice_id: string
          product_id: string | null
          product_name: string | null
          rate_per_kg: number | null
          sort_order: number | null
          total_weight: number | null
          weight_per_bag: number | null
        }
        Insert: {
          amount?: number | null
          bags_qty?: number | null
          created_at?: string
          id?: string
          invoice_id: string
          product_id?: string | null
          product_name?: string | null
          rate_per_kg?: number | null
          sort_order?: number | null
          total_weight?: number | null
          weight_per_bag?: number | null
        }
        Update: {
          amount?: number | null
          bags_qty?: number | null
          created_at?: string
          id?: string
          invoice_id?: string
          product_id?: string | null
          product_name?: string | null
          rate_per_kg?: number | null
          sort_order?: number | null
          total_weight?: number | null
          weight_per_bag?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          account_id: string | null
          created_at: string
          gd_no: string | null
          id: string
          invoice_date: string
          invoice_no: number
          is_deleted: boolean
          net_pay: number | null
          remarks: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
          vehicle_numbers: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          gd_no?: string | null
          id?: string
          invoice_date?: string
          invoice_no?: number
          is_deleted?: boolean
          net_pay?: number | null
          remarks?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
          vehicle_numbers?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string
          gd_no?: string | null
          id?: string
          invoice_date?: string
          invoice_no?: number
          is_deleted?: boolean
          net_pay?: number | null
          remarks?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          vehicle_numbers?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_id: string
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          detail: string | null
          entry_date: string
          id: string
          is_deleted: boolean
          reference_id: string | null
          reference_type: string | null
          remarks: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          detail?: string | null
          entry_date?: string
          id?: string
          is_deleted?: boolean
          reference_id?: string | null
          reference_type?: string | null
          remarks?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          detail?: string | null
          entry_date?: string
          id?: string
          is_deleted?: boolean
          reference_id?: string | null
          reference_type?: string | null
          remarks?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
          vehicle_no: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
          vehicle_no: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
          vehicle_no?: string
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
      account_sub_head_type:
        | "BANKS"
        | "DOLLAR_LEDGERS"
        | "EXPORT_PARTIES"
        | "IMPORT_PARTIES"
        | "NLC_TAFTAN_EXPENSE_LEDGERS"
        | "PERSONALS"
      balance_status_type: "CREDIT" | "DEBIT"
      limit_status_type: "UNLIMITED" | "LIMITED"
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
    Enums: {
      account_sub_head_type: [
        "BANKS",
        "DOLLAR_LEDGERS",
        "EXPORT_PARTIES",
        "IMPORT_PARTIES",
        "NLC_TAFTAN_EXPENSE_LEDGERS",
        "PERSONALS",
      ],
      balance_status_type: ["CREDIT", "DEBIT"],
      limit_status_type: ["UNLIMITED", "LIMITED"],
    },
  },
} as const
