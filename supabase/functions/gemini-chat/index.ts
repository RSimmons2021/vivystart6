import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.11.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Or restrict to your domain in production
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const { user_id, message } = await req.json();

    // Initialize Gemini API
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the correct Gemini model as requested by the user
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Save user message to chat_history
    if (user_id && message) {
      await supabase.from("chat_history").insert({
        user_id,
        message,
        is_user: true
      });
    }

    // Call Gemini API
    const result = await model.generateContent(message);
    const response = await result.response;
    const reply = response.text();

    // Save Gemini reply to chat_history
    if (user_id && reply) {
      await supabase.from("chat_history").insert({
        user_id,
        message: reply,
        is_user: false
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Gemini API error:", e);
    return new Response(JSON.stringify({ error: "Error communicating with Gemini API" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});