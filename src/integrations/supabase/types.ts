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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chapters: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          banned_reason: string | null
          banned_until: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          id: string
          is_banned: boolean | null
          phone: string | null
          roll_number: string | null
          state: string | null
          target_exam: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          banned_reason?: string | null
          banned_until?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id: string
          is_banned?: boolean | null
          phone?: string | null
          roll_number?: string | null
          state?: string | null
          target_exam?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          banned_reason?: string | null
          banned_until?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean | null
          phone?: string | null
          roll_number?: string | null
          state?: string | null
          target_exam?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          chapter_id: string
          correct_answer: string
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          marks: number | null
          negative_marks: number | null
          options: Json | null
          partial_marking: boolean | null
          pdf_page_number: number | null
          question_number: number | null
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          correct_answer: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          marks?: number | null
          negative_marks?: number | null
          options?: Json | null
          partial_marking?: boolean | null
          pdf_page_number?: number | null
          question_number?: number | null
          question_text: string
          question_type?: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          correct_answer?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          marks?: number | null
          negative_marks?: number | null
          options?: Json | null
          partial_marking?: boolean | null
          pdf_page_number?: number | null
          question_number?: number | null
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          answers: Json | null
          awaiting_result: boolean | null
          completed_at: string | null
          fullscreen_exit_count: number | null
          id: string
          percentile: number | null
          rank: number | null
          roll_number: string | null
          score: number | null
          started_at: string
          test_id: string
          time_taken_seconds: number | null
          total_marks: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          awaiting_result?: boolean | null
          completed_at?: string | null
          fullscreen_exit_count?: number | null
          id?: string
          percentile?: number | null
          rank?: number | null
          roll_number?: string | null
          score?: number | null
          started_at?: string
          test_id: string
          time_taken_seconds?: number | null
          total_marks?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          awaiting_result?: boolean | null
          completed_at?: string | null
          fullscreen_exit_count?: number | null
          id?: string
          percentile?: number | null
          rank?: number | null
          roll_number?: string | null
          score?: number | null
          started_at?: string
          test_id?: string
          time_taken_seconds?: number | null
          total_marks?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          id: string
          order_index: number | null
          question_id: string
          test_id: string
        }
        Insert: {
          id?: string
          order_index?: number | null
          question_id: string
          test_id: string
        }
        Update: {
          id?: string
          order_index?: number | null
          question_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_section_questions: {
        Row: {
          correct_answer: Json
          created_at: string
          id: string
          marks: number | null
          negative_marks: number | null
          options: Json | null
          order_index: number | null
          pdf_page: number | null
          question_number: number
          question_text: string | null
          section_id: string
          test_id: string
          updated_at: string
        }
        Insert: {
          correct_answer: Json
          created_at?: string
          id?: string
          marks?: number | null
          negative_marks?: number | null
          options?: Json | null
          order_index?: number | null
          pdf_page?: number | null
          question_number: number
          question_text?: string | null
          section_id: string
          test_id: string
          updated_at?: string
        }
        Update: {
          correct_answer?: Json
          created_at?: string
          id?: string
          marks?: number | null
          negative_marks?: number | null
          options?: Json | null
          order_index?: number | null
          pdf_page?: number | null
          question_number?: number
          question_text?: string | null
          section_id?: string
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_section_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "test_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_section_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sections: {
        Row: {
          created_at: string
          id: string
          name: string | null
          order_index: number | null
          section_type: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          order_index?: number | null
          section_type?: string
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          order_index?: number | null
          section_type?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_sections_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "test_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_subjects: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number | null
          test_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number | null
          test_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number | null
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_subjects_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          answer_key_uploaded: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          exam_type: string | null
          fullscreen_enabled: boolean | null
          id: string
          instructions_json: Json | null
          is_published: boolean | null
          name: string
          pdf_url: string | null
          scheduled_at: string | null
          test_type: string
          updated_at: string
        }
        Insert: {
          answer_key_uploaded?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          exam_type?: string | null
          fullscreen_enabled?: boolean | null
          id?: string
          instructions_json?: Json | null
          is_published?: boolean | null
          name: string
          pdf_url?: string | null
          scheduled_at?: string | null
          test_type?: string
          updated_at?: string
        }
        Update: {
          answer_key_uploaded?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          exam_type?: string | null
          fullscreen_enabled?: boolean | null
          id?: string
          instructions_json?: Json | null
          is_published?: boolean | null
          name?: string
          pdf_url?: string | null
          scheduled_at?: string | null
          test_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
