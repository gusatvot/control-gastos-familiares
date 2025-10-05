import React, { useState } from 'react'
import { supabase } from '../supabase'
import { showToast } from '../App'
import Modal from './Modal'

function BackupModal({ onClose, refreshData }) {
  const [loading, setLoading] = useState(false)

  // Generar backup de todos los datos
  const generateBackup = async () => {
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay usuario autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('family_code')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('No se pudo obtener el perfil')

      // Obtener todos los datos de la familia
      const [
        expensesResponse,
        incomesResponse,
        expenseCategoriesResponse,
        incomeCategoriesResponse,
        budgetsResponse
      ] = await Promise.all([
        supabase.from('expenses').select('*').eq('family_code', profile.family_code),
        supabase.from('incomes').select('*').eq('family_code', profile.family_code),
        supabase.from('expense_categories').select('*').eq('family_code', profile.family_code),
        supabase.from('income_categories').select('*').eq('family_code', profile.family_code),
        supabase.from('budgets').select('*').eq('family_code', profile.family_code)
      ])

      const backupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        familyCode: profile.family_code,
        data: {
          expenses: expensesResponse.data || [],
          incomes: incomesResponse.data || [],
          expense_categories: expenseCategoriesResponse.data || [],
          income_categories: incomeCategoriesResponse.data || [],
          budgets: budgetsResponse.data || []
        }
      }

      // Crear y descargar archivo JSON
      const dataStr = JSON.stringify(backupData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup-gastos-familiares-${profile.family_code}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showToast('Backup generado exitosamente!', 'success')

    } catch (error) {
      console.error('Error generating backup:', error)
      showToast('Error generando backup: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Restaurar datos desde archivo
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setLoading(true)

    try {
      const text = await file.text()
      const backupData = JSON.parse(text)

      // Validar estructura del backup
      if (!backupData.familyCode || !backupData.data) {
        throw new Error('Archivo de backup inválido')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay usuario autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('family_code')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('No se pudo obtener el perfil')

      // Verificar que el family_code coincida
      if (backupData.familyCode !== profile.family_code) {
        throw new Error('El backup no corresponde a tu familia')
      }

      // Confirmar restauración (esto borrará datos existentes)
      if (!confirm('⚠️ ADVERTENCIA: Esto reemplazará todos tus datos actuales. ¿Continuar?')) {
        return
      }

      // Eliminar datos existentes
      await Promise.all([
        supabase.from('expenses').delete().eq('family_code', profile.family_code),
        supabase.from('incomes').delete().eq('family_code', profile.family_code),
        supabase.from('expense_categories').delete().eq('family_code', profile.family_code),
        supabase.from('income_categories').delete().eq('family_code', profile.family_code),
        supabase.from('budgets').delete().eq('family_code', profile.family_code)
      ])

      // Insertar datos del backup
      const insertPromises = []
      
      if (backupData.data.expenses && backupData.data.expenses.length > 0) {
        insertPromises.push(
          supabase.from('expenses').insert(
            backupData.data.expenses.map(expense => ({
              ...expense,
              family_code: profile.family_code,
              created_by: user.id
            }))
          )
        )
      }

      if (backupData.data.incomes && backupData.data.incomes.length > 0) {
        insertPromises.push(
          supabase.from('incomes').insert(
            backupData.data.incomes.map(income => ({
              ...income,
              family_code: profile.family_code,
              created_by: user.id
            }))
          )
        )
      }

      if (backupData.data.expense_categories && backupData.data.expense_categories.length > 0) {
        insertPromises.push(
          supabase.from('expense_categories').insert(backupData.data.expense_categories)
        )
      }

      if (backupData.data.income_categories && backupData.data.income_categories.length > 0) {
        insertPromises.push(
          supabase.from('income_categories').insert(backupData.data.income_categories)
        )
      }

      if (backupData.data.budgets && backupData.data.budgets.length > 0) {
        insertPromises.push(
          supabase.from('budgets').insert(
            backupData.data.budgets.map(budget => ({
              ...budget,
              family_code: profile.family_code,
              created_by: user.id
            }))
          )
        )
      }

      await Promise.all(insertPromises)

      showToast('Datos restaurados exitosamente!', 'success')
      refreshData()
      onClose()

    } catch (error) {
      console.error('Error restoring backup:', error)
      showToast('Error restaurando backup: ' + error.message, 'error')
    } finally {
      setLoading(false)
      // Limpiar input file
      event.target.value = ''
    }
  }

  return (
    <Modal title="Copia de Seguridad y Restauración" onClose={onClose}>
      <div className="space-y-6">
        {/* Información */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h4 className="font-semibold text-blue-400 mb-2">📋 Información importante</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• El backup incluye: Gastos, Ingresos, Categorías y Presupuestos</li>
            <li>• Los archivos se guardan en formato JSON</li>
            <li>• La restauración reemplazará todos los datos actuales</li>
            <li>• Recomienda hacer backup regularmente</li>
          </ul>
        </div>

        {/* Generar Backup */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3">💾 Generar Copia de Seguridad</h4>
          <p className="text-gray-400 text-sm mb-4">
            Descarga un archivo con todos tus datos para guardar de forma segura.
          </p>
          <button
            onClick={generateBackup}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Generando...
              </>
            ) : (
              '📥 Descargar Backup'
            )}
          </button>
        </div>

        {/* Restaurar Backup */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3">🔄 Restaurar desde Backup</h4>
          <p className="text-gray-400 text-sm mb-4">
            Sube un archivo de backup para restaurar tus datos.
          </p>
          <div className="space-y-3">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={loading}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            <p className="text-xs text-yellow-400">
              ⚠️ Advertencia: Esto reemplazará todos tus datos actuales
            </p>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3">📊 Tus Datos Actuales</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-red-400 font-semibold">{/* Se actualizará dinámicamente */}</div>
              <div className="text-gray-400">Gastos</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-semibold">{/* Se actualizará dinámicamente */}</div>
              <div className="text-gray-400">Ingresos</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default BackupModal