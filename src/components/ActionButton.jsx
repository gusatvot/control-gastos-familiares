import React from 'react'

function ActionButton({ icon, label, color, onClick }) {
  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700',
    green: 'bg-green-600 hover:bg-green-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    gray: 'bg-gray-700 hover:bg-gray-600'
  }

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} p-4 rounded-lg transition-colors flex flex-col items-center justify-center space-y-2 min-h-[100px]`}
    >
      <span className="text-lg">{getIcon(icon)}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

function getIcon(icon) {
  const icons = {
    'plus': '➕',
    'trending-up': '📈',
    'file-text': '📊',
    'tag': '🏷️',
    'target': '🎯',
    'settings': '⚙️'
  }
  return icons[icon] || '📄'
}

export default ActionButton