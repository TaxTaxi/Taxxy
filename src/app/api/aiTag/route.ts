// src/app/api/aitag/route.ts
import { OpenAI } from "openai";
import { getRelevantCorrections } from "@/utils/getRelevantCorrections";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt: description } = await req.json();

    // 🔍 Get relevant past corrections
    const examples = await getRelevantCorrections(description);
    let correctionExamples = "";

    if (examples.length > 0) {
      correctionExamples = examples
        .map(
          (c, i) => `Example ${i + 1}:
Original: "${c.original.reason}" (${c.original.purpose})
Corrected: "${c.corrected.reason}" (${c.corrected.purpose})`
        )
        .join("\n\n");
    }

    // 🧠 Smarter AI prompt with examples
    const fullPrompt = `
You are a financial classification assistant. Given a transaction description, return a JSON object with the following fields:

{
  "tag": string,
  "category": string,
  "confidence": number (between 0 and 1),
  "purpose": "business" or "personal",
  "writeOff": {
    "isWriteOff": boolean,
    "reason": string
  }
}

Only return the JSON object. Do not add explanations or extra text.

Description: "${description}"

Here are previous user corrections to guide you:
${correctionExamples || "(no previous examples)"}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: fullPrompt }],
    });

    const content = response.choices?.[0]?.message?.content?.trim();
    console.log("🧠 Raw AI response:", content);

    const parsed = JSON.parse(content || "{}");

    if (!parsed.writeOff) {
      parsed.writeOff = {
        isWriteOff: false,
        reason: "AI did not determine this was a write-off",
      };
    }

    console.log("✅ Final Parsed AI Result:", parsed);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("❌ AI API error:", err);
    return new NextResponse("AI Error", { status: 500 });
  }
}
