import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { showToast } from '../App'
import Modal from './Modal'

function ExpenseModal({ onClose, refreshData, categories, transactionId, expenses }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Categorías de respaldo por si las de Supabase están vacías
  const defaultCategories = [
    'Alimentación', 'Transporte', 'Vivienda', 'Entretenimiento', 
    'Salud', 'Educación', 'Ropa', 'Otros'
  ]

  // Usar categorías de Supabase o las de respaldo
  const availableCategories = categories && categories.length > 0 
    ? categories.map(cat => cat.name) 
    : defaultCategories

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    console.log('Modal cargado - Transaction ID:', transactionId)
    console.log('Categorías disponibles:', availableCategories)
    
    // Si estamos editando, cargar los datos del gasto
    if (transactionId && expenses && expenses.length > 0) {
      const expense = expenses.find(e => e.id == transactionId)
      if (expense) {
        console.log('Datos del gasto a editar:', expense)
        
        // Convertir el amount a string
        const amountValue = expense.amount.toString()
        setAmount(amountValue)
        
        setDescription(expense.description)
        setCategory(expense.category)
        setDate(expense.date)
        setIsEditing(true)
      }
    } else {
      // Si es nuevo gasto, establecer primera categoría por defecto
      if (availableCategories.length > 0 && !category) {
        setCategory(availableCategories[0])
      }
    }
  }, []) 

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!amount || !description || !category || !date) {
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

      if (isEditing) {
        // Editar gasto existente
        const { error } = await supabase
          .from('expenses')
          .update({
            amount: parseFloat(amount),
            description: description,
            category: category,
            date: date,
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId)

        if (error) throw error
        showToast('Gasto actualizado exitosamente!', 'success')
      } else {
        // Crear nuevo gasto
        const { error } = await supabase
          .from('expenses')
          .insert([
            {
              amount: parseFloat(amount),
              description: description,
              category: category,
              date: date,
              family_code: profile.family_code,
              created_by: user.id,
            },
          ])

        if (error) throw error
        showToast('Gasto agregado exitosamente!', 'success')
      }

      onClose()
      refreshData()
      
    } catch (error) {
      console.error('Error saving expense:', error)
      showToast('Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEditing ? "Editar Gasto" : "Agregar Gasto"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cantidad *
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descripción *
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            placeholder="Ej: Supermercado, Gasolina, etc."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Categoría *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="">Seleccionar categoría</option>
            {availableCategories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
          {!categories || categories.length === 0 ? (
            <p className="text-yellow-400 text-xs mt-1">
              Usando categorías temporales. Ve a "Categorías" para gestionar las categorías de tu familia.
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fecha *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !category}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                {isEditing ? 'Actualizando...' : 'Guardando...'}
              </>
            ) : (
              isEditing ? 'Actualizar Gasto' : 'Agregar Gasto'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ExpenseModal