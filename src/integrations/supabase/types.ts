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
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      apartments: {
        Row: {
          active: boolean
          apartment_number: string | null
          availability: string
          base_rate_bwp: number
          cleaning_status: string
          created_at: string
          description: string
          eyebrow: string | null
          features: string[]
          holiday_rate_bwp: number | null
          id: string
          images: string[]
          max_guests: number
          name: string
          property_id: string | null
          slug: string
          sort_order: number
          updated_at: string
          weekend_rate_bwp: number | null
        }
        Insert: {
          active?: boolean
          apartment_number?: string | null
          availability?: string
          base_rate_bwp: number
          cleaning_status?: string
          created_at?: string
          description: string
          eyebrow?: string | null
          features?: string[]
          holiday_rate_bwp?: number | null
          id?: string
          images?: string[]
          max_guests?: number
          name: string
          property_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
          weekend_rate_bwp?: number | null
        }
        Update: {
          active?: boolean
          apartment_number?: string | null
          availability?: string
          base_rate_bwp?: number
          cleaning_status?: string
          created_at?: string
          description?: string
          eyebrow?: string | null
          features?: string[]
          holiday_rate_bwp?: number | null
          id?: string
          images?: string[]
          max_guests?: number
          name?: string
          property_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
          weekend_rate_bwp?: number | null
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          apartment_id: string
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          apartment_id: string
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
        }
        Update: {
          apartment_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          apartment_id: string
          booking_type: string
          cancellation_reason: string | null
          cancelled_at: string | null
          check_in: string
          check_out: string
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string
          emergency_contact: string | null
          guest_email: string
          guest_id: string | null
          guest_id_number: string | null
          guest_name: string
          guest_phone: string
          guests: number
          hold_expires_at: string | null
          id: string
          is_group: boolean
          nationality: string | null
          nightly_rate_bwp: number
          nights: number
          notes: string | null
          reference: string
          source: string
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_bwp: number
          updated_at: string
          vehicle_reg: string | null
        }
        Insert: {
          apartment_id: string
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in: string
          check_out: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          emergency_contact?: string | null
          guest_email: string
          guest_id?: string | null
          guest_id_number?: string | null
          guest_name: string
          guest_phone: string
          guests?: number
          hold_expires_at?: string | null
          id?: string
          is_group?: boolean
          nationality?: string | null
          nightly_rate_bwp: number
          nights: number
          notes?: string | null
          reference?: string
          source?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_bwp: number
          updated_at?: string
          vehicle_reg?: string | null
        }
        Update: {
          apartment_id?: string
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in?: string
          check_out?: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          emergency_contact?: string | null
          guest_email?: string
          guest_id?: string | null
          guest_id_number?: string | null
          guest_name?: string
          guest_phone?: string
          guests?: number
          hold_expires_at?: string | null
          id?: string
          is_group?: boolean
          nationality?: string | null
          nightly_rate_bwp?: number
          nights?: number
          notes?: string | null
          reference?: string
          source?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_bwp?: number
          updated_at?: string
          vehicle_reg?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          active: boolean
          apartment_id: string
          created_at: string
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          apartment_id: string
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          apartment_id?: string
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_runs: {
        Row: {
          apartment_id: string
          completed_by: string | null
          completed_item_ids: string[]
          created_at: string
          id: string
          item_labels: Json
          notes: string | null
        }
        Insert: {
          apartment_id: string
          completed_by?: string | null
          completed_item_ids?: string[]
          created_at?: string
          id?: string
          item_labels?: Json
          notes?: string | null
        }
        Update: {
          apartment_id?: string
          completed_by?: string | null
          completed_item_ids?: string[]
          created_at?: string
          id?: string
          item_labels?: Json
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_runs_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
          rate_multiplier: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name: string
          rate_multiplier?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
          rate_multiplier?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          author_id: string | null
          body: string
          booking_id: string
          created_at: string
          id: string
          sender: Database["public"]["Enums"]["message_sender"]
        }
        Insert: {
          author_id?: string | null
          body: string
          booking_id: string
          created_at?: string
          id?: string
          sender: Database["public"]["Enums"]["message_sender"]
        }
        Update: {
          author_id?: string | null
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          sender?: Database["public"]["Enums"]["message_sender"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          booking_id: string | null
          channel: string
          error: string | null
          id: string
          recipient: string
          sent_at: string
          status: string
          template: string
        }
        Insert: {
          booking_id?: string | null
          channel: string
          error?: string | null
          id?: string
          recipient: string
          sent_at?: string
          status?: string
          template: string
        }
        Update: {
          booking_id?: string | null
          channel?: string
          error?: string | null
          id?: string
          recipient?: string
          sent_at?: string
          status?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_bwp: number
          booking_id: string
          id: string
          is_deposit: boolean
          is_refund: boolean
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          proof_url: string | null
          recorded_at: string
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount_bwp: number
          booking_id: string
          id?: string
          is_deposit?: boolean
          is_refund?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          proof_url?: string | null
          recorded_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount_bwp?: number
          booking_id?: string
          id?: string
          is_deposit?: boolean
          is_refund?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          proof_url?: string | null
          recorded_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          id_number: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          id_number?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          id_number?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string
          bank_account_name: string
          bank_account_number: string
          bank_branch: string
          bank_name: string
          bank_swift: string
          cancellation_hours: number
          cancellation_policy: string
          check_in_time: string
          check_out_time: string
          contact_email: string
          contact_phone: string
          facebook_url: string
          hold_hours: number
          id: number
          instagram_url: string
          logo_url: string
          tax_rate: number
          updated_at: string
          welcome_message: string
          whatsapp_number: string
        }
        Insert: {
          address?: string
          bank_account_name?: string
          bank_account_number?: string
          bank_branch?: string
          bank_name?: string
          bank_swift?: string
          cancellation_hours?: number
          cancellation_policy?: string
          check_in_time?: string
          check_out_time?: string
          contact_email?: string
          contact_phone?: string
          facebook_url?: string
          hold_hours?: number
          id?: number
          instagram_url?: string
          logo_url?: string
          tax_rate?: number
          updated_at?: string
          welcome_message?: string
          whatsapp_number?: string
        }
        Update: {
          address?: string
          bank_account_name?: string
          bank_account_number?: string
          bank_branch?: string
          bank_name?: string
          bank_swift?: string
          cancellation_hours?: number
          cancellation_policy?: string
          check_in_time?: string
          check_out_time?: string
          contact_email?: string
          contact_phone?: string
          facebook_url?: string
          hold_hours?: number
          id?: number
          instagram_url?: string
          logo_url?: string
          tax_rate?: number
          updated_at?: string
          welcome_message?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      special_rates: {
        Row: {
          apartment_id: string
          created_at: string
          end_date: string
          id: string
          label: string | null
          rate_bwp: number
          start_date: string
        }
        Insert: {
          apartment_id: string
          created_at?: string
          end_date: string
          id?: string
          label?: string | null
          rate_bwp: number
          start_date: string
        }
        Update: {
          apartment_id?: string
          created_at?: string
          end_date?: string
          id?: string
          label?: string | null
          rate_bwp?: number
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_rates_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_booking_ref: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_availability: {
        Args: { _check_in: string; _check_out: string; _guests?: number }
        Returns: {
          apartment_id: string
          base_rate_bwp: number
          description: string
          eyebrow: string
          features: string[]
          images: string[]
          max_guests: number
          name: string
          nights: number
          slug: string
          total_bwp: number
        }[]
      }
    }
    Enums: {
      app_role: "guest" | "admin" | "receptionist" | "housekeeping" | "manager"
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "cancelled"
        | "checked_in"
        | "checked_out"
        | "no_show"
      message_sender: "guest" | "admin"
      payment_method: "bank_transfer" | "cash" | "other" | "orange_money"
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
      app_role: ["guest", "admin", "receptionist", "housekeeping", "manager"],
      booking_status: [
        "pending_payment",
        "confirmed",
        "cancelled",
        "checked_in",
        "checked_out",
        "no_show",
      ],
      message_sender: ["guest", "admin"],
      payment_method: ["bank_transfer", "cash", "other", "orange_money"],
    },
  },
} as const
