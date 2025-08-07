// src/app/api/aitag/route.ts - Enhanced with better learning
import { OpenAI } from "openai";
import { getRelevantCorrections } from "@/utils/getRelevantCorrections";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🆕 Enhanced prompt building with tax profile
async function buildPersonalizedPrompt(description: string, amount: number, merchant: string, date: string, examples: any[]) {
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
            // Ignore middleware errors
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user, fall back to basic prompt
  if (!user) {
    return buildBasicPrompt(description, examples);
  }

  // Get tax profile
  const { data: profile } = await supabase
    .from('tax_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return buildBasicPrompt(description, examples);
  }

  // Build personalized context
  const businessContext = profile.business_type && profile.business_type !== 'not_applicable'
    ? `User operates a ${profile.business_type}${profile.business_name ? ` called "${profile.business_name}"` : ''}.`
    : 'User does not have a business.';

  const homeOfficeContext = profile.has_home_office && profile.home_office_square_feet
    ? `They have a ${profile.home_office_square_feet} sq ft home office.`
    : '';

  const vehicleContext = profile.uses_vehicle_for_business 
    ? `They use ${profile.business_miles_percentage || 0}% of vehicle for business.`
    : '';

  const learningContext = buildLearningContext(examples, description);

  return `You are an expert financial transaction classifier with access to the user's tax profile. You learn from user corrections to improve accuracy.

USER TAX PROFILE:
- Business: ${businessContext}
- Home Office: ${homeOfficeContext || 'None'}
- Vehicle: ${vehicleContext || 'No business vehicle use'}
- State: ${profile.state}
- Filing Status: ${profile.filing_status}

IMPORTANT LEARNING FROM USER FEEDBACK:
${learningContext}

CLASSIFICATION RULES:
1. Business expenses: Use their specific business type for context
2. Personal expenses: Groceries, entertainment, personal shopping, personal medical
3. Use their profile to make confident categorizations
4. Provide specific writeOff reasons based on their actual business structure

Return JSON in this exact format:
{
  "tag": "short descriptive tag",
  "category": "expense category", 
  "confidence": number (0-1, where 1 is very confident),
  "purpose": "business" or "personal",
  "writeOff": {
    "isWriteOff": boolean,
    "reason": "specific tax deduction reason based on their ${profile.business_type || 'situation'}"
  }
}

Transaction to classify: "${description}"

Examples of confident, profile-specific responses:
- "Based on your ${profile.business_type || 'business'} structure, this expense is 100% deductible"
- "As a ${profile.filing_status} filer with home office, this qualifies for deduction"

${examples.length > 0 ? `
Based on your past corrections, pay special attention to these patterns:
${formatCorrectionPatterns(examples)}
` : ''}`;
}

// 🆕 Fallback for when no profile exists
function buildBasicPrompt(description: string, examples: any[]) {
  const learningContext = buildLearningContext(examples, description);
  
  return `You are an expert financial transaction classifier. You learn from user corrections to improve accuracy.

IMPORTANT LEARNING FROM USER FEEDBACK:
${learningContext}

CLASSIFICATION RULES:
1. Business expenses: Office supplies, software, business meals, travel, equipment, professional services
2. Personal expenses: Groceries, entertainment, personal shopping, personal medical
3. If uncertain, lean toward "personal" with lower confidence
4. Use specific, actionable writeOff reasons when applicable

Return JSON in this exact format:
{
  "tag": "short descriptive tag",
  "category": "expense category", 
  "confidence": number (0-1, where 1 is very confident),
  "purpose": "business" or "personal",
  "writeOff": {
    "isWriteOff": boolean,
    "reason": "specific tax deduction reason or empty string"
  }
}

Transaction to classify: "${description}"

${examples.length > 0 ? `
Based on your past corrections, pay special attention to these patterns:
${formatCorrectionPatterns(examples)}
` : ''}`;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt: description } = await req.json();

    // 🔍 Get relevant past corrections with enhanced matching
    const examples = await getRelevantCorrections(description);
    
    // 📊 Calculate confidence adjustment based on correction history
    const confidenceAdjustment = calculateConfidenceAdjustment(examples, description);

    // 🆕 Use personalized prompt instead of basic one
    const fullPrompt = await buildPersonalizedPrompt(description, 0, '', '', examples);

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use latest model for better reasoning
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.1, // Lower temperature for consistency
      max_tokens: 300
    });

    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    let parsed;
    try {
      const jsonStart = content.indexOf("{");
      const jsonEnd = content.lastIndexOf("}");
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No JSON found in AI response");
      }
      
      const jsonString = content.slice(jsonStart, jsonEnd + 1);
      parsed = JSON.parse(jsonString);
      
    } catch (parseError) {
      console.error("❌ JSON parsing failed:", parseError);
      console.error("❌ Raw content:", content);
      
      // Enhanced fallback with better defaults
      parsed = {
        tag: extractKeywords(description),
        category: guessCategory(description),
        confidence: 0.15, // Very low confidence for parse failures
        purpose: "personal",
        writeOff: { isWriteOff: false, reason: "Classification uncertain - manual review needed" }
      };
    }

    // 🎯 Apply learning-based confidence adjustment
    let finalConfidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.2;
    finalConfidence = Math.min(1.0, finalConfidence + confidenceAdjustment);
    
    // 🔒 Ensure minimum confidence bounds
    if (finalConfidence < 0.1) finalConfidence = 0.1;
    if (finalConfidence > 0.95) finalConfidence = 0.95; // Never be 100% confident

    const result = {
      tag: parsed.tag || extractKeywords(description),
      category: parsed.category || guessCategory(description),
      confidence: finalConfidence,
      purpose: (parsed.purpose === "business" || parsed.purpose === "personal") 
        ? parsed.purpose 
        : inferPurposeFromDescription(description),
      writeOff: {
        isWriteOff: Boolean(parsed.writeOff?.isWriteOff),
        reason: parsed.writeOff?.reason || ""
      },
      // 🎓 Add learning metadata
      learnedFrom: examples.length,
      correctionInfluence: confidenceAdjustment
    };

    console.log(`✅ AI classified with ${examples.length} learning examples, confidence: ${finalConfidence.toFixed(2)}`);
    
    return NextResponse.json(result);

  } catch (err) {
    console.error("❌ AI API error:", err);
    
    const { prompt: description } = await req.json().catch(() => ({ prompt: "unknown" }));
    
    const safeFallback = {
      tag: extractKeywords(description),
      category: "unassigned",
      confidence: 0.05, // Extremely low for errors
      purpose: "personal",
      writeOff: {
        isWriteOff: false,
        reason: "AI service error - requires manual classification"
      },
      learnedFrom: 0,
      correctionInfluence: 0
    };
    
    return NextResponse.json(safeFallback);
  }
}

// 🧠 Build rich learning context from corrections
function buildLearningContext(examples: any[], currentDescription: string): string {
  if (examples.length === 0) {
    return "(No previous corrections found - learning from scratch)";
  }

  const learningPoints: string[] = [];
  
  examples.forEach((correction, index) => {
    const original = correction.original_purpose || "unknown";
    const corrected = correction.corrected_purpose || "unknown";
    const reason = correction.corrected_reason || correction.original_reason || "";
    
    if (original !== corrected) {
      learningPoints.push(
        `Learning ${index + 1}: "${correction.transaction_description}" was initially classified as ${original} but you corrected it to ${corrected}. ${reason ? `Reason: "${reason}"` : ""}`
      );
    }
  });

  if (learningPoints.length === 0) {
    return "(Previous corrections reviewed - no major pattern changes detected)";
  }

  return learningPoints.join("\n");
}

// 📊 Calculate confidence boost/penalty based on correction history
function calculateConfidenceAdjustment(examples: any[], description: string): number {
  if (examples.length === 0) return 0;

  let adjustment = 0;
  const descWords = description.toLowerCase().split(/\s+/);
  
  examples.forEach(correction => {
    const correctionDesc = correction.transaction_description.toLowerCase();
    const wordOverlap = descWords.filter(word => 
      word.length > 3 && correctionDesc.includes(word)
    ).length;
    
    if (wordOverlap > 0) {
      // If we have similar transactions that were corrected, be more confident
      // in applying those learnings
      adjustment += Math.min(0.15, wordOverlap * 0.05);
    }
  });

  return Math.min(0.3, adjustment); // Cap at 30% confidence boost
}

// 🏷️ Format correction patterns for AI learning
function formatCorrectionPatterns(examples: any[]): string {
  return examples.slice(0, 3).map((correction, i) => {
    const purposeChange = correction.original_purpose !== correction.corrected_purpose 
      ? `${correction.original_purpose} → ${correction.corrected_purpose}`
      : correction.corrected_purpose;
      
    return `Pattern ${i + 1}: "${correction.transaction_description}" should be classified as ${purposeChange}`;
  }).join("\n");
}

// 🔤 Extract keywords when parsing fails
function extractKeywords(description: string): string {
  const commonBusinessWords = ["software", "office", "meeting", "client", "business", "professional"];
  const words = description.toLowerCase().split(/\s+/);
  
  const businessMatch = words.find(word => 
    commonBusinessWords.some(bw => word.includes(bw))
  );
  
  if (businessMatch) return `business-${businessMatch}`;
  
  // Extract first meaningful word
  const meaningfulWord = words.find(word => word.length > 3);
  return meaningfulWord || "transaction";
}

// 📂 Guess category from description
function guessCategory(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes("software") || desc.includes("subscription")) return "software";
  if (desc.includes("office") || desc.includes("supplies")) return "office-supplies";
  if (desc.includes("travel") || desc.includes("flight")) return "travel";
  if (desc.includes("food") || desc.includes("restaurant") || desc.includes("meal")) return "meals";
  if (desc.includes("gas") || desc.includes("fuel")) return "transportation";
  
  return "unassigned";
}

// 🎯 Infer purpose from description patterns
function inferPurposeFromDescription(description: string): "business" | "personal" {
  const desc = description.toLowerCase();
  const businessIndicators = [
    "software", "subscription", "office", "client", "meeting", 
    "professional", "business", "work", "conference", "training"
  ];
  
  const hasBusinessIndicator = businessIndicators.some(indicator => 
    desc.includes(indicator)
  );
  
  return hasBusinessIndicator ? "business" : "personal";
}