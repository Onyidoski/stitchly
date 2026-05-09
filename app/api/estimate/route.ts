import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const estimateRequestSchema = z.object({
  description: z.string().trim().min(1).max(2000),
  measurements: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = estimateRequestSchema.safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid estimate request' }, { status: 400 })
    }

    const { description, measurements } = parsed.data

    const bust = measurements?.bust ?? measurements?.chest ?? 'N/A'
    const waist = measurements?.waist ?? 'N/A'
    const hips = measurements?.hip ?? measurements?.hips ?? 'N/A'
    const shoulder = measurements?.shoulder ?? 'N/A'
    const sleeve = measurements?.sleeve ?? measurements?.sleeve_length_full ?? 'N/A'
    const length = measurements?.length ?? measurements?.full_length ?? measurements?.blouse_length ?? 'N/A'

    const measurementContext = measurements
      ? `Client Measurements (in inches):
         - Chest/Bust: ${bust}
         - Waist: ${waist}
         - Hips: ${hips}
         - Shoulder: ${shoulder}
         - Sleeve: ${sleeve}
         - Length: ${length}`
      : 'No specific client measurements provided. Use standard adult sizing.'

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        fabric_yards: z.string().describe('The estimated fabric needed, e.g., "4-5 yards"'),
        price_min: z.number().describe('Minimum recommended price in Naira (N)'),
        price_max: z.number().describe('Maximum recommended price in Naira (N)'),
        reasoning: z.string().describe('Short explanation calculating usage based on the specific body measurements provided'),
      }),
      system: `You are an expert Nigerian fashion designer and tailor.
      Analyze the style description and the client's specific body measurements provided.

      1. Estimate the yards of fabric needed. CRITICAL: Adjust the yardage based on the provided body measurements (e.g., larger bust/hips require more fabric).
      2. Suggest a fair price range in Nigerian Naira (N) for sewing/labor (excluding fabric cost).
      3. Be realistic with current market rates in Lagos/Abuja.`,
      prompt: `Style Description: ${description}\n\n${measurementContext}`,
    })

    return NextResponse.json({ result: object })
  } catch (error) {
    console.error('AI Error:', error)
    return NextResponse.json({ error: 'Failed to generate estimate' }, { status: 500 })
  }
}
