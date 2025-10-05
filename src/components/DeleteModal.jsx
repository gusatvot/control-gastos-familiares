import React, { useState } from 'react'
import { supabase } from '../supabase'
import { showToast } from '../App'
import Modal from './Modal'

function DeleteModal({ onClose, refreshData, transactionId, type }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const table = type === 'expense' ? 'expenses' : 'incomes'
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', transactionId)

      if (error) throw error

      showToast(`${type === 'expense' ? 'Gasto' : 'Ingreso'} eliminado exitosamente!`, 'success')
      onClose()
      refreshData()

    } catch (error) {
      console.error('Error deleting transaction:', error)
      showToast('Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Confirmar Eliminación" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-gray-300">
          ¿Estás seguro de que quieres eliminar este {type === 'expense' ? 'gasto' : 'ingreso'}? 
          Esta acción no se puede deshacer.
        </p>
        
        <div className="flex space-x-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteModal