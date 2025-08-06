// src/store/taxProfileStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface TaxProfile {
  id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  
  // Basic Tax Info
  filing_status: string;
  state: string;
  dependents: number;
  age: number;
  spouse_age?: number;
  
  // Business Info
  business_type: string;
  business_name: string;
  has_employees: boolean;
  
  // Home Office
  has_home_office: boolean;
  home_office_percentage?: number;
  home_office_square_feet?: number;
  total_home_square_feet?: number;
  
  // Vehicle
  uses_vehicle_for_business: boolean;
  business_miles_percentage?: number;
  tracks_actual_expenses: boolean;
  
  // Previous Year Tax Data
  previous_year_agi?: number;
  previous_year_tax_owed?: number;
  previous_year_refund?: number;
  
  // Deduction Preferences
  itemizes_deductions: boolean;
  has_mortgage: boolean;
  mortgage_interest?: number;
  property_taxes?: number;
  charitable_contributions_annual?: number;
  has_student_loans: boolean;
  
  // Health & Medical
  health_insurance_type: string;
  has_hsa: boolean;
  
  // Retirement & Savings
  has_401k: boolean;
  has_ira: boolean;
  has_roth_ira: boolean;
  max_retirement_contributions: boolean;
  
  // Quarterly Taxes
  makes_quarterly_payments: boolean;
  quarterly_payment_amount?: number;
  
  // Completion Status
  onboarding_completed: boolean;
  last_review_date?: string;
}

type TaxProfileState = {
  profile: TaxProfile | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadProfile: () => Promise<void>;
  saveProfile: (profile: Omit<TaxProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProfile: (updates: Partial<TaxProfile>) => Promise<void>;
  hasCompleteProfile: () => boolean;
  clearProfile: () => void;
};

export const useTaxProfileStore = create<TaxProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  loadProfile: async () => {
    set({ loading: true, error: null });
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        set({ error: 'User not authenticated', loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('tax_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading tax profile:', error);
        set({ error: error.message, loading: false });
        return;
      }

      set({ profile: data, loading: false });
    } catch (err) {
      console.error('Unexpected error loading tax profile:', err);
      set({ error: 'Failed to load tax profile', loading: false });
    }
  },

  saveProfile: async (profileData) => {
    set({ loading: true, error: null });
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        set({ error: 'User not authenticated', loading: false });
        return;
      }

      const profileWithMetadata = {
        ...profileData,
        user_id: user.id,
        onboarding_completed: true,
        last_review_date: new Date().toISOString(),
      };

      // First try to update existing profile
      const { data: existingProfile } = await supabase
        .from('tax_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // Update existing
        const { data, error } = await supabase
          .from('tax_profiles')
          .update(profileWithMetadata)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating tax profile:', error);
          set({ error: error.message, loading: false });
          return;
        }

        set({ profile: data, loading: false });
      } else {
        // Create new
        const { data, error } = await supabase
          .from('tax_profiles')
          .insert([profileWithMetadata])
          .select()
          .single();

        if (error) {
          console.error('Error creating tax profile:', error);
          set({ error: error.message, loading: false });
          return;
        }

        set({ profile: data, loading: false });
      }
    } catch (err) {
      console.error('Unexpected error saving tax profile:', err);
      set({ error: 'Failed to save tax profile', loading: false });
    }
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;

    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('tax_profiles')
        .update({
          ...updates,
          last_review_date: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating tax profile:', error);
        set({ error: error.message, loading: false });
        return;
      }

      set({ profile: data, loading: false });
    } catch (err) {
      console.error('Unexpected error updating tax profile:', err);
      set({ error: 'Failed to update tax profile', loading: false });
    }
  },

  hasCompleteProfile: () => {
    const { profile } = get();
    if (!profile) return false;
    
    // Check required fields for a complete profile
    return !!(
      profile.filing_status &&
      profile.state &&
      profile.age &&
      profile.business_type &&
      profile.onboarding_completed
    );
  },

  clearProfile: () => {
    set({ profile: null, error: null, loading: false });
  },
}));