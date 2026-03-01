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
} as const;

export const DEFAULT_VALUES = {
  userRole: 'pending',
  treeStatus: 'alive',
  plantCategory: 'forest',
  useFirebaseEmulator: false,
  functionsRegion: 'asia-southeast1',
} as const;
