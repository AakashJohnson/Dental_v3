/**
 * Background presets — declarative recipe per page variant describing which
 * animated layers compose that page's background. Consumed by <PageBackground>.
 */
export type BgLayer =
  | 'aurora'
  | 'grid'
  | 'nodes'
  | 'scan'
  | 'mapPulse'
  | 'dental'
  | 'paper'
  | 'indiaMap'
  | 'hud'
  | 'analytics'
  | 'security';

export type BgVariant =
  | 'public'
  | 'ai'
  | 'colleges'
  | 'workflows'
  | 'process'
  | 'documents'
  | 'regulations'
  | 'about'
  | 'login'
  | 'dashboard'
  | 'reports';

export const BACKGROUND_PRESETS: Record<BgVariant, BgLayer[]> = {
  public: ['aurora', 'grid', 'indiaMap', 'nodes', 'mapPulse'],
  ai: ['aurora', 'scan', 'hud', 'nodes', 'dental'],
  colleges: ['aurora', 'grid', 'indiaMap', 'mapPulse', 'nodes'],
  workflows: ['aurora', 'grid', 'nodes', 'dental'],
  process: ['aurora', 'grid', 'nodes'],
  documents: ['aurora', 'paper', 'nodes'],
  regulations: ['aurora', 'paper', 'nodes'],
  about: ['aurora', 'grid', 'nodes'],
  login: ['aurora', 'security', 'grid', 'nodes'],
  dashboard: ['grid', 'indiaMap', 'nodes', 'analytics'],
  reports: ['aurora', 'analytics', 'mapPulse', 'nodes'],
};
