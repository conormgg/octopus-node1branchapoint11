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
          session_id: string
          student_email: string | null
          student_name: string
        }
        Insert: {
          assigned_board_suffix: string
          id?: number
          joined_at?: string | null
          session_id: string
          student_email?: string | null
          student_name: string
        }
        Update: {
          assigned_board_suffix?: string
          id?: number
          joined_at?: string | null
          session_id?: string
          student_email?: string | null
          student_name?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_unique_slug: {
        Args: Record<PropertyKey, never>
        Returns: string
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
