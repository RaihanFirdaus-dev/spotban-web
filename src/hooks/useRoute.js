import { useState, useEffect } from 'react'

/**
 * Fetches a driving route from OSRM public API.
 * Returns { coordinates, summary: { distance (km), duration (min) } }
 */
export function useRoute(userLocation, selected) {
  const [route, setRoute] = useState(null)
  const [loadingRoute, setLoadingRoute] = useState(false)

  useEffect(() => {
    if (!userLocation || !selected) {
      setRoute(null)
      return
    }

    const controller = new AbortController()

    async function fetchRoute() {
      setLoadingRoute(true)
      try {
        const { lat: lat1, lng: lon1 } = userLocation
        const { latitude: lat2, longitude: lon2 } = selected

        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${lon1},${lat1};${lon2},${lat2}` +
          `?overview=full&geometries=geojson`

        const res = await fetch(url, { signal: controller.signal })
        const data = await res.json()

        if (data.code !== 'Ok') throw new Error(data.message)

        const leg = data.routes[0].legs[0]
        setRoute({
          // GeoJSON coords are [lng, lat] — flip to [lat, lng] for Leaflet
          coordinates: data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]),
          summary: {
            distance: (leg.distance / 1000).toFixed(1),   // km
            duration: Math.ceil(leg.duration / 60),        // menit
          },
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('OSRM error:', err)
          setRoute(null)
        }
      } finally {
        setLoadingRoute(false)
      }
    }

    fetchRoute()
    return () => controller.abort()
  }, [userLocation, selected])

  return { route, loadingRoute }
}