import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabaseClient'
import { haversine } from './utils/haversine'
import { parseLocation } from './utils/parseLocation'
import { useAuth } from './hooks/useAuth'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import WorkshopDetail from './components/WorkshopDetail'
import AuthPage from './components/AuthPage'
import './index.css'

// Kolom workshops yang diambil (tanpa foto)
const WORKSHOP_SELECT =
  '*, workshop_photos(photo_url, is_primary)'

// Kolom detail lengkap saat bengkel dipilih
const DETAIL_SELECT =
  '*, workshop_photos(id, photo_url, is_primary)'

export default function App() {
  const { user, role, loading: authLoading, signIn, signUp, signOut } = useAuth()

  const [workshops, setWorkshops]       = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [selected, setSelected]         = useState(null)
  const [detail, setDetail]             = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [sortBy, setSortBy]             = useState('distance')

  // 1. GPS — hanya setelah login
  useEffect(() => {
    if (!user) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserLocation({ lat: coords.latitude, lng: coords.longitude }),
      (err) => console.warn('GPS denied:', err),
      { enableHighAccuracy: true }
    )
  }, [user])

  // 2. Fetch daftar bengkel (aktif saja)
  useEffect(() => {
    if (!user) return
    async function fetchData() {
      setLoading(true)
      const { data: ws, error } = await supabase
        .from('workshops')
        .select(WORKSHOP_SELECT)
        .eq('is_active', true)          // hanya bengkel yang aktif
        .order('name', { ascending: true })

      if (error) { console.error(error); setLoading(false); return }

      setWorkshops(
        ws.map((w) => ({
          ...w,
          // Ekstrak lat/lng dari field location (PostGIS)
          ...parseLocation(w.location),
          primary_photo:
            w.workshop_photos?.find((p) => p.is_primary)?.photo_url ||
            w.workshop_photos?.[0]?.photo_url ||
            null,
        }))
      )
      setLoading(false)
    }
    fetchData()
  }, [user])

  // 3. Fetch detail lengkap saat bengkel dipilih
  useEffect(() => {
    if (!selected) { setDetail(null); return }

    async function fetchDetail() {
      setLoadingDetail(true)
      const { data, error } = await supabase
        .from('workshops')
        .select(DETAIL_SELECT)
        .eq('id', selected.id)
        .single()

      if (error) { console.error(error); setLoadingDetail(false); return }

      const sortedPhotos = [...(data.workshop_photos ?? [])].sort(
        (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
      )

      setDetail({
        ...data,
        ...parseLocation(data.location), // pastikan lat/lng tersedia
        workshop_photos: sortedPhotos,
        distance: selected.distance,     // jarak dari haversine
      })
      setLoadingDetail(false)
    }
    fetchDetail()
  }, [selected?.id])

  // 4. Hitung jarak + sort
  const sortedWorkshops = useMemo(() => {
    const withDistance = workshops.map((w) => ({
      ...w,
      distance: userLocation && w.lat && w.lng
        ? haversine(userLocation.lat, userLocation.lng, w.lat, w.lng)
        : null,
    }))
    if (sortBy === 'price')
      return [...withDistance].sort((a, b) => (a.price_start ?? Infinity) - (b.price_start ?? Infinity))
    return [...withDistance].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
  }, [workshops, userLocation, sortBy])

  function handleSelect(w)  { setSelected(w) }
  function handleClose()    { setSelected(null); setDetail(null) }

  // ── Loading awal (cek sesi) ──
  if (authLoading) {
    return (
      <div className="auth-loading">
        <span className="route-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        <span>Memuat SpotBan…</span>
      </div>
    )
  }

  // ── Belum login ──
  if (!user) return <AuthPage onLogin={signIn} onRegister={signUp} />

  // ── Sudah login ──
  return (
    <div className="app-shell">
      <Sidebar
        workshops={sortedWorkshops}
        selected={selected}
        onSelect={handleSelect}
        userLocation={userLocation}
        loading={loading}
        sortBy={sortBy}
        onSortChange={setSortBy}
        user={user}
        role={role}
        onSignOut={signOut}
      />
      <main className="map-area">
        <MapView
          workshops={sortedWorkshops}
          userLocation={userLocation}
          selected={selected}
          onSelect={handleSelect}
          onLocate={setUserLocation}
        />
        {(selected || loadingDetail) && (
          <WorkshopDetail
            workshop={detail}
            loading={loadingDetail}
            onClose={handleClose}
          />
        )}
      </main>
    </div>
  )
}
