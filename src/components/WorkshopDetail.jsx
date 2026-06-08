import { useEffect, useState } from 'react'
import {
  X, MapPin, Tag, Image, ChevronLeft, ChevronRight,
  Navigation2, Car, Wrench, CheckCircle2, XCircle
} from 'lucide-react'
import { parseArray } from '../utils/parseLocation'

const PLACEHOLDER = 'https://placehold.co/800x400/1e293b/f97316?text=SpotBan'

export default function WorkshopDetail({ workshop, loading, onClose }) {
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => { setActivePhoto(0) }, [workshop?.id])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const photos = workshop?.workshop_photos?.length
    ? workshop.workshop_photos
    : [{ photo_url: PLACEHOLDER }]

  const prevPhoto = () => setActivePhoto((p) => (p - 1 + photos.length) % photos.length)
  const nextPhoto = () => setActivePhoto((p) => (p + 1) % photos.length)

  return (
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <div className="detail-panel">
        <button className="detail-close" onClick={onClose} aria-label="Tutup">
          <X size={18} />
        </button>

        {loading ? (
          <DetailSkeleton />
        ) : workshop ? (
          <>
            {/* ── Galeri Foto ── */}
            <div className="detail-gallery">
              <img
                key={activePhoto}
                src={photos[activePhoto]?.photo_url || PLACEHOLDER}
                alt={workshop.name}
                className="detail-main-photo"
                onError={(e) => { e.target.src = PLACEHOLDER }}
              />

              {photos.length > 1 && (
                <>
                  <button className="gallery-nav gallery-nav--prev" onClick={prevPhoto}>
                    <ChevronLeft size={18} />
                  </button>
                  <button className="gallery-nav gallery-nav--next" onClick={nextPhoto}>
                    <ChevronRight size={18} />
                  </button>
                  <div className="gallery-counter">{activePhoto + 1} / {photos.length}</div>
                </>
              )}

              {photos.length > 1 && (
                <div className="gallery-thumbs">
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={`gallery-thumb ${i === activePhoto ? 'gallery-thumb--active' : ''}`}
                    >
                      <img src={p.photo_url || PLACEHOLDER} alt={`Foto ${i + 1}`}
                        onError={(e) => { e.target.src = PLACEHOLDER }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Info Bengkel ── */}
            <div className="detail-body">

              {/* Nama + jarak + status aktif */}
              <div className="detail-header-row">
                <h2 className="detail-name">{workshop.name}</h2>
                <div className="detail-header-badges">
                  {workshop.distance != null && (
                    <span className="detail-dist">
                      <Navigation2 size={12} />
                      {workshop.distance.toFixed(1)} km
                    </span>
                  )}
                  <StatusBadge active={workshop.is_active} />
                </div>
              </div>

              {/* Alamat & harga */}
              <div className="detail-chips">
                {workshop.address && (
                  <div className="detail-chip">
                    <MapPin size={13} className="detail-chip__icon" />
                    <span>{workshop.address}</span>
                  </div>
                )}
                {workshop.price_start && (
                  <div className="detail-chip detail-chip--price">
                    <Tag size={13} className="detail-chip__icon" />
                    <span>
                      Mulai <strong>Rp {Number(workshop.price_start).toLocaleString('id-ID')}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Tipe kendaraan */}
              <TagSection
                icon={<Car size={13} />}
                title="Tipe Kendaraan"
                items={parseArray(workshop.vehicle_types)}
                colorClass="tag--vehicle"
              />

              {/* Tipe layanan */}
              <TagSection
                icon={<Wrench size={13} />}
                title="Layanan Tersedia"
                items={parseArray(workshop.service_types)}
                colorClass="tag--service"
              />

              {/* Deskripsi */}
              {workshop.description && (
                <div className="detail-section">
                  <h3 className="detail-section__title">Tentang Bengkel</h3>
                  <p className="detail-desc">{workshop.description}</p>
                </div>
              )}

              {/* Jumlah foto */}
              {photos.length > 1 && (
                <div className="detail-section">
                  <h3 className="detail-section__title">
                    <Image size={13} style={{ display: 'inline', marginRight: 5 }} />
                    Galeri ({photos.length} foto)
                  </h3>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}

/* ── Sub-components ── */

function StatusBadge({ active }) {
  return active ? (
    <span className="status-badge status-badge--open">
      <CheckCircle2 size={11} /> Buka
    </span>
  ) : (
    <span className="status-badge status-badge--closed">
      <XCircle size={11} /> Tutup
    </span>
  )
}

function TagSection({ icon, title, items, colorClass }) {
  if (!items?.length) return null
  return (
    <div className="detail-section">
      <h3 className="detail-section__title">
        {icon}
        <span style={{ marginLeft: 5 }}>{title}</span>
      </h3>
      <div className="tag-list">
        {items.map((item) => (
          <span key={item} className={`tag ${colorClass}`}>{item}</span>
        ))}
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton skeleton-line" style={{ width: '70%', height: 18 }} />
        <div className="skeleton skeleton-line" style={{ width: '90%' }} />
        <div className="skeleton skeleton-line" style={{ width: '50%' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {[60, 80, 70].map((w) => (
            <div key={w} className="skeleton" style={{ width: w, height: 26, borderRadius: 99 }} />
          ))}
        </div>
        <div style={{ marginTop: 4 }}>
          <div className="skeleton skeleton-line" style={{ width: '40%', marginBottom: 8 }} />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" style={{ width: '80%' }} />
        </div>
      </div>
    </div>
  )
}
