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

const WORKSHOP_SELECT = '*, workshop_photos(photo_url, is_primary)'
const DETAIL_SELECT   = '*, workshop_photos(id, photo_url, is_primary)'

export default function App() {
  const { user, role, loading: authLoading, signIn, signUp, signOut } = useAuth()

  const [workshops, setWorkshops]         = useState([])
  const [userLocation, setUserLocation]   = useState(null)

  // ── Dua state terpisah ──────────────────────────────────────────────────
  // `activeWorkshop` → bengkel yang dipilih untuk RUTE (tetap ada walau detail ditutup)
  // `detailWorkshop` → bengkel yang sedang dibuka panel detailnya (bisa null)
  const [activeWorkshop, setActiveWorkshop] = useState(null)
  const [detailWorkshop, setDetailWorkshop] = useState(null)
  const [detail, setDetail]                 = useState(null)
  const [loadingDetail, setLoadingDetail]   = useState(false)
  const [loading, setLoading]               = useState(true)
  const [sortBy, setSortBy]                 = useState('distance')

  // 1. GPS — ambil lokasi saat login, langsung flyTo ditangani MapView
  useEffect(() => {
    if (!user) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserLocation({ lat: coords.latitude, lng: coords.longitude }),
      (err) => console.warn('GPS denied:', err),
      { enableHighAccuracy: true }
    )
  }, [user])

  // 2. Fetch daftar bengkel
  useEffect(() => {
    if (!user) return
    async function fetchData() {
      setLoading(true)
      const { data: ws, error } = await supabase
        .from('workshops')
        .select(WORKSHOP_SELECT)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) { console.error(error); setLoading(false); return }

      setWorkshops(
        ws.map((w) => ({
          ...w,
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

  // 3. Fetch detail saat detailWorkshop berubah
  useEffect(() => {
    if (!detailWorkshop) { setDetail(null); return }

    async function fetchDetail() {
      setLoadingDetail(true)
      const { data, error } = await supabase
        .from('workshops')
        .select(DETAIL_SELECT)
        .eq('id', detailWorkshop.id)
        .single()

      if (error) { console.error(error); setLoadingDetail(false); return }

      const sortedPhotos = [...(data.workshop_photos ?? [])].sort(
        (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
      )
      setDetail({
        ...data,
        ...parseLocation(data.location),
        workshop_photos: sortedPhotos,
        distance: detailWorkshop.distance,
      })
      setLoadingDetail(false)
    }
    fetchDetail()
  }, [detailWorkshop?.id])

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

  // Pilih bengkel → set rute aktif + buka detail
  function handleSelect(w) {
    setActiveWorkshop(w)
    setDetailWorkshop(w)
  }

  // Tutup panel detail → rute TETAP ada, hanya panel yang hilang
  function handleCloseDetail() {
    setDetailWorkshop(null)
    setDetail(null)
  }

  // Hapus rute aktif (misal klik X di route panel)
  function handleClearRoute() {
    setActiveWorkshop(null)
    setDetailWorkshop(null)
    setDetail(null)
  }

  if (authLoading) {
    return (
      <div className="auth-loading">
        <span className="route-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        <span>Memuat SpotBan…</span>
      </div>
    )
  }

  if (!user) return <AuthPage onLogin={signIn} onRegister={signUp} />

  return (
    <div className="app-shell">
      <Sidebar
        workshops={sortedWorkshops}
        selected={activeWorkshop}
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
          // MapView pakai activeWorkshop untuk rute & marker aktif
          selected={activeWorkshop}
          onSelect={handleSelect}
          onLocate={setUserLocation}
          onClearRoute={handleClearRoute}
        />
        {/* Panel detail hanya muncul saat detailWorkshop ada */}
        {(detailWorkshop || loadingDetail) && (
          <WorkshopDetail
            workshop={detail}
            loading={loadingDetail}
            onClose={handleCloseDetail}
          />
        )}
      </main>
    </div>
  )
}
