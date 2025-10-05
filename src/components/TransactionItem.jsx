import React from 'react'

function TransactionItem({ transaction, type, onEdit, onDelete, refreshData }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
      <div className="flex-1">
        <p className="font-medium">{transaction.description}</p>
        <p className="text-sm text-gray-400">
          {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <p className={`font-semibold ${type === 'expense' ? 'text-red-400' : 'text-green-400'}`}>
          {type === 'expense' ? '-' : '+'}${parseFloat(transaction.amount).toLocaleString()}
        </p>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            title="Editar"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            title="Eliminar"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default TransactionItem