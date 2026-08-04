import React, { useEffect, useRef } from 'react'
import './MiniMap.css'
import AppIcon from '../ui/AppIcon'

// Using Leaflet via CDN-style import in the component
// This avoids bundler issues with marker icons
export default function MiniMap({ latitude, longitude, endereco, height = '300px' }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!latitude || !longitude || !mapRef.current) return
    if (mapInstanceRef.current) return // Already initialized

    // Dynamic import of leaflet
    import('leaflet').then((L) => {
      // Fix Leaflet default marker icon issue
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current).setView([latitude, longitude], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)

      const marker = L.marker([latitude, longitude]).addTo(map)
      if (endereco) {
        marker.bindPopup(`<strong>${endereco}</strong>`).openPopup()
      }

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, endereco])

  if (!latitude || !longitude) {
    return (
      <div className="minimap-placeholder" style={{ height }}>
        <span className="minimap-placeholder-icon"><AppIcon name="pin" size={26} /></span>
        <span>Localização não cadastrada</span>
        <span className="minimap-placeholder-hint">Adicione latitude e longitude no cadastro do empreendimento</span>
      </div>
    )
  }

  return (
    <div className="minimap-container">
      <div ref={mapRef} className="minimap" style={{ height }} />
    </div>
  )
}
