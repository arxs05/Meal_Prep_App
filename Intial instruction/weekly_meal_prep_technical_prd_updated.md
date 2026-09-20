# Weekly Meal Prep Planner — Technical PRD

## Purpose
Define the simplest implementation for the laptop-first Weekly Meal Prep Planner. Follow this document unless the product owner approves a change.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- React state for in-progress edits
- Local storage during the local-only phase
- **Neon PostgreSQL + Prisma** for the future persistent phase
- Zod for runtime validation when validation is introduced
- Amazon Bedrock server-side only in a later phase

Do not set up the database, AI, authentication, links, or PDF generation unless explicitly requested.

## Data model
### WeeklyPlan
- id
- weekStartDate/week identifier
- optional title
- dishes

### Dish
- id
- planId
- name: required text
- dayOfWeek: Monday–Sunday
- notes: optional text
- sortOrder
- ingredients

### Ingredient
- id
- dishId
- name: required non-empty text
- quantity: optional text
- unit: optional text
- category: required constrained value: `mandatory` or `optional`
- notes: optional text
- assignedPerson: optional text
- isPrepared: boolean, default `false`
- sortOrder

Rules:
- Category must always be `mandatory` or `optional`.
- New ingredients default to `mandatory`.
- Missing category in legacy local data normalizes to `mandatory`.
- Missing assignedPerson normalizes safely to empty/null.
- Missing isPrepared normalizes to false.
- Every ingredient field above must be editable except IDs and parent references.
- Do not add `preparation_form`.
- Do not create a PreparationTask table/entity.

## Ingredient UI requirements
The dish editor must support:
- Add multiple ingredient rows
- Edit name, quantity, unit, category, notes, assigned person
- Toggle isPrepared
- Delete ingredients
- Preserve ingredient order where practical

## Advance-preparation checklist
The checklist must be derived from the existing Ingredient records. It may display ingredient name, dish name, quantity, unit, category, assigned person, notes, and isPrepared.

Optional controls include search, prepared/unprepared filtering, category filtering, and grouping by person or dish.

Toggling a checklist checkbox must update the corresponding Ingredient.isPrepared value and use the active persistence mechanism when persistence exists. No duplicate records may be created.

## Validation
- Dish name is required.
- Day must represent Monday–Sunday.
- Ingredient name is required.
- Ingredient category is required and limited to `mandatory` or `optional`.
- Quantity, unit, notes, and assignedPerson are optional text.
- isPrepared must be boolean.
- sortOrder is numeric where used.

## Local persistence
Before database integration:
- Use React state for edits in progress.
- Use local storage only where the current implementation needs it.
- Preserve edits during normal UI interactions.
- Do not introduce premature database setup.

When explicit saving is implemented, show Unsaved changes, Saving, Saved, and Save failed states, and preserve edits after failed saves.

## Later-phase AI contract
AI generation must be explicit, server-side, validated, and editable before confirmation. Conceptual output:

```json
{
  "ingredients": [
    {
      "name": "Potatoes",
      "quantity": "500",
      "unit": "g",
      "category": "mandatory",
      "notes": ""
    }
  ]
}
```

AI output must not contain preparation tasks or a preparation-form field.

## Non-goals
No accounts, collaboration, comments, notifications, grocery ordering, nutrition, pantry inventory, mobile app, separate preparation tasks, task descriptions, task days, task notes, preparation forms, or duplicate person-wise data.

## Technical risks
- Keep local state, validation, and the future Prisma model aligned.
- Normalize legacy ingredients safely.
- Prevent accidental data loss.
- Keep large plans with at least 15 dishes usable.

## Definition of done for the current ingredient feature group
- Multiple ingredients can be added to a dish.
- Ingredients can be edited and deleted.
- Name is required.
- Mandatory/Optional category is present and editable.
- New ingredients default to Mandatory.
- Quantity and unit are optional.
- Notes and assigned person are optional.
- Prepared state exists and defaults to false.
- Legacy missing category defaults to Mandatory.
- Ingredient data remains attached to the correct dish.
- Any checklist uses the same ingredient records.
- No separate preparation-task system is introduced.
- The project builds successfully.
