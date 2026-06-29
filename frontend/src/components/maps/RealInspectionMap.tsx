import { ReactNode, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { Layers, Maximize2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { MapMarker, MAP_MARKERS, MARKER_META, MarkerStatus, INSPECTION_ROUTE } from '../../data/demoMapData';
import { InspectionMarkerCluster } from './InspectionMarkerCluster';
import { RiskHeatLayer } from './RiskHeatLayer';
import { InspectionRouteLayer } from './InspectionRouteLayer';

/**
 * RealInspectionMap — a REAL interactive tile-based map (Leaflet + OpenStreetMap
 * / Carto tiles). Replaces all SVG/vector India maps. Tile URL is configurable
 * via the VITE_MAP_TILE_URL environment variable.
 *
 * Production note: the default Carto basemap is fine for low/moderate traffic.
 * For high traffic, set VITE_MAP_TILE_URL to your own MapTiler/Mapbox/Carto key
 * endpoint to avoid overloading public tile servers.
 */

const TILE_URL =
  (import.meta as any).env?.VITE_MAP_TILE_URL ||
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

// Satellite imagery (Esri World Imagery) for the Map/Satellite toggle.
const SAT_URL =
  (import.meta as any).env?.VITE_MAP_SATELLITE_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';

function FitToMarkers({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (!markers.length) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.2), { animate: true });
  }, [map, markers]);
  return null;
}

export function MapLegend({ className = '' }: { className?: string }) {
  const keys = Object.keys(MARKER_META) as MarkerStatus[];
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}>
      {keys.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-soft">
          <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: MARKER_META[k].color }} />
          {MARKER_META[k].label}
        </span>
      ))}
    </div>
  );
}

export function RealInspectionMap({
  markers = MAP_MARKERS,
  height = 460,
  center = [22.0, 79.0],
  zoom = 5,
  showHeat = false,
  showRoute = false,
  route = INSPECTION_ROUTE,
  fitToMarkers = true,
  onSelect,
  className = '',
  defaultLayer = 'map',
  showLayerToggles = true,
  statsStrip,
}: {
  markers?: MapMarker[];
  height?: number | string;
  center?: [number, number];
  zoom?: number;
  showHeat?: boolean;
  showRoute?: boolean;
  route?: [number, number][];
  fitToMarkers?: boolean;
  onSelect?: (m: MapMarker) => void;
  className?: string;
  defaultLayer?: 'map' | 'satellite';
  showLayerToggles?: boolean;
  statsStrip?: ReactNode;
}) {
  const [heat, setHeat] = useState(showHeat);
  const [routeOn, setRouteOn] = useState(showRoute);
  const [base, setBase] = useState<'map' | 'satellite'>(defaultLayer);
  const wrapRef = useRef<HTMLDivElement>(null);
  const h = typeof height === 'number' ? `${height}px` : height;
  const memoMarkers = useMemo(() => markers, [markers]);

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  return (
    <div ref={wrapRef} className={`relative overflow-hidden rounded-2xl border border-teal/15 shadow-card bg-ink ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: h, width: '100%' }}
        className="z-0"
      >
        {base === 'satellite' ? (
          <TileLayer key="sat" url={SAT_URL} attribution={SAT_ATTRIBUTION} />
        ) : (
          <TileLayer key="map" url={TILE_URL} attribution={ATTRIBUTION} />
        )}
        <InspectionMarkerCluster markers={memoMarkers} onSelect={onSelect} />
        {heat && <RiskHeatLayer markers={memoMarkers} />}
        {routeOn && <InspectionRouteLayer route={route} />}
        {fitToMarkers && <FitToMarkers markers={memoMarkers} />}
      </MapContainer>

      {/* Map / Satellite segmented control + fullscreen (top-right, like the reference). */}
      <div className="pointer-events-none absolute right-3 top-3 z-[400] flex items-center gap-2">
        <div className="pointer-events-auto flex overflow-hidden rounded-lg border border-white/40 bg-white/90 text-[12px] font-semibold shadow-card backdrop-blur">
          <button onClick={() => setBase('map')} className={`flex items-center gap-1 px-2.5 py-1.5 transition ${base === 'map' ? 'bg-royal text-white' : 'text-ink-soft hover:bg-ivory-100'}`}>
            <Layers size={13} /> Map
          </button>
          <button onClick={() => setBase('satellite')} className={`px-2.5 py-1.5 transition ${base === 'satellite' ? 'bg-royal text-white' : 'text-ink-soft hover:bg-ivory-100'}`}>
            Satellite
          </button>
        </div>
        <button onClick={toggleFullscreen} title="Fullscreen" className="pointer-events-auto grid h-8 w-8 place-items-center rounded-lg border border-white/40 bg-white/90 text-ink-soft shadow-card backdrop-blur transition hover:bg-white hover:text-ink">
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Layer toggles + legend (glass overlay). */}
      {showLayerToggles && (
        <div className="pointer-events-none absolute left-0 right-0 top-14 z-[400] flex flex-wrap items-start justify-between gap-2 px-3">
          <div className="pointer-events-auto rounded-xl border border-white/30 bg-white/85 px-3 py-2 shadow-card backdrop-blur">
            <MapLegend />
          </div>
          <div className="pointer-events-auto flex gap-1.5">
            <button
              onClick={() => setHeat((v) => !v)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-card transition ${heat ? 'bg-saffron text-white' : 'bg-white/85 text-ink-soft hover:bg-white'}`}
            >
              Risk heat
            </button>
            <button
              onClick={() => setRouteOn((v) => !v)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-card transition ${routeOn ? 'bg-royal text-white' : 'bg-white/85 text-ink-soft hover:bg-white'}`}
            >
              Route
            </button>
          </div>
        </div>
      )}

      {/* Optional bottom dark stats strip (over the map). */}
      {statsStrip && <div className="absolute inset-x-0 bottom-0 z-[400]">{statsStrip}</div>}
    </div>
  );
}
