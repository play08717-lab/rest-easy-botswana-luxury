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
      assistant_config: {
        Row: {
          advisories_text: string
          checkin_text: string
          contact_text: string
          extra_notes: string
          id: number
          location_text: string
          rates_text: string
          tone_notes: string
          updated_at: string
        }
        Insert: {
          advisories_text?: string
          checkin_text?: string
          contact_text?: string
          extra_notes?: string
          id?: number
          location_text?: string
          rates_text?: string
          tone_notes?: string
          updated_at?: string
        }
        Update: {
          advisories_text?: string
          checkin_text?: string
          contact_text?: string
          extra_notes?: string
          id?: number
          location_text?: string
          rates_text?: string
          tone_notes?: string
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
          checked_in_at: string | null
          checked_out_at: string | null
          consents: Json | null
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
          consents?: Json | null
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
          consents?: Json | null
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
      deletion_requests: {
        Row: {
          created_at: string
          id: string
          lookup_type: string
          lookup_value: string
          matched_booking_ids: string[] | null
          matched_profile_id: string | null
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requester_email: string | null
          requester_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lookup_type: string
          lookup_value: string
          matched_booking_ids?: string[] | null
          matched_profile_id?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requester_email?: string | null
          requester_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lookup_type?: string
          lookup_value?: string
          matched_booking_ids?: string[] | null
          matched_profile_id?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requester_email?: string | null
          requester_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      lounge_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lounge_categories_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "lounge_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      lounge_item_extras: {
        Row: {
          active: boolean
          created_at: string
          id: string
          item_id: string
          name: string
          price_bwp: number
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          item_id: string
          name: string
          price_bwp?: number
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          item_id?: string
          name?: string
          price_bwp?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lounge_item_extras_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "lounge_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lounge_menu_items: {
        Row: {
          archived: boolean
          available: boolean
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string
          is_special: boolean
          name: string
          prep_notes: string
          price_bwp: number
          sort_order: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          archived?: boolean
          available?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_special?: boolean
          name: string
          prep_notes?: string
          price_bwp?: number
          sort_order?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          archived?: boolean
          available?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_special?: boolean
          name?: string
          prep_notes?: string
          price_bwp?: number
          sort_order?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lounge_menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lounge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lounge_menu_items_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "lounge_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      lounge_order_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["lounge_order_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["lounge_order_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["lounge_order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "lounge_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lounge_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lounge_order_items: {
        Row: {
          category_name: string
          created_at: string
          extras: Json
          extras_total_bwp: number
          id: string
          instructions: string | null
          item_id: string | null
          item_name: string
          line_total_bwp: number
          order_id: string
          quantity: number
          unit_price_bwp: number
        }
        Insert: {
          category_name?: string
          created_at?: string
          extras?: Json
          extras_total_bwp?: number
          id?: string
          instructions?: string | null
          item_id?: string | null
          item_name: string
          line_total_bwp?: number
          order_id: string
          quantity?: number
          unit_price_bwp?: number
        }
        Update: {
          category_name?: string
          created_at?: string
          extras?: Json
          extras_total_bwp?: number
          id?: string
          instructions?: string | null
          item_id?: string | null
          item_name?: string
          line_total_bwp?: number
          order_id?: string
          quantity?: number
          unit_price_bwp?: number
        }
        Relationships: [
          {
            foreignKeyName: "lounge_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "lounge_menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lounge_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lounge_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lounge_orders: {
        Row: {
          apartment_id: string | null
          booking_id: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_notes: string | null
          customer_phone: string
          delivery_fee_bwp: number
          delivery_instructions: string | null
          discount_bwp: number
          guest_id: string | null
          id: string
          order_type: Database["public"]["Enums"]["lounge_order_type"]
          payment_method: string
          payment_status: string
          pickup_time: string | null
          promo_code: string | null
          ready_at: string | null
          reference: string
          staff_notes: string | null
          status: Database["public"]["Enums"]["lounge_order_status"]
          subtotal_bwp: number
          total_bwp: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          apartment_id?: string | null
          booking_id?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_notes?: string | null
          customer_phone: string
          delivery_fee_bwp?: number
          delivery_instructions?: string | null
          discount_bwp?: number
          guest_id?: string | null
          id?: string
          order_type: Database["public"]["Enums"]["lounge_order_type"]
          payment_method?: string
          payment_status?: string
          pickup_time?: string | null
          promo_code?: string | null
          ready_at?: string | null
          reference?: string
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["lounge_order_status"]
          subtotal_bwp?: number
          total_bwp?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          apartment_id?: string | null
          booking_id?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_notes?: string | null
          customer_phone?: string
          delivery_fee_bwp?: number
          delivery_instructions?: string | null
          discount_bwp?: number
          guest_id?: string | null
          id?: string
          order_type?: Database["public"]["Enums"]["lounge_order_type"]
          payment_method?: string
          payment_status?: string
          pickup_time?: string | null
          promo_code?: string | null
          ready_at?: string | null
          reference?: string
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["lounge_order_status"]
          subtotal_bwp?: number
          total_bwp?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lounge_orders_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lounge_orders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lounge_orders_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "lounge_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      lounge_promotions: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          description: string
          discount_amount_bwp: number | null
          discount_percent: number | null
          ends_at: string | null
          id: string
          promo_type: string
          starts_at: string | null
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          description?: string
          discount_amount_bwp?: number | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          promo_type?: string
          starts_at?: string | null
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          description?: string
          discount_amount_bwp?: number | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          promo_type?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lounge_promotions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "lounge_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      lounge_settings: {
        Row: {
          address: string
          cover_image_url: string
          currency: string
          delivery_enabled: boolean
          delivery_fee_bwp: number
          delivery_instructions: string
          delivery_radius_km: number
          distance_note: string
          email: string
          estimated_delivery_minutes: number
          estimated_prep_minutes: number
          facebook_url: string
          instagram_url: string
          logo_url: string
          maps_embed_url: string
          maps_url: string
          minimum_order_bwp: number
          opening_hours: string
          payment_methods: string[]
          phone: string
          updated_at: string
          venue_id: string
          whatsapp_number: string
        }
        Insert: {
          address?: string
          cover_image_url?: string
          currency?: string
          delivery_enabled?: boolean
          delivery_fee_bwp?: number
          delivery_instructions?: string
          delivery_radius_km?: number
          distance_note?: string
          email?: string
          estimated_delivery_minutes?: number
          estimated_prep_minutes?: number
          facebook_url?: string
          instagram_url?: string
          logo_url?: string
          maps_embed_url?: string
          maps_url?: string
          minimum_order_bwp?: number
          opening_hours?: string
          payment_methods?: string[]
          phone?: string
          updated_at?: string
          venue_id: string
          whatsapp_number?: string
        }
        Update: {
          address?: string
          cover_image_url?: string
          currency?: string
          delivery_enabled?: boolean
          delivery_fee_bwp?: number
          delivery_instructions?: string
          delivery_radius_km?: number
          distance_note?: string
          email?: string
          estimated_delivery_minutes?: number
          estimated_prep_minutes?: number
          facebook_url?: string
          instagram_url?: string
          logo_url?: string
          maps_embed_url?: string
          maps_url?: string
          minimum_order_bwp?: number
          opening_hours?: string
          payment_methods?: string[]
          phone?: string
          updated_at?: string
          venue_id?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "lounge_settings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "lounge_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      lounge_venues: {
        Row: {
          about: string
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          tagline: string
          updated_at: string
        }
        Insert: {
          about?: string
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          tagline?: string
          updated_at?: string
        }
        Update: {
          about?: string
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          tagline?: string
          updated_at?: string
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
      generate_lounge_order_ref: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_lounge_manager: { Args: { _user_id: string }; Returns: boolean }
      is_lounge_staff: { Args: { _user_id: string }; Returns: boolean }
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
      app_role:
        | "guest"
        | "admin"
        | "receptionist"
        | "housekeeping"
        | "manager"
        | "lounge_staff"
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "cancelled"
        | "checked_in"
        | "checked_out"
        | "no_show"
      lounge_order_status:
        | "received"
        | "confirmed"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "completed"
        | "cancelled"
      lounge_order_type: "pickup" | "delivery"
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
      app_role: [
        "guest",
        "admin",
        "receptionist",
        "housekeeping",
        "manager",
        "lounge_staff",
      ],
      booking_status: [
        "pending_payment",
        "confirmed",
        "cancelled",
        "checked_in",
        "checked_out",
        "no_show",
      ],
      lounge_order_status: [
        "received",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
        "completed",
        "cancelled",
      ],
      lounge_order_type: ["pickup", "delivery"],
      message_sender: ["guest", "admin"],
      payment_method: ["bank_transfer", "cash", "other", "orange_money"],
    },
  },
} as const
