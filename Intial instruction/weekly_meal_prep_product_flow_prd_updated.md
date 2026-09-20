# Weekly Meal Prep Planner — Product and User Flow PRD

## Product scope
A laptop-first weekly meal planning app for one person. Users create a week, add many dishes, assign dishes to Monday–Sunday, and manage ingredients.

Excluded from the current scope: accounts, collaboration, notifications, mobile optimization, grocery ordering, nutrition, pantry tracking, and any separate preparation-task system.

## Core concepts
### Weekly plan
A container for one week's dishes.

### Dish
A meal with an ID, name, assigned weekday, optional notes/cooking instructions, and ingredients.

### Ingredient
Each ingredient contains:
- **Name:** required
- **Quantity:** optional text
- **Unit:** optional text
- **Category:** required: **Mandatory** or **Optional**
- **Notes:** optional
- **Assigned person:** optional name
- **Prepared:** boolean checkbox/state, default false

The ingredient record is the single source of truth for preparation tracking. There is no preparation-form field and no separate preparation-task entity.

## Main user flow
1. Open the app.
2. Create a weekly plan by selecting a week/date and optionally entering a title.
3. Open the weekly workspace.
4. Add, edit, delete, and move dishes between weekdays.
5. Within each dish, add and manage ingredients.
6. Review ingredients in an advance-preparation checklist.
7. Mark ingredients as prepared or unprepared.

AI generation, saved recipes, public/private links, database persistence, and print/PDF output are later phases.

## Weekly workspace
The workspace should show:
- Week title/date
- Monday–Sunday sections or navigation
- Dish cards grouped by day
- Add-dish action
- Ingredient/preparation checklist access
- Save status when persistence exists

Dish cards show the dish name, ingredient count, edit action, and delete action. The interface must support at least 15 dishes without an artificial limit.

## Ingredient management
Ingredient management is part of the dish add/edit interface.

The user must be able to:
- Add multiple ingredients
- Edit name, quantity, unit, category, notes, and assigned person
- Toggle Prepared
- Delete ingredients
- Change category between Mandatory and Optional

Rules:
- Name is required.
- Category is required and must be Mandatory or Optional.
- New ingredients default to Mandatory.
- Missing category in legacy data defaults to Mandatory.
- Prepared defaults to false.
- No separate preparation-task records are created.

## Advance-preparation checklist
The checklist is a view over existing ingredient records. It may show ingredient name, dish, quantity, unit, category, assigned person, notes, and Prepared state.

It may support search, filtering by prepared state/category, and grouping by person or dish. These views must not duplicate ingredients or create a second source of truth.

## Acceptance criteria
### Plan and dish management
- A user can create a weekly plan.
- The workspace opens after creation.
- The user can add at least 15 dishes.
- A dish can be assigned to any weekday.
- Dishes can be edited and deleted.

### Ingredient management
- A dish can contain multiple ingredients.
- Ingredients can be added, edited, and deleted.
- Every ingredient has a required name.
- Every ingredient has a Mandatory/Optional category.
- New ingredients default to Mandatory.
- Quantity, unit, notes, and assigned person are optional.
- Every ingredient has a Prepared checkbox/state.
- Legacy ingredients without a category default safely to Mandatory.
- Ingredient changes remain attached to the correct dish.
- No separate preparation-task system is introduced.

### Checklist
- The checklist displays existing ingredients.
- The user can mark an ingredient prepared/unprepared.
- The checklist updates the same ingredient record.
- The checklist does not create duplicate records.

## Build order
1. Plan creation and workspace
2. Dish management and weekday assignment
3. Ingredient management with all fields above
4. Advance-preparation checklist
5. Local save behavior
6. superbase database
7. Sharing links
8. AI generation
9. Saved recipes
10. Print-friendly output
