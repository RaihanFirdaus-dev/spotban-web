import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRoute } from '../hooks/useRoute'

// Fix default icon path broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#f97316;border:3px solid #fff;
    box-shadow:0 0 0 3px #f97316,0 2px 8px rgba(0,0,0,.4)">
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const shopIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:32px;height:32px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);background:#1e293b;border:2px solid #f97316;
    box-shadow:0 2px 6px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center">
    <span style="transform:rotate(45deg);font-size:14px">🔧</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34],
})

const shopIconActive = L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);background:#f97316;border:2px solid #fff;
    box-shadow:0 2px 10px rgba(249,115,22,.7);display:flex;align-items:center;justify-content:center">
    <span style="transform:rotate(45deg);font-size:16px">🔧</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
})

// Fly to selected workshop (only when no route yet)
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.latitude, target.longitude], 16, { duration: 1 })
  }, [target, map])
  return null
}

// Fit map bounds to show full route
function FitRoute({ coordinates, userLocation, selected }) {
  const map = useMap()
  useEffect(() => {
    if (!coordinates || !userLocation || !selected) return
    const bounds = L.latLngBounds([
      [userLocation.lat, userLocation.lng],
      [selected.latitude, selected.longitude],
      ...coordinates,
    ])
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, duration: 1 })
  }, [coordinates, map])
  return null
}

export default function MapView({ workshops, userLocation, selected, onSelect }) {
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [-6.2088, 106.8456]

  const { route, loadingRoute } = useRoute(userLocation, selected)

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
        style={{ background: '#e5e7eb' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Route polyline */}
        {route && (
          <>
            <Polyline
              positions={route.coordinates}
              pathOptions={{ color: '#fff', weight: 7, opacity: 0.6 }}
            />
            <Polyline
              positions={route.coordinates}
              pathOptions={{ color: '#f97316', weight: 4, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
            />
            <FitRoute coordinates={route.coordinates} userLocation={userLocation} selected={selected} />
          </>
        )}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <span style={{ fontWeight: 700, color: '#f97316' }}>📍 Lokasi Saya</span>
            </Popup>
          </Marker>
        )}

        {workshops.map((w) => (
          <Marker
            key={w.id}
            position={[w.latitude, w.longitude]}
            icon={selected?.id === w.id ? shopIconActive : shopIcon}
            eventHandlers={{ click: () => onSelect(w) }}
          >
            <Popup>
              <WorkshopPopup workshop={w} />
            </Popup>
          </Marker>
        ))}

        {!route && <FlyTo target={selected} />}
      </MapContainer>

      {/* Route info panel */}
      {selected && (
        <div className="route-panel">
          {loadingRoute ? (
            <div className="route-panel__loading">
              <span className="route-spinner" />
              Menghitung rute…
            </div>
          ) : route ? (
            <>
              <div className="route-panel__dest">
                <span className="route-panel__icon">🔧</span>
                <span className="route-panel__name">{selected.name}</span>
              </div>
              <div className="route-panel__stats">
                <div className="route-stat">
                  <span className="route-stat__val">{route.summary.distance} km</span>
                  <span className="route-stat__label">Jarak Jalan</span>
                </div>
                <div className="route-divider" />
                <div className="route-stat">
                  <span className="route-stat__val">{route.summary.duration} mnt</span>
                  <span className="route-stat__label">Estimasi</span>
                </div>
              </div>
            </>
          ) : (
            <div className="route-panel__loading">⚠️ Rute tidak tersedia</div>
          )}
        </div>
      )}
    </div>
  )
}

function WorkshopPopup({ workshop: w }) {
  return (
    <div style={{ minWidth: 180 }}>
      {w.primary_photo && (
        <img
          src={w.primary_photo}
          alt={w.name}
          style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 4, marginBottom: 6 }}
        />
      )}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{w.name}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{w.address}</div>
      {w.price_start && (
        <div style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>
          Mulai Rp {Number(w.price_start).toLocaleString('id-ID')}
        </div>
      )}
      {w.distance != null && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
          🛣 {w.distance.toFixed(1)} km dari lokasi Anda
        </div>
      )}
    </div>
  )
}
