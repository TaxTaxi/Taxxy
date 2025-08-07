// src/app/api/ai-chat/route.ts - DIAGNOSTIC VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();
    
    console.log('🔍 AI Chat Request:', { message, context });
    
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🔍 User:', user?.id, userError);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔍 DIAGNOSTIC: Get tax profile with detailed logging
    console.log('🔍 Fetching tax profile for user:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('tax_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('🔍 Profile query result:', { profile, profileError });
    
    // 🔍 DIAGNOSTIC: If no profile, return diagnostic info
    if (!profile) {
      const diagnosticResponse = `DIAGNOSTIC INFO - No tax profile found.

User ID: ${user.id}
Profile Error: ${profileError?.message || 'No error'}
Profile Data: ${JSON.stringify(profile)}

This means you need to:
1. Complete the tax onboarding at /tax-onboarding
2. Make sure the profile saves successfully
3. Check the tax_profiles table in Supabase

Without a tax profile, I can only give generic advice. Complete your profile to get personalized responses like:
- "Based on your LLC structure..."
- "Your 200 sq ft home office qualifies for $1,000 deduction..."
- "With your 25% business vehicle usage..."`;

      return NextResponse.json({ response: diagnosticResponse });
    }

    // 🔍 DIAGNOSTIC: If profile exists, show what we found
    const diagnosticInfo = `FOUND TAX PROFILE! Here's what I can see:

Business Type: ${profile.business_type || 'Not set'}
Business Name: ${profile.business_name || 'Not set'}
Has Employees: ${profile.has_employees ? 'Yes' : 'No'}
Filing Status: ${profile.filing_status || 'Not set'}
State: ${profile.state || 'Not set'}
Age: ${profile.age || 'Not set'}
Dependents: ${profile.dependents || 0}

Home Office:
- Has Home Office: ${profile.has_home_office ? 'Yes' : 'No'}
- Office Size: ${profile.home_office_square_feet || 0} sq ft
- Total Home Size: ${profile.total_home_square_feet || 0} sq ft

Vehicle:
- Uses Vehicle for Business: ${profile.uses_vehicle_for_business ? 'Yes' : 'No'}
- Business Percentage: ${profile.business_miles_percentage || 0}%

Other Deductions:
- Has Mortgage: ${profile.has_mortgage ? 'Yes' : 'No'}
- Has Student Loans: ${profile.has_student_loans ? 'Yes' : 'No'}
- Previous Year AGI: $${profile.previous_year_agi?.toLocaleString() || 'Not provided'}

With this data, I should be giving you personalized advice like:
"Based on your ${profile.business_type} structure and ${profile.home_office_square_feet} sq ft home office..."

But instead, it seems like the AI is ignoring this data. Let me now use this profile to give you a PROPER personalized response:`;

    // Calculate real deductions
    const homeOfficeDeduction = profile.has_home_office && profile.home_office_square_feet
      ? Math.min(profile.home_office_square_feet * 5, 1500)
      : 0;

    const vehicleDeduction = profile.uses_vehicle_for_business && profile.business_miles_percentage
      ? Math.round(12000 * (profile.business_miles_percentage / 100) * 0.655)
      : 0;

    const personalizedResponse = `${diagnosticInfo}

PERSONALIZED TAX ADVICE BASED ON YOUR PROFILE:

Based on your ${profile.business_type || 'business'} structure as a ${profile.filing_status} filer in ${profile.state}, here's your specific tax situation:

${profile.has_home_office ? `
🏠 HOME OFFICE: Your ${profile.home_office_square_feet} sq ft office qualifies for a $${homeOfficeDeduction.toLocaleString()} deduction using the simplified method.` : '🏠 HOME OFFICE: You don\'t have a home office set up - this could be a missed opportunity if you work from home.'}

${profile.uses_vehicle_for_business ? `
🚗 VEHICLE: With ${profile.business_miles_percentage}% business usage, you can deduct approximately $${vehicleDeduction.toLocaleString()} annually (assuming 12,000 miles/year at $0.655/mile).` : '🚗 VEHICLE: You don\'t use your vehicle for business - make sure to track miles if you do any business driving.'}

💰 COMBINED SAVINGS: These deductions save you approximately $${Math.round((homeOfficeDeduction + vehicleDeduction) * 0.24).toLocaleString()} in taxes (24% bracket).

${profile.business_type !== 'not_applicable' ? `
📋 BUSINESS STRUCTURE: Your ${profile.business_type} allows you to deduct business expenses directly. Make sure to track all legitimate business costs.` : ''}

This is what PERSONALIZED advice looks like - no generic "consult a professional" nonsense!`;

    return NextResponse.json({ response: personalizedResponse });

  } catch (error) {
    console.error('🔍 AI Chat Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate AI response',
        details: error instanceof Error ? error.message : 'Unknown error',
        diagnostic: 'Check server logs for detailed error info'
      },
      { status: 500 }
    );
  }
}