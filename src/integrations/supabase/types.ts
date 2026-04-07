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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          balance: number
          created_at: string
          id: number
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          balance?: number
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          balance?: number
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collaborator_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          collaborator_id: number
          created_at: string
          id: number
          section: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          collaborator_id: number
          created_at?: string
          id?: number
          section: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          collaborator_id?: number
          created_at?: string
          id?: number
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
      collaborators: {
        Row: {
          created_at: string
          email: string
          id: number
          invite_token: string | null
          name: string | null
          owner_id: string
          status: Database["public"]["Enums"]["collaborator_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          invite_token?: string | null
          name?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["collaborator_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          invite_token?: string | null
          name?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["collaborator_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      debtor_payments: {
        Row: {
          account_id: number | null
          amount: number
          created_at: string
          date: string
          debtor_id: number
          id: number
          notes: string | null
          user_id: string
        }
        Insert: {
          account_id?: number | null
          amount: number
          created_at?: string
          date: string
          debtor_id: number
          id?: number
          notes?: string | null
          user_id: string
        }
        Update: {
          account_id?: number | null
          amount?: number
          created_at?: string
          date?: string
          debtor_id?: number
          id?: number
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      debtors: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: number
          name: string
          paid_amount: number
          remaining_amount: number
          status: Database["public"]["Enums"]["debtor_status"]
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: number
          name: string
          paid_amount?: number
          remaining_amount: number
          status?: Database["public"]["Enums"]["debtor_status"]
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: number
          name?: string
          paid_amount?: number
          remaining_amount?: number
          status?: Database["public"]["Enums"]["debtor_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account_id: number | null
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          date: string
          description: string
          due_date: string | null
          id: number
          is_paid: boolean
          is_recurring: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: number | null
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date: string
          description: string
          due_date?: string | null
          id?: number
          is_paid?: boolean
          is_recurring?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: number | null
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          description?: string
          due_date?: string | null
          id?: number
          is_paid?: boolean
          is_recurring?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_returns: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: number
          investment_id: number
          type: Database["public"]["Enums"]["return_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: number
          investment_id: number
          type: Database["public"]["Enums"]["return_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: number
          investment_id?: number
          type?: Database["public"]["Enums"]["return_type"]
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          administrator: string | null
          code: string
          created_at: string
          current_price: number | null
          dy_percent: number | null
          id: number
          is_active: boolean
          name: string | null
          purchase_date: string
          purchase_price: number
          sale_date: string | null
          sale_price: number | null
          shares: number
          type: Database["public"]["Enums"]["investment_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          administrator?: string | null
          code: string
          created_at?: string
          current_price?: number | null
          dy_percent?: number | null
          id?: number
          is_active?: boolean
          name?: string | null
          purchase_date: string
          purchase_price: number
          sale_date?: string | null
          sale_price?: number | null
          shares?: number
          type: Database["public"]["Enums"]["investment_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          administrator?: string | null
          code?: string
          created_at?: string
          current_price?: number | null
          dy_percent?: number | null
          id?: number
          is_active?: boolean
          name?: string | null
          purchase_date?: string
          purchase_price?: number
          sale_date?: string | null
          sale_price?: number | null
          shares?: number
          type?: Database["public"]["Enums"]["investment_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_components: {
        Row: {
          cost: number
          created_at: string
          id: number
          name: string
          product_id: number
          quantity: number
        }
        Insert: {
          cost: number
          created_at?: string
          id?: number
          name: string
          product_id: number
          quantity?: number
        }
        Update: {
          cost?: number
          created_at?: string
          id?: number
          name?: string
          product_id?: number
          quantity?: number
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          id: number
          product_id: number
          storage_path: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          product_id: number
          storage_path: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: number
          product_id?: number
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_kit_items: {
        Row: {
          created_at: string
          id: number
          kit_id: number
          product_id: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: number
          kit_id: number
          product_id: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: number
          kit_id?: number
          product_id?: number
          quantity?: number
        }
        Relationships: []
      }
      product_kits: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          profit: number
          profit_margin: number
          sale_price: number
          total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          profit?: number
          profit_margin?: number
          sale_price: number
          total_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          profit?: number
          profit_margin?: number
          sale_price?: number
          total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          cost: number
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          is_testing: boolean
          minimum_stock: number
          name: string
          profit: number
          profit_margin: number
          quantity: number
          sale_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          cost: number
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_testing?: boolean
          minimum_stock?: number
          name: string
          profit: number
          profit_margin: number
          quantity?: number
          sale_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_testing?: boolean
          minimum_stock?: number
          name?: string
          profit?: number
          profit_margin?: number
          quantity?: number
          sale_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_signed_in: string
          login_method: string | null
          name: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          last_signed_in?: string
          login_method?: string | null
          name?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_signed_in?: string
          login_method?: string | null
          name?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          account_id: number | null
          amount: number
          created_at: string
          date: string
          description: string
          due_date: string | null
          id: number
          notes: string | null
          paid_date: string | null
          status: Database["public"]["Enums"]["purchase_status"]
          supplier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: number | null
          amount: number
          created_at?: string
          date: string
          description: string
          due_date?: string | null
          id?: number
          notes?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: number | null
          amount?: number
          created_at?: string
          date?: string
          description?: string
          due_date?: string | null
          id?: number
          notes?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          description: string
          id: number
          product_id: number | null
          quantity: number
          sale_id: number
          total_cost: number
          total_price: number
          unit_cost: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: number
          product_id?: number | null
          quantity?: number
          sale_id: number
          total_cost?: number
          total_price: number
          unit_cost?: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: number
          product_id?: number | null
          quantity?: number
          sale_id?: number
          total_cost?: number
          total_price?: number
          unit_cost?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          account_id: number | null
          amount: number
          cost: number
          created_at: string
          customer_name: string | null
          date: string
          description: string
          id: number
          product_id: number | null
          profit: number
          source: Database["public"]["Enums"]["sale_source"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: number | null
          amount: number
          cost?: number
          created_at?: string
          customer_name?: string | null
          date: string
          description: string
          id?: number
          product_id?: number | null
          profit?: number
          source: Database["public"]["Enums"]["sale_source"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: number | null
          amount?: number
          cost?: number
          created_at?: string
          customer_name?: string | null
          date?: string
          description?: string
          id?: number
          product_id?: number | null
          profit?: number
          source?: Database["public"]["Enums"]["sale_source"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_order_items: {
        Row: {
          amount: number
          cost: number
          created_at: string
          description: string
          id: number
          is_completed: boolean
          item_code: string
          item_number: number
          profit: number
          service_order_id: number
          service_type: Database["public"]["Enums"]["service_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          cost?: number
          created_at?: string
          description: string
          id?: number
          is_completed?: boolean
          item_code: string
          item_number: number
          profit?: number
          service_order_id: number
          service_type: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          cost?: number
          created_at?: string
          description?: string
          id?: number
          is_completed?: boolean
          item_code?: string
          item_number?: number
          profit?: number
          service_order_id?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_name: string
          entry_date: string
          exit_date: string | null
          expected_delivery_date: string | null
          id: number
          notes: string | null
          os_number: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          total_cost: number
          total_profit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_name: string
          entry_date: string
          exit_date?: string | null
          expected_delivery_date?: string | null
          id?: number
          notes?: string | null
          os_number: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          total_cost?: number
          total_profit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          entry_date?: string
          exit_date?: string | null
          expected_delivery_date?: string | null
          id?: number
          notes?: string | null
          os_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          total_cost?: number
          total_profit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          account_id: number | null
          amount: number | null
          cost: number
          created_at: string
          customer_name: string | null
          date: string
          description: string
          id: number
          os_number: string | null
          profit: number
          serial_number: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: Database["public"]["Enums"]["order_status"]
          storage_location: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: number | null
          amount?: number | null
          cost?: number
          created_at?: string
          customer_name?: string | null
          date: string
          description: string
          id?: number
          os_number?: string | null
          profit?: number
          serial_number?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: Database["public"]["Enums"]["order_status"]
          storage_location?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: number | null
          amount?: number | null
          cost?: number
          created_at?: string
          customer_name?: string | null
          date?: string
          description?: string
          id?: number
          os_number?: string | null
          profit?: number
          serial_number?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: Database["public"]["Enums"]["order_status"]
          storage_location?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_payments: {
        Row: {
          account_id: number
          amount: number
          created_at: string
          date: string
          id: number
          notes: string | null
          supplier_name: string
          user_id: string
        }
        Insert: {
          account_id: number
          amount: number
          created_at?: string
          date: string
          id?: number
          notes?: string | null
          supplier_name: string
          user_id: string
        }
        Update: {
          account_id?: number
          amount?: number
          created_at?: string
          date?: string
          id?: number
          notes?: string | null
          supplier_name?: string
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: number
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: number
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: number
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: number
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string
          id: number
          is_personal: boolean
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: number
          amount: number
          category?: string | null
          created_at?: string
          date: string
          description: string
          id?: number
          is_personal?: boolean
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: number
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: number
          is_personal?: boolean
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
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
      account_type: "checking" | "savings" | "investment" | "cash"
      collaborator_status: "pending" | "active" | "inactive"
      debtor_status: "pending" | "partial" | "paid"
      expense_category:
        | "casa"
        | "still"
        | "fixas"
        | "mercado"
        | "superfluos"
        | "outras"
      investment_type: "fii" | "stock" | "fund" | "fixed_income"
      order_status: "open" | "completed"
      purchase_status: "pending" | "paid"
      return_type: "dividend" | "interest" | "rent"
      sale_source:
        | "shopee"
        | "mp_edgar"
        | "mp_emerson"
        | "direct"
        | "debtor"
        | "other"
      service_type: "no_repair" | "repaired" | "test" | "pending"
      transaction_type: "income" | "expense"
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
      account_type: ["checking", "savings", "investment", "cash"],
      collaborator_status: ["pending", "active", "inactive"],
      debtor_status: ["pending", "partial", "paid"],
      expense_category: [
        "casa",
        "still",
        "fixas",
        "mercado",
        "superfluos",
        "outras",
      ],
      investment_type: ["fii", "stock", "fund", "fixed_income"],
      order_status: ["open", "completed"],
      purchase_status: ["pending", "paid"],
      return_type: ["dividend", "interest", "rent"],
      sale_source: [
        "shopee",
        "mp_edgar",
        "mp_emerson",
        "direct",
        "debtor",
        "other",
      ],
      service_type: ["no_repair", "repaired", "test", "pending"],
      transaction_type: ["income", "expense"],
    },
  },
} as const
