import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.11.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FoodAnalysis {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fruitsVeggies: number;
  confidence: number;
}

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
    const { imageBase64, userId } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Image data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Gemini API
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare the prompt for food analysis
    const prompt = `
Analyze this food image and provide detailed nutritional information. Please be as accurate as possible based on visual estimation.

Respond with ONLY a valid JSON object in this exact format (no additional text):
{
  "name": "Name of the dish/food item",
  "description": "Brief description of what you see",
  "calories": estimated_total_calories_as_number,
  "protein": estimated_protein_in_grams_as_number,
  "carbs": estimated_carbohydrates_in_grams_as_number,
  "fat": estimated_fat_in_grams_as_number,
  "fruitsVeggies": estimated_fruits_vegetables_servings_as_number,
  "confidence": confidence_level_0_to_100_as_number
}

Guidelines:
- Estimate portion sizes carefully
- Consider all visible ingredients
- Fruits/vegetables servings: 1 serving ≈ 1/2 cup chopped or 1 medium piece
- Be conservative with estimates if unsure
- Confidence should reflect how certain you are about the analysis
- All numbers should be integers (no decimals)
`;

    // Prepare image data for Gemini
    const imagePart = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
        mimeType: "image/jpeg"
      }
    };

    // Call Gemini 1.5 Flash API
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let analysis: FoodAnalysis;
    try {
      // Clean the response text in case there's extra formatting
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      analysis = JSON.parse(jsonString);
      
      // Validate required fields
      if (!analysis.name || typeof analysis.calories !== 'number') {
        throw new Error("Invalid response format");
      }
      
      // Ensure all numeric fields are present and valid
      analysis.calories = Math.max(0, Math.round(analysis.calories || 0));
      analysis.protein = Math.max(0, Math.round(analysis.protein || 0));
      analysis.carbs = Math.max(0, Math.round(analysis.carbs || 0));
      analysis.fat = Math.max(0, Math.round(analysis.fat || 0));
      analysis.fruitsVeggies = Math.max(0, Math.round(analysis.fruitsVeggies || 0));
      analysis.confidence = Math.min(100, Math.max(0, Math.round(analysis.confidence || 0)));
      
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return new Response(JSON.stringify({ 
        error: "Failed to analyze food image. Please try again.",
        details: "Invalid AI response format"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Food analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      error: "Failed to analyze food image",
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 