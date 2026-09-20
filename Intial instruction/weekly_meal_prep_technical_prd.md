# Weekly Meal Prep Planner — Technical PRD

## 1. Document Purpose

This document defines the simplest technically viable implementation of the Weekly Meal Prep Planner MVP.

It is intended for a coding agent. The agent must follow this document unless the product owner explicitly approves a change.

## 2. Product Summary

The application helps one person plan meals for a week and prepare ingredients in advance.

The user can:

- Add dishes for the upcoming week.
- Generate ingredient lists and preparation forms using AI.
- Add custom dishes manually.
- Assign dishes to days.
- Assign preparation tasks to people by name.
- Mark preparation tasks as complete.
- Reuse saved custom recipes by copying them into a new weekly plan.
- Export the weekly plan as a PDF.
- Share a read-only link to a weekly plan.
- Edit the plan only through a private edit mechanism controlled by the plan owner.

The application is laptop-first. Mobile compatibility is not a requirement for the MVP.

## 3. MVP Principles

1. Prefer the simplest implementation.
2. Keep infrastructure free or within free tiers.
3. Do not add authentication accounts unless technically necessary.
4. Do not build collaboration, comments, notifications, or real-time editing.
5. Do not build a sophisticated permissions system.
6. Do not build advanced ingredient deduplication.
7. Do not build a native mobile app.
8. Do not introduce a separate backend service unless required.
9. Use one source of truth for plan data.
10. Make all important data exportable.

## 4. Recommended Stack

### Frontend and application

- Next.js using the App Router.
- TypeScript.
- Tailwind CSS.
- React state and server actions/API routes only where needed.

### Database and backend

- Supabase free tier:
  - PostgreSQL database.
  - Simple database API.
- Use Supabase only for persistent weekly plans and saved custom recipes.

### Hosting

- Vercel free tier for deployment.
- No custom domain is required.
- The application can use the default `*.vercel.app` URL.

### PDF

Use a browser-based PDF generation approach first:

- Prefer print-friendly HTML/CSS.
- Use the browser's print dialog and “Save as PDF”.
- Do not introduce a server-side PDF rendering service in the MVP.

If a direct PDF download is later required, use a lightweight client-side PDF library only after the print workflow is validated.

### AI

- Amazon Bedrock through a server-side API route or server action.
- The API key/credentials must never be exposed to the browser.
- Start with the tested low-cost model selected by the product owner.
- The model must return strict JSON.
- Validate the model response with a runtime schema before using it.

### Validation

- Use Zod for validating:
  - API input.
  - AI output.
  - Database payloads.
  - Plan data received from the client.

### Optional utility libraries

Use only when needed:

- `date-fns` for date and week calculations.
- A small UUID utility, or server-generated IDs.

Do not add a state-management library for the MVP.

## 5. Cost Requirements

The MVP should aim for ₹0/month during low usage.

Expected free-tier services:

- Vercel: free hobby deployment.
- Supabase: free database tier.
- Amazon Bedrock: usage-based; use the least expensive suitable model and enforce limits.

Cost-control requirements:

- Add a maximum number of AI requests per action.
- Do not call AI automatically on every keystroke.
- AI is called only when the user explicitly requests ingredient generation.
- Show a loading state during AI requests.
- Add a basic request limit per plan or browser session.
- Keep prompts short and structured.
- Do not store unnecessary AI conversation history.
- Display a clear error when the AI request fails.

Important: free tiers and model pricing may change. The coding agent must verify current limits before deployment.

## 6. High-Level Architecture

```text
Browser
  |
  | HTTPS
  v
Next.js application on Vercel
  |
  | Server actions/API routes
  |---> Amazon Bedrock for ingredient generation
  |
  |---> Supabase PostgreSQL
          |
          |-- weekly plans
          |-- dishes
          |-- ingredients
          |-- preparation tasks
          |-- saved custom recipes
```

The browser must never directly call Amazon Bedrock.

The browser may read public plan data through a controlled Next.js route or a carefully restricted Supabase access pattern. Prefer routing reads and writes through Next.js server-side code so the access rules remain centralized.

## 7. Link and Access Model

Each weekly plan has:

- A public view identifier.
- A private edit token.

Example conceptual URLs:

- Read-only URL: `/plan/{publicPlanId}`
- Edit URL: `/edit/{privateEditToken}`

The actual URL structure may differ, but the behavior must remain the same.

### Public view

Anyone who possesses the public URL can:

- View the plan.
- View dishes, days, ingredients, preparation forms, assignments, and completion state if the product owner decides completion state should be visible.

Public viewers cannot:

- Edit the plan.
- Add or remove dishes.
- Change assignments.
- Mark tasks complete.
- Delete the plan.

### Private edit access

Only someone with the private edit URL/token can edit the plan.

Requirements:

- The private edit token must be cryptographically random.
- Store only a secure hash of the edit token in the database if practical.
- Never expose the edit token in public plan data.
- Do not place the edit token in ordinary database queries or client-visible responses.
- Do not log the edit token.
- The edit interface must verify the token server-side for every mutation.

### Security scope

This is not a full authentication system.

The MVP security model is “possession of a secret edit link grants edit access.” Anyone who obtains the private edit link can edit the plan.

The public view link must never grant edit access.

## 8. Database Design

Use a relational schema but keep it small.

### `weekly_plans`

- `id`: UUID, primary key.
- `public_id`: random non-sensitive identifier, unique.
- `edit_token_hash`: hashed private edit token.
- `week_start_date`: date.
- `title`: optional text.
- `created_at`: timestamp.
- `updated_at`: timestamp.
- `is_archived`: boolean, default false.

### `dishes`

- `id`: UUID, primary key.
- `plan_id`: foreign key to `weekly_plans`.
- `name`: text.
- `day_of_week`: integer or enum representing Monday–Sunday.
- `notes`: optional text.
- `sort_order`: integer.
- `created_at`: timestamp.

### `ingredients`

- `id`: UUID, primary key.
- `dish_id`: foreign key to `dishes`.
- `name`: text.
- `quantity`: text.
- `unit`: optional text.
- `category`: enum/text: `mandatory` or `optional`.
- `preparation_form`: optional text, e.g. `boiled`, `diced`, `paste`, `grated`.
- `notes`: optional text.
- `sort_order`: integer.

### `preparation_tasks`

- `id`: UUID, primary key.
- `plan_id`: foreign key to `weekly_plans`.
- `dish_id`: nullable foreign key to `dishes`.
- `ingredient_id`: nullable foreign key to `ingredients`.
- `task_text`: text.
- `day_of_week`: integer or enum.
- `assigned_to`: optional text.
- `is_completed`: boolean, default false.
- `sort_order`: integer.

A task should normally be generated from an ingredient, but storing `task_text` separately makes the checklist easy to display and edit.

### `saved_recipes`

- `id`: UUID, primary key.
- `name`: text.
- `description`: optional text.
- `ingredients_json`: JSONB.
- `created_at`: timestamp.
- `updated_at`: timestamp.

Saved recipes are reusable templates. They are not automatically tied to one week.

When a saved recipe is reused, its data is copied into the current plan. Later changes to the weekly copy must not change the saved original.

## 9. Data Ownership and Consistency

The weekly plan is the source of truth for the current week.

The saved recipe is a reusable template.

When a recipe is copied into a plan:

1. Create a new dish record.
2. Create new ingredient records.
3. Create new preparation task records.
4. Do not keep a live reference that would cause later edits to affect the saved recipe.

All related records must be created or updated in a transaction where possible.

## 10. API/Server Operations

Minimum server operations:

### Create plan

Input:

- Week start date.
- Optional title.

Output:

- Public plan URL.
- Private edit URL shown only once to the creator.

### Read public plan

Input:

- Public plan ID.

Output:

- Sanitized read-only plan data.

### Read editable plan

Input:

- Private edit token.

Output:

- Full plan data for the editor.

### Add dish

Input:

- Edit token.
- Dish name.
- Day.
- Optional notes.
- Ingredients/tasks if manually supplied.

### Generate ingredients

Input:

- Edit token.
- Dish name.
- Optional user instructions.

Behavior:

1. Verify edit token.
2. Call Bedrock.
3. Validate JSON using Zod.
4. Return structured ingredients.
5. Do not automatically save until the user confirms, unless the UI explicitly communicates that generation saves immediately.

### Update plan

Input:

- Edit token.
- Validated plan changes.

Behavior:

- Verify edit token.
- Validate payload.
- Update only permitted fields.
- Update `updated_at`.

### Save custom recipe

Input:

- Edit token or local owner context.
- Recipe name.
- Ingredients and preparation data.

### Copy saved recipe into plan

Input:

- Edit token.
- Saved recipe ID.
- Target day.

Behavior:

- Copy the recipe into the current plan as independent records.

### Delete plan or dish

Input:

- Edit token.
- Record ID.

Behavior:

- Verify ownership through the edit token.
- Use cascading deletes carefully.

## 11. AI Output Contract

The AI must return JSON in this conceptual format:

```json
{
  "dishName": "Oats Omelette",
  "ingredients": [
    {
      "name": "Oats",
      "quantity": "1/2",
      "unit": "cup",
      "category": "mandatory",
      "preparationForm": "dry oats",
      "notes": ""
    }
  ],
  "instructions": [
    "..."
  ]
}
```

Rules:

- `category` must be exactly `mandatory` or `optional`.
- Ingredient names must be plain and understandable.
- Quantities may be text because recipes vary.
- Preparation forms should be useful and actionable.
- Do not force a preparation form when none is necessary.
- Do not use meaningless forms such as `raw`, `liquid`, or `powdered` unless they help preparation.
- The UI must allow manual correction of every AI-generated field.
- AI output is a suggestion, not an authoritative recipe.

## 12. Local State and Autosave

Use local React state for edits in progress.

For the MVP:

- Save explicit user changes through a Save button or clearly defined debounced autosave.
- Prefer an explicit Save button initially because it is easier to reason about.
- Show `Unsaved changes`, `Saving`, `Saved`, and `Save failed` states.
- Warn the user before leaving a page with unsaved changes where technically feasible.

Do not implement offline synchronization or conflict resolution.

## 13. PDF/Print Architecture

Create a dedicated print-friendly route or view.

The print view should contain:

1. Week summary.
2. Advance preparation checklist.
3. Daily cooking plan from Monday to Sunday.
4. Dish names.
5. Ingredients and preparation forms.
6. Assigned person names.
7. Completion checkboxes or completion indicators if useful.

Use CSS print rules:

- Hide navigation and editing controls.
- Avoid splitting a single task block across pages where practical.
- Use readable spacing.
- Use a clear title and week date.

The first implementation may rely on browser “Print → Save as PDF.”

## 14. Deployment

Development:

- Run locally with environment variables.
- Use a local `.env.local` file.
- Never commit secrets.

Production:

- Deploy Next.js to Vercel.
- Store secrets in Vercel environment variables.
- Configure Supabase URL and server-side key.
- Configure Bedrock credentials securely.
- Test public read access and private edit access separately.

## 15. Environment Variables

Conceptual variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only.
- `BEDROCK_REGION`
- `BEDROCK_ACCESS_KEY_ID` — server-only.
- `BEDROCK_SECRET_ACCESS_KEY` — server-only.
- `BEDROCK_MODEL_ID`

The exact names may be changed by the coding agent, but server-only secrets must never use a public/client prefix.

## 16. Non-Goals

Do not implement:

- User registration.
- Login accounts.
- Multiple household workspaces.
- Real-time collaboration.
- Comments.
- Notifications.
- Grocery delivery.
- Nutrition tracking.
- Calorie calculations.
- Advanced pantry inventory.
- Automatic ingredient purchasing.
- Complex ingredient normalization.
- Mobile app.
- Native app.
- Multi-language support.
- Version history.
- Conflict resolution.
- Role-based permissions.

## 17. Technical Risks

### Private link leakage

Anyone with the edit link can edit. The product must clearly distinguish public and private links.

### AI inconsistency

AI may return invalid or inaccurate data. Use strict schema validation and editable fields.

### Free-tier limits

Database hosting, Vercel, and Bedrock limits may change. Keep usage low and expose clear errors.

### Accidental data loss

Use explicit saving and confirmation before destructive actions.

### PDF layout

Long plans may span multiple pages. Validate with realistic plans containing at least 15 dishes.

## 18. Definition of Done

The technical MVP is complete when:

- A user can create a weekly plan.
- A public read-only URL works.
- A private edit URL works.
- The public URL cannot mutate data.
- The private edit URL can add, edit, and delete dishes.
- AI-generated ingredients are validated and editable.
- Custom recipes can be saved.
- Saved recipes can be copied into a plan independently.
- Preparation tasks can be assigned and marked complete.
- The plan can be printed cleanly to PDF.
- Secrets are not exposed to the browser or repository.
- The app runs within the intended free/low-cost limits.
