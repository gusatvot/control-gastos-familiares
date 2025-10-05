import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import AuthScreen from './components/AuthScreen'
import Modal from './components/Modal'
import ExpenseModal from './components/ExpenseModal'
import IncomeModal from './components/IncomeModal'
import ReportsModal from './components/ReportsModal'
import CategoriesModal from './components/CategoriesModal'
import BudgetsModal from './components/BudgetsModal'
import DeleteModal from './components/DeleteModal'
import ActionButton from './components/ActionButton'
import SummaryCard from './components/SummaryCard'
import TransactionItem from './components/TransactionItem'
import BackupModal from './components/BackupModal'

// FunciÃ³n de toast global
export function showToast(message, type = 'success') {
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

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [incomes, setIncomes] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])
  const [incomeCategories, setIncomeCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0
  })
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: ''
  })

  // Verificar sesiÃ³n al cargar
  useEffect(() => {
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Cargar datos cuando el usuario cambie
  useEffect(() => {
    if (user) {
      loadAllData()
    }
  }, [user])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllData = async () => {
    if (!user) return
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_code')
        .eq('id', user.id)
        .single()

      if (!profile) return

      // Cargar todos los datos en paralelo
      const [
        expensesResponse,
        incomesResponse,
        expenseCategoriesResponse,
        incomeCategoriesResponse,
        budgetsResponse
      ] = await Promise.all([
        supabase.from('expenses').select('*').eq('family_code', profile.family_code).order('date', { ascending: false }),
        supabase.from('incomes').select('*').eq('family_code', profile.family_code).order('date', { ascending: false }),
        supabase.from('expense_categories').select('*').eq('family_code', profile.family_code),
        supabase.from('income_categories').select('*').eq('family_code', profile.family_code),
        supabase.from('budgets').select('*').eq('family_code', profile.family_code)
      ])

      setExpenses(expensesResponse.data || [])
      setIncomes(incomesResponse.data || [])
      setExpenseCategories(expenseCategoriesResponse.data || [])
      setIncomeCategories(incomeCategoriesResponse.data || [])
      setBudgets(budgetsResponse.data || [])

      calculateSummary(expensesResponse.data || [], incomesResponse.data || [])

    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const calculateSummary = (expensesData, incomesData) => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyExpenses = expensesData.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && 
        expenseDate.getFullYear() === currentYear
    })

    const monthlyIncomes = incomesData.filter(income => {
      const incomeDate = new Date(income.date)
      return incomeDate.getMonth() === currentMonth && 
        incomeDate.getFullYear() === currentYear
    })

    const totalExpense = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
    const totalIncome = monthlyIncomes.reduce((sum, income) => sum + parseFloat(income.amount), 0)
    const balance = totalIncome - totalExpense

    setSummary({
      totalIncome,
      totalExpense,
      balance
    })
  }

  const getExpensesByCategory = () => {
    const categories = {}
    
    expenses.forEach(expense => {
      if (!categories[expense.category]) {
        categories[expense.category] = 0
      }
      categories[expense.category] += parseFloat(expense.amount)
    })
    
    return Object.entries(categories).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount)
  }

  const refreshData = () => {
    loadAllData()
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Filtrar transacciones
  const filteredExpenses = expenses.filter(expense => {
    if (filters.startDate && new Date(expense.date) < new Date(filters.startDate)) return false
    if (filters.endDate && new Date(expense.date) > new Date(filters.endDate)) return false
    if (filters.category && expense.category !== filters.category) return false
    return true
  })

  const filteredIncomes = incomes.filter(income => {
    if (filters.startDate && new Date(income.date) < new Date(filters.startDate)) return false
    if (filters.endDate && new Date(income.date) > new Date(filters.endDate)) return false
    if (filters.category && income.category !== filters.category) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="loading-spinner"></div>
        <span className="ml-2">Cargando...</span>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold">$</span>
            </div>
            <h1 className="text-xl font-semibold">Control de Gastos Familiares</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">{user.email}</span>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto p-4">
        {/* Acciones RÃ¡pidas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <ActionButton 
            icon="plus" 
            label="Agregar Gasto" 
            color="red"
            onClick={() => setActiveModal('expense')}
          />
          <ActionButton 
            icon="trending-up" 
            label="Agregar Ingreso" 
            color="green"
            onClick={() => setActiveModal('income')}
          />
          <ActionButton 
            icon="file-text" 
            label="Ver Reportes" 
            color="blue"
            onClick={() => setActiveModal('reports')}
          />
          <ActionButton 
            icon="tag" 
            label="Categorías" 
            color="orange"
            onClick={() => setActiveModal('categories')}
          />
          <ActionButton 
            icon="target" 
            label="Presupuestos" 
            color="purple"
            onClick={() => setActiveModal('budgets')}
          />
          <ActionButton 
            icon="settings" 
            label="Configuración" 
            color="gray"
            onClick={() => setActiveModal('settings')}
          />
        </div>

        {/* Filtros */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
              <select
        value={filters.category}
        onChange={(e) => setFilters({...filters, category: e.target.value})}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
      >
        <option value="">Todas las categorías</option>
        {expenseCategories.map((category) => (
          <option key={category.id} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({startDate: '', endDate: '', category: ''})}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard 
            title="Ingresos del Mes" 
            amount={summary.totalIncome} 
            color="green" 
            icon="trending-up"
          />
          <SummaryCard 
            title="Gastos del Mes" 
            amount={summary.totalExpense} 
            color="red" 
            icon="trending-down"
          />
          <SummaryCard 
            title="Presupuesto Disponible" 
            amount={summary.balance} 
            color="blue" 
            icon="dollar-sign"
          />
        </div>

        {/* Contenido Principal - Grid 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Historial de Gastos */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Historial de Gastos</h2>
              <span className="text-sm text-gray-400">
                {filteredExpenses.length} registros
              </span>
            </div>
            {filteredExpenses.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p>No hay gastos registrados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredExpenses.map((expense) => (
                  <TransactionItem 
                    key={expense.id}
                    transaction={expense}
                    type="expense"
                    onEdit={() => setActiveModal(`edit-expense-${expense.id}`)}
                    onDelete={() => setActiveModal(`delete-expense-${expense.id}`)}
                    refreshData={refreshData}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Gastos por Categoría */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Gastos por Categoría</h2>
            {expenses.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p>No hay datos para mostrar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getExpensesByCategory().map((item, index) => {
                  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
                  const percentage = ((item.amount / totalExpenses) * 100).toFixed(1)
                  const budget = budgets.find(b => b.category === item.category)
                  const budgetPercentage = budget ? ((item.amount / budget.amount) * 100).toFixed(1) : null
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.category}</span>
                        <div className="text-right">
                          <span className="text-red-400 font-semibold block">
                            ${item.amount.toLocaleString()} ({percentage}%)
                          </span>
                          {budget && (
                            <span className={`text-xs ${budgetPercentage > 100 ? 'text-red-500' : 'text-green-500'}`}>
                              Presupuesto: {budgetPercentage}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Historial de Ingresos */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Historial de Ingresos</h2>
            <span className="text-sm text-gray-400">
              {filteredIncomes.length} registros
            </span>
          </div>
          {filteredIncomes.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              <p>No hay ingresos registrados</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filteredIncomes.map((income) => (
                <TransactionItem 
                  key={income.id}
                  transaction={income}
                  type="income"
                  onEdit={() => setActiveModal(`edit-income-${income.id}`)}
                  onDelete={() => setActiveModal(`delete-income-${income.id}`)}
                  refreshData={refreshData}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modales */}
      {activeModal === 'expense' && (
        <ExpenseModal 
          onClose={() => setActiveModal(null)} 
          refreshData={refreshData}
          categories={expenseCategories}
        />
      )}
      {activeModal === 'income' && (
        <IncomeModal 
          onClose={() => setActiveModal(null)} 
          refreshData={refreshData}
          categories={incomeCategories}
        />
      )}
      {activeModal === 'reports' && (
        <ReportsModal 
          onClose={() => setActiveModal(null)}
          expenses={expenses}
          incomes={incomes}
          expenseCategories={expenseCategories}
        />
      )}
      {activeModal === 'categories' && (
        <CategoriesModal 
          onClose={() => setActiveModal(null)}
          refreshData={refreshData}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
        />
      )}
      {activeModal === 'budgets' && (
        <BudgetsModal 
          onClose={() => setActiveModal(null)}
          refreshData={refreshData}
          budgets={budgets}
          expenseCategories={expenseCategories}
        />
      )}
      {activeModal === 'settings' && (
        <BackupModal 
        onClose={() => setActiveModal(null)}
        refreshData={refreshData}
        />
      )}
      
      {/* Modales de ediciÃ³n/eliminaciÃ³n dinÃ¡micos */}
      {activeModal?.startsWith('edit-expense-') && (
        <ExpenseModal 
          onClose={() => setActiveModal(null)} 
          refreshData={refreshData}
          categories={expenseCategories}
          transactionId={activeModal.replace('edit-expense-', '')}
          expenses={expenses}
        />
      )}
      {activeModal?.startsWith('edit-income-') && (
        <IncomeModal 
          onClose={() => setActiveModal(null)} 
          refreshData={refreshData}
          categories={incomeCategories}
          transactionId={activeModal.replace('edit-income-', '')}
          incomes={incomes}
        />
      )}
      {activeModal?.startsWith('delete-expense-') && (
        <DeleteModal 
          onClose={() => setActiveModal(null)} 
          refreshData={refreshData}
          transactionId={activeModal.replace('delete-expense-', '')}
          type="expense"
        />
      )}
      {activeModal?.startsWith('delete-income-') && (
        <DeleteModal 
          onClose={() => setActiveModal(null)} 
          refreshData={refreshData}
          transactionId={activeModal.replace('delete-income-', '')}
          type="income"
        />
      )}
    </div>
  )
}

export default App


