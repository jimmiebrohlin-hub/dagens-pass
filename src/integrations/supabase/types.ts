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
      challenge_progress: {
        Row: {
          base_reps: number
          exercise_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_reps?: number
          exercise_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_reps?: number
          exercise_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_preferences: {
        Row: {
          blocked_ids: string[]
          created_at: string
          favorite_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          blocked_ids?: string[]
          created_at?: string
          favorite_ids?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          blocked_ids?: string[]
          created_at?: string
          favorite_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_streak_activity: {
        Row: {
          activity_type: string
          created_at: string
          from_user_id: string | null
          id: string
          streak_count_after: number | null
          streak_id: string
          to_user_id: string | null
          user_id: string
          workout_session_id: string | null
        }
        Insert: {
          activity_type?: string
          created_at?: string
          from_user_id?: string | null
          id?: string
          streak_count_after?: number | null
          streak_id: string
          to_user_id?: string | null
          user_id: string
          workout_session_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          from_user_id?: string | null
          id?: string
          streak_count_after?: number | null
          streak_id?: string
          to_user_id?: string | null
          user_id?: string
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_streak_activity_streak_id_fkey"
            columns: ["streak_id"]
            isOneToOne: false
            referencedRelation: "shared_streaks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_streak_activity_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_streak_members: {
        Row: {
          display_name: string | null
          joined_at: string
          member_order: number
          role: string
          status: string
          streak_id: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          joined_at?: string
          member_order?: number
          role?: string
          status?: string
          streak_id: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          joined_at?: string
          member_order?: number
          role?: string
          status?: string
          streak_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_streak_members_streak_id_fkey"
            columns: ["streak_id"]
            isOneToOne: false
            referencedRelation: "shared_streaks"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_streaks: {
        Row: {
          created_at: string
          created_by: string
          current_turn_user_id: string | null
          id: string
          invite_code: string
          last_completed_at: string | null
          name: string
          status: string
          streak_count: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_turn_user_id?: string | null
          id?: string
          invite_code?: string
          last_completed_at?: string | null
          name: string
          status?: string
          streak_count?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_turn_user_id?: string | null
          id?: string
          invite_code?: string
          last_completed_at?: string | null
          name?: string
          status?: string
          streak_count?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          intensity: string
          reminder_enabled: boolean
          reminder_time: string
          rest_seconds: number
          sound_enabled: boolean
          updated_at: string
          user_id: string
          vibration_enabled: boolean
        }
        Insert: {
          created_at?: string
          intensity?: string
          reminder_enabled?: boolean
          reminder_time?: string
          rest_seconds?: number
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
          vibration_enabled?: boolean
        }
        Update: {
          created_at?: string
          intensity?: string
          reminder_enabled?: boolean
          reminder_time?: string
          rest_seconds?: number
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
          vibration_enabled?: boolean
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string
          created_at: string
          exercises: Json
          feedback: string | null
          id: string
          local_id: string | null
          mode: string
          total_reps: number | null
          user_id: string
          workout_date: string
        }
        Insert: {
          completed_at: string
          created_at?: string
          exercises?: Json
          feedback?: string | null
          id?: string
          local_id?: string | null
          mode: string
          total_reps?: number | null
          user_id: string
          workout_date: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          exercises?: Json
          feedback?: string | null
          id?: string
          local_id?: string | null
          mode?: string
          total_reps?: number | null
          user_id?: string
          workout_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_shared_streak: { Args: { p_name?: string }; Returns: string }
      get_my_shared_streak: { Args: never; Returns: Json }
      is_active_streak_member: {
        Args: { _streak_id: string; _user_id: string }
        Returns: boolean
      }
      is_shared_streak_member: {
        Args: { p_streak_id: string }
        Returns: boolean
      }
      join_shared_streak_by_code: {
        Args: { p_invite_code: string }
        Returns: string
      }
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
  public: {
    Enums: {},
  },
} as const
