// Hand-written to match supabase/migrations/*.sql — no live project to run `supabase gen types` against yet.
// Regenerate from the real schema once a Supabase project exists (`supabase gen types typescript`).
// Shape follows @supabase/postgrest-js's GenericSchema contract exactly (Tables/Views/Functions,
// every table's Relationships array, every view's Relationships array) — omitting any of these
// silently collapses row/insert/update types to `never` throughout the client.
//
// Phase 3 tables (vendors, listings, orders) are intentionally not modeled here yet — nothing in
// the app queries them, and guessing their shape now would be untested drift risk for no benefit.

export type ProductCategory = 'hojicha' | 'matcha';
export type ProfileRole = 'consumer' | 'vendor';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          role: ProfileRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          role?: ProfileRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          role?: ProfileRole;
          created_at?: string;
        };
        Relationships: [];
      };
      regions: {
        Row: {
          id: string;
          name: string;
          prefecture: string | null;
          municipality: string | null;
          e_stat_area_ha: number | null;
          scarcity_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          prefecture?: string | null;
          municipality?: string | null;
          e_stat_area_ha?: number | null;
          scarcity_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          prefecture?: string | null;
          municipality?: string | null;
          e_stat_area_ha?: number | null;
          scarcity_note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          brand: string | null;
          category: ProductCategory;
          grade: string | null;
          region_id: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          brand?: string | null;
          category: ProductCategory;
          grade?: string | null;
          region_id?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          brand?: string | null;
          category?: ProductCategory;
          grade?: string | null;
          region_id?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          stars: number;
          notes: string | null;
          photo_url: string | null;
          created_at: string;
          flavor_notes: string[];
          sweetness: number | null;
          umami: number | null;
          bitterness: number | null;
          body: number | null;
          prep_method: string | null;
          dose_g: number | null;
          water_ml: number | null;
          water_temp_c: number | null;
          tasted_on: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          stars: number;
          notes?: string | null;
          photo_url?: string | null;
          created_at?: string;
          flavor_notes?: string[];
          sweetness?: number | null;
          umami?: number | null;
          bitterness?: number | null;
          body?: number | null;
          prep_method?: string | null;
          dose_g?: number | null;
          water_ml?: number | null;
          water_temp_c?: number | null;
          tasted_on?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          stars?: number;
          notes?: string | null;
          photo_url?: string | null;
          created_at?: string;
          flavor_notes?: string[];
          sweetness?: number | null;
          umami?: number | null;
          bitterness?: number | null;
          body?: number | null;
          prep_method?: string | null;
          dose_g?: number | null;
          water_ml?: number | null;
          water_temp_c?: number | null;
          tasted_on?: string;
        };
        Relationships: [];
      };
      wishlist: {
        Row: {
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      product_ratings: {
        Row: {
          product_id: string;
          review_count: number;
          avg_stars: number;
        };
        Relationships: [];
      };
      public_profiles: {
        Row: {
          id: string;
          display_name: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
