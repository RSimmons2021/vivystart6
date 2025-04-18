import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  Image,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowUpRight, 
  X, 
  Camera, 
  Image as ImageIcon, 
  Plus 
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { MultiRingProgress } from '@/components/MultiRingProgress';
import { WeightChart } from '@/components/WeightChart';
import { useUserStore } from '@/store/user-store';
import { useThemeStore } from '@/store/theme-store';
import { useHealthStore } from '@/store/health-store';
import Colors from '@/constants/colors';
import { format, startOfWeek, endOfWeek, parseISO, subDays } from 'date-fns';

// Conversion functions
const kgToLbs = (kg: number) => Math.round(kg * 2.20462);
const lbsToKg = (lbs: number) => lbs / 2.20462;

export default function ProgressScreen() {
  const { user } = useUserStore();
  const { isDarkMode } = useThemeStore();
  const { weightUnit } = useUserStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const { meals, addMeal, weightLogs, addWeightLog, fetchWeightLogs, fetchDailyLogs, fetchStepLogs } = useHealthStore();
  const [loading, setLoading] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [modalVisible, setModalVisible] = useState(false);
  const [mealModalVisible, setMealModalVisible] = useState(false);

  // Defensive check: show loading or error if user not found
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>User not found</Text>
      </SafeAreaView>
    );
  }

  // Add new weight log
  const handleAddWeight = async (weight: number, date: string) => {
    if (!user?.id) return;
    try {
      await addWeightLog({ date, weight });
    } catch {
      console.error('Failed to add weight log.');
    }
  };

  const handleAddMeal = async () => {
    setMealModalVisible(false);
    try {
      await addMeal({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        name: 'Healthy Meal',
        description: 'A balanced meal with protein and vegetables',
        imageUri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        fruitsVeggies: 2,
        protein: 25,
        calories: 450,
        carbs: 30,
        fat: 15,
      });
    } catch (e) {
      console.error('Failed to add meal.');
    }
  };
  
  const recentMeals = [...meals]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  // Calculate weekly score (fruitsVeggies, protein, steps, overall)
  const today = new Date();
  const weekStart = format(startOfWeek(today), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today), 'yyyy-MM-dd');
  const weeklyProgress = meals.filter(m => m.date >= weekStart && m.date <= weekEnd);
  const weeklyScore = {
    fruitsVeggies: Math.round((weeklyProgress.reduce((sum, m) => sum + (m.fruitsVeggies || 0), 0) / (5 * weeklyProgress.length || 1)) * 100),
    protein: Math.round((weeklyProgress.reduce((sum, m) => sum + (m.protein || 0), 0) / (100 * weeklyProgress.length || 1)) * 100),
    steps: Math.round((weeklyProgress.reduce((sum, m) => sum + (m.steps || 0), 0) / (10000 * weeklyProgress.length || 1)) * 100),
    overall: 0
  };
  weeklyScore.overall = Math.round((weeklyScore.fruitsVeggies + weeklyScore.protein + weeklyScore.steps) / 3);

  // Weight loss calculation
  // Sort logs by date
  const sortedWeightLogs = [...weightLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const logStartWeight = sortedWeightLogs.length > 0 ? sortedWeightLogs[0].weight : (user?.startWeight || 0);
  const logLatestWeight = sortedWeightLogs.length > 0 ? sortedWeightLogs[sortedWeightLogs.length - 1].weight : logStartWeight;
  const weightLoss = logStartWeight - logLatestWeight;
  const percentageLoss = logStartWeight ? (weightLoss / logStartWeight) * 100 : 0;
  const convertedWeightLoss = {
    total: weightUnit === 'lbs' ? kgToLbs(weightLoss) : Math.round(weightLoss),
    percentage: Math.round(percentageLoss)
  };

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    (async () => {
      await Promise.all([
        fetchWeightLogs(),
        fetchDailyLogs(),
        fetchStepLogs()
      ]);
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>Progress</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Progress</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {format(subDays(today, 6), 'MMM d')} – {format(today, 'MMM d, yyyy')}
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <Card style={[styles.scoreCard, { backgroundColor: themeColors.card }]}>
          <MultiRingProgress
            size={200}
            rings={[
              { progress: weeklyScore.fruitsVeggies, color: Colors.fruits, strokeWidth: 12 },
              { progress: weeklyScore.protein, color: Colors.protein, strokeWidth: 12 },
              { progress: weeklyScore.steps, color: Colors.steps, strokeWidth: 12 },
            ]}
            isDarkMode={isDarkMode}
          >
            <Text style={[styles.scorePercentage, { color: themeColors.text }]}>{weeklyScore.overall}%</Text>
            <Text style={[styles.scoreLabel, { color: themeColors.textSecondary }]}>Weekly Score</Text>
          </MultiRingProgress>
          
          <View style={styles.scoreBreakdown}>
            <View style={styles.scoreItem}>
              <View style={[styles.scoreIndicator, { backgroundColor: Colors.fruits }]} />
              <Text style={[styles.scoreItemLabel, { color: themeColors.text }]}>Fruits & Veggies</Text>
              <Text style={[styles.scoreItemValue, { color: themeColors.text }]}>{weeklyScore.fruitsVeggies}%</Text>
            </View>
            
            <View style={styles.scoreItem}>
              <View style={[styles.scoreIndicator, { backgroundColor: Colors.protein }]} />
              <Text style={[styles.scoreItemLabel, { color: themeColors.text }]}>Protein</Text>
              <Text style={[styles.scoreItemValue, { color: themeColors.text }]}>{weeklyScore.protein}%</Text>
            </View>
            
            <View style={styles.scoreItem}>
              <View style={[styles.scoreIndicator, { backgroundColor: Colors.steps }]} />
              <Text style={[styles.scoreItemLabel, { color: themeColors.text }]}>Steps</Text>
              <Text style={[styles.scoreItemValue, { color: themeColors.text }]}>{weeklyScore.steps}%</Text>
            </View>
          </View>
        </Card>
        
        <View style={styles.weightCards}>
          <Card style={[styles.weightCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.weightCardTitle, { color: themeColors.textSecondary }]}>Weight Loss</Text>
            <Text style={[styles.weightCardValue, { color: themeColors.text }]}>
              {convertedWeightLoss.total} {weightUnit}
            </Text>
          </Card>
          
          <Card style={[styles.weightCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.weightCardTitle, { color: themeColors.textSecondary }]}>% Lost</Text>
            <Text style={[styles.weightCardValue, { color: themeColors.text }]}>{convertedWeightLoss.percentage}%</Text>
          </Card>
        </View>
        
        <Card style={[styles.chartCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: themeColors.text }]}>Weight Trend</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <ArrowUpRight size={20} color={themeColors.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Add a wrapper with explicit background color for Android light mode */}
          <View style={Platform.OS === 'android' ? 
            { backgroundColor: isDarkMode ? '#242424' : '#ffffff', borderRadius: 16 } : {}}>
            <WeightChart
              weightLogs={weightLogs}
              startWeight={user?.startWeight || 0}
              goalWeight={user?.goalWeight || 0}
              period={chartPeriod}
              isDarkMode={isDarkMode}
              weightUnit={weightUnit}
            />
          </View>
          
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                chartPeriod === 'week' && [styles.periodButtonActive, { backgroundColor: themeColors.primary }]
              ]}
              onPress={() => setChartPeriod('week')}
            >
              <Text 
                style={[
                  styles.periodButtonText,
                  { color: themeColors.textSecondary },
                  chartPeriod === 'week' && [styles.periodButtonTextActive, { color: themeColors.card }]
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.periodButton,
                chartPeriod === 'month' && [styles.periodButtonActive, { backgroundColor: themeColors.primary }]
              ]}
              onPress={() => setChartPeriod('month')}
            >
              <Text 
                style={[
                  styles.periodButtonText,
                  { color: themeColors.textSecondary },
                  chartPeriod === 'month' && [styles.periodButtonTextActive, { color: themeColors.card }]
                ]}
              >
                Month
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.periodButton,
                chartPeriod === 'year' && [styles.periodButtonActive, { backgroundColor: themeColors.primary }]
              ]}
              onPress={() => setChartPeriod('year')}
            >
              <Text 
                style={[
                  styles.periodButtonText,
                  { color: themeColors.textSecondary },
                  chartPeriod === 'year' && [styles.periodButtonTextActive, { color: themeColors.card }]
                ]}
              >
                Year
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        <View style={styles.mealsHeader}>
          <Text style={[styles.mealsTitle, { color: themeColors.text }]}>Recent Meals</Text>
          <TouchableOpacity 
            style={[styles.addMealButton, { backgroundColor: themeColors.primary }]}
            onPress={() => setMealModalVisible(true)}
          >
            <Plus size={16} color={themeColors.card} />
            <Text style={[styles.addMealButtonText, { color: themeColors.card }]}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {recentMeals.length === 0 ? (
          <Card style={[styles.emptyMealsCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.emptyMealsText, { color: themeColors.textSecondary }]}>No meals logged yet</Text>
            <Text style={[styles.emptyMealsSubtext, { color: themeColors.textTertiary }]}>
              Tap the + button to log your first meal
            </Text>
          </Card>
        ) : (
          recentMeals.map((meal, index) => (
            <Card key={index} style={[styles.mealCard, { backgroundColor: themeColors.card }]}>
              <View style={styles.mealHeader}>
                <View>
                  <Text style={[styles.mealName, { color: themeColors.text }]}>{meal.name}</Text>
                  <Text style={[styles.mealDate, { color: themeColors.textSecondary }]}>
                    {format(parseISO(meal.date), 'MMM d')} • {meal.time}
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
            </Card>
          ))
        )}
        
        <Text style={[styles.coachNote, { color: themeColors.textTertiary }]}>
          To log your weight, press the + button on the bottom of the Coach tab
        </Text>
      </ScrollView>
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Weight History</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Add a wrapper with explicit background color for Android light mode */}
            <View style={Platform.OS === 'android' ? 
              { backgroundColor: isDarkMode ? '#242424' : '#ffffff', borderRadius: 16 } : {}}>
              <WeightChart
                weightLogs={weightLogs}
                startWeight={user?.startWeight || 0}
                goalWeight={user?.goalWeight || 0}
                period={chartPeriod}
                height={300}
                isDarkMode={isDarkMode}
                weightUnit={weightUnit}
              />
            </View>
            
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  chartPeriod === 'week' && [styles.periodButtonActive, { backgroundColor: themeColors.primary }]
                ]}
                onPress={() => setChartPeriod('week')}
              >
                <Text 
                  style={[
                    styles.periodButtonText,
                    { color: themeColors.textSecondary },
                    chartPeriod === 'week' && [styles.periodButtonTextActive, { color: themeColors.card }]
                  ]}
                >
                  Week
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  chartPeriod === 'month' && [styles.periodButtonActive, { backgroundColor: themeColors.primary }]
                ]}
                onPress={() => setChartPeriod('month')}
              >
                <Text 
                  style={[
                    styles.periodButtonText,
                    { color: themeColors.textSecondary },
                    chartPeriod === 'month' && [styles.periodButtonTextActive, { color: themeColors.card }]
                  ]}
                >
                  Month
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  chartPeriod === 'year' && [styles.periodButtonActive, { backgroundColor: themeColors.primary }]
                ]}
                onPress={() => setChartPeriod('year')}
              >
                <Text 
                  style={[
                    styles.periodButtonText,
                    { color: themeColors.textSecondary },
                    chartPeriod === 'year' && [styles.periodButtonTextActive, { color: themeColors.card }]
                  ]}
                >
                  Year
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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
            
            <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>How would you like to log your meal?</Text>
            
            <View style={styles.mealOptions}>
              <TouchableOpacity style={styles.mealOption} onPress={handleAddMeal}>
                <View style={[styles.mealOptionIcon, { backgroundColor: themeColors.accent }]}>
                  <Camera size={24} color={themeColors.card} />
                </View>
                <Text style={[styles.mealOptionText, { color: themeColors.text }]}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mealOption} onPress={handleAddMeal}>
                <View style={[styles.mealOptionIcon, { backgroundColor: themeColors.secondary }]}>
                  <ImageIcon size={24} color={themeColors.card} />
                </View>
                <Text style={[styles.mealOptionText, { color: themeColors.text }]}>Photos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mealOption} onPress={handleAddMeal}>
                <View style={[styles.mealOptionIcon, { backgroundColor: themeColors.success }]}>
                  <Text style={[styles.mealOptionIconText, { color: themeColors.card }]}>T</Text>
                </View>
                <Text style={[styles.mealOptionText, { color: themeColors.text }]}>Describe</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mealOption} onPress={handleAddMeal}>
                <View style={[styles.mealOptionIcon, { backgroundColor: themeColors.info }]}>
                  <Text style={[styles.mealOptionIconText, { color: themeColors.card }]}>🍽️</Text>
                </View>
                <Text style={[styles.mealOptionText, { color: themeColors.text }]}>Saved Meals</Text>
              </TouchableOpacity>
            </View>
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
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  scorePercentage: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 16,
  },
  scoreBreakdown: {
    width: '100%',
    marginTop: 24,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  scoreItemLabel: {
    flex: 1,
    fontSize: 16,
  },
  scoreItemValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  weightCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weightCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    paddingVertical: 16,
  },
  weightCardTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  weightCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartCard: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
  },
  periodButtonTextActive: {
    fontWeight: '600',
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
    paddingVertical: 6,
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
    paddingVertical: 24,
    marginBottom: 16,
  },
  emptyMealsText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyMealsSubtext: {
    fontSize: 14,
    textAlign: 'center',
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
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  mealOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mealOption: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  mealOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealOptionIconText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  mealOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 24,
  },
});