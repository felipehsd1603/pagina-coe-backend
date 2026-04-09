/**
 * Feature flags by role — backend mirror of frontend featureFlags.ts.
 * Used by requireFeature middleware to authorize API endpoints.
 */

type Role = 'VIEWER' | 'EDITOR' | 'ADMIN';

export type Feature =
  | 'dashboard'
  | 'apps'
  | 'apps.manage'
  | 'demands'
  | 'demands.manage'
  | 'testimonials'
  | 'testimonials.manage'
  | 'courses'
  | 'courses.manage'
  | 'metrics'
  | 'metrics.manage'
  | 'users'
  | 'coe-sync'
  | 'citizen-devs';

export const ROLE_FEATURES: Record<Role, Feature[]> = {
  VIEWER: [
    'dashboard',
    'apps',
    'demands',
    'testimonials',
    'courses',
    'metrics',
    'citizen-devs',
  ],
  EDITOR: [
    'dashboard',
    'apps',
    'apps.manage',
    'demands',
    'demands.manage',
    'testimonials',
    'testimonials.manage',
    'courses',
    'courses.manage',
    'metrics',
    'citizen-devs',
  ],
  ADMIN: [
    'dashboard',
    'apps',
    'apps.manage',
    'demands',
    'demands.manage',
    'testimonials',
    'testimonials.manage',
    'courses',
    'courses.manage',
    'metrics',
    'metrics.manage',
    'users',
    'coe-sync',
    'citizen-devs',
  ],
};

/**
 * Check if a given role has a specific feature.
 */
export function roleHasFeature(role: string, feature: Feature): boolean {
  const features = ROLE_FEATURES[role as Role];
  return features?.includes(feature) ?? false;
}

/**
 * Get all features for a given role.
 */
export function getFeaturesForRole(role: string): Feature[] {
  return ROLE_FEATURES[role as Role] ?? [];
}
