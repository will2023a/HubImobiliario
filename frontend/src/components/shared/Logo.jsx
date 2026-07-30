import React from 'react'

export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0d474"/>
          <stop offset="50%" stopColor="#d4af37"/>
          <stop offset="100%" stopColor="#b8941f"/>
        </linearGradient>
      </defs>
      {/* Shield outline */}
      <path
        d="M20 3L5 9v10c0 8.5 6.4 16.5 15 18.5 8.6-2 15-10 15-18.5V9L20 3z"
        fill="url(#logoGold)"
        opacity="0.12"
        stroke="url(#logoGold)"
        strokeWidth="1.2"
      />
      {/* Building/chart icon inside */}
      <rect x="14" y="16" width="4" height="11" rx="1" fill="url(#logoGold)" opacity="0.9"/>
      <rect x="20" y="12" width="4" height="15" rx="1" fill="url(#logoGold)"/>
      <rect x="26" y="19" width="4" height="8" rx="1" fill="url(#logoGold)" opacity="0.7"/>
      {/* 360 arc */}
      <circle cx="20" cy="20" r="16" fill="none" stroke="url(#logoGold)" strokeWidth="0.8" strokeDasharray="60 40" opacity="0.5"/>
      {/* Accent dot */}
      <circle cx="33" cy="7" r="2" fill="#d4af37"/>
    </svg>
  )
}
