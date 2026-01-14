import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // [!code change] Destructure measurements from the request body
    const { description, measurements } = await req.json()

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    // Format measurements for the prompt (handle case where measurements might be missing)
    const measurementContext = measurements 
      ? `Client Measurements (in inches): 
         - Chest/Bust: ${measurements.chest || 'N/A'}
         - Waist: ${measurements.waist || 'N/A'}
         - Hips: ${measurements.hip || 'N/A'}
         - Shoulder: ${measurements.shoulder || 'N/A'}
         - Sleeve: ${measurements.sleeve || 'N/A'}
         - Length: ${measurements.length || 'N/A'}`
      : 'No specific client measurements provided. Use standard adult sizing.'

    // We use 'gemini-1.5-flash' because it is free and fast
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'), 
      schema: z.object({
        fabric_yards: z.string().describe('The estimated fabric needed, e.g., "4-5 yards"'),
        price_min: z.number().describe('Minimum recommended price in Naira (₦)'),
        price_max: z.number().describe('Maximum recommended price in Naira (₦)'),
        reasoning: z.string().describe('Short explanation calculating usage based on the specific body measurements provided'),
      }),
      // [!code change] Updated system prompt to emphasize measurements
      system: `You are an expert Nigerian fashion designer and tailor. 
      Analyze the style description and the client's specific body measurements provided.
      
      1. Estimate the yards of fabric needed. CRITICAL: Adjust the yardage based on the provided body measurements (e.g., larger bust/hips require more fabric).
      2. Suggest a fair price range in Nigerian Naira (₦) for sewing/labor (excluding fabric cost).
      3. Be realistic with current market rates in Lagos/Abuja.`,
      // [!code change] Pass both description and measurements in the prompt
      prompt: `Style Description: ${description}\n\n${measurementContext}`,
    })

    return NextResponse.json({ result: object })

  } catch (error) {
    console.error('AI Error:', error)
    return NextResponse.json({ error: 'Failed to generate estimate' }, { status: 500 })
  }
}