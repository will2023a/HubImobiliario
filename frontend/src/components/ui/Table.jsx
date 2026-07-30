import React, { useState } from 'react'
import './Table.css'

export default function Table({
  columns,
  data,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  emptyMessage = 'Nenhum registro encontrado',
  loading = false,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const handleSort = (key) => {
    if (!key) return
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig])

  const toggleRow = (id) => {
    if (!onSelectionChange) return
    const newSelection = selectedRows.includes(id)
      ? selectedRows.filter(r => r !== id)
      : [...selectedRows, id]
    onSelectionChange(newSelection)
  }

  const toggleAll = () => {
    if (!onSelectionChange) return
    if (selectedRows.length === data.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map(row => row.id))
    }
  }

  if (loading) {
    return (
      <div className="table-container">
        <div className="table-loading">
          <div className="table-spinner" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {selectable && (
              <th className="table-th-check">
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedRows.length === data.length}
                  onChange={toggleAll}
                  aria-label="Selecionar todos"
                />
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                className={`${col.sortable ? 'table-th-sortable' : ''}`}
                onClick={() => col.sortable && handleSort(col.key)}
                style={col.width ? { width: col.width } : {}}
              >
                <span>{col.label}</span>
                {col.sortable && sortConfig.key === col.key && (
                  <span className="table-sort-icon">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="table-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, idx) => (
              <tr
                key={row.id || idx}
                className={`${onRowClick ? 'table-row-clickable' : ''} ${selectedRows.includes(row.id) ? 'table-row-selected' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {selectable && (
                  <td className="table-td-check" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Selecionar linha ${idx + 1}`}
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
