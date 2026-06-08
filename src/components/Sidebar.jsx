import { MapPin, Navigation, Wrench, ChevronRight, ArrowUpDown, Route, Tag } from 'lucide-react'

const PLACEHOLDER = 'https://placehold.co/400x200/1e293b/f97316?text=SpotBan'

const SORT_OPTIONS = [
  { value: 'distance', label: 'Terdekat', icon: Route },
  { value: 'price',    label: 'Termurah', icon: Tag   },
]

export default function Sidebar({ workshops, selected, onSelect, userLocation, loading, sortBy, onSortChange }) {
  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🔧</span>
          <div>
            <h1 className="logo-title">SpotBan</h1>
            <p className="logo-sub">Tambal Ban Terdekat</p>
          </div>
        </div>
        <div className="gps-badge">
          <Navigation size={12} />
          <span>{userLocation ? 'GPS Aktif' : 'Mencari GPS…'}</span>
        </div>
      </div>

      {/* Sort bar */}
      <div className="sort-bar">
        <div className="sort-bar__label">
          <ArrowUpDown size={13} />
          <span>Urutkan</span>
        </div>
        <div className="sort-tabs">
          {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onSortChange(value)}
              className={`sort-tab ${sortBy === value ? 'sort-tab--active' : ''}`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="result-bar">
        <Wrench size={14} className="result-icon" />
        <span>
          {loading ? 'Memuat bengkel…' : `${workshops.length} bengkel ditemukan`}
        </span>
      </div>

      {/* Cards */}
      <div className="card-list">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : workshops.map((w, idx) => (
              <WorkshopCard
                key={w.id}
                workshop={w}
                rank={idx + 1}
                isSelected={selected?.id === w.id}
                sortBy={sortBy}
                onClick={() => onSelect(w)}
              />
            ))}
      </div>
    </aside>
  )
}

function WorkshopCard({ workshop: w, rank, isSelected, sortBy, onClick }) {
  // Badge value changes depending on active sort
  const badge =
    sortBy === 'price' && w.price_start
      ? `Rp ${Number(w.price_start).toLocaleString('id-ID')}`
      : w.distance != null
      ? `${w.distance.toFixed(1)} km`
      : null

  return (
    <button
      onClick={onClick}
      className={`workshop-card ${isSelected ? 'workshop-card--active' : ''}`}
    >
      <div className="card-img-wrap">
        <img
          src={w.primary_photo || PLACEHOLDER}
          alt={w.name}
          className="card-img"
          onError={(e) => { e.target.src = PLACEHOLDER }}
        />
        <span className="card-rank">#{rank}</span>
      </div>

      <div className="card-body">
        <div className="card-top">
          <h3 className="card-name">{w.name}</h3>
          {badge && <span className="card-dist">{badge}</span>}
        </div>

        <div className="card-address">
          <MapPin size={11} />
          <span>{w.address}</span>
        </div>

        <div className="card-meta-row">
          {w.distance != null && sortBy !== 'distance' && (
            <span className="card-meta-chip">
              <Route size={10} /> {w.distance.toFixed(1)} km
            </span>
          )}
          {w.price_start && sortBy !== 'price' && (
            <span className="card-meta-chip">
              <Tag size={10} /> Rp {Number(w.price_start).toLocaleString('id-ID')}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="card-arrow" />
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line w-3/4" />
        <div className="skeleton skeleton-line w-1/2" />
        <div className="skeleton skeleton-line w-2/3" />
      </div>
    </div>
  )
}
