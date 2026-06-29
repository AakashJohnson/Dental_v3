import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapMarker } from '../../data/demoMapData';

/**
 * RiskHeatLayer — a lightweight canvas "heat" effect using layered translucent
 * circles sized/coloured by each college's risk score. Avoids an extra heatmap
 * dependency while still reading as a real risk heat layer that fades in.
 */
export function RiskHeatLayer({ markers, visible = true }: { markers: MapMarker[]; visible?: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;
    const group = L.layerGroup();
    markers.forEach((m) => {
      const color = m.risk >= 70 ? '#dc2626' : m.risk >= 45 ? '#ea7317' : '#15803d';
      // Outer soft halo + inner core => heat blob.
      L.circle([m.lat, m.lng], {
        radius: 60000 + m.risk * 2200,
        stroke: false,
        fillColor: color,
        fillOpacity: 0.1 + (m.risk / 100) * 0.14,
        className: 'dd-heat-blob',
      }).addTo(group);
      L.circle([m.lat, m.lng], {
        radius: 26000 + m.risk * 700,
        stroke: false,
        fillColor: color,
        fillOpacity: 0.18 + (m.risk / 100) * 0.18,
      }).addTo(group);
    });
    group.addTo(map);
    return () => {
      map.removeLayer(group);
    };
  }, [map, markers, visible]);

  return null;
}
