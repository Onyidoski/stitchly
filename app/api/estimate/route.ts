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

    // We use 'gemini-1.5-flash' because it is free and fast
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'), 
      schema: z.object({
        fabric_yards: z.string().describe('The estimated fabric needed, e.g., "4-5 yards"'),
        price_min: z.number().describe('Minimum recommended price in Naira (₦)'),
        price_max: z.number().describe('Maximum recommended price in Naira (₦)'),
        reasoning: z.string().describe('Short explanation for the price and fabric usage'),
      }),
      system: `You are an expert Nigerian fashion designer and tailor. 
      Analyze the style description provided. 
      1. Estimate the yards of fabric needed for an average adult.
      2. Suggest a fair price range in Nigerian Naira (₦) for sewing/labor (excluding fabric cost).
      3. Be realistic with current market rates in Lagos/Abuja.`,
      prompt: description,
    })

    return NextResponse.json({ result: object })

  } catch (error) {
    console.error('AI Error:', error)
    return NextResponse.json({ error: 'Failed to generate estimate' }, { status: 500 })
  }
}