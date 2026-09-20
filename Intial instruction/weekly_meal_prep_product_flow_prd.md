# Weekly Meal Prep Planner — Product and User Flow PRD

## 1. Product Overview

The Weekly Meal Prep Planner helps a person decide what to cook during the coming week and prepare ingredients in advance.

The core problem:

> Every day, the user has to figure out what to cook, what ingredients are needed, and what preparation must happen first. This creates avoidable mental effort and can waste around an hour.

The product turns weekly meal planning into a clear execution sheet.

The intended workflow is:

1. Plan the week.
2. Add dishes.
3. Generate or enter ingredients.
4. Convert ingredients into preparation tasks.
5. Assign tasks to people.
6. Prepare ingredients in advance.
7. Cook each day using the prepared ingredients.

## 2. Target User

The primary user is one person planning meals for a household.

The user may coordinate with a cook or family members, but the MVP does not include accounts or collaboration.

Names can be added to tasks for organizational purposes.

## 3. Product Principles

- Fast to use.
- Laptop-first.
- Clear rather than feature-heavy.
- Every AI result must be editable.
- The weekly plan must remain understandable without the AI.
- A user should be able to recover from mistakes.
- The user should not need to understand technical concepts.
- The final output should be useful in the kitchen.

## 4. MVP Scope

### Included

- Create a weekly plan.
- Select or enter the week.
- Add many dishes, including more than 14–15 dishes.
- Assign each dish to a weekday.
- Generate ingredients with AI.
- Manually enter or edit ingredients.
- Mark ingredients as mandatory or optional.
- Specify useful preparation forms.
- Add short cooking instructions.
- Create preparation tasks.
- Assign a person’s name to a task.
- Mark tasks complete.
- View the plan by day.
- View preparation tasks in an advance-preparation checklist.
- Save custom recipes.
- Copy saved recipes into a new week.
- Generate a read-only public link.
- Keep editing available only through the private edit link.
- Print or save the plan as a PDF.

### Excluded

- Accounts and login.
- Collaboration.
- Comments.
- Notifications.
- Mobile optimization.
- Grocery ordering.
- Nutrition tracking.
- Pantry inventory.
- Advanced ingredient merging.
- Automated shopping lists.
- Recipe ratings.
- Social features.

## 5. Core Concepts

### Weekly plan

A container representing one week of meals and preparation tasks.

### Dish

A meal the user intends to cook on a particular day.

Examples:

- Oats omelette.
- Rajma rice.
- Paneer bhurji.

### Ingredient

An item needed for a dish.

Each ingredient can have:

- Name.
- Quantity.
- Unit.
- Mandatory/optional category.
- Preparation form.
- Notes.

### Preparation task

An actionable preparation activity.

Examples:

- Boil potatoes.
- Dice onions.
- Make tomato paste.
- Marinate paneer.
- Portion oats.

### Saved recipe

A reusable recipe template stored independently of a particular week.

When reused, it is copied into the current week. Editing the weekly copy does not change the saved original.

## 6. Primary User Journey

### Step 1: Open the app

The user sees:

- App name.
- Short explanation.
- `Create weekly plan` button.
- `Open existing plan` option.

### Step 2: Create a weekly plan

The user selects:

- Week start date or week identifier.
- Optional plan title.

The app creates the plan and displays:

- Weekly plan workspace.
- Public view link.
- Private edit link or edit-link management control.

The private edit link must be clearly marked as sensitive.

### Step 3: Add dishes

The user clicks `Add dish`.

The user chooses one of three paths:

1. Generate with AI.
2. Enter manually.
3. Copy a saved recipe.

The user enters:

- Dish name.
- Day of the week.
- Optional notes.

The user can add as many dishes as needed.

The app must not impose a low limit such as 14 or 15 dishes unless a technical limit is necessary.

### Step 4A: Generate a dish with AI

The user enters a dish name, such as `Oats omelette`, and clicks `Generate ingredients`.

The app:

1. Shows a loading state.
2. Sends the dish name and any optional instructions to the server.
3. The server calls the AI model.
4. The server validates the response.
5. The app displays editable ingredient rows and optional instructions.

Each ingredient row shows:

- Ingredient name.
- Quantity.
- Unit.
- Mandatory/optional selector.
- Preparation form.
- Notes.
- Delete control.

The user can:

- Edit any value.
- Add an ingredient.
- Delete an ingredient.
- Change mandatory/optional classification.
- Add or edit instructions.
- Confirm the dish.

The AI response must not become permanent until the user confirms or saves the dish.

### Step 4B: Enter a dish manually

The user enters:

- Dish name.
- Day.
- Ingredients.
- Quantities.
- Preparation forms if needed.
- Optional instructions.

The user can add or remove ingredient rows.

Manual dishes must work without an AI call.

### Step 4C: Copy a saved recipe

The user selects a saved recipe.

The app asks for the target day if it has not already been selected.

The app copies the saved recipe into the current week.

The copied dish is independent. Editing it does not modify the saved recipe.

## 7. Weekly Workspace

The weekly workspace is the main screen.

It should provide:

- Week title/date.
- Day navigation or day sections from Monday to Sunday.
- Dish cards grouped by day.
- Add dish button.
- Preparation checklist access.
- Saved recipes access.
- Print/PDF button.
- Public view link control.
- Save status.

Each dish card should show:

- Dish name.
- Assigned day.
- Ingredient count.
- Preparation-task count.
- Completion summary if relevant.
- Edit and delete actions.

The interface should remain usable with a large plan containing at least 15 dishes.

## 8. Ingredient and Preparation Workflow

After a dish is confirmed, the app creates or updates its preparation tasks.

The user should be able to review the generated tasks.

A preparation task may include:

- Task description.
- Related dish.
- Related ingredient.
- Preparation day, usually the advance-preparation day.
- Assigned person.
- Completion state.

Examples:

| Task | Dish | Assigned to | Complete |
|---|---|---|---|
| Boil potatoes | Aloo paratha | Rahul | No |
| Dice onions | Oats omelette | Priya | Yes |
| Make tomato paste | Paneer curry | Rahul | No |

The product should not assume that every ingredient needs a preparation task.

For example:

- Salt may not need a separate task.
- A packaged ingredient may not need preparation.
- An ingredient may be used directly during cooking.

The user must be able to edit or remove unnecessary tasks.

## 9. Advance Preparation View

The advance preparation view is designed for the preparation session before the week begins.

It should show:

- All preparation tasks.
- Task description.
- Related dish.
- Assigned person.
- Completion checkbox.
- Optional preparation notes.

Useful filters or grouping:

- By assigned person.
- By dish.
- By completion status.

The simplest initial layout can be one checklist grouped by person or by task order.

When a task is marked complete:

- Its completion state is saved to the current plan.
- The UI updates immediately.
- The task remains available for review.

Completion state is personal plan data. It is not a collaboration or synchronization feature.

## 10. Daily Cooking View

The daily cooking view shows what is planned for each day.

For each day, show:

- Dish names.
- Ingredients required.
- Preparation forms.
- Short cooking instructions.
- Relevant advance-preparation notes.

The user should be able to move between days easily.

The daily view is intended for cooking execution, not detailed recipe publishing.

## 11. View by Person

A secondary view may show preparation tasks grouped by assigned person.

Example:

### Rahul

- Sunday: Boil potatoes — Aloo paratha.
- Sunday: Dice onions — Oats omelette.
- Sunday: Marinate paneer — Paneer tikka.

### Priya

- Sunday: Make tomato paste — Paneer curry.
- Sunday: Grate carrots — Carrot salad.

This view is a different presentation of the same preparation-task data.

It must not create duplicate tasks or a second source of truth.

If time is limited, this can be implemented after the basic day-based checklist.

## 12. Saved Recipes

The user can save a custom recipe for future use.

A saved recipe contains:

- Recipe name.
- Ingredients.
- Quantities.
- Preparation forms.
- Mandatory/optional categories.
- Notes.
- Optional instructions.

The saved recipe library should support:

- Create.
- View.
- Edit.
- Delete.
- Search by name if needed.
- Copy into the current weekly plan.

The saved recipe is a template.

When copied into a week:

- A new dish is created.
- All ingredients are copied.
- Preparation tasks are generated or copied.
- Changes to the weekly dish do not affect the saved recipe.

## 13. Public View and Private Editing Flow

After creating a plan, the user can obtain two links:

### Public view link

Purpose:

- Allow anyone with the link to see the plan.

Capabilities:

- Read-only viewing.
- No edit controls.
- No mutation requests.

### Private edit link

Purpose:

- Allow the plan owner to edit the plan without creating an account.

Capabilities:

- Add, edit, and delete dishes.
- Change days.
- Edit ingredients.
- Assign people.
- Mark tasks complete.
- Save recipes where permitted.
- Export the plan.

The UI must warn the user:

> Anyone who has your private edit link can edit this plan. Keep it private.

The public view should never display the private edit link.

## 14. Saving Behavior

The product must make saving obvious.

Recommended MVP behavior:

- User edits data locally in the interface.
- A `Save changes` button persists changes.
- The UI displays:
  - `Unsaved changes`
  - `Saving…`
  - `Saved`
  - `Save failed`

Actions that should trigger saving:

- Adding a dish.
- Editing a dish.
- Deleting a dish.
- Editing ingredients.
- Changing a day.
- Adding or editing a preparation task.
- Assigning a person.
- Marking a task complete.
- Saving a recipe.

If a save fails:

- Preserve the current unsaved state in the interface.
- Show a clear error.
- Allow retry.
- Do not silently discard changes.

## 15. Deletion Behavior

For destructive actions:

- Ask for confirmation when deleting a dish, recipe, or plan.
- Explain whether related ingredients and tasks will also be removed.
- Prefer soft deletion only if it is simple; otherwise use confirmed hard deletion.

Deleting a dish should remove or detach its associated ingredients and preparation tasks.

## 16. Error and Empty States

The product must handle:

### No weekly plan

Show a clear `Create weekly plan` action.

### Empty week

Show:

> No dishes added yet. Add your first dish to start planning.

### AI failure

Show:

> We couldn't generate this dish right now. You can retry or enter the ingredients manually.

### Invalid AI output

Do not display malformed data as if it were valid. Ask the user to retry or use manual entry.

### Failed save

Show the error and preserve unsaved edits.

### Invalid public link

Show a simple not-found or unavailable message.

### Invalid private edit link

Show a message explaining that the edit link is invalid or expired, without exposing sensitive details.

## 17. PDF/Print Flow

The user clicks `Print / Save as PDF`.

The app opens a print-friendly version.

The document should contain:

1. Weekly plan title and dates.
2. Advance preparation checklist.
3. Tasks grouped by person or task order.
4. Daily cooking plan.
5. Dishes by day.
6. Ingredients and preparation forms.
7. Short instructions.

The user uses the browser's print dialog and selects `Save as PDF`.

The print view must hide:

- Edit buttons.
- Navigation controls.
- Private edit links.
- Technical metadata.

## 18. Acceptance Criteria

### Plan creation

- The user can create a plan for a selected week.
- The plan receives a public view link.
- The plan receives a private edit link.
- The private link is not shown on the public view.

### Dish management

- The user can add at least 15 dishes.
- A dish can be assigned to any weekday.
- A dish can be edited and deleted.
- A dish can be entered manually.
- A dish can be generated using AI.

### Ingredient management

- AI-generated ingredients are editable.
- The user can add, remove, and modify ingredients.
- Each ingredient supports mandatory/optional classification.
- Preparation forms are optional and editable.

### Preparation tasks

- Tasks can be created from ingredients or manually.
- Tasks can be assigned to a person by name.
- Tasks can be marked complete.
- Completion state persists after saving.
- Tasks can be viewed in an advance-preparation checklist.

### Saved recipes

- A custom recipe can be saved.
- A saved recipe can be copied into a week.
- Editing a copied recipe does not change the saved original.

### Access

- Anyone with the public link can view the plan.
- Public viewers cannot modify the plan.
- Anyone with the private edit link can modify the plan.
- The application clearly warns that the private link must be kept secret.

### Export

- The plan can be printed cleanly.
- The print view contains advance preparation and daily cooking sections.
- Private edit credentials are excluded from the print view.

## 19. Suggested MVP Build Order

1. Create a weekly plan.
2. Add and edit dishes manually.
3. Assign dishes to days.
4. Add and edit ingredients manually.
5. Build the preparation checklist.
6. Add assignments and completion states.
7. Add database persistence.
8. Add private edit/public view links.
9. Add AI ingredient generation.
10. Add saved recipe copying.
11. Add print-friendly PDF output.
12. Add secondary views such as grouping by person.

The coding agent should complete and test each step before proceeding to the next.
