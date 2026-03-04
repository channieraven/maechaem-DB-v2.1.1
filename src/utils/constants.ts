export const COLLECTION_NAMES = {
  profiles: 'profiles',
  plots: 'plots',
  trees: 'trees',
  species: 'species',
  growthLogs: 'growth_logs',
  growthDbh: 'growth_dbh',
  growthBamboo: 'growth_bamboo',
  growthBanana: 'growth_banana',
  plotImages: 'plot_images',
  plotSpacing: 'plot_spacing',
  importJobs: 'import_jobs',
  comments: 'comments',
  notifications: 'notifications',
  mapLayers: 'map_layers',
} as const;

export const DEFAULT_LAYER_STYLES = {
  plot_boundary: { color: '#16a34a', weight: 2, opacity: 0.8, fillColor: '#16a34a', fillOpacity: 0.1 },
  tree_position: { color: '#0284c7', weight: 1, opacity: 0.9, fillColor: '#0284c7', fillOpacity: 0.7 },
  contour: { color: '#92400e', weight: 1.5, opacity: 0.6 },
  infrastructure: { color: '#6b7280', weight: 2, opacity: 0.7 },
} as const;

export const LAYER_TYPE_LABELS: Record<string, string> = {
  plot_boundary: 'ขอบเขตแปลง',
  tree_position: 'ตำแหน่งต้นไม้',
  contour: 'เส้นชั้นความสูง',
  infrastructure: 'โครงสร้างพื้นฐาน',
};

export const DEFAULT_VALUES = {
  userRole: 'pending',
  treeStatus: 'alive',
  plantCategory: 'forest',
  useFirebaseEmulator: false,
  functionsRegion: 'asia-southeast1',
} as const;
