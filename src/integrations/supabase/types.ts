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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_allowlist: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          commission_percent: number
          id: number
          merchant_account_holder: string
          merchant_account_number: string
          merchant_bank_name: string
          merchant_ifsc: string
          merchant_name: string
          merchant_qr_path: string
          merchant_upi_id: string
          updated_at: string
        }
        Insert: {
          commission_percent?: number
          id?: number
          merchant_account_holder?: string
          merchant_account_number?: string
          merchant_bank_name?: string
          merchant_ifsc?: string
          merchant_name?: string
          merchant_qr_path?: string
          merchant_upi_id?: string
          updated_at?: string
        }
        Update: {
          commission_percent?: number
          id?: number
          merchant_account_holder?: string
          merchant_account_number?: string
          merchant_bank_name?: string
          merchant_ifsc?: string
          merchant_name?: string
          merchant_qr_path?: string
          merchant_upi_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          address: string
          amount: number
          booking_date: string
          booking_time: string
          code: string
          commission: number
          commission_percent: number
          created_at: string
          customer_name: string
          customer_phone: string
          paid_at: string | null
          payment: string
          payment_method: string | null
          payment_ref: string | null
          payout_paid_at: string | null
          payout_ref: string | null
          payout_status: string
          rating: number | null
          reward_credited: boolean
          service_id: string
          status: string
          user_id: string
          worker_id: string
          worker_payout: number
        }
        Insert: {
          address: string
          amount: number
          booking_date: string
          booking_time: string
          code?: string
          commission: number
          commission_percent?: number
          created_at?: string
          customer_name: string
          customer_phone?: string
          paid_at?: string | null
          payment?: string
          payment_method?: string | null
          payment_ref?: string | null
          payout_paid_at?: string | null
          payout_ref?: string | null
          payout_status?: string
          rating?: number | null
          reward_credited?: boolean
          service_id: string
          status?: string
          user_id: string
          worker_id: string
          worker_payout?: number
        }
        Update: {
          address?: string
          amount?: number
          booking_date?: string
          booking_time?: string
          code?: string
          commission?: number
          commission_percent?: number
          created_at?: string
          customer_name?: string
          customer_phone?: string
          paid_at?: string | null
          payment?: string
          payment_method?: string | null
          payment_ref?: string | null
          payout_paid_at?: string | null
          payout_ref?: string | null
          payout_status?: string
          rating?: number | null
          reward_credited?: boolean
          service_id?: string
          status?: string
          user_id?: string
          worker_id?: string
          worker_payout?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_methods: {
        Row: {
          account_number: string | null
          created_at: string
          holder_name: string
          id: string
          ifsc: string | null
          method_type: string
          qr_path: string | null
          upi_id: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          created_at?: string
          holder_name: string
          id?: string
          ifsc?: string | null
          method_type: string
          qr_path?: string | null
          upi_id?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          created_at?: string
          holder_name?: string
          id?: string
          ifsc?: string | null
          method_type?: string
          qr_path?: string | null
          upi_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          reward_points: number
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          reward_points?: number
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          reward_points?: number
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      service_commissions: {
        Row: {
          commission: number
          service_id: string
          updated_at: string
        }
        Insert: {
          commission: number
          service_id: string
          updated_at?: string
        }
        Update: {
          commission?: number
          service_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          commission: number | null
          created_at: string
          icon: string
          id: string
          name: string
          price: number | null
          status: string
          tint: string
          updated_at: string
        }
        Insert: {
          commission?: number | null
          created_at?: string
          icon: string
          id: string
          name: string
          price?: number | null
          status?: string
          tint: string
          updated_at?: string
        }
        Update: {
          commission?: number | null
          created_at?: string
          icon?: string
          id?: string
          name?: string
          price?: number | null
          status?: string
          tint?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          booking_code: string | null
          created_at: string
          customer_id: string | null
          id: string
          note: string | null
          reference: string | null
          type: string
          worker_id: string | null
        }
        Insert: {
          amount: number
          booking_code?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          note?: string | null
          reference?: string | null
          type: string
          worker_id?: string | null
        }
        Update: {
          amount?: number
          booking_code?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          note?: string | null
          reference?: string | null
          type?: string
          worker_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          code: string
          created_at: string
          id: string
          points: number
          user_id: string
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          points: number
          user_id: string
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          points?: number
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      wallet_deposits: {
        Row: {
          admin_note: string | null
          amount: number
          code: string
          created_at: string
          expires_at: string
          reviewed_at: string | null
          status: string
          submitted_at: string | null
          user_id: string
          utr: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          code?: string
          created_at?: string
          expires_at?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          user_id: string
          utr?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          code?: string
          created_at?: string
          expires_at?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          user_id?: string
          utr?: string | null
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account: string
          amount: number
          code: string
          created_at: string
          requested_on: string
          status: string
        }
        Insert: {
          account: string
          amount: number
          code?: string
          created_at?: string
          requested_on?: string
          status?: string
        }
        Update: {
          account?: string
          amount?: number
          code?: string
          created_at?: string
          requested_on?: string
          status?: string
        }
        Relationships: []
      }
      worker_kyc: {
        Row: {
          address: string
          admin_note: string | null
          full_name: string
          id_number: string
          id_type: string
          payout_account: string
          phone: string
          reviewed_at: string | null
          status: string
          submitted_at: string
          user_id: string
          worker_id: string
        }
        Insert: {
          address: string
          admin_note?: string | null
          full_name: string
          id_number: string
          id_type: string
          payout_account: string
          phone: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          user_id: string
          worker_id: string
        }
        Update: {
          address?: string
          admin_note?: string | null
          full_name?: string
          id_number?: string
          id_type?: string
          payout_account?: string
          phone?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_kyc_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: true
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_withdrawals: {
        Row: {
          amount: number
          code: string
          created_at: string
          destination: string
          method_type: string
          payout_ref: string | null
          qr_path: string | null
          status: string
          updated_at: string
          user_id: string
          worker_id: string
        }
        Insert: {
          amount: number
          code?: string
          created_at?: string
          destination: string
          method_type: string
          payout_ref?: string | null
          qr_path?: string | null
          status?: string
          updated_at?: string
          user_id: string
          worker_id: string
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          destination?: string
          method_type?: string
          payout_ref?: string | null
          qr_path?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          worker_id?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          available: boolean
          created_at: string
          distance_km: number
          exp_years: number
          id: string
          jobs_done: number
          kyc: string
          name: string
          photo: string
          rating: number
          role: string
          service_id: string
          user_id: string | null
        }
        Insert: {
          available?: boolean
          created_at?: string
          distance_km?: number
          exp_years?: number
          id: string
          jobs_done?: number
          kyc?: string
          name: string
          photo?: string
          rating?: number
          role: string
          service_id: string
          user_id?: string | null
        }
        Update: {
          available?: boolean
          created_at?: string
          distance_km?: number
          exp_years?: number
          id?: string
          jobs_done?: number
          kyc?: string
          name?: string
          photo?: string
          rating?: number
          role?: string
          service_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_payout_method: {
        Args: {
          _account: string
          _holder: string
          _ifsc: string
          _qr_path: string
          _type: string
          _upi: string
        }
        Returns: undefined
      }
      add_reward_points: { Args: { _points: number }; Returns: number }
      admin_link_worker: {
        Args: {
          _email: string
          _exp_years: number
          _name: string
          _photo?: string
          _service_id: string
        }
        Returns: {
          available: boolean
          created_at: string
          distance_km: number
          exp_years: number
          id: string
          jobs_done: number
          kyc: string
          name: string
          photo: string
          rating: number
          role: string
          service_id: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "workers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_mark_booking_paid: {
        Args: { _code: string; _method: string; _ref: string }
        Returns: undefined
      }
      admin_mark_worker_paid: {
        Args: { _code: string; _ref: string }
        Returns: undefined
      }
      admin_request_withdrawal: {
        Args: { _account: string; _amount: number }
        Returns: {
          account: string
          amount: number
          code: string
          created_at: string
          requested_on: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_review_deposit: {
        Args: { _approve: boolean; _code: string; _note: string }
        Returns: undefined
      }
      admin_set_commission_percent: {
        Args: { _percent: number }
        Returns: undefined
      }
      admin_set_merchant_payment_details: {
        Args: {
          _account: string
          _bank_name: string
          _holder: string
          _ifsc: string
          _name: string
          _qr_path: string
          _upi: string
        }
        Returns: undefined
      }
      admin_set_merchant_upi: {
        Args: { _name: string; _upi: string }
        Returns: undefined
      }
      admin_set_withdrawal_status: {
        Args: { _code: string; _status: string }
        Returns: undefined
      }
      admin_set_worker_kyc: {
        Args: { _kyc: string; _worker_id: string }
        Returns: undefined
      }
      admin_set_worker_withdrawal: {
        Args: { _code: string; _ref: string; _status: string }
        Returns: undefined
      }
      admin_update_service: {
        Args: {
          _commission: number
          _price: number
          _service_id: string
          _status: string
        }
        Returns: undefined
      }
      calc_commission: { Args: { _amount: number }; Returns: number }
      cancel_own_booking: { Args: { _code: string }; Returns: undefined }
      create_booking: {
        Args: {
          _address: string
          _booking_date: string
          _booking_time: string
          _worker_id: string
        }
        Returns: {
          address: string
          amount: number
          booking_date: string
          booking_time: string
          code: string
          commission: number
          commission_percent: number
          created_at: string
          customer_name: string
          customer_phone: string
          paid_at: string | null
          payment: string
          payment_method: string | null
          payment_ref: string | null
          payout_paid_at: string | null
          payout_ref: string | null
          payout_status: string
          rating: number | null
          reward_credited: boolean
          service_id: string
          status: string
          user_id: string
          worker_id: string
          worker_payout: number
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_payout_due_if_ready: { Args: { _code: string }; Returns: undefined }
      my_worker_balance: { Args: never; Returns: number }
      pay_booking_from_wallet: { Args: { _code: string }; Returns: undefined }
      rate_own_booking: {
        Args: { _code: string; _rating: number }
        Returns: undefined
      }
      redeem_reward_points: {
        Args: never
        Returns: {
          code: string
          created_at: string
          id: string
          points: number
          user_id: string
          value: number
        }
        SetofOptions: {
          from: "*"
          to: "vouchers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_worker_withdrawal: {
        Args: { _amount: number; _method_id: string }
        Returns: undefined
      }
      set_assigned_booking_status: {
        Args: { _code: string; _status: string }
        Returns: undefined
      }
      set_own_worker_availability: {
        Args: { _available: boolean }
        Returns: undefined
      }
      set_own_worker_service: {
        Args: { _exp_years: number; _service_id: string }
        Returns: undefined
      }
      start_wallet_deposit: {
        Args: { _amount: number }
        Returns: {
          admin_note: string | null
          amount: number
          code: string
          created_at: string
          expires_at: string
          reviewed_at: string | null
          status: string
          submitted_at: string | null
          user_id: string
          utr: string | null
        }
        SetofOptions: {
          from: "*"
          to: "wallet_deposits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_deposit_utr: {
        Args: { _code: string; _utr: string }
        Returns: undefined
      }
      submit_worker_kyc: {
        Args: {
          _address: string
          _full_name: string
          _id_number: string
          _id_type: string
          _payout_account: string
          _phone: string
        }
        Returns: undefined
      }
      worker_available_balance: { Args: { _user: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "worker" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "worker", "user"],
    },
  },
} as const
