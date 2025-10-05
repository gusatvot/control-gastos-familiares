import React, { useState } from 'react'
import { supabase } from '../supabase'
import { showToast } from '../App'
import Modal from './Modal'

function CategoriesModal({ onClose, refreshData, expenseCategories, incomeCategories }) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryType, setCategoryType] = useState('expense')
  const [loading, setLoading] = useState(false)

  const handleAddCategory = async (e) => {
    e.preventDefault()
    
    if (!newCategoryName.trim()) {
      alert('Por favor ingresa un nombre para la categoría')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay usuario autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('family_code')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('No se pudo obtener el perfil del usuario')

      const table = categoryType === 'expense' ? 'expense_categories' : 'income_categories'
      
      const { error } = await supabase
        .from(table)
        .insert([
          {
            name: newCategoryName.trim(),
            family_code: profile.family_code,
          },
        ])

      if (error) throw error

      showToast('Categoría agregada exitosamente!', 'success')
      setNewCategoryName('')
      refreshData()

    } catch (error) {
      console.error('Error adding category:', error)
      showToast('Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId, categoryName, type) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryName}"?`)) {
      return
    }

    try {
      const table = type === 'expense' ? 'expense_categories' : 'income_categories'
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      showToast('Categoría eliminada exitosamente!', 'success')
      refreshData()

    } catch (error) {
      console.error('Error deleting category:', error)
      showToast('Error: ' + error.message, 'error')
    }
  }

  return (
    <Modal title="Gestión de Categorías" onClose={onClose}>
      <div className="space-y-6">
        {/* Formulario para agregar categoría */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Agregar Nueva Categoría</h3>
          <form onSubmit={handleAddCategory} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tipo de Categoría
                </label>
                <select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre de la categoría"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Agregando...
                </>
              ) : (
                'Agregar Categoría'
              )}
            </button>
          </form>
        </div>

        {/* Lista de categorías existentes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categorías de Gastos */}
          <div>
            <h4 className="font-semibold mb-3 text-red-400">Categorías de Gastos</h4>
            <div className="space-y-2">
              {expenseCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <span>{category.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(category.id, category.name, 'expense')}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Eliminar categoría"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Categorías de Ingresos */}
          <div>
            <h4 className="font-semibold mb-3 text-green-400">Categorías de Ingresos</h4>
            <div className="space-y-2">
              {incomeCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <span>{category.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(category.id, category.name, 'income')}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Eliminar categoría"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default CategoriesModal