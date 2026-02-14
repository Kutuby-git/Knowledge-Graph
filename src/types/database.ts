export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      units: {
        Row: {
          id: number;
          code: string;
          name: string;
          full_name: string;
          description: string | null;
          color: string;
          icon: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["units"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
      };
      sub_themes: {
        Row: {
          id: number;
          unit_id: number;
          theme_order: number;
          label: string;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sub_themes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["sub_themes"]["Insert"]>;
      };
      words: {
        Row: {
          id: number;
          arabic: string;
          arabic_bare: string;
          transliteration: string | null;
          kids_glossary: string | null;
          surah_ayah: string | null;
          is_advanced: boolean;
          part_2: boolean;
          root_id: number | null;
          difficulty_score: number | null;
          difficulty_factors: Json | null;
          part_of_speech: string | null;
          morphological_form: string | null;
          embedding: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["words"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["words"]["Insert"]>;
      };
      roots: {
        Row: {
          id: number;
          letters: string;
          transliteration: string | null;
          meaning: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["roots"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["roots"]["Insert"]>;
      };
      word_themes: {
        Row: {
          id: number;
          word_id: number;
          sub_theme_id: number;
          source_sheet: string | null;
          row_number: number | null;
        };
        Insert: Omit<Database["public"]["Tables"]["word_themes"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["word_themes"]["Insert"]>;
      };
      word_relationships: {
        Row: {
          id: number;
          word_id_1: number;
          word_id_2: number;
          relationship_type: "same_root" | "opposite" | "virtue_pair" | "semantic_similar" | "morphological_variant";
          weight: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["word_relationships"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["word_relationships"]["Insert"]>;
      };
    };
    Functions: {
      search_words: {
        Args: { query_text: string };
        Returns: Database["public"]["Tables"]["words"]["Row"][];
      };
      get_word_connections: {
        Args: { target_word_id: number };
        Returns: {
          word_id: number;
          arabic: string;
          transliteration: string;
          kids_glossary: string;
          relationship_type: string;
          weight: number;
        }[];
      };
    };
  };
}

// Convenience types
export type Unit = Database["public"]["Tables"]["units"]["Row"];
export type SubTheme = Database["public"]["Tables"]["sub_themes"]["Row"];
export type Word = Database["public"]["Tables"]["words"]["Row"];
export type Root = Database["public"]["Tables"]["roots"]["Row"];
export type WordTheme = Database["public"]["Tables"]["word_themes"]["Row"];
export type WordRelationship = Database["public"]["Tables"]["word_relationships"]["Row"];
