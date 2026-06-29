import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * GeoProofMap — small interactive map that visualises the proposed college site
 * and its attached hospital, with a connecting line coloured by whether the
 * distance is within the statutory limit (Reg 6(h), ≤10 km).
 */
const TILE_URL =
  (import.meta as any).env?.VITE_MAP_TILE_URL ||
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

function pin(color: string, letter: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.35)"><span style="transform:rotate(45deg);color:#fff;font-size:11px;font-weight:700">${letter}</span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    tooltipAnchor: [0, -20],
  });
}

function FitBounds({ a, b }: { a: [number, number]; b: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([a, b]);
    map.fitBounds(bounds.pad(0.4), { animate: false, maxZoom: 14 });
  }, [map, a, b]);
  return null;
}

export function GeoProofMap({
  college,
  hospital,
  distanceKm,
  withinLimit,
}: {
  college: [number, number];
  hospital: [number, number];
  distanceKm: number;
  withinLimit: boolean;
}) {
  const lineColor = withinLimit ? '#16a34a' : '#dc2626';
  return (
    <div className="h-56 overflow-hidden rounded-lg border border-teal/15">
      <MapContainer center={college} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
        <Marker position={college} icon={pin('#0f766e', 'C')}>
          <Tooltip>College site</Tooltip>
        </Marker>
        <Marker position={hospital} icon={pin('#b45309', 'H')}>
          <Tooltip>Attached hospital</Tooltip>
        </Marker>
        <Polyline positions={[college, hospital]} pathOptions={{ color: lineColor, weight: 3, dashArray: '6 6' }}>
          <Tooltip permanent direction="center">{distanceKm} km</Tooltip>
        </Polyline>
        <FitBounds a={college} b={hospital} />
      </MapContainer>
    </div>
  );
}
