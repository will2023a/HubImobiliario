import React, { useState } from 'react'
import './DateRangeFilter.css'

export default function DateRangeFilter({ onFilter, onClear, className = '' }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  function handleFilter() {
    if (startDate || endDate) {
      onFilter({ startDate: startDate || null, endDate: endDate || null })
    }
  }

  function handleClear() {
    setStartDate('')
    setEndDate('')
    onClear && onClear()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleFilter()
  }

  return (
    <div className={`date-range-filter ${className}`}>
      <div className="date-range-inputs">
        <div className="date-range-field">
          <label className="date-range-label">De</label>
          <input
            type="date"
            className="date-range-input"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="date-range-field">
          <label className="date-range-label">Até</label>
          <input
            type="date"
            className="date-range-input"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
      <div className="date-range-actions">
        <button className="date-range-btn date-range-btn-filter" onClick={handleFilter}>
          Filtrar
        </button>
        {(startDate || endDate) && (
          <button className="date-range-btn date-range-btn-clear" onClick={handleClear}>
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}
