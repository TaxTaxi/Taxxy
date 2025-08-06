// src/app/api/ai-tax-summary/route.ts
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

    // Generate AI tax summary
    const aiSummary = await generateAITaxSummary(summary);

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

async function generateAITaxSummary(summary: TransactionSummary): Promise<string> {
  const taxableIncome = summary.totalIncome - summary.businessExpenses;
  const estimatedTax = Math.max(0, taxableIncome * 0.25);

  const prompt = `
You are a professional tax advisor. Based on the following financial data, write a comprehensive but concise tax summary paragraph (250-350 words) that explains the user's tax situation in clear, actionable language.

Financial Data:
- Total Income: $${summary.totalIncome.toFixed(2)}
- Total Expenses: $${summary.totalExpenses.toFixed(2)}
- Business Expenses (Deductible): $${summary.businessExpenses.toFixed(2)}
- Personal Expenses (Non-deductible): $${summary.personalExpenses.toFixed(2)}
- Write-offs: $${summary.writeOffs.toFixed(2)}
- Transaction Count: ${summary.transactionCount}
- Date Range: ${summary.dateRange.start} to ${summary.dateRange.end}
- Taxable Income: $${taxableIncome.toFixed(2)}
- Estimated Tax (25%): $${estimatedTax.toFixed(2)}
- Top Spending Categories: ${summary.topCategories.map(cat => `${cat.category} ($${cat.amount.toFixed(2)})`).join(', ')}

Write a professional tax summary that:
1. Opens with an overview of their financial position
2. Highlights key deductions and tax advantages
3. Explains their estimated tax liability
4. Provides 2-3 actionable recommendations
5. Uses encouraging, professional language
6. Mentions specific dollar amounts for impact

Keep it conversational but authoritative. Focus on being helpful and informative without being overly technical.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 500
  });

  return response.choices[0]?.message?.content || 'Unable to generate tax summary at this time.';
}