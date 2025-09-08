import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';

// Fix default icon paths (works well when bundling with Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [10.4806, -66.9036]; // Caracas, Venezuela

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng || {};
      if (typeof lat === 'number' && typeof lng === 'number') {
        onPick({ latitude: lat, longitude: lng });
      }
    },
  });
  return null;
}

const MapPicker = ({
  value = null, // { latitude, longitude } | null
  onChange,
  center = DEFAULT_CENTER,
  zoom = 12,
  height = '300px',
  className = '',
  accuracy = null, // number (meters)
}) => {
  // Normalize value to array position
  const position = useMemo(() => {
    if (value && typeof value.latitude === 'number' && typeof value.longitude === 'number') {
      return [parseFloat(value.latitude), parseFloat(value.longitude)];
    }
    return null;
  }, [value]);

  // Handler when user clicks over map
  const handlePick = (coords) => {
    onChange?.(coords);
  };

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={position || center}
        zoom={position ? 15 : zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
     >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <ClickHandler onPick={handlePick} />

        {position && (
          <Marker
            position={position}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e?.target;
                const ll = m?.getLatLng?.();
                if (ll) onChange?.({ latitude: ll.lat, longitude: ll.lng });
              },
            }}
          />
        )}

        {position && typeof accuracy === 'number' && accuracy > 0 && (
          <Circle
            center={position}
            radius={accuracy}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15 }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapPicker;
