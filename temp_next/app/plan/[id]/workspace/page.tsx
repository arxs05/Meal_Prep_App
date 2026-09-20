'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PlanData {
  id: string
  title: string
  weekStartDate: string
}

interface Ingredient {
  id: string
  name: string
  quantity: string
  unit: string
  category: 'Mandatory' | 'Optional'
  assignedTo: string
  isPrepared: boolean
  preparationForm: string
}

interface Dish {
  id: string
  name: string
  notes: string
  day: string
  ingredients: Ingredient[]
}

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [plan, setPlan] = useState<PlanData>({
    id: params.id,
    title: '',
    weekStartDate: ''
  })
  const [dishes, setDishes] = useState<Dish[]>([])
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formDay, setFormDay] = useState('')
  const [formData, setFormData] = useState({ name: '', notes: '' })
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: '1', name: '', quantity: '', unit: '', category: 'Mandatory', assignedTo: '', isPrepared: false, preparationForm: '' }])

  // Helper function to format date as "20 September 2026"
  function formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date'
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Unknown date'
    
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()
    
    return `${day} ${month} ${year}`
  }

  useEffect(() => {
    // Load plan data from localStorage using the plan ID from params
    const storedPlans = localStorage.getItem('plans')
    if (storedPlans) {
      try {
        const plansData: PlanData[] = JSON.parse(storedPlans)
        const plan = plansData.find(p => p.id === params.id)
        if (plan) {
          setPlan(plan)
        }
      } catch (e) {
        console.error('Failed to parse stored plans:', e)
      }
    }

    // Load dishes from localStorage using plan-specific key
    const storedDishes = localStorage.getItem(`dishes_${params.id}`)
    if (storedDishes) {
      try {
        const dishesData: Dish[] = JSON.parse(storedDishes)
        // Ensure existing ingredients have all fields with defaults
        const updatedDishes = dishesData.map(dish => ({
          ...dish,
          ingredients: dish.ingredients.map(ing => ({
            ...ing,
            preparationForm: ing.preparationForm || '',
            category: ing.category || 'Mandatory',
            assignedTo: ing.assignedTo || '',
            isPrepared: ing.isPrepared !== undefined ? ing.isPrepared : false
          }))
        }))
        setDishes(updatedDishes)
      } catch (e) {
        console.error('Failed to parse stored dishes:', e)
      }
    }
  }, [params.id])

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const handleBack = () => {
    router.push('/')
  }

  const handleAddDishClick = (day: string) => {
    setFormDay(day)
    setEditingDish(null)
    setFormData({ name: '', notes: '' })
    setIngredients([{ id: '1', name: '', quantity: '', unit: '', category: 'Mandatory', assignedTo: '', isPrepared: false, preparationForm: '' }])
    setShowForm(true)
  }

  const handleEditDishClick = (dish: Dish) => {
    setEditingDish(dish)
    setFormData({ name: dish.name, notes: dish.notes })
    setIngredients(dish.ingredients)
    setShowForm(true)
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { id: Date.now().toString(), name: '', quantity: '', unit: '', category: 'Mandatory', assignedTo: '', isPrepared: false, preparationForm: '' }])
  }

  const handleRemoveIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id))
    }
  }

  const handleIngredientChange = (id: string, field: keyof Ingredient, value: string | boolean) => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing))
  }

  const handleCategoryChange = (id: string, value: 'Mandatory' | 'Optional') => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, category: value } : ing))
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Dish name is required')
      return
    }

    // Validate that all ingredient names are not empty
    const emptyIngredients = ingredients.filter(ing => !ing.name.trim())
    if (emptyIngredients.length > 0) {
      alert('Please fill in all ingredient names')
      return
    }

    const newDish: Dish = {
      id: editingDish ? editingDish.id : Date.now().toString(),
      name: formData.name.trim(),
      notes: formData.notes.trim(),
      day: formDay,
      ingredients: ingredients.map(ing => ({
        ...ing,
        name: ing.name.trim(),
        quantity: ing.quantity.trim(),
        unit: ing.unit.trim(),
        category: ing.category,
        assignedTo: ing.assignedTo.trim(),
        isPrepared: ing.isPrepared,
        preparationForm: ing.preparationForm.trim()
      }))
    }

    const updatedDishes = editingDish
      ? dishes.map(d => d.id === editingDish.id ? newDish : d)
      : [...dishes, newDish]

    setDishes(updatedDishes)
    localStorage.setItem(`dishes_${params.id}`, JSON.stringify(updatedDishes))
    setShowForm(false)
    setFormData({ name: '', notes: '' })
    setIngredients([{ id: '1', name: '', quantity: '', unit: '', category: 'Mandatory', assignedTo: '', isPrepared: false, preparationForm: '' }])
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setFormData({ name: '', notes: '' })
    setIngredients([{ id: '1', name: '', quantity: '', unit: '', category: 'Mandatory', assignedTo: '', isPrepared: false, preparationForm: '' }])
    setEditingDish(null)
  }

  const handleDeleteDish = (dishId: string) => {
    if (window.confirm('Are you sure you want to delete this dish?')) {
      const updatedDishes = dishes.filter(d => d.id !== dishId)
      setDishes(updatedDishes)
      localStorage.setItem(`dishes_${params.id}`, JSON.stringify(updatedDishes))
    }
  }

  const getDishesForDay = (day: string) => {
    return dishes.filter(d => d.day === day)
  }

  // Get all ingredients grouped by dish for the checklist
  const getIngredientsForChecklist = () => {
    const allIngredients: { dish: Dish; ingredient: Ingredient }[] = []
    dishes.forEach(dish => {
      dish.ingredients.forEach(ingredient => {
        allIngredients.push({ dish, ingredient })
      })
    })
    return allIngredients
  }

  // Toggle prepared state for an ingredient
  const togglePrepared = (dishId: string, ingredientId: string) => {
    const updatedDishes = dishes.map(dish => {
      if (dish.id === dishId) {
        return {
          ...dish,
          ingredients: dish.ingredients.map(ing =>
            ing.id === ingredientId ? { ...ing, isPrepared: !ing.isPrepared } : ing
          )
        }
      }
      return dish
    })
    setDishes(updatedDishes)
    localStorage.setItem(`dishes_${params.id}`, JSON.stringify(updatedDishes))
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {plan.title || 'Weekly Plan'}
              </h1>
              <p className="text-sm text-gray-600">
                Week starting {formatDate(plan.weekStartDate)}
              </p>
            </div>
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-100"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {days.map((day) => {
            const dayDishes = getDishesForDay(day)
            return (
              <div key={day} className="bg-white rounded-lg shadow p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{day}</h2>
                  <button
                    onClick={() => handleAddDishClick(day)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Add dish
                  </button>
                </div>
                
                <div className="flex-1 space-y-3">
                  {dayDishes.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center text-gray-500 min-h-[80px] flex items-center justify-center">
                      No dishes yet
                    </div>
                  ) : (
                    dayDishes.map((dish) => (
                      <div key={dish.id} className="border border-gray-200 rounded-md p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{dish.name}</h3>
                            {dish.notes && (
                              <p className="text-sm text-gray-600 mt-1">{dish.notes}</p>
                            )}
                            {dish.ingredients.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {dish.ingredients.length} ingredient{dish.ingredients.length !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-2">
                            <button
                              onClick={() => handleEditDishClick(dish)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDish(dish.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Advance-Preparation Checklist */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Advance-Preparation Checklist
          </h2>
          
          {dishes.length === 0 || getIngredientsForChecklist().length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <p className="text-gray-600 text-lg mb-2">No ingredients yet</p>
              <p className="text-gray-500">
                Add dishes and ingredients to create your preparation checklist
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {dishes.map((dish) => {
                const dishIngredients = dish.ingredients
                if (dishIngredients.length === 0) return null
                
                return (
                  <div key={dish.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{dish.name}</h3>
                          <p className="text-sm text-gray-500">
                            {dish.day} • {dish.ingredients.length} ingredient{dish.ingredients.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {dish.notes && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Notes: {dish.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="space-y-3">
                        {dishIngredients.map((ingredient) => (
                          <div
                            key={ingredient.id}
                            className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-md border transition-colors ${
                              ingredient.isPrepared
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={ingredient.isPrepared}
                                  onChange={() => togglePrepared(dish.id, ingredient.id)}
                                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
                                />
                              </label>
                              
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`font-medium ${ingredient.isPrepared ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                                    {ingredient.name}
                                  </span>
                                  {ingredient.quantity && (
                                    <span className="text-gray-600 text-sm">
                                      {ingredient.quantity}
                                    </span>
                                  )}
                                  {ingredient.unit && (
                                    <span className="text-gray-600 text-sm">
                                      {ingredient.unit}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                                  {ingredient.category && (
                                    <span
                                      className={`px-2 py-0.5 rounded ${
                                        ingredient.category === 'Mandatory'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                    >
                                      {ingredient.category}
                                    </span>
                                  )}
                                  {ingredient.preparationForm && (
                                    <span className="text-gray-600">
                                      {ingredient.preparationForm}
                                    </span>
                                  )}
                                  {ingredient.assignedTo && (
                                    <span className="text-gray-600">
                                      👤 {ingredient.assignedTo}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dish Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingDish ? 'Edit Dish' : 'Add Dish'}
            </h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="dishName" className="block text-sm font-medium text-gray-700 mb-1">
                  Dish Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="dishName"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., Oats Omelette"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredients
                </label>
                <div className="space-y-3">
                  {ingredients.map((ingredient) => (
                    <div key={ingredient.id} className="border border-gray-200 rounded-md p-3 space-y-2">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Ingredient name *"
                            value={ingredient.name}
                            onChange={(e) => handleIngredientChange(ingredient.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Qty"
                          value={ingredient.quantity}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'quantity', e.target.value)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={ingredient.unit}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'unit', e.target.value)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(ingredient.id)}
                          className="text-red-600 hover:text-red-800 px-2 py-2"
                          disabled={ingredients.length === 1}
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <select
                          value={ingredient.category}
                          onChange={(e) => handleCategoryChange(ingredient.id, e.target.value as 'Mandatory' | 'Optional')}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="Mandatory">Mandatory</option>
                          <option value="Optional">Optional</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Assigned person"
                          value={ingredient.assignedTo}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'assignedTo', e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                        />
                        <label className="flex items-center gap-1 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={ingredient.isPrepared}
                            onChange={(e) => handleIngredientChange(ingredient.id, 'isPrepared', e.target.checked)}
                            className="w-4 h-4"
                          />
                          Prepared
                        </label>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Preparation form (e.g., diced, boiled)"
                          value={ingredient.preparationForm}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'preparationForm', e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add ingredient
                </button>
              </div>

              <div>
                <label htmlFor="dishNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="dishNotes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., Use 2 eggs, add spinach"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {editingDish ? 'Save Changes' : 'Add Dish'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}