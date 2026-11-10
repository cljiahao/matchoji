// Hand-written to match supabase/migrations/*.sql — no live project to run `supabase gen types` against yet.
// Regenerate from the real schema once a Supabase project exists (`supabase gen types typescript`).
// Shape follows @supabase/postgrest-js's GenericSchema contract exactly (Tables/Views/Functions,
// every table's Relationships array, every view's Relationships array) — omitting any of these
// silently collapses row/insert/update types to `never` throughout the client.
//
// `pnpm schema:check` compares this file's tables, columns, nullability and enums with the live
// database's `supabase gen types` output, so a migration needs its types updated here too.

export type ProductCategory = 'hojicha' | 'matcha';
export type ProfileRole = 'consumer' | 'vendor';
export type SupplyLevel = 'scarce' | 'tight' | 'plentiful';
// Where a tea's price per gram sits among priced teas of its category.
export type PriceBand = 'budget' | 'mid' | 'premium';
export type ShopKind = 'maker_store' | 'stockist' | 'cafe';
export type TeaMetric = 'cultivated_ha' | 'aracha_t' | 'tencha_t';
export type TeaStatSource = 'maff' | 'zencharen';
export type StockStatus = 'in_stock' | 'sold_out';
export type VendorStatus = 'pending' | 'approved' | 'rejected';
export type NotificationKind =
  | 'follow'
  | 'like'
  | 'comment'
  | 'tea_reviewed'
  | 'shop_reviewed'
  | 'report_resolved'
  | 'cafe_reviewed'
  | 'drink_reviewed';
export type ReportTarget = 'review' | 'comment';
export type Flush = 'first' | 'second' | 'autumn' | 'unspecified';
export type ProductStatus = 'pending' | 'approved' | 'rejected';
export type CafeStatus = 'pending' | 'approved' | 'rejected';
export type DrinkStatus = 'pending' | 'approved' | 'rejected';
export type CityCountry = 'SG' | 'MY';
export type DrinkCurrency = 'SGD' | 'MYR';
export type DrinkBase = 'hojicha' | 'matcha';
export type DrinkStyle = 'latte' | 'straight' | 'iced_latte' | 'float' | 'other';
export type DrinkServing = 'hot' | 'iced' | 'both';
export type Disclosure = 'none' | 'invited' | 'gifted' | 'paid';

// The migration 20261110000000_cafes_and_drinks.sql makes reviews.product_id nullable and adds
// drink_id, instagram_url, disclosure, tea_strength, roast and by_trusted_taster to reviews and
// latest_reviews. Their Row types below still show the tea-only shape until the review
// consumers are made drink-safe (slice S2), which changes Row and REVIEW_COLUMNS together.
export interface Database {
  public: {
    Tables: {
      cities: {
        Row: {
          slug: string;
          name: string;
          country: CityCountry;
          currency: DrinkCurrency;
          sort_order: number;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      cafes: {
        Row: {
          id: string;
          slug: string;
          name: string;
          city_slug: string;
          area: string | null;
          address: string | null;
          lat: number | null;
          lng: number | null;
          instagram_handle: string | null;
          website_url: string | null;
          status: CafeStatus;
          added_by: string | null;
          review_note: string | null;
          merged_into: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        // Suggestions only: status, credit, slug and review fields are set by the database.
        Insert: {
          name: string;
          city_slug: string;
          area?: string | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          instagram_handle?: string | null;
          website_url?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      drinks: {
        Row: {
          id: string;
          cafe_id: string;
          slug: string;
          name: string;
          base: DrinkBase;
          style: DrinkStyle;
          serving: DrinkServing;
          price: number | null;
          currency: DrinkCurrency;
          photo_url: string | null;
          photo_credit: string | null;
          tea_product_id: string | null;
          status: DrinkStatus;
          added_by: string | null;
          review_note: string | null;
          merged_into: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        // Suggestions only: a photo, status, currency and slug are never set by the client.
        Insert: {
          cafe_id: string;
          name: string;
          base: DrinkBase;
          style: DrinkStyle;
          serving: DrinkServing;
          price?: number | null;
          tea_product_id?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          occurred_at: string;
          actor_id: string | null;
          table_name: string;
          action: string;
          old_row: Record<string, unknown> | null;
          new_row: Record<string, unknown> | null;
        };
        // Written only by the audit triggers; the app never inserts or updates it.
        Insert: never;
        Update: never;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          buyer_user_id: string;
          listing_id: string;
          qty: number;
          status: string;
          payment_ref: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_user_id: string;
          listing_id: string;
          qty?: number;
          status?: string;
          payment_ref?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          buyer_user_id?: string;
          listing_id?: string;
          qty?: number;
          status?: string;
          payment_ref?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          role: ProfileRole;
          is_admin: boolean;
          is_public: boolean;
          created_at: string;
          is_trusted_taster: boolean;
          instagram_handle: string | null;
          bio: string | null;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          role?: ProfileRole;
          is_admin?: boolean;
          is_public?: boolean;
          created_at?: string;
          is_trusted_taster?: boolean;
          instagram_handle?: string | null;
          bio?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          role?: ProfileRole;
          is_public?: boolean;
          created_at?: string;
          is_trusted_taster?: boolean;
          instagram_handle?: string | null;
          bio?: string | null;
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
      follows: {
        Row: { follower_id: string; followee_id: string; created_at: string };
        Insert: { follower_id: string; followee_id: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string };
        Insert: { blocker_id: string; blocked_id: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      review_likes: {
        Row: { review_id: string; user_id: string; created_at: string };
        Insert: { review_id: string; user_id: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      review_comments: {
        Row: { id: string; review_id: string; user_id: string; body: string; created_at: string };
        Insert: {
          id?: string;
          review_id: string;
          user_id?: string;
          body: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: number;
          user_id: string;
          kind: NotificationKind;
          actor_id: string | null;
          review_id: string | null;
          product_id: string | null;
          drink_id: string | null;
          cafe_id: string | null;
          body: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: { read_at?: string | null };
        Relationships: [];
      };
      content_reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: ReportTarget;
          target_id: string;
          reason: string;
          status: 'open' | 'removed' | 'dismissed';
          resolution_note: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          reporter_id?: string;
          target_type: ReportTarget;
          target_id: string;
          reason: string;
        };
        Update: Record<string, never>;
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
      shop_locations: {
        Row: {
          id: string;
          brand: string;
          name: string;
          kind: ShopKind;
          address: string;
          city: string;
          country: string;
          lat: number;
          lng: number;
          source_url: string;
          checked_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand: string;
          name: string;
          kind: ShopKind;
          address: string;
          city: string;
          country: string;
          lat: number;
          lng: number;
          source_url: string;
          checked_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand?: string;
          name?: string;
          kind?: ShopKind;
          address?: string;
          city?: string;
          country?: string;
          lat?: number;
          lng?: number;
          source_url?: string;
          checked_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tea_price_history: {
        Row: {
          id: string;
          product_id: string;
          price: number;
          pack_grams: number;
          currency: string;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          price: number;
          pack_grams: number;
          currency?: string;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          price?: number;
          pack_grams?: number;
          currency?: string;
          recorded_at?: string;
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
          // Who the photo comes from, shown under it; set by admins with the photo.
          image_credit: string | null;
          shop_url: string | null;
          status: ProductStatus;
          added_by: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          merged_into: string | null;
          // Reference price in SGD for one pack, set by admins; both or neither.
          price_sgd: number | null;
          pack_grams: number | null;
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
          image_credit?: string | null;
          shop_url?: string | null;
          status?: ProductStatus;
          added_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          merged_into?: string | null;
          price_sgd?: number | null;
          pack_grams?: number | null;
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
          image_credit?: string | null;
          shop_url?: string | null;
          status?: ProductStatus;
          added_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          merged_into?: string | null;
          price_sgd?: number | null;
          pack_grams?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      // Learn tab lessons each person has finished; slugs of repo content, private to the learner.
      lesson_progress: {
        Row: {
          user_id: string;
          course_slug: string;
          lesson_slug: string;
          created_at: string;
        };
        Insert: {
          course_slug: string;
          lesson_slug: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      // One row per label photo read, only to cap scans per day; the photo is never stored.
      label_scans: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          // Null once the author deleted their account; the rating stays, anonymised.
          user_id: string | null;
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
          harvest_year: number | null;
          flush: Flush | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id?: string | null;
          drink_id?: string | null;
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
          harvest_year?: number | null;
          flush?: Flush | null;
          instagram_url?: string | null;
          disclosure?: Disclosure;
          tea_strength?: number | null;
          roast?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string | null;
          drink_id?: string | null;
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
          harvest_year?: number | null;
          flush?: Flush | null;
          instagram_url?: string | null;
          disclosure?: Disclosure;
          tea_strength?: number | null;
          roast?: number | null;
        };
        Relationships: [];
      };
      wishlist: {
        Row: {
          user_id: string;
          product_id: string;
          created_at: string;
          owned_quantity: number;
          opened_on: string | null;
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
          owned_quantity?: number;
          opened_on?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      // Each person's latest tasting of each tea; what every public number counts.
      latest_reviews: {
        Row: {
          id: string;
          // Null once the author deleted their account; the rating stays, anonymised.
          user_id: string | null;
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
          harvest_year: number | null;
          flush: Flush | null;
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
          price_sgd: number | null;
          pack_grams: number | null;
          price_per_gram: number | null;
          price_band: PriceBand | null;
        };
        Relationships: [];
      };
      // Approved priced teas: price per gram and its band within the category.
      tea_prices: {
        Row: {
          product_id: string;
          price_sgd: number;
          pack_grams: number;
          price_per_gram: number;
          price_band: PriceBand | null;
        };
        Relationships: [];
      };
      // Each tea's community taste: averaged sliders and note mentions, from latest_reviews.
      tea_taste_profiles: {
        Row: {
          product_id: string;
          sweetness: number | null;
          umami: number | null;
          bitterness: number | null;
          body: number | null;
          notes: Record<string, number>;
        };
        Relationships: [];
      };
      // Ratings per harvest year and flush; top_harvest marks a tea's best with 3+ ratings.
      edition_ratings: {
        Row: {
          product_id: string;
          harvest_year: number;
          flush: Flush;
          review_count: number;
          avg_stars: number;
          top_harvest: boolean;
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
          is_public: boolean;
          created_at: string;
          is_trusted_taster: boolean;
          instagram_handle: string | null;
          bio: string | null;
        };
        Relationships: [];
      };
      // Approved drinks at approved cafés. Taster and community scores are never blended.
      drink_ratings: {
        Row: {
          drink_id: string;
          taster_count: number;
          taster_avg: number | null;
          taster_disclosed_count: number;
          community_count: number;
          community_avg: number | null;
        };
        Relationships: [];
      };
      cafe_ratings: {
        Row: {
          cafe_id: string;
          drink_count: number;
          taster_count: number;
          taster_avg: number | null;
          community_count: number;
          community_avg: number | null;
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
      // image null keeps the current photo; '' clears it and its credit.
      set_tea_links: {
        Args: { tea: string; image: string | null; shop: string; credit: string };
        Returns: undefined;
      };
      set_tea_price: {
        Args: { tea: string; price: number | null; grams: number | null };
        Returns: undefined;
      };
      merge_tea: { Args: { duplicate: string; keep: string }; Returns: undefined };
      review_vendor: {
        Args: { vendor: string; decision: 'approved' | 'rejected'; note?: string };
        Returns: undefined;
      };
      reapply_as_vendor: { Args: Record<string, never>; Returns: undefined };
      health: { Args: Record<string, never>; Returns: boolean };
      resolve_report: {
        Args: { report: string; decision: 'removed' | 'dismissed'; note?: string };
        Returns: undefined;
      };
      following_feed: {
        Args: { max_rows?: number };
        Returns: Database['public']['Tables']['reviews']['Row'][];
      };
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
      product_reviews: {
        Args: { product: string };
        Returns: (Database['public']['Tables']['reviews']['Row'] & { author_private: boolean })[];
      };
      slugify: { Args: { txt: string }; Returns: string };
      set_trusted_taster: { Args: { person: string; value: boolean }; Returns: undefined };
      review_cafe: {
        Args: { cafe: string; decision: 'approved' | 'rejected'; note?: string };
        Returns: undefined;
      };
      review_drink: {
        Args: { drink: string; decision: 'approved' | 'rejected'; note?: string };
        Returns: undefined;
      };
      merge_cafe: { Args: { duplicate: string; keep: string }; Returns: undefined };
      merge_drink: { Args: { duplicate: string; keep: string }; Returns: undefined };
      drink_reviews: {
        Args: { drink: string };
        Returns: (Omit<Database['public']['Tables']['reviews']['Row'], 'product_id'> & {
          product_id: string | null;
          drink_id: string | null;
          author_private: boolean;
          instagram_url: string | null;
          disclosure: Disclosure;
          tea_strength: number | null;
          roast: number | null;
          by_trusted_taster: boolean;
        })[];
      };
      is_public_profile: { Args: { person: string }; Returns: boolean };
      search_teas: {
        Args: { q: string };
        Returns: { id: string; name: string; brand: string | null; category: ProductCategory }[];
      };
    };
  };
}
