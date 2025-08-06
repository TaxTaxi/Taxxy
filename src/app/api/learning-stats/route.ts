// src/app/api/learning-stats/route.ts - Track AI learning progress
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface LearningStats {
  totalCorrections: number;
  recentCorrections: number; // Last 30 days
  avgConfidenceImprovement: number;
  topCategories: Array<{ category: string; corrections: number }>;
  learningTrends: {
    weeklyCorrections: number[];
    confidenceOverTime: number[];
  };
}

export async function GET(request: NextRequest) {
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
              // Ignore middleware errors
            }
          },
        },
      }
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user corrections
    const { data: corrections, error } = await supabase
      .from('corrections')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching corrections:', error);
      return NextResponse.json({ error: 'Failed to fetch learning stats' }, { status: 500 });
    }

    // Calculate statistics
    const stats = calculateLearningStats(corrections || []);
    
    return NextResponse.json(stats);

  } catch (error) {
    console.error('Learning stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateLearningStats(corrections: any[]): LearningStats {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Basic counts
  const totalCorrections = corrections.length;
  const recentCorrections = corrections.filter(c => 
    new Date(c.date) >= thirtyDaysAgo
  ).length;

  // Category analysis
  const categoryCount: Record<string, number> = {};
  corrections.forEach(correction => {
    const desc = correction.transaction_description || '';
    const category = inferCategory(desc);
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCount)
    .map(([category, corrections]) => ({ category, corrections }))
    .sort((a, b) => b.corrections - a.corrections)
    .slice(0, 5);

  // Weekly trends (last 8 weeks)
  const weeklyCorrections = calculateWeeklyTrends(corrections);
  
  // Confidence improvement estimate
  const avgConfidenceImprovement = estimateConfidenceImprovement(corrections);

  return {
    totalCorrections,
    recentCorrections,
    avgConfidenceImprovement,
    topCategories,
    learningTrends: {
      weeklyCorrections,
      confidenceOverTime: [] // Could be implemented with more data
    }
  };
}

function calculateWeeklyTrends(corrections: any[]): number[] {
  const weeks = Array(8).fill(0);
  const now = new Date();
  
  corrections.forEach(correction => {
    const correctionDate = new Date(correction.date);
    const weeksAgo = Math.floor(
      (now.getTime() - correctionDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    
    if (weeksAgo >= 0 && weeksAgo < 8) {
      weeks[7 - weeksAgo]++; // Most recent week at the end
    }
  });
  
  return weeks;
}

function estimateConfidenceImprovement(corrections: any[]): number {
  if (corrections.length === 0) return 0;
  
  // Simple heuristic: more corrections = more learning = higher confidence
  // In reality, this would be calculated from actual AI performance metrics
  const correctionScore = Math.min(corrections.length / 20, 1); // Cap at 20 corrections
  return correctionScore * 15; // Up to 15% improvement
}

function inferCategory(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('software') || desc.includes('subscription')) return 'Software';
  if (desc.includes('office') || desc.includes('supplies')) return 'Office Supplies';
  if (desc.includes('travel') || desc.includes('flight')) return 'Travel';
  if (desc.includes('food') || desc.includes('restaurant')) return 'Meals';
  if (desc.includes('gas') || desc.includes('fuel')) return 'Transportation';
  if (desc.includes('marketing') || desc.includes('ads')) return 'Marketing';
  
  return 'Other';
}