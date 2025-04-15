import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { AchievementBadge } from '@/components/AchievementBadge';
import { LevelProgressBar } from '@/components/LevelProgressBar';
import { StreakCounter } from '@/components/StreakCounter';
import { useGamificationStore } from '@/store/gamification-store';
import { useThemeStore } from '@/store/theme-store';
import Colors from '@/constants/colors';

export default function AchievementsScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  const { 
    achievements, 
    points, 
    level, 
    streaks,
    getUnlockedAchievements,
    getLockedAchievements
  } = useGamificationStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const unlockedAchievements = getUnlockedAchievements();
  const lockedAchievements = getLockedAchievements();
  
  const categories = [
    { id: null, label: 'All' },
    { id: 'weight', label: 'Weight' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'activity', label: 'Activity' },
    { id: 'medication', label: 'Medication' },
    { id: 'streak', label: 'Streaks' },
    { id: 'journey', label: 'Journey' },
  ];
  
  const filteredUnlocked = selectedCategory 
    ? unlockedAchievements.filter(a => a.category === selectedCategory)
    : unlockedAchievements;
    
  const filteredLocked = selectedCategory 
    ? lockedAchievements.filter(a => a.category === selectedCategory)
    : lockedAchievements;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Achievements</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.statsCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.pointsContainer}>
            <Text style={[styles.pointsValue, { color: themeColors.text }]}>{points}</Text>
            <Text style={[styles.pointsLabel, { color: themeColors.textSecondary }]}>Total Points</Text>
          </View>
          
          <LevelProgressBar level={level} points={points} style={styles.levelBar} />
          
          <View style={styles.streaksContainer}>
            <StreakCounter count={streaks.login} label="Day Streak" />
            <StreakCounter count={streaks.weight} label="Weight Streak" />
            <StreakCounter count={streaks.meals} label="Meal Streak" />
          </View>
        </Card>
        
        <View style={styles.categoryFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id || 'all'}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && [
                    styles.categoryButtonActive,
                    { backgroundColor: themeColors.primary }
                  ],
                  { borderColor: themeColors.border }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text 
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category.id 
                      ? [styles.categoryButtonTextActive, { color: themeColors.card }]
                      : { color: themeColors.text }
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Unlocked ({filteredUnlocked.length})
        </Text>
        
        {filteredUnlocked.length === 0 ? (
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            No achievements unlocked in this category yet
          </Text>
        ) : (
          <View style={styles.badgesGrid}>
            {filteredUnlocked.map(achievement => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                size="medium"
              />
            ))}
          </View>
        )}
        
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Locked ({filteredLocked.length})
        </Text>
        
        {filteredLocked.length === 0 ? (
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            You've unlocked all achievements in this category!
          </Text>
        ) : (
          <View style={styles.badgesGrid}>
            {filteredLocked.map(achievement => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                size="medium"
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsCard: {
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  pointsLabel: {
    fontSize: 14,
  },
  levelBar: {
    marginBottom: 16,
  },
  streaksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryFilters: {
    marginBottom: 24,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryButtonActive: {
    borderWidth: 0,
  },
  categoryButtonText: {
    fontSize: 14,
  },
  categoryButtonTextActive: {
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
});