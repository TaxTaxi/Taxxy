// src/utils/getRelevantCorrections.ts - Enhanced matching algorithm
import { supabase } from "@/lib/supabase";

interface CorrectionMatch {
  id: string;
  transaction_description: string;
  original_purpose?: string;
  corrected_purpose?: string;
  original_reason?: string;
  corrected_reason?: string;
  date: string;
  user_id?: string;
  relevanceScore: number; // New: scoring system
}

export async function getRelevantCorrections(description: string): Promise<CorrectionMatch[]> {
  try {
    // Get current user for personalized corrections
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No user found for corrections lookup");
      return [];
    }

    // Fetch user's corrections with better query
    const { data: corrections, error } = await supabase
      .from("corrections")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(50); // Get more recent corrections

    if (error) {
      console.error("❌ Failed to fetch corrections:", error);
      return [];
    }

    if (!corrections || corrections.length === 0) {
      return [];
    }

    // 🧠 Enhanced matching with multiple strategies
    const scoredCorrections = corrections
      .map(correction => ({
        ...correction,
        relevanceScore: calculateRelevanceScore(description, correction)
      }))
      .filter(correction => correction.relevanceScore > 0.1) // Only meaningful matches
      .sort((a, b) => b.relevanceScore - a.relevanceScore) // Best matches first
      .slice(0, 5); // Top 5 most relevant

    console.log(`🎯 Found ${scoredCorrections.length} relevant corrections for "${description}"`);
    
    return scoredCorrections;

  } catch (err) {
    console.error("❌ Error in getRelevantCorrections:", err);
    return [];
  }
}

// 🎯 Advanced relevance scoring algorithm
function calculateRelevanceScore(targetDescription: string, correction: any): number {
  const target = targetDescription.toLowerCase().trim();
  const source = correction.transaction_description.toLowerCase().trim();
  
  let score = 0;

  // 1. Exact substring match (highest weight)
  if (source.includes(target) || target.includes(source)) {
    score += 1.0;
  }

  // 2. Word overlap scoring
  const targetWords = extractMeaningfulWords(target);
  const sourceWords = extractMeaningfulWords(source);
  
  const commonWords = targetWords.filter(word => sourceWords.includes(word));
  if (targetWords.length > 0) {
    score += (commonWords.length / targetWords.length) * 0.8;
  }

  // 3. Business/category pattern matching
  const categoryBonus = calculateCategoryRelevance(target, source);
  score += categoryBonus * 0.6;

  // 4. Vendor/merchant matching
  const merchantBonus = calculateMerchantRelevance(target, source);
  score += merchantBonus * 0.5;

  // 5. Amount pattern similarity (if we had amounts, but focusing on description)
  
  // 6. Recency bonus (more recent corrections are more relevant)
  const daysAgo = Math.floor(
    (new Date().getTime() - new Date(correction.date).getTime()) / (1000 * 60 * 60 * 24)
  );
  const recencyBonus = Math.max(0, (30 - daysAgo) / 30 * 0.2); // Bonus for corrections within 30 days
  score += recencyBonus;

  // 7. Purpose change significance (corrections that changed purpose are more important)
  if (correction.original_purpose !== correction.corrected_purpose) {
    score += 0.3;
  }

  return Math.min(2.0, score); // Cap at 2.0 for normalization
}

// 🔤 Extract meaningful words (filter out common words)
function extractMeaningfulWords(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'payment', 'purchase', 'transaction'
  ]);

  return text
    .split(/[\s\-_,\.]+/)
    .map(word => word.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(word => word.length > 2 && !stopWords.has(word));
}

// 🏢 Calculate category-based relevance
function calculateCategoryRelevance(target: string, source: string): number {
  const businessCategories = [
    ['software', 'saas', 'subscription', 'app', 'service'],
    ['office', 'supplies', 'equipment', 'desk', 'chair'],
    ['travel', 'flight', 'hotel', 'uber', 'lyft', 'taxi'],
    ['food', 'restaurant', 'meal', 'lunch', 'dinner', 'catering'],
    ['marketing', 'advertising', 'promotion', 'ads', 'campaign'],
    ['professional', 'consultant', 'lawyer', 'accountant', 'service'],
    ['internet', 'phone', 'communication', 'wifi', 'cellular'],
    ['fuel', 'gas', 'parking', 'toll', 'mileage']
  ];

  for (const category of businessCategories) {
    const targetMatches = category.some(term => target.includes(term));
    const sourceMatches = category.some(term => source.includes(term));
    
    if (targetMatches && sourceMatches) {
      return 1.0; // Strong category match
    }
  }

  return 0;
}

// 🏪 Calculate merchant/vendor relevance  
function calculateMerchantRelevance(target: string, source: string): number {
  // Common merchant patterns
  const merchantPatterns = [
    /amazon|amzn/i,
    /google|goog/i,
    /microsoft|msft/i,
    /apple|itunes/i,
    /adobe/i,
    /zoom/i,
    /slack/i,
    /uber|lyft/i,
    /starbucks|coffee/i,
    /walmart|target/i
  ];

  for (const pattern of merchantPatterns) {
    if (pattern.test(target) && pattern.test(source)) {
      return 1.0; // Same merchant
    }
  }

  // Check for similar merchant names (basic approach)
  const targetMerchants = extractPotentialMerchants(target);
  const sourceMerchants = extractPotentialMerchants(source);
  
  for (const targetMerchant of targetMerchants) {
    for (const sourceMerchant of sourceMerchants) {
      if (targetMerchant.length > 3 && sourceMerchant.includes(targetMerchant)) {
        return 0.8;
      }
    }
  }

  return 0;
}

// 🏷️ Extract potential merchant names from transaction descriptions
function extractPotentialMerchants(text: string): string[] {
  // Look for capitalized words that might be merchant names
  const words = text.split(/\s+/);
  return words
    .filter(word => word.length > 3)
    .filter(word => /^[A-Z]/.test(word) || word.toUpperCase() === word)
    .map(word => word.toLowerCase().replace(/[^a-z]/g, ''));
}