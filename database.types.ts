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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      address: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: number
          is_default: boolean | null
          latitude: number | null
          longitude: number | null
          state: string | null
          street: string | null
          users: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: number
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          street?: string | null
          users?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: number
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          street?: string | null
          users?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "address_users_fkey"
            columns: ["users"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      adoption: {
        Row: {
          created_at: string
          happiness_image: string | null
          has_children_in_home: boolean | null
          has_other_pets_in_home: boolean | null
          have_outdoor_space: boolean | null
          have_permission_from_landlord: boolean | null
          id: number
          is_renting: boolean | null
          number_of_household_members: number | null
          pet: number | null
          status: Database["public"]["Enums"]["adoption_status"] | null
          type_of_residence: string | null
          user: string | null
        }
        Insert: {
          created_at?: string
          happiness_image?: string | null
          has_children_in_home?: boolean | null
          has_other_pets_in_home?: boolean | null
          have_outdoor_space?: boolean | null
          have_permission_from_landlord?: boolean | null
          id?: number
          is_renting?: boolean | null
          number_of_household_members?: number | null
          pet?: number | null
          status?: Database["public"]["Enums"]["adoption_status"] | null
          type_of_residence?: string | null
          user?: string | null
        }
        Update: {
          created_at?: string
          happiness_image?: string | null
          has_children_in_home?: boolean | null
          has_other_pets_in_home?: boolean | null
          have_outdoor_space?: boolean | null
          have_permission_from_landlord?: boolean | null
          id?: number
          is_renting?: boolean | null
          number_of_household_members?: number | null
          pet?: number | null
          status?: Database["public"]["Enums"]["adoption_status"] | null
          type_of_residence?: string | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adoption_pet_fkey"
            columns: ["pet"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_responses: {
        Row: {
          about: string | null
          cache_key: string | null
          content: string | null
          created_at: string
          id: number
          last_used_at: string | null
          response: string | null
          usage_count: number | null
        }
        Insert: {
          about?: string | null
          cache_key?: string | null
          content?: string | null
          created_at?: string
          id?: number
          last_used_at?: string | null
          response?: string | null
          usage_count?: number | null
        }
        Update: {
          about?: string | null
          cache_key?: string | null
          content?: string | null
          created_at?: string
          id?: number
          last_used_at?: string | null
          response?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number | null
          donated_at: string
          donor: string | null
          fundraising: number | null
          id: number
          message: string | null
          reference_number: string | null
          screenshot: string | null
        }
        Insert: {
          amount?: number | null
          donated_at?: string
          donor?: string | null
          fundraising?: number | null
          id?: number
          message?: string | null
          reference_number?: string | null
          screenshot?: string | null
        }
        Update: {
          amount?: number | null
          donated_at?: string
          donor?: string | null
          fundraising?: number | null
          id?: number
          message?: string | null
          reference_number?: string | null
          screenshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_donor_fkey"
            columns: ["donor"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_fundraising_fkey"
            columns: ["fundraising"]
            isOneToOne: false
            referencedRelation: "fundraising"
            referencedColumns: ["id"]
          },
        ]
      }
      event_comments: {
        Row: {
          content: string
          created_at: string | null
          event: number
          id: number
          likes: string[] | null
          user: string
        }
        Insert: {
          content: string
          created_at?: string | null
          event: number
          id?: number
          likes?: string[] | null
          user: string
        }
        Update: {
          content?: string
          created_at?: string | null
          event?: number
          id?: number
          likes?: string[] | null
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comments_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_members: {
        Row: {
          event: number
          id: number
          joined_at: string
          user: string
        }
        Insert: {
          event: number
          id?: number
          joined_at?: string
          user: string
        }
        Update: {
          event?: number
          id?: number
          joined_at?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_members_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_members_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ended_at: string | null
          id: number
          images: string[] | null
          starting_date: string | null
          suggestions: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: number
          images?: string[] | null
          starting_date?: string | null
          suggestions?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: number
          images?: string[] | null
          starting_date?: string | null
          suggestions?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: number
          pet: number | null
          user: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          pet?: number | null
          user?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          pet?: number | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_pet_fkey"
            columns: ["pet"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum: {
        Row: {
          created_at: string
          created_by: string | null
          forum_name: string | null
          id: number
          private: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          forum_name?: string | null
          id?: number
          private?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          forum_name?: string | null
          id?: number
          private?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_chats: {
        Row: {
          forum: number
          id: number
          image_url: string | null
          message: string | null
          reactions: Json[] | null
          replied_to: number | null
          sender: string | null
          sent_at: string
          viewers: string[] | null
        }
        Insert: {
          forum: number
          id?: number
          image_url?: string | null
          message?: string | null
          reactions?: Json[] | null
          replied_to?: number | null
          sender?: string | null
          sent_at?: string
          viewers?: string[] | null
        }
        Update: {
          forum?: number
          id?: number
          image_url?: string | null
          message?: string | null
          reactions?: Json[] | null
          replied_to?: number | null
          sender?: string | null
          sent_at?: string
          viewers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_chats_forum_fkey"
            columns: ["forum"]
            isOneToOne: false
            referencedRelation: "forum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_chats_replied_to_fkey"
            columns: ["replied_to"]
            isOneToOne: false
            referencedRelation: "forum_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_chats_sender_fkey"
            columns: ["sender"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_members: {
        Row: {
          created_at: string
          forum: number
          id: number
          invitation_status:
            | Database["public"]["Enums"]["invitation_status"]
            | null
          member: string
          mute: boolean | null
        }
        Insert: {
          created_at?: string
          forum: number
          id?: number
          invitation_status?:
            | Database["public"]["Enums"]["invitation_status"]
            | null
          member: string
          mute?: boolean | null
        }
        Update: {
          created_at?: string
          forum?: number
          id?: number
          invitation_status?:
            | Database["public"]["Enums"]["invitation_status"]
            | null
          member?: string
          mute?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_members_forum_fkey"
            columns: ["forum"]
            isOneToOne: false
            referencedRelation: "forum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_members_member_fkey"
            columns: ["member"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraising: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          facebook_link: string | null
          gcash_number: string | null
          id: number
          images: string[] | null
          qr_code: string | null
          raised_amount: number | null
          status: Database["public"]["Enums"]["fundraising_status"] | null
          target_amount: number | null
          title: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          facebook_link?: string | null
          gcash_number?: string | null
          id?: number
          images?: string[] | null
          qr_code?: string | null
          raised_amount?: number | null
          status?: Database["public"]["Enums"]["fundraising_status"] | null
          target_amount?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          facebook_link?: string | null
          gcash_number?: string | null
          id?: number
          images?: string[] | null
          qr_code?: string | null
          raised_amount?: number | null
          status?: Database["public"]["Enums"]["fundraising_status"] | null
          target_amount?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundraising_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          created_at: string
          forum_chat: number | null
          id: number
          user: string | null
        }
        Insert: {
          created_at?: string
          forum_chat?: number | null
          id?: number
          user?: string | null
        }
        Update: {
          created_at?: string
          forum_chat?: number | null
          id?: number
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentions_forum_chat_fkey"
            columns: ["forum_chat"]
            isOneToOne: false
            referencedRelation: "forum_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: number
          is_viewed: boolean | null
          title: string
          user: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          is_viewed?: boolean | null
          title: string
          user: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          is_viewed?: boolean | null
          title?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      global_chat_messages: {
        Row: {
          id: number
          message: string
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: number
          message: string
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          message?: string
          user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          added_by: string | null
          age: number | null
          breed: string | null
          color: string | null
          created_at: string
          date_of_birth: string | null
          description: string | null
          gender: string | null
          good_with: string[] | null
          health_status: string | null
          id: number
          is_spayed_or_neutured: boolean | null
          is_trained: boolean | null
          is_vaccinated: boolean | null
          name: string
          photos: string[] | null
          request_status: string | null
          rescue_address: string | null
          size: string | null
          special_needs: string | null
          type: string
          weight: string | null
        }
        Insert: {
          added_by?: string | null
          age?: number | null
          breed?: string | null
          color?: string | null
          created_at?: string
          date_of_birth?: string | null
          description?: string | null
          gender?: string | null
          good_with?: string[] | null
          health_status?: string | null
          id?: number
          is_spayed_or_neutured?: boolean | null
          is_trained?: boolean | null
          is_vaccinated?: boolean | null
          name: string
          photos?: string[] | null
          request_status?: string | null
          rescue_address?: string | null
          size?: string | null
          special_needs?: string | null
          type: string
          weight?: string | null
        }
        Update: {
          added_by?: string | null
          age?: number | null
          breed?: string | null
          color?: string | null
          created_at?: string
          date_of_birth?: string | null
          description?: string | null
          gender?: string | null
          good_with?: string[] | null
          health_status?: string | null
          id?: number
          is_spayed_or_neutured?: boolean | null
          is_trained?: boolean | null
          is_vaccinated?: boolean | null
          name?: string
          photos?: string[] | null
          request_status?: string | null
          rescue_address?: string | null
          size?: string | null
          special_needs?: string | null
          type?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role: {
        Row: {
          created_at: string
          id: number
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          type: string
        }
        Update: {
          created_at?: string
          id?: number
          type?: string
        }
        Relationships: []
      }
      user_identification: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          id: number
          id_attachment_url: string
          id_name: string
          status: Database["public"]["Enums"]["id_status"] | null
          user: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: number
          id_attachment_url: string
          id_name: string
          status?: Database["public"]["Enums"]["id_status"] | null
          user?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: number
          id_attachment_url?: string
          id_name?: string
          status?: Database["public"]["Enums"]["id_status"] | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_identification_user_fkey"
            columns: ["user"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          house_images: string[] | null
          id: string
          is_active: boolean | null
          last_active_at: string | null
          onboarded: boolean | null
          password_changed: boolean | null
          payment_method: string | null
          paymongo_id: string | null
          phone_number: string
          profile_image_link: string | null
          role: number
          status: Database["public"]["Enums"]["user_status"] | null
          username: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          house_images?: string[] | null
          id: string
          is_active?: boolean | null
          last_active_at?: string | null
          onboarded?: boolean | null
          password_changed?: boolean | null
          payment_method?: string | null
          paymongo_id?: string | null
          phone_number: string
          profile_image_link?: string | null
          role: number
          status?: Database["public"]["Enums"]["user_status"] | null
          username?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          house_images?: string[] | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          onboarded?: boolean | null
          password_changed?: boolean | null
          payment_method?: string | null
          paymongo_id?: string | null
          phone_number?: string
          profile_image_link?: string | null
          role?: number
          status?: Database["public"]["Enums"]["user_status"] | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      toggle_comment_like: {
        Args: { comment_id: number; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      adoption_status:
        | "PENDING"
        | "REJECTED"
        | "CANCELLED"
        | "COMPLETED"
        | "APPROVED"
      fundraising_status:
        | "PENDING"
        | "ONGOING"
        | "COMPLETE"
        | "REJECTED"
        | "CANCELLED"
      id_status: "PENDING" | "ACCEPTED" | "REJECTED"
      id_types:
        | "PHILSYS_ID"
        | "PASSPORT"
        | "DRIVER_LICENSE"
        | "SSS_ID"
        | "UMID_CARD"
        | "GSIS_ID"
        | "PRC_ID"
        | "TIN_ID"
        | "POSTAL_ID"
        | "VOTER_ID"
        | "PHILHEALTH_ID"
        | "PAGIBIG_ID"
        | "SENIOR_CITIZEN_ID"
        | "PWD_ID"
        | "STUDENT_ID"
        | "OFW_ID"
        | "NBI_CLEARANCE"
        | "POLICE_CLEARANCE"
        | "BARANGAY_ID"
        | "FIREARMS_LICENSE_ID"
        | "IBP_ID"
        | "SEAMAN_BOOK"
        | "ACR_I_CARD"
      invitation_status: "PENDING" | "APPROVED" | "REJECTED"
      user_role: "CUSTOMER" | "ADMIN" | "STAFF"
      user_status: "SEMI_VERIFIED" | "FULLY_VERIFIED" | "INDEFINITE" | "PENDING"
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
      adoption_status: [
        "PENDING",
        "REJECTED",
        "CANCELLED",
        "COMPLETED",
        "APPROVED",
      ],
      fundraising_status: [
        "PENDING",
        "ONGOING",
        "COMPLETE",
        "REJECTED",
        "CANCELLED",
      ],
      id_status: ["PENDING", "ACCEPTED", "REJECTED"],
      id_types: [
        "PHILSYS_ID",
        "PASSPORT",
        "DRIVER_LICENSE",
        "SSS_ID",
        "UMID_CARD",
        "GSIS_ID",
        "PRC_ID",
        "TIN_ID",
        "POSTAL_ID",
        "VOTER_ID",
        "PHILHEALTH_ID",
        "PAGIBIG_ID",
        "SENIOR_CITIZEN_ID",
        "PWD_ID",
        "STUDENT_ID",
        "OFW_ID",
        "NBI_CLEARANCE",
        "POLICE_CLEARANCE",
        "BARANGAY_ID",
        "FIREARMS_LICENSE_ID",
        "IBP_ID",
        "SEAMAN_BOOK",
        "ACR_I_CARD",
      ],
      invitation_status: ["PENDING", "APPROVED", "REJECTED"],
      user_role: ["CUSTOMER", "ADMIN", "STAFF"],
      user_status: ["SEMI_VERIFIED", "FULLY_VERIFIED", "INDEFINITE", "PENDING"],
    },
  },
} as const
