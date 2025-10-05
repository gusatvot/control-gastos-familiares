import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { showToast } from '../App'
import Modal from './Modal'

function IncomeModal({ onClose, refreshData, categories, transactionId, incomes }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Categorías de respaldo para ingresos
  const defaultIncomeCategories = [
    'Salario', 'Freelance', 'Inversiones', 'Ventas', 
    'Bonos', 'Regalos', 'Otros Ingresos'
  ]

  // Usar categorías de Supabase o las de respaldo
  const availableCategories = categories && categories.length > 0 
    ? categories.map(cat => cat.name) 
    : defaultIncomeCategories

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    console.log('Modal de ingreso cargado - Transaction ID:', transactionId)
    console.log('Categorías de ingresos disponibles:', availableCategories)
    
    // Si estamos editando, cargar los datos del ingreso
    if (transactionId && incomes && incomes.length > 0) {
      const income = incomes.find(i => i.id == transactionId)
      if (income) {
        console.log('Datos del ingreso a editar:', income)
        
        // Convertir el amount a string
        const amountValue = income.amount.toString()
        setAmount(amountValue)
        
        setDescription(income.description)
        setCategory(income.category)
        setDate(income.date)
        setIsEditing(true)
      }
    } else {
      // Si es nuevo ingreso, establecer primera categoría por defecto
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
        // Editar ingreso existente
        const { error } = await supabase
          .from('incomes')
          .update({
            amount: parseFloat(amount),
            description: description,
            category: category,
            date: date,
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId)

        if (error) throw error
        showToast('Ingreso actualizado exitosamente!', 'success')
      } else {
        // Crear nuevo ingreso
        const { error } = await supabase
          .from('incomes')
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
        showToast('Ingreso agregado exitosamente!', 'success')
      }

      onClose()
      refreshData()

    } catch (error) {
      console.error('Error saving income:', error)
      showToast('Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEditing ? "Editar Ingreso" : "Agregar Ingreso"} onClose={onClose}>
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
            placeholder="Ej: Salario mensual, Venta, etc."
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
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                {isEditing ? 'Actualizando...' : 'Guardando...'}
              </>
            ) : (
              isEditing ? 'Actualizar Ingreso' : 'Agregar Ingreso'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default IncomeModal