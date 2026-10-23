// Hand-written to match supabase/migrations/*.sql — no live project to run `supabase gen types` against yet.
// Regenerate from the real schema once a Supabase project exists (`supabase gen types typescript`).
// Shape follows @supabase/postgrest-js's GenericSchema contract exactly (Tables/Views/Functions,
// every table's Relationships array, every view's Relationships array) — omitting any of these
// silently collapses row/insert/update types to `never` throughout the client.
//
// orders is not modeled yet: nothing in the app queries it until checkout is built.

export type ProductCategory = 'hojicha' | 'matcha';
export type ProfileRole = 'consumer' | 'vendor';
export type SupplyLevel = 'scarce' | 'tight' | 'plentiful';
export type TeaMetric = 'cultivated_ha' | 'aracha_t' | 'tencha_t';
export type TeaStatSource = 'maff' | 'zencharen';
export type StockStatus = 'in_stock' | 'sold_out';
export type VendorStatus = 'pending' | 'approved' | 'rejected';
export type ProductStatus = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          role: ProfileRole;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          role?: ProfileRole;
          is_admin?: boolean;
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
          matcha_supply: SupplyLevel | null;
          hojicha_supply: SupplyLevel | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          prefecture?: string | null;
          municipality?: string | null;
          e_stat_area_ha?: number | null;
          scarcity_note?: string | null;
          matcha_supply?: SupplyLevel | null;
          hojicha_supply?: SupplyLevel | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          prefecture?: string | null;
          municipality?: string | null;
          e_stat_area_ha?: number | null;
          scarcity_note?: string | null;
          matcha_supply?: SupplyLevel | null;
          hojicha_supply?: SupplyLevel | null;
          created_at?: string;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          profile_info: string | null;
          website: string | null;
          country: string;
          ships_to: string[];
          status: VendorStatus;
          reviewed_at: string | null;
          review_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          profile_info?: string | null;
          website?: string | null;
          country: string;
          ships_to?: string[];
          status?: VendorStatus;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          profile_info?: string | null;
          website?: string | null;
          country?: string;
          ships_to?: string[];
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          vendor_id: string;
          product_id: string;
          price: number;
          currency: string;
          stock: number;
          url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          product_id: string;
          price: number;
          currency: string;
          stock: number;
          url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          product_id?: string;
          price?: number;
          currency?: string;
          stock?: number;
          url?: string;
        };
        Relationships: [];
      };
      stock_reports: {
        Row: {
          id: number;
          product_id: string;
          user_id: string;
          status: StockStatus;
          created_at: string;
        };
        Insert: {
          product_id: string;
          user_id?: string;
          status: StockStatus;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          user_id?: string;
          status?: StockStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      tea_production_stats: {
        Row: {
          prefecture: string;
          year: number;
          metric: TeaMetric;
          value: number;
          source: TeaStatSource;
          source_ref: string;
        };
        Insert: {
          prefecture: string;
          year: number;
          metric: TeaMetric;
          value: number;
          source: TeaStatSource;
          source_ref: string;
        };
        Update: {
          prefecture?: string;
          year?: number;
          metric?: TeaMetric;
          value?: number;
          source?: TeaStatSource;
          source_ref?: string;
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
          shop_url: string | null;
          status: ProductStatus;
          added_by: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          merged_into: string | null;
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
          shop_url?: string | null;
          status?: ProductStatus;
          added_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          merged_into?: string | null;
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
          shop_url?: string | null;
          status?: ProductStatus;
          added_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          merged_into?: string | null;
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
      // Each person's latest tasting of each tea; what every public number counts.
      latest_reviews: {
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
        Relationships: [];
      };
      // Approved teas with region, rating, weighted score and scarcity rank, for the lists.
      catalogue_teas: {
        Row: {
          id: string;
          name: string;
          brand: string | null;
          category: ProductCategory;
          grade: string | null;
          grade_key: string | null;
          region_id: string | null;
          region_name: string | null;
          supply: SupplyLevel | null;
          supply_rank: number;
          image_url: string | null;
          shop_url: string | null;
          created_at: string;
          review_count: number;
          avg_stars: number | null;
          weighted_score: number | null;
          top_rank: number;
        };
        Relationships: [];
      };
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
      is_admin: { Args: Record<string, never>; Returns: boolean };
      review_tea: {
        Args: { tea: string; decision: 'approved' | 'rejected'; note?: string };
        Returns: undefined;
      };
      set_tea_links: { Args: { tea: string; image: string; shop: string }; Returns: undefined };
      merge_tea: { Args: { duplicate: string; keep: string }; Returns: undefined };
      review_vendor: {
        Args: { vendor: string; decision: 'approved' | 'rejected'; note?: string };
        Returns: undefined;
      };
      reapply_as_vendor: { Args: Record<string, never>; Returns: undefined };
      search_teas: {
        Args: { q: string };
        Returns: { id: string; name: string; brand: string | null; category: ProductCategory }[];
      };
    };
  };
}
