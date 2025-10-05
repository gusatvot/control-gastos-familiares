import React, { useState, useEffect, useRef } from 'react'
import Modal from './Modal'

// Nota: Para las funcionalidades de exportación, necesitarás implementar
// las librerías correspondientes o usar servicios externos

function ReportsModal({ onClose, expenses, incomes, expenseCategories }) {
  const [reportType, setReportType] = useState('general')
  const [dateRange, setDateRange] = useState('month')
  const chartRef = useRef(null)

  // Función para generar datos del reporte
  const generateReportData = () => {
    const now = new Date()
    let startDate, endDate

    switch (dateRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        endDate = new Date()
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      default:
        startDate = new Date(0)
        endDate = new Date()
    }

    const filteredExpenses = expenses.filter(expense => 
      new Date(expense.date) >= startDate && new Date(expense.date) <= endDate
    )
    const filteredIncomes = incomes.filter(income => 
      new Date(income.date) >= startDate && new Date(income.date) <= endDate
    )

    return { filteredExpenses, filteredIncomes, startDate, endDate }
  }

  // Función para exportar a Excel (placeholder)
  const exportToExcel = () => {
    showToast('Funcionalidad de exportación a Excel próximamente', 'info')
    // Implementar usando xlsx library
  }

  // Función para exportar a PDF (placeholder)
  const exportToPDF = () => {
    showToast('Funcionalidad de exportación a PDF próximamente', 'info')
    // Implementar usando jspdf library
  }

  const { filteredExpenses, filteredIncomes, startDate, endDate } = generateReportData()
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
  const totalIncomes = filteredIncomes.reduce((sum, income) => sum + parseFloat(income.amount), 0)
  const balance = totalIncomes - totalExpenses

  // Calcular gastos por categoría
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount)
    return acc
  }, {})

  // Calcular ingresos por categoría
  const incomesByCategory = filteredIncomes.reduce((acc, income) => {
    acc[income.category] = (acc[income.category] || 0) + parseFloat(income.amount)
    return acc
  }, {})

  return (
    <Modal title="Reportes y Análisis" onClose={onClose} wide={true}>
      <div className="space-y-6">
        {/* Controles del reporte */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tipo de Reporte
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="general">Reporte General</option>
              <option value="expenses">Solo Gastos</option>
              <option value="incomes">Solo Ingresos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Período
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="week">Última Semana</option>
              <option value="month">Este Mes</option>
              <option value="year">Este Año</option>
              <option value="all">Todo el Período</option>
            </select>
          </div>
          <div className="flex space-x-2 items-end">
            <button
              onClick={exportToExcel}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Exportar Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Total Ingresos</p>
            <p className="text-2xl font-semibold text-green-400">
              ${totalIncomes.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Total Gastos</p>
            <p className="text-2xl font-semibold text-red-400">
              ${totalExpenses.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Balance</p>
            <p className={`text-2xl font-semibold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${balance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Gráfico simplificado con barras */}
        {reportType === 'general' && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-4 text-center">Distribución de Gastos por Categoría</h4>
            <div className="space-y-3">
              {Object.entries(expensesByCategory)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = ((amount / totalExpenses) * 100).toFixed(1)
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{category}</span>
                        <span className="text-red-400">
                          ${amount.toLocaleString()} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-red-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Estadísticas detalladas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gastos por categoría */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Gastos por Categoría</h4>
            <div className="space-y-2">
              {Object.entries(expensesByCategory)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span>{category}</span>
                    <span className="text-red-400 font-semibold">
                      ${amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              {Object.keys(expensesByCategory).length === 0 && (
                <p className="text-gray-400 text-center py-2">No hay gastos en este período</p>
              )}
            </div>
          </div>

          {/* Ingresos por categoría */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Ingresos por Categoría</h4>
            <div className="space-y-2">
              {Object.entries(incomesByCategory)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span>{category}</span>
                    <span className="text-green-400 font-semibold">
                      ${amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              {Object.keys(incomesByCategory).length === 0 && (
                <p className="text-gray-400 text-center py-2">No hay ingresos en este período</p>
              )}
            </div>
          </div>
        </div>

        {/* Información del período */}
        <div className="text-center text-gray-400 text-sm">
          Reporte generado para el período: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </div>
      </div>
    </Modal>
  )
}

// Función de toast local para este componente
function showToast(message, type = 'success') {
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.innerHTML = `
    <div class="flex items-center space-x-2">
      <span>${message}</span>
    </div>
  `
  
  document.body.appendChild(toast)
  
  setTimeout(() => toast.classList.add('show'), 100)
  
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

export default ReportsModal