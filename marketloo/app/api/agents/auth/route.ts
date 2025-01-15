import { createClient } from "@/utils/supabase/server";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Verify agent creation key
    const authHeader = req.headers.get("x-agent-key");
    const agentCreationKey = process.env.AGENT_CREATION_KEY;

    if (!agentCreationKey) {
      throw new Error("Server configuration error: Missing agent creation key");
    }

    if (authHeader !== agentCreationKey) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid agent creation key" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Generate unique credentials using a disposable email domain
    const username = `agent_${nanoid(4)}`;
    const password = nanoid(16);
    const email = `${username}@10minutemail.com`; // Using disposable email domain

    // Create auth user and sign in
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Get session tokens
    const { data: sessionData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) throw loginError;

    // Initialize user in users table with starting balance
    const { error: dbError } = await supabase.from("users").insert({
      id: authData.user!.id,
      username,
      balance_of_poo: 1000000,
    });

    if (dbError) throw dbError;

    // Return credentials and tokens
    return NextResponse.json({
      email,
      password,
      user_id: authData.user!.id,
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
