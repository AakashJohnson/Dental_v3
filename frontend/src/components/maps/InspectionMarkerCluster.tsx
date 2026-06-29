import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import 'leaflet.markercluster';
import { MapMarker, MARKER_META } from '../../data/demoMapData';
import { MapPopupCard } from './MapPopupCard';

/**
 * InspectionMarkerCluster — renders pulsing inspection markers grouped into
 * animated clusters (leaflet.markercluster). High-risk markers glow red.
 * Popups use the rich MapPopupCard (rendered to static HTML for Leaflet).
 */
export function InspectionMarkerCluster({
  markers,
  onSelect,
}: {
  markers: MapMarker[];
  onSelect?: (m: MapMarker) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const cluster = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 48,
      iconCreateFunction: (c: any) => {
        const count = c.getChildCount();
        const size = count > 8 ? 46 : count > 4 ? 40 : 34;
        return L.divIcon({
          html: `<div class="dd-cluster" style="width:${size}px;height:${size}px;font-size:${size / 3}px">${count}</div>`,
          className: 'dd-cluster-wrap',
          iconSize: [size, size],
        });
      },
    });

    markers.forEach((m) => {
      const meta = MARKER_META[m.status];
      const isRisk = m.status === 'highRisk' || m.risk >= 70;
      const icon = L.divIcon({
        className: 'dd-marker-wrap',
        html: `<div class="dd-marker ${isRisk ? 'is-risk' : ''}">
          <span class="dd-ring" style="background:${meta.color}55"></span>
          <span class="dd-dot" style="background:${meta.color}"></span>
        </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker([m.lat, m.lng], { icon, title: m.name });
      marker.bindPopup(renderToStaticMarkup(<MapPopupCard m={m} />), {
        closeButton: true,
        minWidth: 248,
        maxWidth: 248,
      });
      if (onSelect) marker.on('click', () => onSelect(m));
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
    };
  }, [map, markers, onSelect]);

  return null;
}
