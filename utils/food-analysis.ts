import { supabase } from '@/lib/supabase';

export interface FoodAnalysis {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fruitsVeggies: number;
  confidence: number;
}

export interface AnalyzeFoodResponse {
  analysis?: FoodAnalysis;
  error?: string;
  details?: string;
}

/**
 * Convert image URI to base64 format for API transmission
 */
export const imageUriToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Failed to convert image to base64');
  }
};

/**
 * Analyze food image using AI to extract nutritional information
 */
export const analyzeFoodImage = async (imageUri: string, userId?: string): Promise<AnalyzeFoodResponse> => {
  try {
    // Convert image to base64
    const imageBase64 = await imageUriToBase64(imageUri);
    
    // Use provided userId or try to get current user
    let userIdToUse = userId;
    if (!userIdToUse) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userIdToUse = user.id;
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-food', {
      body: {
        imageBase64,
        userId: userIdToUse,
      },
    });

    if (error) {
      console.error('Supabase function error:', error);
      return {
        error: 'Failed to analyze food image',
        details: error.message,
      };
    }

    if (data?.error) {
      return {
        error: data.error,
        details: data.details,
      };
    }

    if (!data?.analysis) {
      return {
        error: 'No analysis data received',
      };
    }

    return {
      analysis: data.analysis,
    };
  } catch (error) {
    console.error('Food analysis error:', error);
    return {
      error: 'Failed to analyze food image',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Format confidence level for display
 */
export const formatConfidence = (confidence: number): string => {
  if (confidence >= 80) return 'High';
  if (confidence >= 60) return 'Medium';
  if (confidence >= 40) return 'Low';
  return 'Very Low';
};

/**
 * Get confidence color for UI
 */
export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return '#10B981'; // Green
  if (confidence >= 60) return '#F59E0B'; // Yellow
  if (confidence >= 40) return '#EF4444'; // Red
  return '#6B7280'; // Gray
}; 