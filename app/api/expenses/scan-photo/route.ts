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

const scanRequestSchema = z.object({
  image: z
    .string()
    .min(1)
    .max(8_000_000)
    .refine((v) => v.startsWith('data:image/'), 'Expected an image data URL'),
})

const itemsSchema = z.object({
  items: z.array(
    z.object({
      category: z
        .enum(EXPENSE_CATEGORY_VALUES)
        .describe('The closest matching expense category'),
      description: z
        .string()
        .describe('Short description of what was bought'),
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

    const parsed = scanRequestSchema.safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid scan request' }, { status: 400 })
    }

    const { image } = parsed.data

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: itemsSchema,
      system: `You are a bookkeeping assistant for a Nigerian tailor/fashion business.
      The user photographed something to remember what they spent at a market or supplier.
      There is usually NO formal shop receipt — common inputs include:
      - Handwritten list in a notebook
      - Prices written on paper or a nylon bag
      - A supplier's price list (printed or handwritten)
      - Bank transfer / POS screenshot showing amount paid
      - Photo of items bought with prices noted nearby
      - WhatsApp message screenshot with items and prices

      Extract each separate purchase as a line item.
      - Map each item to: fabric, thread, needles, buttons, lining, fuel, labor, or other.
      - amount must be a plain number in Naira (strip ₦, N, commas).
      - If only one total is visible (e.g. transfer screenshot), return one item with a sensible description.
      - If text is unreadable, return an empty items array.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the expense line items from this photo.',
            },
            { type: 'image', image },
          ],
        },
      ],
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error('Photo Scan Error:', error)
    return NextResponse.json({ error: 'Failed to read photo' }, { status: 500 })
  }
}
