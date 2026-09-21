import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { dishName } = await request.json();

    if (!dishName || typeof dishName !== 'string') {
      return NextResponse.json(
        { error: 'Dish name is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash-lite',
    });

    const prompt = `
You are a culinary data API.

CRITICAL INSTRUCTION:
Process ONLY the user-provided dish input below.
Never default to an unrequested recipe.

Return ONLY a valid, raw JSON object.
Do not include markdown, backticks, or commentary.

Return this exact structure:
{
  "dish_name": "STRING",
  "notes": "STRING",
  "ingredients": [
    {
      "name": "STRING",
      "recipe_quantity": NUMBER,
      "recipe_unit": "STRING",
      "type": "mandatory | optional",
      "prep_form": "STRING"
    }
  ]
}

STRICT RULES:

1. COUNTABLE VS UNCOUNTABLE UNITS:
- For countable items such as tomato, onion, egg, lemon, and chili, use "piece".
- For uncountable items such as flour, rice, sugar, butter, and beans, use "gm" or "ml" where appropriate.

2. NOTES:
- Keep notes ultra-short and telegraphic (under 25 words).
- Maximum 2–3 numbered cooking steps.

3. INGREDIENT NAMES:
- Use one general ingredient name only.
- Do not include brand names, aliases, or parenthetical descriptions.

4. RECIPE UNITS:
- Allowed units: "gm", "ml", "piece", "tsp", "tbsp", or "pinch".
- Quantity must be a positive number.

5. PREPARATION FORM:
- Describe the required preparation state, such as "Finely Diced", "Grated", or "Overnight Soaked".
- Use "None" when no preparation is needed.

6. INGREDIENT CATEGORIES:
- Use only "mandatory" or "optional".

INPUT DISH TO PROCESS:
"${dishName}"
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanedText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedData = JSON.parse(cleanedText);

    return NextResponse.json(parsedData);
  } catch (error) {
  console.error('Gemini ingredient generation failed:', error);

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : String(error),
    },
    { status: 500 }
  );
}
}