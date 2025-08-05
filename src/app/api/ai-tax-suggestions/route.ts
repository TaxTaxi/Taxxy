import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from "next/headers";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("🪪 User:", user);
    console.log("🚨 User Error:", userError);

    if (!user) {
      return NextResponse.json({ 
        error: "No user found", 
        userError: userError?.message 
      }, { status: 401 });
    }

    const { description, amount } = await request.json();

    if (!description || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ OpenAI call (keeping your original logic)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a tax assistant. Given a transaction description and amount, suggest:
- category: tax deduction category
- writeOff: true or false
- notes: brief explanation

Return ONLY valid JSON in this format:
{"category": "string", "writeOff": boolean, "notes": "string"}`,
        },
        {
          role: "user",
          content: `Description: "${description}", Amount: ${amount}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    
    // ✅ Your original JSON parsing
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    const jsonString = content.slice(jsonStart, jsonEnd + 1);
    const aiSuggestion = JSON.parse(jsonString);

    console.log("🧠 AI Suggestion:", aiSuggestion);
    console.log("🚨 About to insert with user_id:", user.id);
console.log("🔍 Trying to insert user_id:", user.id);
console.log("🔍 User object:", user);
console.log("🔍 About to insert:");
console.log("  user.id:", user.id);
console.log("  typeof user.id:", typeof user.id);
console.log("  user.id length:", user.id?.length);

const insertData = {
  description,
  amount,
  category: aiSuggestion.category,
  write_off: aiSuggestion.writeOff,
  notes: aiSuggestion.notes,
  user_id: user.id,
};
console.log("🔍 Insert data:", insertData);
    // ✅ Insert to Supabase
    const { error } = await supabase.from("ai_tax_suggestions").insert([
      {
        description,
        amount,
        category: aiSuggestion.category,
        write_off: aiSuggestion.writeOff,
        notes: aiSuggestion.notes,
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return NextResponse.json({ 
        error: "Database insert failed", 
        details: error.message,
        hint: error.hint,
        user_id: user.id 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: aiSuggestion });
  } catch (err: any) {
    console.error("❌ Route error:", err);
    return NextResponse.json({ error: "Route failed", details: err.message }, { status: 500 });
  }
}