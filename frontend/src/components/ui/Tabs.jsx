import React, { useState } from 'react'
import './Tabs.css'

export default function Tabs({ tabs, defaultTab, onChange }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key)

  const handleChange = (key) => {
    setActive(key)
    onChange && onChange(key)
  }

  const activeTab = tabs.find(t => t.key === active)

  return (
    <div className="tabs">
      <div className="tabs-header" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tabs-btn ${active === tab.key ? 'tabs-btn-active' : ''}`}
            onClick={() => handleChange(tab.key)}
            role="tab"
            aria-selected={active === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
          >
            {tab.icon && <span className="tabs-icon">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="tabs-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
      <div
        className="tabs-content"
        role="tabpanel"
        id={`tabpanel-${active}`}
      >
        {activeTab?.content}
      </div>
    </div>
  )
}
