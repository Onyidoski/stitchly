import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const EXPENSE_CATEGORY_VALUES = [
  'fabric',
  'thread',
  'needles',
  'buttons',
  'lining',
  'fuel',
  'labor',
  'other',
] as const

const parseRequestSchema = z.object({
  text: z.string().trim().min(1).max(4000),
})

const itemsSchema = z.object({
  items: z.array(
    z.object({
      category: z
        .enum(EXPENSE_CATEGORY_VALUES)
        .describe('The closest matching expense category'),
      description: z
        .string()
        .describe('Short description of the item, e.g. "2 cartons of thread"'),
      amount: z.number().describe('The cost in Nigerian Naira as a plain number'),
    })
  ),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = parseRequestSchema.safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parse request' }, { status: 400 })
    }

    const { text } = parsed.data

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: itemsSchema,
      system: `You are a bookkeeping assistant for a Nigerian tailor/fashion business.
      Extract individual expense line items from the user's note.
      - Map each item to the closest category: fabric, thread, needles, buttons, lining, fuel, labor, or other.
      - amount must be a plain number in Naira (strip currency symbols, commas, and the word "naira").
      - If a single note clearly contains several purchases, return one item per purchase.
      - If you cannot determine an amount for an item, skip that item.`,
      prompt: `Extract the expenses from this note:\n\n${text}`,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error('Expense Parse Error:', error)
    return NextResponse.json({ error: 'Failed to parse expenses' }, { status: 500 })
  }
}
