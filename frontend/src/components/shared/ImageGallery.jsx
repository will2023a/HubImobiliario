import React, { useState } from 'react'
import Modal from '../ui/Modal'
import './ImageGallery.css'
import AppIcon from '../ui/AppIcon'

const categoriaLabels = {
  fachada: 'Fachada',
  areas_comuns: 'Áreas comuns',
  decorados: 'Decorados',
  plantas: 'Plantas',
  outros: 'Outros',
}

export default function ImageGallery({ images = [] }) {
  const [activeCategory, setActiveCategory] = useState('todas')
  const [lightboxImg, setLightboxImg] = useState(null)

  // Agrupar por categoria
  const categories = {}
  images.forEach(img => {
    const cat = img.categoria || 'outros'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(img)
  })

  const filteredImages = activeCategory === 'todas'
    ? images
    : images.filter(img => img.categoria === activeCategory)

  if (images.length === 0) {
    return (
      <div className="gallery-empty">
        <span className="gallery-empty-icon"><AppIcon name="building" size={28} /></span>
        <p>Nenhuma imagem cadastrada</p>
        <p className="gallery-empty-hint">Adicione imagens na edição do empreendimento</p>
      </div>
    )
  }

  return (
    <div className="gallery">
      {/* Category tabs */}
      <div className="gallery-tabs">
        <button
          className={`gallery-tab ${activeCategory === 'todas' ? 'gallery-tab-active' : ''}`}
          onClick={() => setActiveCategory('todas')}
        >
          Todas ({images.length})
        </button>
        {Object.entries(categories).map(([cat, imgs]) => (
          <button
            key={cat}
            className={`gallery-tab ${activeCategory === cat ? 'gallery-tab-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {categoriaLabels[cat] || cat} ({imgs.length})
          </button>
        ))}
      </div>

      {/* Image grid */}
      <div className="gallery-grid">
        {filteredImages.map((img, idx) => (
          <div
            key={img.id || idx}
            className="gallery-item"
            onClick={() => setLightboxImg(img)}
          >
            <img
              src={img.url}
              alt={img.titulo || `Imagem ${idx + 1}`}
              className="gallery-img"
              loading="lazy"
            />
            {img.titulo && <span className="gallery-img-title">{img.titulo}</span>}
          </div>
        ))}
      </div>

      {/* Lightbox modal */}
      <Modal
        isOpen={!!lightboxImg}
        onClose={() => setLightboxImg(null)}
        size="lg"
        title={lightboxImg?.titulo || 'Imagem'}
      >
        {lightboxImg && (
          <div className="gallery-lightbox">
            <img
              src={lightboxImg.url}
              alt={lightboxImg.titulo || 'Imagem'}
              className="gallery-lightbox-img"
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
