import React, { useState } from 'react'
import './Tooltip.css'

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
}) {
  const [visible, setVisible] = useState(false)
  let timeout

  const show = () => {
    timeout = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    clearTimeout(timeout)
    setVisible(false)
  }

  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span className={`tooltip tooltip-${position}`} role="tooltip">
          {content}
        </span>
      )}
    </span>
  )
}
