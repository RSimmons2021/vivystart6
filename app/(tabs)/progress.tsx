import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowUpRight, 
  X
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { MultiRingProgress } from '@/components/MultiRingProgress';
import { WeightChart } from '@/components/WeightChart';
import { useUserStore } from '@/store/user-store';
import { useThemeStore } from '@/store/theme-store';
import { useHealthStore } from '@/store/health-store';
import Colors from '@/constants/colors';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';

// Conversion functions
const kgToLbs = (kg: number) => Math.round(kg * 2.20462);
const lbsToKg = (lbs: number) => lbs / 2.20462;

export default function ProgressScreen() {
  const { user } = useUserStore();
  const { isDarkMode } = useThemeStore();
  const { weightUnit } = useUserStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const { weightLogs, addWeightLog, dailyLogs, getWeeklyScore, fetchWeightLogs, fetchDailyLogs, fetchStepLogs, refreshAllDailyLogsFromMeals, meals } = useHealthStore();
  const [loading, setLoading] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [modalVisible, setModalVisible] = useState(false);

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
  
  // Calculate weekly score (fruitsVeggies, protein, steps, overall)
  const today = new Date();
  const weekStart = format(startOfWeek(today), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today), 'yyyy-MM-dd');
  const weeklyScore = useMemo(() => {
    console.log('Progress tab: Calculating weekly score');
    console.log('Daily logs count:', dailyLogs.length);
    console.log('Week range:', weekStart, 'to', weekEnd);
    
    const relevantLogs = dailyLogs.filter(log => {
      return log.date >= weekStart && log.date <= weekEnd;
    });
    console.log('Relevant logs for this week:', relevantLogs.length);
    relevantLogs.forEach(log => {
      console.log(`Log ${log.date}: protein=${log.proteinGrams}, fruitsVeggies=${log.fruitsVeggies}, steps=${log.steps}`);
    });
    
    const score = getWeeklyScore(weekStart, weekEnd);
    console.log('Calculated weekly score:', score);
    return score;
  }, [getWeeklyScore, weekStart, weekEnd, dailyLogs, meals]);

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
      // Refresh daily logs from meals to ensure scores are up to date
      await refreshAllDailyLogsFromMeals();
      setLoading(false);
    })();
  }, [user?.id]);

  // Refresh daily logs when meals change
  useEffect(() => {
    if (!user?.id || meals.length === 0) return;
    console.log('Progress tab: Meals changed, refreshing daily logs...');
    refreshAllDailyLogsFromMeals();
  }, [meals.length, user?.id]);

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
          <View>
            <MultiRingProgress
              size={200}
              rings={[
                { 
                  progress: weeklyScore.fruitsVeggies, 
                  color: Colors.fruits, 
                  strokeWidth: 12
                },
                { 
                  progress: weeklyScore.protein, 
                  color: Colors.protein, 
                  strokeWidth: 12
                },
                { 
                  progress: weeklyScore.steps, 
                  color: Colors.primary, 
                  strokeWidth: 12
                }
              ]}
              isDarkMode={isDarkMode}
            >
              <Text style={[styles.scorePercentage, { color: themeColors.text }]}>
                {weeklyScore.overall}%
              </Text>
              <Text style={[styles.scoreLabel, { color: themeColors.textSecondary }]}>
                Weekly Score
              </Text>
            </MultiRingProgress>
            
            <View style={styles.scoreBreakdown}>
              <View style={styles.scoreItem}>
                <View style={[styles.scoreIndicator, { backgroundColor: Colors.fruits }]} />
                <Text style={[styles.scoreItemLabel, { color: themeColors.textSecondary }]}>
                  Fruits & Veggies
                </Text>
                <Text style={[styles.scoreItemValue, { color: themeColors.text }]}>
                  {weeklyScore.fruitsVeggies}%
                </Text>
              </View>
              
              <View style={styles.scoreItem}>
                <View style={[styles.scoreIndicator, { backgroundColor: Colors.protein }]} />
                <Text style={[styles.scoreItemLabel, { color: themeColors.textSecondary }]}>
                  Protein
                </Text>
                <Text style={[styles.scoreItemValue, { color: themeColors.text }]}>
                  {weeklyScore.protein}%
                </Text>
              </View>
              
              <View style={styles.scoreItem}>
                <View style={[styles.scoreIndicator, { backgroundColor: Colors.primary }]} />
                <Text style={[styles.scoreItemLabel, { color: themeColors.textSecondary }]}>
                  Steps
                </Text>
                <Text style={[styles.scoreItemValue, { color: themeColors.text }]}>
                  {weeklyScore.steps}%
                </Text>
              </View>
            </View>
          </View>
        </Card>
        
        <View style={styles.weightCards}>
          <Card style={[styles.weightCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.weightCardTitle, { color: themeColors.textSecondary }]}>
              Weight Loss
            </Text>
            <Text style={[styles.weightCardValue, { color: themeColors.primary }]}>
              {convertedWeightLoss.total > 0 ? '-' : ''}{Math.abs(convertedWeightLoss.total)} {weightUnit}
            </Text>
          </Card>
          
          <Card style={[styles.weightCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.weightCardTitle, { color: themeColors.textSecondary }]}>
              Percentage
            </Text>
            <Text style={[styles.weightCardValue, { color: themeColors.primary }]}>
              {convertedWeightLoss.percentage > 0 ? '-' : ''}{Math.abs(convertedWeightLoss.percentage)}%
            </Text>
          </Card>
        </View>
        
        <Card style={[styles.chartCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: themeColors.text }]}>Weight Progress</Text>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => setModalVisible(true)}
            >
              <Text style={[{ color: themeColors.primary, marginRight: 4 }]}>View All</Text>
              <ArrowUpRight size={16} color={themeColors.primary} />
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
              height={200}
              isDarkMode={isDarkMode}
              weightUnit={weightUnit}
            />
          </View>
        </Card>
        
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});