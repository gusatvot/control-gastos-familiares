import React from 'react'

function SummaryCard({ title, amount, color, icon }) {
  const colorClasses = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400'
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-semibold ${colorClasses[color]}`}>
            ${amount.toLocaleString()}
          </p>
        </div>
        <span className="text-2xl text-gray-400">{getIcon(icon)}</span>
      </div>
    </div>
  )
}

function getIcon(icon) {
  const icons = {
    'trending-up': '📈',
    'trending-down': '📉',
    'dollar-sign': '💰'
  }
  return icons[icon] || '💰'
}

export default SummaryCard