// src/app/api/transactions/import-csv/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface Transaction {
  date: string;
  description: string;
  amount: number;
}

interface ImportResults {
  imported: number;
  skipped: number;
  aiClassified: number;
  needsReview: number;
  errors: string[];
}

interface AIResult {
  tag: string;
  category: string;
  purpose: string;
  confidence: number;
}

interface ExistingTransaction {
  date: string;
  description: string;
  amount: number;
}

interface ClassificationResult {
  aiClassified?: boolean;
  needsReview?: boolean;
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactions }: { transactions: Transaction[] } = await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Invalid transactions data' }, { status: 400 });
    }

    const results: ImportResults = {
      imported: 0,
      skipped: 0,
      aiClassified: 0,
      needsReview: 0,
      errors: []
    };

    // Get existing transactions to check for duplicates
    const { data: existingTransactions } = await supabase
      .from('transactions')
      .select('date, description, amount')
      .eq('user_id', user.id);

    const existingSet = new Set(
      existingTransactions?.map((t: ExistingTransaction) => `${t.date}-${t.description}-${t.amount}`) || []
    );

    const transactionsToProcess: any[] = [];

    for (const transaction of transactions) {
      try {
        // Parse and validate date
        const parsedDate = parseDate(transaction.date);
        if (!parsedDate) {
          results.errors.push(`Invalid date format: ${transaction.date}`);
          continue;
        }

        // Clean up amount
        const amount = parseFloat(transaction.amount.toString());
        if (isNaN(amount) || amount === 0) {
          results.errors.push(`Invalid amount: ${transaction.amount}`);
          continue;
        }

        // Check for duplicates
        const duplicateKey = `${parsedDate}-${transaction.description}-${amount}`;
        if (existingSet.has(duplicateKey)) {
          results.skipped++;
          continue;
        }

        transactionsToProcess.push({
          date: parsedDate,
          description: transaction.description.trim(),
          amount: amount,
          user_id: user.id,
          created_at: new Date().toISOString()
        });

      } catch (error) {
        results.errors.push(`Error processing transaction: ${(error as Error).message}`);
      }
    }

    // Batch insert transactions
    if (transactionsToProcess.length > 0) {
      const { data: insertedTransactions, error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsToProcess)
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: 'Failed to insert transactions' }, { status: 500 });
      }

      results.imported = insertedTransactions.length;

      // Process AI classification for each transaction
      const classificationPromises = insertedTransactions.map(async (transaction: any) => {
        try {
          // Call your existing AI tagging API
          const aiResponse = await fetch(`${request.nextUrl.origin}/api/aitag`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: transaction.description,
            }),
          });

          if (!aiResponse.ok) {
            throw new Error(`AI API returned ${aiResponse.status}`);
          }

          const aiResult = await aiResponse.json();
          
          // Update transaction with AI classification
          const { error: updateError } = await supabase
            .from('transactions')
            .update({
              tag: aiResult.tag || 'untagged',
              category: aiResult.category || 'unassigned',
              confidence: typeof aiResult.confidence === 'number' 
                ? Math.round(aiResult.confidence * 100)
                : 20, // Low confidence fallback
              purpose: aiResult.purpose === 'business' ? 'business' : 'personal',
              writeOff: aiResult.writeOff && typeof aiResult.writeOff === 'object' 
                ? {
                    isWriteOff: Boolean(aiResult.writeOff.isWriteOff),
                    reason: aiResult.writeOff.reason || ''
                  }
                : { isWriteOff: false, reason: '' },
              reviewed: false,
            })
            .eq('id', transaction.id);

          if (updateError) {
            console.error('AI classification update error:', updateError);
            return { needsReview: true } as ClassificationResult;
          }

          // Determine if needs review based on confidence
          const confidence = typeof aiResult.confidence === 'number' 
            ? Math.round(aiResult.confidence * 100) 
            : 20;
            
          if (confidence >= 75) {
            return { aiClassified: true } as ClassificationResult;
          } else {
            return { needsReview: true } as ClassificationResult;
          }

        } catch (error) {
          console.error('AI classification error:', error);
          return { needsReview: true } as ClassificationResult;
        }
      });

      // Wait for all classifications to complete
      const classificationResults: ClassificationResult[] = await Promise.all(classificationPromises);
      
      // Count results
      classificationResults.forEach((result: ClassificationResult) => {
        if (result.aiClassified) {
          results.aiClassified++;
        } else {
          results.needsReview++;
        }
      });
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}

// Helper function to parse various date formats
function parseDate(dateString: string): string | null {
  if (!dateString) return null;

  // Clean up the date string
  const cleaned = dateString.trim();
  
  // Try parsing as ISO date first
  const isoDate = new Date(cleaned);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString().split('T')[0];
  }

  // Try MM/DD/YYYY format (most common US format)
  const mmddyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Try YYYY-MM-DD format
  const yyyymmdd = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Try MM-DD-YYYY format
  const mmddyyyy2 = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mmddyyyy2) {
    const [, month, day, year] = mmddyyyy2;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  console.warn('Could not parse date:', dateString);
  return null;
}