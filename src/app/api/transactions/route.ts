// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from "next/headers";

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        error: "No user found",
        userError: userError?.message
      }, { status: 401 });
    }

    const { description, amount, date, category } = await request.json();

    if (!description || !amount || !date) {
      return NextResponse.json({ 
        error: "Missing required fields: description, amount, date" 
      }, { status: 400 });
    }

    // Create the transaction (preserve positive/negative amounts)
    const newTx = {
      description,
      amount: parseFloat(amount),
      date,
      category: category || "unassigned",
      reviewed: false,
      user_id: user.id
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert([newTx])
      .select();

    if (error || !data || !data[0]) {
      console.error("❌ Supabase insert failed", error);
      return NextResponse.json({
        error: "Database insert failed",
        details: error?.message
      }, { status: 500 });
    }

    const inserted = data[0];

    // 🧠 Trigger AI classification
    try {
      const aiResponse = await fetch(`${request.nextUrl.origin}/api/aitag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: inserted.description,
        }),
      });

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json();
        console.log("🧠 AI Tagging Result:", aiResult);

        // Update transaction with AI results
        const updates = {
          tag: aiResult.tag || "untagged",
          category: aiResult.category || "unassigned",
          confidence: typeof aiResult.confidence === "number" 
            ? Math.round(aiResult.confidence * 100)
            : typeof aiResult.confidence === "string" 
            ? Math.round(parseFloat(aiResult.confidence) * 100)
            : 0,
          purpose: aiResult.purpose === "business" ? "business" : "personal",
          writeOff: aiResult.writeOff && typeof aiResult.writeOff === "object" 
            ? {
                isWriteOff: Boolean(aiResult.writeOff.isWriteOff),
                reason: aiResult.writeOff.reason || ""
              }
            : { isWriteOff: false, reason: "" },
          reviewed: false,
        };

        const { error: updateError } = await supabase
          .from("transactions")
          .update(updates)
          .eq("id", inserted.id);

        if (updateError) {
          console.error("❌ AI update failed:", updateError);
          // Return the transaction even if AI update failed
          return NextResponse.json({
            success: true,
            data: inserted,
            aiError: updateError.message
          });
        }

        // Return the fully updated transaction
        return NextResponse.json({
          success: true,
          data: { ...inserted, ...updates },
          aiClassified: true
        });

      } else {
        console.error("❌ AI classification failed");
        // Return the transaction without AI classification
        return NextResponse.json({
          success: true,
          data: inserted,
          aiError: "AI classification failed"
        });
      }

    } catch (aiError) {
      console.error("❌ AI tagging error:", aiError);
      // Return the transaction even if AI failed
      return NextResponse.json({
        success: true,
        data: inserted,
        aiError: (aiError as Error).message
      });
    }

  } catch (err: any) {
    console.error("❌ API Route error:", err);
    return NextResponse.json({ 
      error: "Route failed", 
      details: err.message 
    }, { status: 500 });
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
            } catch {}
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        error: "No user found"
      }, { status: 401 });
    }

    const { data, error } = await supabase.from("transactions").select("*");
    
    if (error) {
      return NextResponse.json({
        error: "Failed to fetch transactions",
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (err: any) {
    return NextResponse.json({
      error: "Route failed",
      details: err.message
    }, { status: 500 });
  }
}