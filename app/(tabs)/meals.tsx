import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, 
  Camera, 
  Plus,
  Trash2,
  Sparkles,
  CheckCircle
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { useUserStore } from '@/store/user-store';
import { useThemeStore } from '@/store/theme-store';
import { useHealthStore } from '@/store/health-store';
import Colors from '@/constants/colors';
import { format, parseISO } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { analyzeFoodImage, formatConfidence, getConfidenceColor, type FoodAnalysis } from '@/utils/food-analysis';

export default function MealTrackerScreen() {
  const { user } = useUserStore();
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const { meals, addMeal, deleteMeal, fetchMeals } = useHealthStore();
  const [loading, setLoading] = useState(false);
  const [mealModalVisible, setMealModalVisible] = useState(false);

  const [addMealForm, setAddMealForm] = useState({
    imageUri: '',
    name: '',
    description: '',
    fruitsVeggies: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [addMealError, setAddMealError] = useState<string | null>(null);
  const [addMealLoading, setAddMealLoading] = useState(false);
  
  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<FoodAnalysis | null>(null);
  const [analysisApplied, setAnalysisApplied] = useState(false);

  const resetAddMealForm = () => {
    setAddMealForm({
      imageUri: '',
      name: '',
      description: '',
      fruitsVeggies: '',
      protein: '',
      carbs: '',
      fat: '',
    });
    setAiAnalysis(null);
    setAnalysisApplied(false);
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAddMealForm(f => ({ ...f, imageUri: result.assets[0].uri }));
      // Reset AI analysis when new image is selected
      setAiAnalysis(null);
      setAnalysisApplied(false);
    }
  };

  const handleAnalyzeFood = async () => {
    if (!addMealForm.imageUri) {
      Alert.alert('No Image', 'Please select an image first to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAddMealError(null);

    try {
      const result = await analyzeFoodImage(addMealForm.imageUri, user?.id);
      
      if (result.error) {
        setAddMealError(result.error);
        Alert.alert('Analysis Failed', result.error);
        return;
      }

      if (result.analysis) {
        setAiAnalysis(result.analysis);
        // Show confidence level to user
        const confidenceText = formatConfidence(result.analysis.confidence);
        Alert.alert(
          'Analysis Complete', 
          `Food analyzed with ${confidenceText.toLowerCase()} confidence (${result.analysis.confidence}%). Review the results and tap "Apply Analysis" to use them.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      const errorMessage = 'Failed to analyze food image. Please try again.';
      setAddMealError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAnalysis = () => {
    if (!aiAnalysis) return;

    setAddMealForm(f => ({
      ...f,
      name: aiAnalysis.name,
      description: aiAnalysis.description,
      fruitsVeggies: aiAnalysis.fruitsVeggies.toString(),
      protein: aiAnalysis.protein.toString(),
      carbs: aiAnalysis.carbs.toString(),
      fat: aiAnalysis.fat.toString(),
    }));
    setAnalysisApplied(true);
  };

  const handleAddMealSubmit = async () => {
    setAddMealLoading(true);
    setAddMealError(null);
    try {
      await addMeal({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        name: addMealForm.name,
        description: addMealForm.description,
        imageUri: addMealForm.imageUri,
        fruitsVeggies: parseInt(addMealForm.fruitsVeggies) || 0,
        protein: parseInt(addMealForm.protein) || 0,
        carbs: parseInt(addMealForm.carbs) || 0,
        fat: parseInt(addMealForm.fat) || 0,
        calories: aiAnalysis?.calories || 0,
      });
      await fetchMeals();
      setMealModalVisible(false);
      resetAddMealForm();
    } catch (e) {
      setAddMealError('Failed to add meal.');
    } finally {
      setAddMealLoading(false);
    }
  };

  const handleDeleteAddMeal = () => {
    resetAddMealForm();
    setMealModalVisible(false);
  };

  // Defensive check: show loading or error if user not found
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>User not found</Text>
      </SafeAreaView>
    );
  }

  // Sort meals by date and time, most recent first
  const sortedMeals = [...meals]
    .sort((a, b) => {
      // Sort by date descending, then by time descending if dates are equal
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      // Compare time as HH:mm strings
      return (b.time || '').localeCompare(a.time || '');
    });

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchMeals().finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>Meals AI</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>Loading meals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Meals AI</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Track your nutrition and meals
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.mealsHeader}>
          <Text style={[styles.mealsTitle, { color: themeColors.text }]}>Your Meals</Text>
          <TouchableOpacity 
            style={[styles.addMealButton, { backgroundColor: themeColors.primary }]}
            onPress={() => setMealModalVisible(true)}
          >
            <Plus size={16} color={themeColors.card} />
            <Text style={[styles.addMealButtonText, { color: themeColors.card }]}>Add Meal</Text>
          </TouchableOpacity>
        </View>
        
        {sortedMeals.length === 0 ? (
          <Card style={[styles.emptyMealsCard, { backgroundColor: themeColors.card }]}> 
            <View>
              <Text style={[styles.emptyMealsText, { color: themeColors.textSecondary }]}>No meals logged yet</Text>
              <Text style={[styles.emptyMealsSubtext, { color: themeColors.textTertiary }]}>Start tracking your nutrition by adding your first meal</Text>
            </View>
          </Card>
        ) : (
          sortedMeals.map((meal, index) => (
            <Card key={index} style={[styles.mealCard, { backgroundColor: themeColors.card }]}> 
              <View>
                <View style={styles.mealHeader}>
                  <View>
                    <Text style={[styles.mealName, { color: themeColors.text }]}>{meal.name}</Text>
                    <Text style={[styles.mealDate, { color: themeColors.textSecondary }]}>
                      {format(parseISO(meal.date), 'MMM d, yyyy')} • {meal.time}
                    </Text>
                  </View>
                  {meal.calories && (
                    <Text style={[styles.mealCalories, { color: themeColors.primary }]}>{meal.calories} cal</Text>
                  )}
                </View>
                {meal.imageUri && (
                  <Image
                    source={{ uri: meal.imageUri }}
                    style={styles.mealImage}
                    resizeMode="cover"
                  />
                )}
                {meal.description && (
                  <Text style={[styles.mealDescription, { color: themeColors.textSecondary }]}>{meal.description}</Text>
                )}
                {(meal.fruitsVeggies || meal.protein || meal.carbs || meal.fat) && (
                  <View style={styles.mealNutrition}>
                    {meal.fruitsVeggies && (
                      <View style={styles.nutritionItem}>
                        <View style={[styles.nutritionIndicator, { backgroundColor: Colors.fruits }]} />
                        <Text style={[styles.nutritionText, { color: themeColors.textSecondary }]}>
                          {meal.fruitsVeggies} servings
                        </Text>
                      </View>
                    )}
                    {meal.protein && (
                      <View style={styles.nutritionItem}>
                        <View style={[styles.nutritionIndicator, { backgroundColor: Colors.protein }]} />
                        <Text style={[styles.nutritionText, { color: themeColors.textSecondary }]}>
                          {meal.protein}g protein
                        </Text>
                      </View>
                    )}
                    {meal.carbs && (
                      <View style={styles.nutritionItem}>
                        <View style={[styles.nutritionIndicator, { backgroundColor: Colors.primary }]} />
                        <Text style={[styles.nutritionText, { color: themeColors.textSecondary }]}>
                          {meal.carbs}g carbs
                        </Text>
                      </View>
                    )}
                    {meal.fat && (
                      <View style={styles.nutritionItem}>
                        <View style={[styles.nutritionIndicator, { backgroundColor: Colors.warning }]} />
                        <Text style={[styles.nutritionText, { color: themeColors.textSecondary }]}>
                          {meal.fat}g fat
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                <TouchableOpacity style={styles.deleteButton} onPress={async () => { await deleteMeal(meal.id); await fetchMeals(); }}>
                  <Trash2 size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
        
        <Text style={[styles.coachNote, { color: themeColors.textTertiary }]}>
          Use the AI Coach tab to get personalized nutrition advice based on your meal logs
        </Text>
      </ScrollView>
      
      <Modal
        visible={mealModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMealModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>  
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Log Meal</Text>
              <TouchableOpacity onPress={() => setMealModalVisible(false)}>
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 500, backgroundColor: themeColors.background }} contentContainerStyle={{ paddingBottom: 20 }}>
              <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                {addMealForm.imageUri ? (
                  <Image 
                    source={{ uri: addMealForm.imageUri }} 
                    style={styles.addMealImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.addMealImagePlaceholder, { backgroundColor: themeColors.backgroundSecondary }]}>
                    <Camera size={32} color={themeColors.textTertiary} />
                    <Text style={{ color: themeColors.textTertiary, marginTop: 8 }}>Add Photo (Optional)</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* AI Analysis Section */}
              {addMealForm.imageUri && (
                <View style={styles.aiSection}>
                  <TouchableOpacity
                    style={[styles.analyzeButton, { 
                      backgroundColor: isAnalyzing ? themeColors.backgroundSecondary : '#8B5CF6',
                      opacity: isAnalyzing ? 0.7 : 1 
                    }]}
                    onPress={handleAnalyzeFood}
                    disabled={isAnalyzing}
                  >
                    <Sparkles size={20} color="white" />
                    <Text style={styles.analyzeButtonText}>
                      {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                    </Text>
                  </TouchableOpacity>

                  {aiAnalysis && (
                    <View style={[styles.analysisResults, { backgroundColor: themeColors.backgroundSecondary, borderColor: themeColors.border }]}>
                      <View style={styles.analysisHeader}>
                        <Text style={[styles.analysisTitle, { color: themeColors.text }]}>AI Analysis Results</Text>
                        <View style={styles.confidenceContainer}>
                          <View style={[styles.confidenceDot, { backgroundColor: getConfidenceColor(aiAnalysis.confidence) }]} />
                          <Text style={[styles.confidenceText, { color: themeColors.textSecondary }]}>
                            {formatConfidence(aiAnalysis.confidence)} Confidence
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.analysisData}>
                        <Text style={[styles.analysisItemTitle, { color: themeColors.text }]}>{aiAnalysis.name}</Text>
                        <Text style={[styles.analysisItemSubtitle, { color: themeColors.textSecondary }]}>{aiAnalysis.description}</Text>
                        
                        <View style={styles.nutritionGrid}>
                          <View style={styles.nutritionGridItem}>
                            <Text style={[styles.nutritionValue, { color: themeColors.primary }]}>{aiAnalysis.calories}</Text>
                            <Text style={[styles.nutritionLabel, { color: themeColors.textSecondary }]}>calories</Text>
                          </View>
                          <View style={styles.nutritionGridItem}>
                            <Text style={[styles.nutritionValue, { color: themeColors.primary }]}>{aiAnalysis.protein}g</Text>
                            <Text style={[styles.nutritionLabel, { color: themeColors.textSecondary }]}>protein</Text>
                          </View>
                          <View style={styles.nutritionGridItem}>
                            <Text style={[styles.nutritionValue, { color: themeColors.primary }]}>{aiAnalysis.carbs}g</Text>
                            <Text style={[styles.nutritionLabel, { color: themeColors.textSecondary }]}>carbs</Text>
                          </View>
                          <View style={styles.nutritionGridItem}>
                            <Text style={[styles.nutritionValue, { color: themeColors.primary }]}>{aiAnalysis.fat}g</Text>
                            <Text style={[styles.nutritionLabel, { color: themeColors.textSecondary }]}>fat</Text>
                          </View>
                        </View>
                      </View>
                      
                      {!analysisApplied && (
                        <TouchableOpacity
                          style={[styles.applyButton, { backgroundColor: themeColors.primary }]}
                          onPress={handleApplyAnalysis}
                        >
                          <CheckCircle size={16} color="white" />
                          <Text style={styles.applyButtonText}>Apply Analysis</Text>
                        </TouchableOpacity>
                      )}
                      
                      {analysisApplied && (
                        <View style={[styles.appliedIndicator, { backgroundColor: '#10B981' }]}>
                          <CheckCircle size={16} color="white" />
                          <Text style={styles.appliedText}>Analysis Applied</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              <TextInput
                style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.backgroundSecondary, borderColor: themeColors.border }]}
                placeholder="Meal Title"
                placeholderTextColor={themeColors.textTertiary}
                value={addMealForm.name}
                onChangeText={text => setAddMealForm(f => ({ ...f, name: text }))}
              />
              <TextInput
                style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.backgroundSecondary, borderColor: themeColors.border, minHeight: 60 }]}
                placeholder="Description"
                placeholderTextColor={themeColors.textTertiary}
                value={addMealForm.description}
                onChangeText={text => setAddMealForm(f => ({ ...f, description: text }))}
                multiline
              />
              <TextInput
                style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.backgroundSecondary, borderColor: themeColors.border }]}
                placeholder="Fruits & Veggies (servings)"
                placeholderTextColor={themeColors.textTertiary}
                value={addMealForm.fruitsVeggies}
                onChangeText={text => setAddMealForm(f => ({ ...f, fruitsVeggies: text }))}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.backgroundSecondary, borderColor: themeColors.border }]}
                placeholder="Protein (grams)"
                placeholderTextColor={themeColors.textTertiary}
                value={addMealForm.protein}
                onChangeText={text => setAddMealForm(f => ({ ...f, protein: text }))}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.backgroundSecondary, borderColor: themeColors.border }]}
                placeholder="Carbs (grams)"
                placeholderTextColor={themeColors.textTertiary}
                value={addMealForm.carbs}
                onChangeText={text => setAddMealForm(f => ({ ...f, carbs: text }))}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.backgroundSecondary, borderColor: themeColors.border }]}
                placeholder="Fat (grams)"
                placeholderTextColor={themeColors.textTertiary}
                value={addMealForm.fat}
                onChangeText={text => setAddMealForm(f => ({ ...f, fat: text }))}
                keyboardType="numeric"
              />
              {addMealError && (
                <Text style={{ color: Colors.error, marginTop: 8, textAlign: 'center' }}>{addMealError}</Text>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16 }}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAddMeal}>
                  <Trash2 size={22} color={Colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { marginLeft: 16, opacity: addMealLoading ? 0.5 : 1, backgroundColor: themeColors.primary }]}
                  onPress={handleAddMealSubmit}
                  disabled={addMealLoading}
                >
                  <Text style={[styles.saveButtonText, { color: themeColors.card }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addMealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyMealsCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  emptyMealsText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMealsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  mealCard: {
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealDate: {
    fontSize: 14,
    marginTop: 2,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  mealDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  mealNutrition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  nutritionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  nutritionText: {
    fontSize: 12,
  },
  coachNote: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 24,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    fontSize: 16,
    backgroundColor: Colors.backgroundSecondary,
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  addMealImage: {
    width: 180,
    height: 120,
    borderRadius: 12,
  },
  addMealImagePlaceholder: {
    width: 180,
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.card,
  },
  aiSection: {
    marginBottom: 20,
  },
  analyzeButton: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  analysisResults: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 12,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 12,
  },
  analysisData: {
    marginBottom: 16,
  },
  analysisItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  analysisItemSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionGridItem: {
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nutritionLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  applyButton: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  appliedIndicator: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 