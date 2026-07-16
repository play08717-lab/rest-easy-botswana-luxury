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
          base_rate_bwp: number
          created_at: string
          description: string
          eyebrow: string | null
          features: string[]
          id: string
          images: string[]
          max_guests: number
          name: string
          property_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_rate_bwp: number
          created_at?: string
          description: string
          eyebrow?: string | null
          features?: string[]
          id?: string
          images?: string[]
          max_guests?: number
          name: string
          property_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_rate_bwp?: number
          created_at?: string
          description?: string
          eyebrow?: string | null
          features?: string[]
          id?: string
          images?: string[]
          max_guests?: number
          name?: string
          property_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
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
          created_at: string
          guest_email: string
          guest_id: string
          guest_id_number: string | null
          guest_name: string
          guest_phone: string
          guests: number
          hold_expires_at: string | null
          id: string
          nightly_rate_bwp: number
          nights: number
          reference: string
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_bwp: number
          updated_at: string
        }
        Insert: {
          apartment_id: string
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in: string
          check_out: string
          created_at?: string
          guest_email: string
          guest_id: string
          guest_id_number?: string | null
          guest_name: string
          guest_phone: string
          guests?: number
          hold_expires_at?: string | null
          id?: string
          nightly_rate_bwp: number
          nights: number
          reference?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_bwp: number
          updated_at?: string
        }
        Update: {
          apartment_id?: string
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in?: string
          check_out?: string
          created_at?: string
          guest_email?: string
          guest_id?: string
          guest_id_number?: string | null
          guest_name?: string
          guest_phone?: string
          guests?: number
          hold_expires_at?: string | null
          id?: string
          nightly_rate_bwp?: number
          nights?: number
          reference?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_bwp?: number
          updated_at?: string
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
          check_in_time: string
          check_out_time: string
          contact_email: string
          contact_phone: string
          hold_hours: number
          id: number
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
          check_in_time?: string
          check_out_time?: string
          contact_email?: string
          contact_phone?: string
          hold_hours?: number
          id?: number
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
          check_in_time?: string
          check_out_time?: string
          contact_email?: string
          contact_phone?: string
          hold_hours?: number
          id?: number
          updated_at?: string
          welcome_message?: string
          whatsapp_number?: string
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
      payment_method: "bank_transfer" | "cash" | "other"
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
      payment_method: ["bank_transfer", "cash", "other"],
    },
  },
} as const
