// src/app/api/writeoff/route.ts
import { OpenAI } from "openai";
import { getRelevantCorrections } from "@/utils/getRelevantCorrections";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { description, purpose } = await req.json();

    // 🧠 Get past user corrections
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

    // ✅ Safe fallback for purpose
    const safePurpose = purpose || "unknown";

    // 🧠 Prompt with examples
    const prompt = `
You are a financial assistant. Determine whether the following transaction is a business write-off.

Respond ONLY with a JSON object like this:
{
  "writeOff": {
    "isWriteOff": true,
    "reason": "Brief explanation here"
  }
}

Or this:
{
  "writeOff": {
    "isWriteOff": false,
    "reason": "This is not a valid business write-off because..."
  }
}

Transaction:
Description: "${description}"
Purpose: "${safePurpose}"

Use these previous user corrections as guidance:
${correctionExamples || "(no prior examples)"}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices?.[0]?.message?.content?.trim();
    console.log("🧠 Raw write-off suggestion:", content);

    const suggestion = JSON.parse(content || "{}");

    return NextResponse.json(suggestion);
  } catch (err) {
    console.error("❌ Write-off API error:", err);
    return new NextResponse("AI Write-off Error", { status: 500 });
  }
}
