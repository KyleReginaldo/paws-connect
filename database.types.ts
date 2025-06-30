export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      address: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: number
          is_default: boolean | null
          state: string | null
          street: string | null
          users: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: number
          is_default?: boolean | null
          state?: string | null
          street?: string | null
          users?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: number
          is_default?: boolean | null
          state?: string | null
          street?: string | null
          users?: string | null
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
          has_children_in_home: boolean | null
          has_other_pets_in_home: boolean | null
          have_outdoor_space: boolean | null
          have_permission_from_landlord: boolean | null
          id: number
          is_renting: boolean | null
          number_of_household_members: number | null
          pet: number | null
          type_of_residence: string | null
          user: string | null
        }
        Insert: {
          created_at?: string
          has_children_in_home?: boolean | null
          has_other_pets_in_home?: boolean | null
          have_outdoor_space?: boolean | null
          have_permission_from_landlord?: boolean | null
          id?: number
          is_renting?: boolean | null
          number_of_household_members?: number | null
          pet?: number | null
          type_of_residence?: string | null
          user?: string | null
        }
        Update: {
          created_at?: string
          has_children_in_home?: boolean | null
          has_other_pets_in_home?: boolean | null
          have_outdoor_space?: boolean | null
          have_permission_from_landlord?: boolean | null
          id?: number
          is_renting?: boolean | null
          number_of_household_members?: number | null
          pet?: number | null
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
      donations: {
        Row: {
          amount: number | null
          donated_at: string
          donor: string | null
          fundraising: number | null
          id: number
          message: string | null
        }
        Insert: {
          amount?: number | null
          donated_at?: string
          donor?: string | null
          fundraising?: number | null
          id?: number
          message?: string | null
        }
        Update: {
          amount?: number | null
          donated_at?: string
          donor?: string | null
          fundraising?: number | null
          id?: number
          message?: string | null
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
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          forum_name?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          forum_name?: string | null
          id?: number
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
          message: string | null
          sender: string | null
          sent_at: string
        }
        Insert: {
          forum: number
          id?: number
          message?: string | null
          sender?: string | null
          sent_at?: string
        }
        Update: {
          forum?: number
          id?: number
          message?: string | null
          sender?: string | null
          sent_at?: string
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
            foreignKeyName: "forum_chats_sender_fkey"
            columns: ["sender"]
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
          id: number
          raised_amount: number | null
          target_amount: number | null
          title: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          raised_amount?: number | null
          target_amount?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          raised_amount?: number | null
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
      pets: {
        Row: {
          added_by: string | null
          age: number | null
          breed: string | null
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
          request_status: string | null
          rescure_address: string | null
          size: string | null
          special_needs: string | null
          type: string
          weight: string | null
        }
        Insert: {
          added_by?: string | null
          age?: number | null
          breed?: string | null
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
          request_status?: string | null
          rescure_address?: string | null
          size?: string | null
          special_needs?: string | null
          type: string
          weight?: string | null
        }
        Update: {
          added_by?: string | null
          age?: number | null
          breed?: string | null
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
          request_status?: string | null
          rescure_address?: string | null
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
      users: {
        Row: {
          created_at: string
          email: string | null
          house_images: string[] | null
          id: string
          phone_number: string
          role: number
          status: string | null
          username: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          house_images?: string[] | null
          id: string
          phone_number: string
          role: number
          status?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          house_images?: string[] | null
          id?: string
          phone_number?: string
          role?: number
          status?: string | null
          username?: string | null
        }
        Relationships: [
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
