/** Abre Google Maps con ruta en auto hacia el destino (origen = ubicación del usuario si hay permiso). */
export function abrirRutaGoogleMaps(lat: number, lng: number) {
  const destino = `${lat},${lng}`
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=driving`

  if (!navigator.geolocation) {
    window.open(fallback, '_blank', 'noopener,noreferrer')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const origin = `${pos.coords.latitude},${pos.coords.longitude}`
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destino}&travelmode=driving`,
        '_blank',
        'noopener,noreferrer',
      )
    },
    () => {
      window.open(fallback, '_blank', 'noopener,noreferrer')
    },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

export function clienteTieneCoordenadas(
  latitud?: number | string | null,
  longitud?: number | string | null,
): boolean {
  const lat = Number(latitud)
  const lng = Number(longitud)
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
}
