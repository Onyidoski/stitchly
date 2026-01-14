import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { description } = await req.json()

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      temperature: 0, // Keep this 0 for consistent pricing
      schema: z.object({
        fabric_yards: z.string().describe('The estimated fabric needed, e.g., "4-5 yards"'),
        price_min: z.number().describe('Minimum recommended price in Naira (₦)'),
        price_max: z.number().describe('Maximum recommended price in Naira (₦)'),
        // [!code ++] Updated description to force an answer every time
        reasoning: z.string().describe('A brief explanation of how the fabric yardage and price were calculated.'),
      }),
      system: `You are an expert Nigerian fashion designer and tailor (Stitchly AI). 
      
      YOUR TASK:
      Analyze the user's style description to estimate fabric usage and labor cost.

      RULES FOR ESTIMATION:
      1. FABRIC: If the style is vague (e.g., just "Ankara"), assume a standard adult outfit (e.g., Skirt & Blouse) and base estimates on that.
      2. PRICING: Provide a realistic labor cost range in Nigerian Naira (₦) for a professional tailor in Lagos.
      3. CONSISTENCY: Always give the same estimate for the same description.

      OUTPUT GUIDELINES:
      - 'fabric_yards': specific range (e.g. "5-6 yards").
      - 'reasoning': REQUIRED. Always explain why you chose this yardage and price. 
         (Example: "Off-shoulder styles require less fabric for the bodice but full sleeves consume more yardage.")`,
      prompt: description,
    })

    return NextResponse.json({ result: object })

  } catch (error) {
    console.error('AI Error:', error)
    return NextResponse.json({ error: 'Failed to generate estimate' }, { status: 500 })
  }
}