// src/app/api/ai-tax-summary/route.ts - ENHANCED WITH PROFILE DATA
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  businessExpenses: number;
  personalExpenses: number;
  writeOffs: number;
  transactionCount: number;
  topCategories: Array<{ category: string; amount: number; count: number }>;
  dateRange: { start: string; end: string };
}

export async function POST(request: NextRequest) {
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

    console.log('🔍 Generating tax summary for user:', user.id);

    // 🆕 GET TAX PROFILE - This was missing!
    const { data: profile, error: profileError } = await supabase
      .from('tax_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('🔍 Tax profile found:', profile ? 'Yes' : 'No', profileError);

    // Get user's transactions and income
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);

    const { data: income, error: incomeError } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id);

    if (txError || incomeError) {
      console.error('Database error:', txError || incomeError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Calculate summary data using your existing logic
    const summary = calculateTransactionSummary(transactions || [], income || []);

    // 🆕 Generate PERSONALIZED AI tax summary using profile
    const aiSummary = await generatePersonalizedTaxSummary(summary, profile);

    return NextResponse.json({
      success: true,
      summary: aiSummary,
      data: summary
    });

  } catch (error) {
    console.error('AI tax summary error:', error);
    return NextResponse.json({ error: 'Failed to generate tax summary' }, { status: 500 });
  }
}

function calculateTransactionSummary(transactions: any[], income: any[]): TransactionSummary {
  // Calculate income total
  const totalIncome = income.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  // Calculate expenses (matching your existing logic)
  const businessExpenses = transactions
    .filter(tx => tx.purpose === 'business' && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
  const personalExpenses = transactions
    .filter(tx => tx.purpose === 'personal' && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
  // Write-offs total
  const writeOffs = transactions
    .filter(tx => tx.writeOff?.isWriteOff)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const totalExpenses = businessExpenses + personalExpenses;

  // Get top spending categories
  const categoryTotals: Record<string, { amount: number; count: number }> = {};
  
  transactions
    .filter(tx => tx.amount < 0)
    .forEach(tx => {
      const category = tx.category || 'unassigned';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { amount: 0, count: 0 };
      }
      categoryTotals[category].amount += Math.abs(tx.amount);
      categoryTotals[category].count += 1;
    });

  const topCategories: Array<{ category: string; amount: number; count: number }> = [];
  
  for (const [category, categoryData] of Object.entries(categoryTotals)) {
    topCategories.push({
      category,
      amount: categoryData.amount,
      count: categoryData.count
    });
  }
  
  topCategories.sort((a, b) => b.amount - a.amount);
  const topFiveCategories = topCategories.slice(0, 5);

  // Date range
  const dates = [...transactions, ...income]
    .map(item => item.date)
    .filter(Boolean)
    .sort();
    
  const dateRange = {
    start: dates[0] || new Date().toISOString().split('T')[0],
    end: dates[dates.length - 1] || new Date().toISOString().split('T')[0]
  };

  return {
    totalIncome,
    totalExpenses,
    businessExpenses,
    personalExpenses,
    writeOffs,
    transactionCount: transactions.length,
    topCategories: topFiveCategories,
    dateRange
  };
}

// 🆕 PERSONALIZED tax summary using profile data
async function generatePersonalizedTaxSummary(summary: TransactionSummary, profile: any): Promise<string> {
  const taxableIncome = summary.totalIncome - summary.businessExpenses;
  const estimatedTax = Math.max(0, taxableIncome * 0.25);

  // 🚨 If no profile, return message about completing profile
  if (!profile) {
    return `Based on your financial data, you have $${summary.totalIncome.toFixed(2)} in income and $${summary.businessExpenses.toFixed(2)} in business deductions. However, to provide truly personalized tax advice, I need your complete tax profile including your business structure, home office details, and filing status.

Complete your tax profile at /tax-onboarding to unlock specific advice like:
• Exact home office deduction calculations based on your space
• Business structure optimization for your situation  
• State-specific tax strategies for your location
• Personalized quarterly payment recommendations

Without your profile, I can only provide generic advice. Complete your onboarding to transform these generic insights into powerful, personalized tax strategy!`;
  }

  // 🆕 BUILD PERSONALIZED PROMPT using actual profile
  const homeOfficeDeduction = profile.has_home_office && profile.home_office_square_feet
    ? Math.min(profile.home_office_square_feet * 5, 1500)
    : 0;

  const vehicleDeduction = profile.uses_vehicle_for_business && profile.business_miles_percentage
    ? Math.round(12000 * (profile.business_miles_percentage / 100) * 0.655)
    : 0;

  const prompt = `You are Taxxy, a confident AI tax expert. Write a personalized tax summary (250-300 words) using the user's ACTUAL tax profile and financial data.

USER'S ACTUAL TAX PROFILE:
- Business: ${profile.business_type} "${profile.business_name}"${profile.has_employees ? ' with employees' : ''}
- Filing Status: ${profile.filing_status} in ${profile.state}
- Age: ${profile.age}, Dependents: ${profile.dependents}
- Home Office: ${profile.has_home_office ? `${profile.home_office_square_feet} sq ft (${homeOfficeDeduction > 0 ? `$${homeOfficeDeduction} deduction available` : 'qualifies for deduction'})` : 'None'}
- Vehicle: ${profile.uses_vehicle_for_business ? `${profile.business_miles_percentage}% business use ($${vehicleDeduction} potential deduction)` : 'No business vehicle'}
- Previous Year AGI: $${profile.previous_year_agi?.toLocaleString() || 'Not provided'}
- Charitable Contributions: $${profile.charitable_contributions_annual?.toLocaleString() || '0'}
- Retirement Accounts: ${[profile.has_401k && '401(k)', profile.has_ira && 'IRA', profile.has_hsa && 'HSA'].filter(Boolean).join(', ') || 'None'}

ACTUAL FINANCIAL DATA:
- Total Income: $${summary.totalIncome.toFixed(2)}
- Business Expenses: $${summary.businessExpenses.toFixed(2)}
- Personal Expenses: $${summary.personalExpenses.toFixed(2)}
- Write-offs: $${summary.writeOffs.toFixed(2)}
- Taxable Income: $${taxableIncome.toFixed(2)}
- Estimated Tax (25%): $${estimatedTax.toFixed(2)}
- Transaction Count: ${summary.transactionCount}

INSTRUCTIONS:
1. BE CONFIDENT - You are THE tax expert, never say "consult a professional"
2. Use their SPECIFIC business type (${profile.business_type}), filing status (${profile.filing_status}), and state (${profile.state})
3. Reference their actual home office size (${profile.home_office_square_feet || 0} sq ft) and business structure
4. Give exact deduction amounts: "Your ${profile.home_office_square_feet} sq ft home office provides a $${homeOfficeDeduction} deduction"
5. Calculate real tax savings and quarterly payments based on their data
6. Use their business name "${profile.business_name}" and employee status
7. Be specific: "As a ${profile.filing_status} filer with your ${profile.business_type} business..."

Write a professional, confident tax summary that uses their actual profile data, not hypotheticals. Focus on actionable strategies specific to their situation.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 600
  });

  return response.choices[0]?.message?.content || 'Unable to generate personalized tax summary at this time.';
}