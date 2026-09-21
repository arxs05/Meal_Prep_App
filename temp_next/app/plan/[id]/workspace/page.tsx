'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

interface PlanData {
  id: string;
  title: string;
  week_start_date: string;
}

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: 'Mandatory' | 'Optional';
  notes?: string;
  assigned_to: string;
  is_prepared: boolean;
  preparation_form: string;
}

interface Dish {
  id: string;
  name: string;
  notes: string;
  day: string;
  ingredients: Ingredient[];
}

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    };

    loadUser();
  }, []);

  const [plan, setPlan] = useState<PlanData>({
    id: params.id,
    title: '',
    week_start_date: ''
  });
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDay, setFormDay] = useState('');
  const [formData, setFormData] = useState({ name: '', notes: '' });
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: '1', name: '', quantity: '', unit: '', category: 'Mandatory', assigned_to: '', is_prepared: false, preparation_form: '' }]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedDishTemplates, setSavedDishTemplates] = useState<{ id: string; name: string }[]>([]);
  const [isSearchingTemplates, setIsSearchingTemplates] = useState(false);

  // Helper function to format date as "20 September 2026"
  function formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }

  // Helper function to normalize text for saved dish matching
  // Removes extra whitespace, trims, and lowercases for comparison
  function normalizeSavedText(text: string): string {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // Helper function to create a saved dish template
  async function createSavedDish(dish: Dish, owner_id: string): Promise<string | null> {
    const supabase = getSupabaseClient();
    
    const normalized_name = normalizeSavedText(dish.name);
    
    // Check if saved dish with same normalized name exists for this user
    const { data: existingSavedDishes, error: checkError } = await supabase
      .from('saved_dishes')
      .select('id')
      .eq('owner_id', owner_id)
      .eq('normalized_name', normalized_name)
      .limit(1);

    if (checkError) {
      console.error('Failed to check existing saved dish:', checkError);
      return null;
    }

    if (existingSavedDishes && existingSavedDishes.length > 0) {
      // Saved dish already exists
      return existingSavedDishes[0].id;
    }

    // Create new saved dish
    const { data: savedDish, error: savedDishError } = await supabase
      .from('saved_dishes')
      .insert({
        owner_id: owner_id,
        name: dish.name.trim(),
        normalized_name: normalized_name,
        notes: dish.notes.trim() || null
      })
      .select()
      .single();

    if (savedDishError) {
      console.error('Failed to create saved dish:', savedDishError);
      return null;
    }

    // Create saved dish ingredients
    if (savedDish && dish.ingredients && dish.ingredients.length > 0) {
      for (const ing of dish.ingredients) {
        const { error: ingError } = await supabase
          .from('saved_dish_ingredients')
          .insert({
            saved_dish_id: savedDish.id,
            name: ing.name.trim(),
            quantity: ing.quantity.trim(),
            unit: ing.unit.trim(),
            category: ing.category,
            notes: ing.notes ? ing.notes.trim() : null,
            assigned_to: ing.assigned_to ? ing.assigned_to.trim() : null,
            is_prepared: ing.is_prepared,
            preparation_form: ing.preparation_form ? ing.preparation_form.trim() : null,
            sort_order: 0
          });

        if (ingError) {
          console.error('Failed to insert saved ingredient:', ingError);
        }
      }
    }

    return savedDish ? savedDish.id : null;
  }

  // Helper function to check for existing saved dish
  async function checkExistingSavedDish(dishName: string, owner_id: string): Promise<{ exists: boolean; id: string | null } | null> {
    const supabase = getSupabaseClient();
    
    const normalized_name = normalizeSavedText(dishName);
    
    const { data: existingSavedDishes, error: checkError } = await supabase
      .from('saved_dishes')
      .select('id')
      .eq('owner_id', owner_id)
      .eq('normalized_name', normalized_name)
      .limit(1);

    if (checkError) {
      console.error('Failed to check existing saved dish:', checkError);
      return null;
    }

    if (existingSavedDishes && existingSavedDishes.length > 0) {
      return { exists: true, id: existingSavedDishes[0].id };
    }

    return { exists: false, id: null };
  }

  // Helper function to fetch saved dish templates for the current user
  // that match the given search term
  async function fetchSavedDishTemplates(searchTerm: string, ownerId: string): Promise<void> {
    if (!searchTerm.trim()) {
      setSavedDishTemplates([]);
      return;
    }

    setIsSearchingTemplates(true);
    const supabase = getSupabaseClient();
    
    const normalizedSearchTerm = normalizeSavedText(searchTerm);
    
    // Search for saved dishes that match the normalized name
    const { data: templates, error } = await supabase
      .from('saved_dishes')
      .select('id, name')
      .eq('owner_id', ownerId)
      .ilike('normalized_name', `%${normalizedSearchTerm}%`)
      .limit(10);

    if (error) {
      console.error('Failed to fetch saved dish templates:', error);
      setSavedDishTemplates([]);
    } else {
      setSavedDishTemplates(templates || []);
    }
    
    setIsSearchingTemplates(false);
  }

  // Helper function to load a saved dish template and populate the form
  async function loadSavedDishTemplate(templateId: string, ownerId: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    // Fetch the saved dish
    const { data: savedDish, error: dishError } = await supabase
      .from('saved_dishes')
      .select('*')
      .eq('id', templateId)
      .eq('owner_id', ownerId)
      .single();

    if (dishError) {
      console.error('Failed to fetch saved dish:', dishError);
      alert('Failed to load template');
      return;
    }

    // Fetch the saved ingredients
    const { data: savedIngredients, error: ingredientsError } = await supabase
      .from('saved_dish_ingredients')
      .select('*')
      .eq('saved_dish_id', templateId)
      .order('sort_order', { ascending: true });

    if (ingredientsError) {
      console.error('Failed to fetch saved dish ingredients:', ingredientsError);
      alert('Failed to load ingredients');
      return;
    }

    // Populate the form with the template data
    setFormData({ name: savedDish.name, notes: savedDish.notes || '' });
    
    // Convert saved ingredients to the ingredient format used in the form
    const loadedIngredients = (savedIngredients || []).map((ing, index) => ({
      id: `temp-${Date.now()}-${index}`,
      name: ing.name,
      quantity: ing.quantity || '',
      unit: ing.unit || '',
      category: ing.category as 'Mandatory' | 'Optional',
      assigned_to: ing.assigned_to || '',
      is_prepared: ing.is_prepared,
      preparation_form: ing.preparation_form || ''
    }));

    // If no ingredients were loaded, add a blank one
    if (loadedIngredients.length === 0) {
      loadedIngredients.push({ id: '1', name: '', quantity: '', unit: '', category: 'Mandatory', assigned_to: '', is_prepared: false, preparation_form: '' });
    }

    setIngredients(loadedIngredients);
    
    // Clear saved dishes templates after loading
    setSavedDishTemplates([]);
  }

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }

      // Load plan data
      const { data: planData, error: planError } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('id', params.id)
        .eq('owner_id', session.user.id)
        .single();

      if (planError || !planData) {
        console.error('Failed to fetch plan:', planError);
        setIsLoading(false);
        return;
      }

      setPlan(planData);

      // Load dishes with ingredients
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select(`
          id,
          name,
          notes,
          day,
          ingredients (
            id,
            name,
            quantity,
            unit,
            category,
            assigned_to,
            is_prepared,
            preparation_form
          )
        `)
        .eq('plan_id', params.id)
        .order('created_at', { ascending: true });

      if (dishesError) {
        console.error('Failed to fetch dishes:', dishesError);
      } else {
        setDishes(dishesData || []);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [params.id]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleBack = () => {
    router.push('/');
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      alert('Failed to sign out: ' + error.message);
      return;
    }
    
    router.push('/login');
    router.refresh();
  };

  const handleAddDishClick = (day: string) => {
    setFormDay(day);
    setEditingDish(null);
    setFormData({ name: '', notes: '' });
    setIngredients([{ id: '1', name: '', quantity: '', unit: '', category: 'Mandatory', assigned_to: '', is_prepared: false, preparation_form: '' }]);
    setShowForm(true);
  };

  const handleEditDishClick = (dish: Dish) => {
    setEditingDish(dish);
    setFormDay(dish.day);
    setFormData({ name: dish.name, notes: dish.notes });
    setIngredients(dish.ingredients);
    setShowForm(true);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { id: Date.now().toString(), name: '', quantity: '', unit: '', category: 'Mandatory', assigned_to: '', is_prepared: false, preparation_form: '' }]);
  };

  const handleRemoveIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
    }
  };

  const handleIngredientChange = (id: string, field: keyof Ingredient, value: string | boolean) => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
  };

  const handleCategoryChange = (id: string, value: 'Mandatory' | 'Optional') => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, category: value } : ing));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Dish name is required');
      return;
    }

    // Validate that all ingredient names are not empty
    const emptyIngredients = ingredients.filter(ing => !ing.name.trim());
    if (emptyIngredients.length > 0) {
      alert('Please fill in all ingredient names');
      return;
    }

    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert('You must be logged in');
      return;
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
        assigned_to: ing.assigned_to.trim(),
        is_prepared: ing.is_prepared,
        preparation_form: ing.preparation_form.trim()
      }))
    };

    if (editingDish) {
      // Update existing dish
      const { error } = await supabase
        .from('dishes')
        .update({
          name: newDish.name,
          notes: newDish.notes,
          day: newDish.day
        })
        .eq('id', editingDish.id);

      if (error) {
        console.error('Failed to update dish:', error);
        alert('Failed to update dish');
        return;
      }

      // Update ingredients
      for (const ing of newDish.ingredients) {
        if (ing.id.startsWith('temp-')) {
          // New ingredient
          const { error } = await supabase
            .from('ingredients')
            .insert({
              dish_id: editingDish.id,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              category: ing.category,
              assigned_to: ing.assigned_to,
              is_prepared: ing.is_prepared,
              preparation_form: ing.preparation_form
            });

          if (error) {
            console.error('Failed to insert ingredient:', error);
          }
        } else {
          // Update existing ingredient
          const { error } = await supabase
            .from('ingredients')
            .update({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              category: ing.category,
              assigned_to: ing.assigned_to,
              is_prepared: ing.is_prepared,
              preparation_form: ing.preparation_form
            })
            .eq('id', ing.id);

          if (error) {
            console.error('Failed to update ingredient:', error);
          }
        }
      }

      setDishes(dishes.map(d => d.id === editingDish.id ? newDish : d));
    } else {
      // Only create a saved template if one does not already exist
const existingSavedDish = await checkExistingSavedDish(newDish.name, userId!);

if (!existingSavedDish?.exists) {
  await createSavedDish(newDish, userId!);
}

      // Create new dish
      const { data: dishData, error: dishError } = await supabase
        .from('dishes')
        .insert({
          plan_id: params.id,
          name: newDish.name,
          notes: newDish.notes,
          day: newDish.day
        })
        .select()
        .single();

      if (dishError) {
        console.error('Failed to insert dish:', dishError);
        alert('Failed to create dish');
        return;
      }

      // Insert ingredients
      for (const ing of newDish.ingredients) {
        const { error } = await supabase
          .from('ingredients')
          .insert({
            dish_id: dishData.id,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category,
            assigned_to: ing.assigned_to,
            is_prepared: ing.is_prepared,
            preparation_form: ing.preparation_form
          });

        if (error) {
          console.error('Failed to insert ingredient:', error);
        }
      }

      // Create saved dish template for this new dish
      const savedDishId = await createSavedDish(newDish, session.user.id);

      if (!savedDishId) {
      alert('Saved dish template creation failed. Check the browser console.');
      }

      setDishes([...dishes, { ...newDish, id: dishData.id }]);
    }

    setShowForm(false);
    setFormData({ name: '', notes: '' });
    setIngredients([{ id: '1', name: '', quantity: '', unit: '', category: 'Mandatory', assigned_to: '', is_prepared: false, preparation_form: '' }]);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormData({ name: '', notes: '' });
    setIngredients([{ id: '1', name: '', quantity: '', unit: '', category: 'Mandatory', assigned_to: '', is_prepared: false, preparation_form: '' }]);
    setEditingDish(null);
  };

  const handleDeleteDish = async (dishId: string) => {
    if (window.confirm('Are you sure you want to delete this dish?')) {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', dishId);

      if (error) {
        console.error('Failed to delete dish:', error);
      } else {
        setDishes(dishes.filter(d => d.id !== dishId));
      }
    }
  };

  const getDishesForDay = (day: string) => {
    return dishes.filter(d => d.day === day);
  };

  // Get all ingredients grouped by dish for the checklist
  const getIngredientsForChecklist = () => {
    const allIngredients: { dish: Dish; ingredient: Ingredient }[] = [];
    dishes.forEach(dish => {
      dish.ingredients.forEach(ingredient => {
        allIngredients.push({ dish, ingredient });
      });
    });
    return allIngredients;
  };

  // Toggle prepared state for an ingredient
  const togglePrepared = async (dishId: string, ingredientId: string) => {
    const supabase = getSupabaseClient();
    
    const updatedDishes = dishes.map(dish => {
      if (dish.id === dishId) {
        return {
          ...dish,
          ingredients: dish.ingredients.map(ing =>
            ing.id === ingredientId ? { ...ing, is_prepared: !ing.is_prepared } : ing
          )
        };
      }
      return dish;
    });

    setDishes(updatedDishes);

    // Update in database
    const { error } = await supabase
      .from('ingredients')
      .update({ is_prepared: !updatedDishes.find(d => d.id === dishId)?.ingredients.find(i => i.id === ingredientId)?.is_prepared })
      .eq('id', ingredientId);

    if (error) {
      console.error('Failed to update ingredient:', error);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    );
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
                Week starting {formatDate(plan.week_start_date)}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 px-4 py-2 rounded-md hover:bg-red-50 mr-2"
            >
              Logout
            </button>
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
            const dayDishes = getDishesForDay(day);
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
            );
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
                const dishIngredients = dish.ingredients;
                if (dishIngredients.length === 0) return null;
                
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
                              ingredient.is_prepared
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={ingredient.is_prepared}
                                  onChange={() => togglePrepared(dish.id, ingredient.id)}
                                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
                                />
                              </label>
                              
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`font-medium ${ingredient.is_prepared ? 'text-green-800 line-through' : 'text-gray-900'}`}>
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
                                  {ingredient.preparation_form && (
                                    <span className="text-gray-600">
                                      {ingredient.preparation_form}
                                    </span>
                                  )}
                                  {ingredient.assigned_to && (
                                    <span className="text-gray-600">
                                      👤 {ingredient.assigned_to}
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
                );
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
                  onChange={(e) => {
  const name = e.target.value;

  setFormData({ ...formData, name });

  if (userId && name.trim()) {
    fetchSavedDishTemplates(name, userId);
  } else {
    setSavedDishTemplates([]);
  }
}}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., Oats Omelette"
                />
                {/* Template Suggestions */}
{isSearchingTemplates && (
  <div className="mt-2 text-sm text-gray-600">
    Searching templates...
  </div>
)}

{!isSearchingTemplates && savedDishTemplates.length > 0 && (
  <div className="mt-2 space-y-1">
    <p className="text-xs font-medium text-gray-500">
      Use saved template:
    </p>

    {savedDishTemplates.map((template) => (
      <button
        key={template.id}
        type="button"
        onClick={() => loadSavedDishTemplate(template.id, userId!)}
        className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
      >
        {template.name}
      </button>
    ))}
  </div>
)}
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
                          value={ingredient.assigned_to}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'assigned_to', e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                        />
                        <label className="flex items-center gap-1 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={ingredient.is_prepared}
                            onChange={(e) => handleIngredientChange(ingredient.id, 'is_prepared', e.target.checked)}
                            className="w-4 h-4"
                          />
                          Prepared
                        </label>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Preparation form (e.g., diced, boiled)"
                          value={ingredient.preparation_form}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'preparation_form', e.target.value)}
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
  );
}