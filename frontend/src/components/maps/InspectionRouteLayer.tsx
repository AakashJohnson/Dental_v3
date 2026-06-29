import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * InspectionRouteLayer — draws an animated assessor/observer field-inspection
 * route line (dashed, "drawing" animation via stroke-dashoffset) with origin
 * and destination markers.
 */
export function InspectionRouteLayer({
  route,
  color = '#1d4ed8',
  visible = true,
}: {
  route: [number, number][];
  color?: string;
  visible?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!visible || route.length < 2) return;
    const group = L.layerGroup();

    const line = L.polyline(route, {
      color,
      weight: 3,
      opacity: 0.9,
      dashArray: '10 12',
      className: 'dd-route-line',
      lineCap: 'round',
    }).addTo(group);

    // Animate the dash to suggest direction of travel.
    let offset = 0;
    const path = (line as any).getElement?.() as SVGPathElement | undefined;
    const timer = window.setInterval(() => {
      offset = (offset - 2) % 1000;
      if (path) path.style.strokeDashoffset = String(offset);
    }, 60);

    const origin = route[0];
    const dest = route[route.length - 1];
    L.circleMarker(origin, { radius: 6, color: '#fff', weight: 2, fillColor: '#15803d', fillOpacity: 1 })
      .bindTooltip('Inspection origin', { direction: 'top' })
      .addTo(group);
    L.circleMarker(dest, { radius: 6, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 })
      .bindTooltip('Field site', { direction: 'top' })
      .addTo(group);

    group.addTo(map);
    return () => {
      window.clearInterval(timer);
      map.removeLayer(group);
    };
  }, [map, route, color, visible]);

  return null;
}
