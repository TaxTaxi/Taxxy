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

    // 🧠 Improved AI prompt with better instructions
    const fullPrompt = `
You are a financial classification assistant. Given a transaction description, return a JSON object with the following fields:

{
  "tag": string (short descriptive tag),
  "category": string (expense category),  
  "confidence": number (between 0 and 1, where 1 is very confident),
  "purpose": "business" or "personal",
  "writeOff": {
    "isWriteOff": boolean,
    "reason": string
  }
}

IMPORTANT: 
- If you are uncertain about the classification, set confidence to a low value (0.3-0.6)
- For very vague descriptions, still provide your best guess but with low confidence
- ALWAYS return valid JSON, never return plain text
- If unsure between business/personal, lean toward "personal" with low confidence

Description: "${description}"

Previous user corrections to guide you:
${correctionExamples || "(no previous examples)"}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.3, // Lower temperature for more consistent responses
    });

    const content = response.choices?.[0]?.message?.content?.trim();
    console.log("🧠 Raw AI response:", content);

    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    // Improved JSON parsing with better error handling
    let parsed;
    try {
      // Try to find JSON in the response
      const jsonStart = content.indexOf("{");
      const jsonEnd = content.lastIndexOf("}");
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No JSON found in AI response");
      }
      
      const jsonString = content.slice(jsonStart, jsonEnd + 1);
      parsed = JSON.parse(jsonString);
      
      // Validate required fields exist
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error("Parsed result is not an object");
      }
      
    } catch (parseError) {
      console.error("❌ JSON parsing failed:", parseError);
      console.error("❌ Content that failed to parse:", content);
      
      // Fallback: Return low confidence "uncertain" classification
      parsed = {
        tag: "uncertain",
        category: "unassigned", 
        confidence: 0.2, // Very low confidence
        purpose: "personal", // Default to personal when uncertain
        writeOff: {
          isWriteOff: false,
          reason: "Classification uncertain - needs manual review"
        }
      };
      
      console.log("🔄 Using fallback classification:", parsed);
    }

    // Ensure all required fields exist with proper defaults
    const result = {
      tag: parsed.tag || "unassigned",
      category: parsed.category || "unassigned",
      confidence: typeof parsed.confidence === "number" && parsed.confidence > 0 
        ? parsed.confidence 
        : 0.2, // Default to low confidence, not 0
      purpose: (parsed.purpose === "business" || parsed.purpose === "personal") 
        ? parsed.purpose 
        : "personal", // Default to personal when uncertain
      writeOff: {
        isWriteOff: Boolean(parsed.writeOff?.isWriteOff),
        reason: parsed.writeOff?.reason || "AI classification uncertain"
      }
    };

    // Additional validation - ensure confidence is reasonable
    if (result.confidence === 0) {
      result.confidence = 0.2; // Never return 0 confidence
    }

    console.log("✅ Final validated AI result:", result);
    return NextResponse.json(result);

  } catch (err) {
    console.error("❌ AI API error:", err);
    
    // Return a safe fallback instead of failing completely
    const fallbackResult = {
      tag: "error",
      category: "unassigned",
      confidence: 0.1, // Very low confidence to indicate error
      purpose: "personal",
      writeOff: {
        isWriteOff: false,
        reason: "AI service temporarily unavailable - needs manual review"
      }
    };
    
    console.log("🚨 Returning error fallback:", fallbackResult);
    return NextResponse.json(fallbackResult);
  }
}