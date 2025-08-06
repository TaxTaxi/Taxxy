// src/app/api/tax-profile/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

    const profileData = await request.json();

    // Add metadata
    const profileWithMetadata = {
      ...profileData,
      user_id: user.id,
      onboarding_completed: true,
      last_review_date: new Date().toISOString(),
    };

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('tax_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('tax_profiles')
        .update(profileWithMetadata)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating tax profile:', error);
        return NextResponse.json({ error: 'Failed to update tax profile' }, { status: 500 });
      }

      return NextResponse.json({ success: true, profile: data });
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('tax_profiles')
        .insert([profileWithMetadata])
        .select()
        .single();

      if (error) {
        console.error('Error creating tax profile:', error);
        return NextResponse.json({ error: 'Failed to create tax profile' }, { status: 500 });
      }

      return NextResponse.json({ success: true, profile: data });
    }

  } catch (error) {
    console.error('Tax profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    // Get user's tax profile
    const { data, error } = await supabase
      .from('tax_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching tax profile:', error);
      return NextResponse.json({ error: 'Failed to fetch tax profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });

  } catch (error) {
    console.error('Tax profile GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}