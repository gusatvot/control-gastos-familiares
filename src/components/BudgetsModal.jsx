import React, { useState } from 'react'
import { supabase } from '../supabase'
import { showToast } from '../App'
import Modal from './Modal'

function BudgetsModal({ onClose, refreshData, budgets, expenseCategories }) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedCategory || !amount) {
      alert('Por favor completa todos los campos')
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

      // Verificar si ya existe un presupuesto para esta categoría
      const existingBudget = budgets.find(b => b.category === selectedCategory)

      if (existingBudget) {
        // Actualizar presupuesto existente
        const { error } = await supabase
          .from('budgets')
          .update({
            amount: parseFloat(amount),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBudget.id)

        if (error) throw error
        showToast('Presupuesto actualizado exitosamente!', 'success')
      } else {
        // Crear nuevo presupuesto
        const { error } = await supabase
          .from('budgets')
          .insert([
            {
              category: selectedCategory,
              amount: parseFloat(amount),
              family_code: profile.family_code,
              created_by: user.id,
            },
          ])

        if (error) throw error
        showToast('Presupuesto creado exitosamente!', 'success')
      }

      setSelectedCategory('')
      setAmount('')
      refreshData()

    } catch (error) {
      console.error('Error saving budget:', error)
      showToast('Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBudget = async (budgetId, categoryName) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el presupuesto para "${categoryName}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)

      if (error) throw error

      showToast('Presupuesto eliminado exitosamente!', 'success')
      refreshData()

    } catch (error) {
      console.error('Error deleting budget:', error)
      showToast('Error: ' + error.message, 'error')
    }
  }

  return (
    <Modal title="Gestión de Presupuestos" onClose={onClose}>
      <div className="space-y-6">
        {/* Formulario para agregar/editar presupuesto */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            {budgets.find(b => b.category === selectedCategory) ? 'Editar Presupuesto' : 'Crear Presupuesto'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Categoría
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    const budget = budgets.find(b => b.category === e.target.value)
                    setAmount(budget ? budget.amount.toString() : '')
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {expenseCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Monto del Presupuesto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Guardando...
                </>
              ) : (
                budgets.find(b => b.category === selectedCategory) ? 'Actualizar Presupuesto' : 'Crear Presupuesto'
              )}
            </button>
          </form>
        </div>

        {/* Lista de presupuestos existentes */}
        <div>
          <h4 className="font-semibold mb-3">Presupuestos Existentes</h4>
          <div className="space-y-2">
            {budgets.map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div>
                  <span className="font-medium">{budget.category}</span>
                  <p className="text-sm text-gray-400">${parseFloat(budget.amount).toLocaleString()}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(budget.category)
                      setAmount(budget.amount.toString())
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Editar presupuesto"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(budget.id, budget.category)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Eliminar presupuesto"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {budgets.length === 0 && (
              <p className="text-gray-400 text-center py-4">No hay presupuestos configurados</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default BudgetsModal