'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { SparklesIcon, Trash2Icon, EditIcon, CheckIcon } from 'lucide-react';

const toTitleCase = (value: string) => {
  return value.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
};

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

  // Get day order for sorting (Monday = 0 through Sunday = 6)
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Get current day for highlighting
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Sunday'];
    return days[new Date().getDay()] || 'Monday';
  };

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
  const handleGenerateIngredients = async () => {
  if (!formData.name.trim()) {
    alert('Please enter a dish name first.');
    return;
  }

  setIsLoading(true);

  try {
    const response = await  fetch('/api/plans/generate-ingredients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dishName: formData.name.trim(),
      }),
    });

    const data = await response.json();
    console.log('Gemini response:', data);
    

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate ingredients');
    }

    setIngredients(
  data.ingredients.map((ingredient: any, index: number) => ({
    id: `generated-${Date.now()}-${index}`,
    name: ingredient.name || '',
    quantity: String(ingredient.recipe_quantity ?? ''),
    unit: ingredient.recipe_unit || '',
    category:
      ingredient.type === 'optional' ? 'Optional' : 'Mandatory',
    assigned_to: '',
    is_prepared: false,
    preparation_form: ingredient.prep_form || 'None',
  }))
);
  if (data.notes) {
  setFormData((current) => ({
    ...current,
    notes: data.notes,
  }));
}

  } catch (error) {
    console.error('Ingredient generation failed:', error);
    alert('Failed to generate ingredients. Please try again.');
  } finally {
    setIsLoading(false);
  }
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
      <main className="min-h-screen bg-[#060a13]">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060a13]">
      {/* Header */}
      <div className="bg-[rgba(10,15,28,0.85)] border-b border-[rgba(255,255,255,0.08)]">
        <div className="container mx-auto px-4 py-4 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#f0f4f8]">
  {toTitleCase(plan.title)}
</h1>
              <p className="text-[#8b9bb4] mt-1 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#00d2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Week starting {formatDate(plan.week_start_date)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="h-[44px] px-5 rounded-[300px] font-medium text-[#fca5a5] bg-[rgba(220,38,38,0.15)] border border-[rgba(220,38,38,0.3)] hover:bg-[rgba(220,38,38,0.25)] transition-all duration-300 text-sm"
              >
                Logout
              </button>
              <button
                onClick={handleBack}
                className="h-[44px] px-6 rounded-[300px] font-medium text-white bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.2)] transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {days.map((day) => {
            const dayDishes = getDishesForDay(day);
            const isCurrentDay = day === getCurrentDay();
            return (
              <div 
                key={day} 
                className={`glass-card rounded-2xl p-6 flex flex-col border ${isCurrentDay ? 'border-[#00ff9d]/30 shadow-[0_0_30px_rgba(0,255,157,0.15)]' : ''}`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <h2 className={`text-lg font-semibold ${isCurrentDay ? 'text-[#00ff9d]' : 'text-[#f0f4f8]'}`}>
                      {day}
                    </h2>
                    {isCurrentDay && (
                      <span className="px-2 py-1 text-xs rounded-full bg-[rgba(255,0,0,0.2)] border border-red-500/30 text-red-500">
                        <span className="text-xs font-medium uppercase tracking-wide">●</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddDishClick(day)}
                    className="h-[44px] px-5 rounded-[300px] font-medium text-[#060a13] bg-[#00ff9d] hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add dish</span>
                  </button>
                </div>
                
                <div className="flex-1 space-y-4">
                  {dayDishes.length === 0 ? (
                    <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-xl p-6 text-center text-[#8b9bb4] min-h-[100px] flex flex-col items-center justify-center">
                      <svg className="w-8 h-8 mb-2 text-[#8b9bb4]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      No dishes yet
                    </div>
                  ) : (
                    dayDishes.map((dish) => (
                      <div key={dish.id} className="glass-input rounded-xl p-4 group transition-all hover:border-[rgba(0,255,157,0.3)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-[#f0f4f8] truncate group-hover:text-[#00ff9d] transition-colors">{toTitleCase(dish.name)}</h3>
                            {dish.ingredients.length > 0 && (
                              <p className="text-xs text-[#8b9bb4] mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3 text-[#00d2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                {dish.ingredients.length} ingredient{dish.ingredients.length !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditDishClick(dish)}
                              className="h-8 w-8 shrink-0 rounded-full text-[#00d2ff] bg-[rgba(0,210,255,0.12)] hover:bg-[rgba(0,210,255,0.25)] border border-[rgba(0,210,255,0.3)] transition-all duration-300 flex items-center justify-center"
                            >
                              <EditIcon className="w-3.5 h-3.5 text-[#00d2ff]" />
                            </button>
                            <button
                              onClick={() => handleDeleteDish(dish.id)}
                              className="h-8 w-8 shrink-0 rounded-full text-[#fca5a5] bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.3)] hover:bg-[rgba(220,38,38,0.25)] transition-all duration-300 flex items-center justify-center"
                            >
                              <Trash2Icon className="w-3.5 h-3.5 text-[#fca5a5]" />
                              
                            
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
          <h2 className="text-2xl font-bold text-[#f0f4f8] mb-6">
            Advance-Preparation Checklist
          </h2>
          
          {dishes.length === 0 || getIngredientsForChecklist().length === 0 ? (
            <div className="glass-card rounded-2xl border border-[rgba(255,255,255,0.08)] p-8 text-center">
              <div className="text-[#64748b] text-6xl mb-4">📋</div>
              <p className="text-[#f0f4f8] text-lg mb-2">No ingredients yet</p>
              <p className="text-[#f0f4f8]">
                Add dishes and ingredients to create your preparation checklist
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {[...dishes]
    .sort((a, b) => {
      const dayOrder = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ];

      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    })
    .map((dish) => {
      const dishIngredients = dish.ingredients;
      if (dishIngredients.length === 0) return null;
                
                return (
                  <div key={dish.id} className="glass-card rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
                    <div className="bg-[rgba(20,27,45,0.6)] px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-[#f0f4f8]">
  {toTitleCase(dish.name)}
</h3>

<div className="mt-2 flex items-center gap-3">
  <span
    className={`rounded-full border px-3 py-1 text-sm font-semibold ${
      dish.day === 'Monday'
        ? 'border-blue-400/30 bg-blue-400/10 text-blue-300'
        : dish.day === 'Tuesday'
        ? 'border-purple-400/30 bg-purple-400/10 text-purple-300'
        : dish.day === 'Wednesday'
        ? 'border-pink-400/30 bg-pink-400/10 text-pink-300'
        : dish.day === 'Thursday'
        ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300'
        : dish.day === 'Friday'
        ? 'border-orange-400/30 bg-orange-400/10 text-orange-300'
        : dish.day === 'Saturday'
        ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
        : 'border-green-400/30 bg-green-400/10 text-green-300'
    }`}
  >
    {dish.day}
  </span>

  <span className="text-base text-[#8b9bb4]">
    {dish.ingredients.length} ingredient{dish.ingredients.length !== 1 ? 's' : ''}
  </span>
</div>
                        </div>
                        
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="space-y-3">
                        {dishIngredients.map((ingredient) => (
                          <div
                            key={ingredient.id}
                            className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-md border transition-colors ${
                              ingredient.is_prepared
  ? 'bg-[rgba(0,255,157,0.1)] border-[rgba(0,255,157,0.3)]'
  : 'bg-[rgba(20,27,45,0.6)] border-[rgba(255,255,255,0.1)]'
                            }`}
                          >
                        <div className="flex w-full items-start gap-3">
  {/* Checkbox */}
  <label className="mt-1 cursor-pointer">
    <input
      type="checkbox"
      checked={ingredient.is_prepared}
      onChange={() => togglePrepared(dish.id, ingredient.id)}
      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
    />
  </label>

  {/* Ingredient name + preparation form */}
  <div className="flex-1 min-w-0">
    <span
      className={`text-lg font-semibold ${
        ingredient.is_prepared
          ? 'text-green-300 line-through'
          : 'text-[#f0f4f8]'
      }`}
    >
      {toTitleCase(ingredient.name)}
    </span>

    {/* Preparation form directly below the name */}
    {ingredient.preparation_form && (
      <p className="mt-1 text-base italic font-medium text-[#a8b3c7]">
        {toTitleCase(ingredient.preparation_form)}
      </p>
    )}

    {/* Assigned person — centered in the ingredient row */}
{ingredient.assigned_to && (
  <div className="flex flex-1 items-center justify-center">
    <span className="text-base font-medium text-[#d1d5db]">
      👤 {toTitleCase(ingredient.assigned_to)}
    </span>
  </div>
)}
  </div>

  {/* Mandatory/Optional + quantity/unit on the right */}
  <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
  {/* Quantity and unit */}
  <div className="text-xl font-semibold text-[#f0f4f8]">
    {ingredient.quantity && <span>{ingredient.quantity}</span>}
    {ingredient.unit && <span className="ml-1">{ingredient.unit}</span>}
  </div>

  {/* Mandatory / Optional */}
  {ingredient.category && (
    <span
      className={`text-sm font-medium ${
        ingredient.category === 'Mandatory'
          ? 'text-red-300'
          : 'text-yellow-300'
      }`}
    >
      {ingredient.category}
    </span>
  )}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[rgba(255,255,255,0.12)] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-[#f0f4f8]">
                {editingDish ? 'Edit Dish' : 'Add Dish'}
              </h2>
              <button
                onClick={handleCancelForm}
                className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.2)] transition-colors text-[#8b9bb4]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="dishName" className="block text-sm font-medium text-[#f0f4f8] mb-2">
                  Dish Name <span className="text-[#fca5a5]">*</span>
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
                  className="w-full px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,27,45,0.6)] text-[#f0f4f8] placeholder:text-[#64748b] focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]"
                  placeholder="e.g., Oats Omelette"
                />
  <div className="mt-2 flex justify-end">
      <button
  type="button"
  onClick={handleGenerateIngredients}
  disabled={isLoading || !formData.name.trim()}
  aria-label="Generate ingredients with AI"
  title="Generate ingredients with AI"
  className="mt-2 inline-flex h-10 items-center gap-2 rounded-full border border-[rgba(254,35,6,0.63)] bg-[#b60909c0] px-4 text-sm font-semibold text-[#fbfafb] transition-all duration-200 hover:bg-[rgba(248,41,5,0.22)] disabled:cursor-not-allowed disabled:opacity-50"

>
  <span aria-hidden="true">✦</span>
  {isLoading ? 'Generating...' : 'Use AI'}
</button>
</div>
{!isSearchingTemplates && savedDishTemplates.length > 0 && (
  <div className="mt-2 space-y-1">
    <p className="text-xs font-medium text-[#f0f4f8] ">
      Use saved template:
    </p>

   {savedDishTemplates.map((template) => (
  <button
    key={template.id}
    type="button"
    onClick={() => loadSavedDishTemplate(template.id, userId!)}
    className="block w-full rounded-lg border border-transparent bg-[rgba(0,200,255,0.03)] px-3 py-2 text-center font-semibold text-[#00ff9d] transition-all duration-200 hover:border-[rgba(0,255,157,0.3)] hover:bg-[rgba(0,255,157,0.18)] hover:text-[#66ffc4]"
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
                            value={toTitleCase(ingredient.name)}
                            onChange={(e) => handleIngredientChange(ingredient.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,27,45,0.6)] text-[#f0f4f8] placeholder:text-[#64748b] focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Qty"
                          value={ingredient.quantity}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'quantity', e.target.value)}
                         className="w-20 px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,27,45,0.6)] text-[#f0f4f8] placeholder:text-[#64748b] focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]"
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={ingredient.unit}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'unit', e.target.value)}
                          className="w-20 px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,27,45,0.6)] text-[#f0f4f8] placeholder:text-[#64748b] focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]"
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
                          className="px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,27,45,0.6)] text-[#f0f4f8] placeholder:text-[#64748b] focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]"
                        >
                          <option value="Mandatory">Mandatory</option>
                          <option value="Optional">Optional</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Assigned person"
                          value={toTitleCase(ingredient.assigned_to)}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'assigned_to', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,27,45,0.6)] text-[#f0f4f8] placeholder:text-[#64748b] focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]"
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
                          value={toTitleCase(ingredient.preparation_form)}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'preparation_form', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,27,45,0.6)] text-[#f0f4f8] placeholder:text-[#64748b] focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]"
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
                  className="w-full px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,27,45,0.6)] text-[#f0f4f8] placeholder:text-[#64748b] focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]"
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