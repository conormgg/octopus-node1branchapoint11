export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_class_students: {
        Row: {
          id: number
          saved_class_id: number
          student_email: string | null
          student_name: string
        }
        Insert: {
          id?: number
          saved_class_id: number
          student_email?: string | null
          student_name: string
        }
        Update: {
          id?: number
          saved_class_id?: number
          student_email?: string | null
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_class_students_saved_class_id_fkey"
            columns: ["saved_class_id"]
            isOneToOne: false
            referencedRelation: "saved_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_classes: {
        Row: {
          class_name: string
          created_at: string | null
          duration_minutes: number | null
          id: number
          teacher_id: string
        }
        Insert: {
          class_name: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: number
          teacher_id: string
        }
        Update: {
          class_name?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: number
          teacher_id?: string
        }
        Relationships: []
      }
      session_participants: {
        Row: {
          assigned_board_suffix: string
          id: number
          joined_at: string | null
          last_ping_at: string | null
          session_id: string
          student_email: string | null
          student_name: string
          sync_direction: string | null
        }
        Insert: {
          assigned_board_suffix: string
          id?: number
          joined_at?: string | null
          last_ping_at?: string | null
          session_id: string
          student_email?: string | null
          student_name: string
          sync_direction?: string | null
        }
        Update: {
          assigned_board_suffix?: string
          id?: number
          joined_at?: string | null
          last_ping_at?: string | null
          session_id?: string
          student_email?: string | null
          student_name?: string
          sync_direction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          last_action: Json | null
          last_activity_at: string | null
          status: string | null
          teacher_id: string
          title: string
          unique_url_slug: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          last_action?: Json | null
          last_activity_at?: string | null
          status?: string | null
          teacher_id: string
          title?: string
          unique_url_slug: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          last_action?: Json | null
          last_activity_at?: string | null
          status?: string | null
          teacher_id?: string
          title?: string
          unique_url_slug?: string
        }
        Relationships: []
      }
      whiteboard_data: {
        Row: {
          action_type: string
          board_id: string
          created_at: string | null
          id: string
          object_data: Json
          object_id: string
          object_type: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          board_id: string
          created_at?: string | null
          id?: string
          object_data: Json
          object_id: string
          object_type?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          board_id?: string
          created_at?: string | null
          id?: string
          object_data?: Json
          object_id?: string
          object_type?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whiteboard_data_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whiteboard_snapshots: {
        Row: {
          board_id: string
          created_at: string
          id: number
          session_id: string
          snapshot_data: Json
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: never
          session_id: string
          snapshot_data: Json
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: never
          session_id?: string
          snapshot_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "whiteboard_snapshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_unique_slug: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_session_by_slug: {
        Args: { slug: string }
        Returns: {
          id: string
          title: string
          unique_url_slug: string
          status: string
          created_at: string
          duration_minutes: number
        }[]
      }
      update_session_activity: {
        Args: { session_uuid: string }
        Returns: undefined
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
