import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const parseRequestSchema = z.object({
  text: z.string().trim().min(1).max(4000),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = parseRequestSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parse request' }, { status: 400 });
    }

    const { text } = parsed.data;

    const { object } = await generateObject({
      model: google('gemini-2.5-pro'),
      schema: z.object({
        round_shoulder: z.string().optional().describe("Round Shoulder measurement"),
        round_armhole: z.string().optional().describe("Round Armhole measurement"),
        round_upper_bust: z.string().optional().describe("Round Upper Bust measurement"),
        shoulder: z.string().optional().describe("Shoulder measurement"),
        bust_span: z.string().optional().describe("Bust Span measurement"),
        bust: z.string().optional().describe("Bust measurement"),
        bust_point: z.string().optional().describe("Bust Point measurement"),
        underbust: z.string().optional().describe("Underbust measurement"),
        underbust_point: z.string().optional().describe("Underbust Point measurement"),
        waist: z.string().optional().describe("Waist measurement"),
        waist_point: z.string().optional().describe("Waist Point measurement"),
        hip: z.string().optional().describe("Hip or Hips measurement"),
        hip_point: z.string().optional().describe("Hip Point measurement"),
        back_length: z.string().optional().describe("Back Length measurement"),
        knee_length: z.string().optional().describe("Knee Length measurement"),
        blouse_length: z.string().optional().describe("Blouse Length measurement"),
        full_length: z.string().optional().describe("Full Length measurement"),
        sleeve_length_short: z.string().optional().describe("Short Sleeve Length"),
        round_sleeve_short: z.string().optional().describe("Round Short Sleeve"),
        sleeve_length_elbow: z.string().optional().describe("Elbow Sleeve Length"),
        round_sleeve_elbow: z.string().optional().describe("Round Elbow Sleeve"),
        sleeve_length_3_4: z.string().optional().describe("3/4 Sleeve Length"),
        round_sleeve_3_4: z.string().optional().describe("Round 3/4 Sleeve"),
        sleeve_length_full: z.string().optional().describe("Full Sleeve Length"),
        round_sleeve_full: z.string().optional().describe("Round Full Sleeve"),
        trouser_waist: z.string().optional().describe("Trouser Waist measurement"),
        trouser_hips: z.string().optional().describe("Trouser Hips measurement"),
        trouser_hip_point: z.string().optional().describe("Trouser Hip Point measurement (Waist-Hip)"),
        thigh: z.string().optional().describe("Laps or Thigh measurement"),
        round_knee: z.string().optional().describe("Round Knee measurement"),
        ankle: z.string().optional().describe("Ankle or Foot measurement"),
        trouser_length: z.string().optional().describe("Trouser Length measurement"),
        pallazo_length: z.string().optional().describe("Pallazo Length measurement"),
        notes: z.string().optional().describe("Any extra notes or unmapped measurements"),
      }),
      prompt: `Extract the fashion measurements from the following text. Map them to the correct fields. If a measurement is not present, leave it undefined. If there is extra info or a measurement you can't map, put it in notes. The text is:\n\n${text}`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("AI Parse Error:", error);
    return NextResponse.json({ error: "Failed to parse measurements" }, { status: 500 });
  }
}
