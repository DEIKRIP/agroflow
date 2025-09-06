import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import MapContainer and other components directly
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const useMap = dynamic(
  () => import('react-leaflet').then((mod) => mod.useMap),
  { ssr: false }
);

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const THUNDERFOREST_API_KEY = 'd953e6cb4ed34b0487a72e335333073a';
const THUNDERFOREST_URL = `https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=${THUNDERFOREST_API_KEY}`;

const ParcelMap = ({ parcels = [], selectedParcel, onParcelSelect, className = '' }) => {
  const [mapCenter, setMapCenter] = useState([10.4806, -66.9036]); // Caracas, Venezuela
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMapReady(true);
    }
  }, []);

  useEffect(() => {
    if (selectedParcel?.latitude && selectedParcel?.longitude) {
      setMapCenter([
        parseFloat(selectedParcel.latitude),
        parseFloat(selectedParcel.longitude)
      ]);
    }
  }, [selectedParcel]);

  const getStatusColor = useCallback((status) => {
    const colors = {
      'Activo': '#22C55E',
      'En Preparación': '#F59E0B',
      'Cosechado': '#3B82F6',
      'Inactivo': '#6B7280'
    };
    return colors[status] || '#6B7280';
  }, []);

  if (!mapReady) {
    return <div className="p-4">Cargando mapa...</div>;
  }

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden relative z-0 ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Mapa de Parcelas</h3>
        <div className="text-sm text-muted-foreground">
          {parcels.length} Parcelas
        </div>
      </div>

      <div className="w-full h-[500px]">
        <MapContainer
          center={mapCenter}
          zoom={selectedParcel ? 14 : 10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url={THUNDERFOREST_URL}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.thunderforest.com/">Thunderforest</a>'
          />
          {parcels.map((parcel) => {
            if (!parcel.latitude || !parcel.longitude) return null;
            const position = [
              parseFloat(parcel.latitude),
              parseFloat(parcel.longitude)
            ];
            const isSelected = selectedParcel?.id === parcel.id;
            const color = getStatusColor(parcel.status);

            return (
              <Marker
                key={parcel.id}
                position={position}
                eventHandlers={{
                  click: () => onParcelSelect?.(parcel),
                }}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: `
                    <div style="
                      background: ${color};
                      width: ${isSelected ? '24px' : '20px'};
                      height: ${isSelected ? '24px' : '20px'};
                      border-radius: 50%;
                      border: 2px solid white;
                      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-weight: bold;
                    ">${isSelected ? '📍' : ''}</div>
                  `,
                  iconSize: [isSelected ? 24 : 20, isSelected ? 24 : 20],
                  iconAnchor: [isSelected ? 12 : 10, isSelected ? 24 : 20],
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <h4 className="font-bold">{parcel.name}</h4>
                    <p>Estado: {parcel.status}</p>
                    <p>Área: {parcel.area || 'N/A'} ha</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Activo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs">En Preparación</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Cosechado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-xs">Inactivo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParcelMap;