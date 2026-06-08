/**
 * Mem-parse berbagai format field `location` dari Supabase PostGIS
 * menjadi { lat, lng } yang bisa dipakai Leaflet.
 *
 * Format yang didukung:
 *  - GeoJSON object  : { type: "Point", coordinates: [lng, lat] }
 *  - WKT string      : "POINT(lng lat)"
 *  - Plain object    : { lat, lng } atau { latitude, longitude }
 *  - null / undefined: return null
 */
export function parseLocation(location) {
  if (!location) return null

  try {
    // 1. Sudah berupa object (GeoJSON atau plain)
    if (typeof location === 'object') {
      // GeoJSON Point
      if (location.type === 'Point' && Array.isArray(location.coordinates)) {
        const [lng, lat] = location.coordinates
        return { lat, lng }
      }
      // Plain { lat, lng }
      if (location.lat != null && location.lng != null)
        return { lat: Number(location.lat), lng: Number(location.lng) }
      // Plain { latitude, longitude }
      if (location.latitude != null && location.longitude != null)
        return { lat: Number(location.latitude), lng: Number(location.longitude) }
    }

    // 2. String — coba parse sebagai JSON dulu
    if (typeof location === 'string') {
      try {
        return parseLocation(JSON.parse(location))
      } catch {
        // bukan JSON, coba WKT: "POINT(106.8456 -6.2088)"
        const match = location.match(/POINT\s*\(\s*([\d.+-]+)\s+([\d.+-]+)\s*\)/i)
        if (match) return { lat: Number(match[2]), lng: Number(match[1]) }
      }
    }
  } catch (e) {
    console.warn('parseLocation error:', e)
  }

  return null
}

/**
 * Mem-parse field array (vehicle_types / service_types).
 * Supabase bisa mengembalikan array JS, string JSON, atau string CSV.
 */
export function parseArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { /* bukan JSON */ }
    return value.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}