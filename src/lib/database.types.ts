// Shared temporal types
export type TimestampValue = Date | string;
export type DateValue = Date | string;

// Shared geo types
export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

// ENUM types
export type PlantCategory = 'forest' | 'rubber' | 'bamboo' | 'fruit' | 'banana';
export type TreeStatus = 'alive' | 'dead' | 'missing';
export type UserRole = 'pending' | 'staff' | 'researcher' | 'executive' | 'external' | 'admin';
export type ImageType = 'plan_pre_1' | 'plan_pre_2' | 'plan_post_1' | 'gallery';
export type GalleryCategory = 'tree' | 'soil' | 'atmosphere' | 'other';

// Collection interfaces
export interface Profile {
  id: string;
  email: string;
  fullname: string;
  position: string;
  organization: string;
  role: UserRole;
  approved: boolean;
  created_at: TimestampValue;
}

export interface Plot {
  id: string;
  plot_code: string;
  name_short: string;
  owner_name: string;
  group_number: number;
  area_sq_m: number;
  tambon: string;
  elevation_m: number;
  boundary_geojson: GeoJsonPolygon;
  note: string;
  created_at: TimestampValue;
  tree_count: number;
  alive_count: number;
  latest_survey_date: TimestampValue;
}

export interface Tree {
  id: string;
  tree_code: string;
  plot_id: string;
  species_id: string;
  tree_number: number;
  tag_label: string;
  row_main: number;
  row_sub: number;
  utm_x: number;
  utm_y: number;
  geom: GeoJsonPoint;
  grid_spacing: number;
  note: string;
  created_at: TimestampValue;
}

export interface Species {
  id: string;
  species_code: string;
  species_group: 'A' | 'B';
  group_label: string;
  plant_category: PlantCategory;
  name_th: string;
  name_en: string;
  name_sci: string;
  hex_color: string;
  created_at: TimestampValue;
}

export interface GrowthLog {
  id: string;
  tree_id: string;
  survey_date: DateValue;
  recorder_id: string;
  height_m: number;
  status: TreeStatus;
  flowering: boolean;
  note: string;
  synced_from: string;
  created_at: TimestampValue;
}

export interface GrowthDbh {
  id: string;
  growth_log_id: string;
  dbh_cm: number;
}

export interface GrowthBamboo {
  id: string;
  growth_log_id: string;
  culm_count: number;
  dbh_1_cm: number;
  dbh_2_cm: number;
  dbh_3_cm: number;
}

export interface GrowthBanana {
  id: string;
  growth_log_id: string;
  total_plants: number;
  plants_1yr: number;
  yield_bunches: number;
  yield_hands: number;
  price_per_hand: number;
}

export interface PlotImage {
  id: string;
  plot_id: string;
  image_type: ImageType;
  gallery_category: GalleryCategory;
  legacy_url: string;
  storage_path: string;
  description: string;
  uploaded_by: string;
  upload_date: DateValue;
  created_at: TimestampValue;
}

export interface PlotSpacing {
  id: string;
  plot_id: string;
  avg_spacing: number;
  min_spacing: number;
  max_spacing: number;
  tree_count: number;
  note: string;
  measured_date: DateValue;
}

export interface Comment {
  id: string;
  growth_log_id: string;
  author_id: string;
  body: string;
  created_at: TimestampValue;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: TimestampValue;
}
