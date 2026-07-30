import React, { useState, useRef, useEffect } from 'react'
import './Dropdown.css'

export default function Dropdown({
  trigger,
  children,
  align = 'left',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`dropdown ${className}`} ref={ref}>
      <div className="dropdown-trigger" onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      {open && (
        <div className={`dropdown-menu dropdown-align-${align}`}>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ children, onClick, icon, danger = false }) {
  return (
    <button
      className={`dropdown-item ${danger ? 'dropdown-item-danger' : ''}`}
      onClick={onClick}
    >
      {icon && <span className="dropdown-item-icon">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
