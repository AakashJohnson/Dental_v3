/**
 * Demo map data for the national inspection map.
 *
 * Each marker carries REAL geographic coordinates (lat/lng) so it can be
 * rendered on a real tile-based map (Leaflet/MapLibre/OpenStreetMap). The
 * legacy x/y percentage fields are retained only for backwards compatibility
 * and are no longer used by the main map.
 *
 * Replace with a backend feed later — keep the MapMarker shape stable.
 */

export type MarkerStatus = 'approved' | 'inspection' | 'scrutiny' | 'deficiency' | 'highRisk' | 'scheduled';

export interface MapMarker {
  id: string;
  name: string;
  state: string;
  city: string;
  lat: number; // real latitude
  lng: number; // real longitude
  x: number; // legacy 0-100 (deprecated)
  y: number; // legacy 0-100 (deprecated)
  status: MarkerStatus;
  workflow: string;
  risk: number; // 0-100
  intake: number;
  lastInspection: string;
  nextAction: string;
}

export const MARKER_META: Record<MarkerStatus, { label: string; color: string }> = {
  approved: { label: 'Approved', color: '#15803d' },
  inspection: { label: 'AI Inspection live', color: '#1d4ed8' },
  scrutiny: { label: 'Under scrutiny', color: '#0d5c5c' },
  scheduled: { label: 'Inspection scheduled', color: '#b8860b' },
  deficiency: { label: 'Deficiency', color: '#ea7317' },
  highRisk: { label: 'High risk', color: '#dc2626' },
};

export const MAP_MARKERS: MapMarker[] = [
  { id: 'DD-872845', name: 'Sunrise Dental College', state: 'Karnataka', city: 'Mysuru', lat: 12.2958, lng: 76.6394, x: 38, y: 74, status: 'inspection', workflow: 'New College + First PG', risk: 48, intake: 50, lastInspection: '2026-06-18', nextAction: 'Observer sign-off' },
  { id: 'DD-632149', name: 'Heritage Institute of Dental Sciences', state: 'Maharashtra', city: 'Pune', lat: 18.5204, lng: 73.8567, x: 33, y: 58, status: 'deficiency', workflow: 'Increase BDS/MDS Seats', risk: 66, intake: 150, lastInspection: '2026-05-30', nextAction: 'Compliance reply due' },
  { id: 'DD-939104', name: 'Metro Dental College', state: 'Tamil Nadu', city: 'Chennai', lat: 13.0827, lng: 80.2707, x: 47, y: 84, status: 'approved', workflow: 'Renewal BDS/MDS', risk: 18, intake: 100, lastInspection: '2026-04-12', nextAction: 'LOP issued' },
  { id: 'DD-554120', name: 'Ganga Valley Dental College', state: 'Uttar Pradesh', city: 'Lucknow', lat: 26.8467, lng: 80.9462, x: 47, y: 40, status: 'scrutiny', workflow: 'New College + First PG', risk: 34, intake: 50, lastInspection: '—', nextAction: 'Scrutiny completeness' },
  { id: 'DD-771208', name: 'Coastal Dental Institute', state: 'Kerala', city: 'Kochi', lat: 9.9312, lng: 76.2673, x: 38, y: 88, status: 'scheduled', workflow: 'Recognition', risk: 41, intake: 60, lastInspection: '2026-06-29', nextAction: 'Team dispatch' },
  { id: 'DD-118934', name: 'Deccan Dental Academy', state: 'Telangana', city: 'Hyderabad', lat: 17.3850, lng: 78.4867, x: 44, y: 70, status: 'highRisk', workflow: 'Periodic Inspection', risk: 81, intake: 100, lastInspection: '2026-06-02', nextAction: 'EC adverse review' },
  { id: 'DD-220471', name: 'Aravalli Dental College', state: 'Rajasthan', city: 'Jaipur', lat: 26.9124, lng: 75.7873, x: 33, y: 40, status: 'inspection', workflow: 'Increase BDS/MDS Seats', risk: 52, intake: 120, lastInspection: '2026-06-20', nextAction: 'AI capture in progress' },
  { id: 'DD-390845', name: 'Brahmaputra Dental College', state: 'Assam', city: 'Guwahati', lat: 26.1445, lng: 91.7362, x: 76, y: 38, status: 'deficiency', workflow: 'Renewal BDS/MDS', risk: 59, intake: 50, lastInspection: '2026-05-21', nextAction: 'Re-verification' },
  { id: 'DD-447712', name: 'Kalinga Dental Sciences', state: 'Odisha', city: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, x: 56, y: 58, status: 'approved', workflow: 'Recognition', risk: 22, intake: 80, lastInspection: '2026-03-28', nextAction: 'Recognition granted' },
  { id: 'DD-661230', name: 'Narmada Dental College', state: 'Gujarat', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714, x: 26, y: 52, status: 'scrutiny', workflow: 'New College + First PG', risk: 37, intake: 50, lastInspection: '—', nextAction: 'Document gating' },
  { id: 'DD-805519', name: 'Himalayan Dental Institute', state: 'Himachal Pradesh', city: 'Shimla', lat: 31.1048, lng: 77.1734, x: 41, y: 26, status: 'scheduled', workflow: 'Periodic Inspection', risk: 44, intake: 60, lastInspection: '2026-07-03', nextAction: 'COI clearance' },
  { id: 'DD-913460', name: 'Cauvery Dental College', state: 'Tamil Nadu', city: 'Coimbatore', lat: 11.0168, lng: 76.9558, x: 42, y: 82, status: 'highRisk', workflow: 'Increase BDS/MDS Seats', risk: 77, intake: 150, lastInspection: '2026-06-05', nextAction: 'Government decision' },
];

/** Animated assessor/observer field-inspection route (Pune → Mumbai → Nashik corridor demo). */
export const INSPECTION_ROUTE: [number, number][] = [
  [18.5204, 73.8567], // Pune (origin)
  [18.9388, 73.3150], // Lonavala corridor
  [19.0760, 72.8777], // Mumbai HQ
  [19.9975, 73.7898], // Nashik field site
];

export const STATE_APPLICATIONS = [
  { state: 'Maharashtra', value: 28 },
  { state: 'Tamil Nadu', value: 24 },
  { state: 'Karnataka', value: 22 },
  { state: 'Uttar Pradesh', value: 19 },
  { state: 'Gujarat', value: 14 },
  { state: 'Rajasthan', value: 12 },
  { state: 'Telangana', value: 11 },
  { state: 'Kerala', value: 9 },
];

export const INSPECTION_DENSITY = [
  { month: 'Jan', inspections: 14 },
  { month: 'Feb', inspections: 18 },
  { month: 'Mar', inspections: 22 },
  { month: 'Apr', inspections: 31 },
  { month: 'May', inspections: 27 },
  { month: 'Jun', inspections: 35 },
];
