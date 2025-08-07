// src/lib/aiTaxAdvisor.ts
import { supabase } from '@/lib/supabase';

export interface TaxProfile {
  filing_status: string;
  state: string;
  age: number;
  dependents: number;
  business_type?: string;
  business_name?: string;
  has_employees: boolean;
  has_home_office?: boolean;
  home_office_square_feet?: number;
  total_home_square_feet?: number;
  uses_vehicle_for_business?: boolean;
  business_miles_percentage?: number;
  has_mortgage: boolean;
  has_student_loans: boolean;
  charitable_contributions_annual?: number;
  health_insurance_type?: string;
  has_401k?: boolean;
  previous_year_agi?: number;
  previous_year_tax_owed?: number;
}

interface TransactionContext {
  amount: number;
  description: string;
  category?: string;
  date: string;
  merchant?: string;
}

export class AITaxAdvisor {
  
  async getTaxProfile(): Promise<TaxProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('tax_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.log('No tax profile found:', error.message);
      return null;
    }

    return data;
  }

  private buildPersonalizedPrompt(profile: TaxProfile, context: TransactionContext): string {
    const businessInfo = profile.business_type 
      ? `The user operates a ${profile.business_type}${profile.business_name ? ` called "${profile.business_name}"` : ''} ${profile.has_employees ? 'with employees' : 'as a sole proprietor'}.`
      : 'The user does not have a business.';

    const homeOfficeInfo = profile.has_home_office && profile.home_office_square_feet && profile.total_home_square_feet
      ? `They have a home office of ${profile.home_office_square_feet} sq ft (${Math.round((profile.home_office_square_feet / profile.total_home_square_feet) * 100)}% of their home).`
      : profile.has_home_office 
        ? 'They have a home office but square footage details are not specified.'
        : 'They do not have a home office.';

    const vehicleInfo = profile.uses_vehicle_for_business && profile.business_miles_percentage
      ? `They use ${profile.business_miles_percentage}% of their vehicle for business purposes.`
      : profile.uses_vehicle_for_business
        ? 'They use their vehicle for business but percentage details are not specified.'
        : 'They do not use vehicle for business.';

    const deductionInfo = [
      profile.has_mortgage && 'mortgage interest',
      profile.has_student_loans && 'student loan interest', 
      profile.charitable_contributions_annual && `$${profile.charitable_contributions_annual} in charitable contributions`,
      profile.has_401k && '401(k) contributions'
    ].filter(Boolean).join(', ');

    return `You are Taxxy, a confident AI tax expert providing personalized advice. 

USER PROFILE:
- Filing Status: ${profile.filing_status}
- State: ${profile.state}  
- Age: ${profile.age}, Dependents: ${profile.dependents}
- ${businessInfo}
- ${homeOfficeInfo}
- ${vehicleInfo}
- Previous Year Income: $${profile.previous_year_agi?.toLocaleString() || 'Not provided'}
- Deductions: ${deductionInfo || 'None specified'}

TRANSACTION TO ANALYZE:
- Amount: $${Math.abs(context.amount)}
- Description: ${context.description}
- Date: ${context.date}
- Current Category: ${context.category || 'Uncategorized'}

INSTRUCTIONS:
1. BE CONFIDENT - You are the tax expert, not a referral service
2. Use their specific profile details in your advice
3. Provide actionable, personalized recommendations  
4. Reference their business type, home office, vehicle usage, etc. when relevant
5. Calculate specific deduction amounts when possible
6. Never say "consult a tax professional" - YOU are the tax professional
7. Be specific: "Based on your ${profile.business_type || 'situation'} structure..." not "If you have a business..."

Analyze this transaction and provide confident, personalized tax advice using their profile.`;
  }

  async getPersonalizedTaxAdvice(transaction: TransactionContext): Promise<string> {
    const profile = await this.getTaxProfile();
    
    if (!profile) {
      return `I'd love to give you personalized tax advice, but I don't have your tax profile yet. Complete your tax onboarding to unlock specific advice like:

• Exact home office deduction calculations
• Business expense categorization for your ${transaction.description}
• State-specific tax implications
• Quarterly payment recommendations

Complete your Tax Profile to get started!`;
    }

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: this.buildPersonalizedPrompt(profile, transaction),
          context: 'tax_advice'
        })
      });

      const data = await response.json();
      return data.response || 'Unable to generate advice at this time.';
    } catch (error) {
      console.error('AI Tax Advisor Error:', error);
      return 'Unable to generate personalized advice right now. Please try again.';
    }
  }

  async getQuarterlyTaxAdvice(): Promise<string> {
    const profile = await this.getTaxProfile();
    if (!profile) return 'Complete your tax profile to get quarterly payment advice.';

    const prompt = `Based on this tax profile, provide confident quarterly estimated tax payment advice:

PROFILE: ${profile.filing_status} filer in ${profile.state}, ${profile.business_type || 'No business'}, previous income $${profile.previous_year_agi?.toLocaleString() || 'unknown'}

Calculate estimated quarterly payments and provide specific advice. Be confident and actionable.`;

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, context: 'quarterly_advice' })
      });

      const data = await response.json();
      return data.response;
    } catch {
      return 'Unable to calculate quarterly payments right now.';
    }
  }

  async getDeductionOptimization(): Promise<string> {
    const profile = await this.getTaxProfile();
    if (!profile) return 'Complete your tax profile to get deduction optimization advice.';

    const homeOfficeDesc = profile.has_home_office && profile.home_office_square_feet 
      ? `${profile.home_office_square_feet} sq ft` 
      : 'None';
    
    const vehicleDesc = profile.uses_vehicle_for_business && profile.business_miles_percentage 
      ? `${profile.business_miles_percentage}% business use` 
      : 'None';

    const prompt = `Analyze this tax profile and provide confident deduction optimization strategies:

BUSINESS: ${profile.business_type || 'None'}
HOME OFFICE: ${homeOfficeDesc}
VEHICLE: ${vehicleDesc}
OTHER: Mortgage: ${profile.has_mortgage ? 'Yes' : 'No'}, Student Loans: ${profile.has_student_loans ? 'Yes' : 'No'}

Provide specific dollar amounts and optimization strategies. Be the confident tax expert.`;

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, context: 'deduction_optimization' })
      });

      const data = await response.json();
      return data.response;
    } catch {
      return 'Unable to generate deduction advice right now.';
    }
  }
}

export const aiTaxAdvisor = new AITaxAdvisor();