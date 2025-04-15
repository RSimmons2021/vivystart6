import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Check, ArrowRight, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { AchievementUnlockedModal } from '@/components/AchievementUnlockedModal';
import { useJourneyStore } from '@/store/journey-store';
import { useGamificationStore } from '@/store/gamification-store';
import { useThemeStore } from '@/store/theme-store';
import Colors from '@/constants/colors';
import { Achievement } from '@/types';

export default function JourneyStageScreen() {
  const { id } = useLocalSearchParams();
  const { journeyStages, completeJourneyStage } = useJourneyStore();
  const { unlockAchievement, achievements } = useGamificationStore();
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  const stage = journeyStages.find(s => s.id === id);
  
  // Achievement animation
  const [achievementModalVisible, setAchievementModalVisible] = React.useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = React.useState<Achievement | null>(null);
  const confettiAnimation = new Animated.Value(0);
  
  const handleComplete = () => {
    completeJourneyStage(stage!.id);
    
    // Check for achievements
    checkAndUnlockAchievement('complete-stage');
    
    // Check if all stages are completed
    const allCompleted = journeyStages.every(s => s.id === stage!.id ? true : s.isCompleted);
    if (allCompleted) {
      checkAndUnlockAchievement('complete-all-stages');
    }
  };
  
  const checkAndUnlockAchievement = (achievementId: string) =>  {
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.isUnlocked) {
      unlockAchievement(achievementId);
      setUnlockedAchievement(achievement);
      setAchievementModalVisible(true);
      
      // Animate confetti
      Animated.timing(confettiAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        confettiAnimation.setValue(0);
      });
    }
  };
  
  if (!stage) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>Stage not found</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Mock content for each stage
  const getStageContent = () => {
    switch (stage.title) {
      case 'GLP-1 Foundations':
        return (
          <>
            <Text style={[styles.paragraph, { color: themeColors.text }]}>
              GLP-1 (Glucagon-Like Peptide-1) medications work by mimicking a hormone that targets areas of the brain that regulate appetite and food intake. They help you feel full faster and stay full longer.
            </Text>
            <Card style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.infoCardTitle, { color: themeColors.text }]}>Key Benefits</Text>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Reduced hunger and cravings</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Slower stomach emptying</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Improved blood sugar control</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Gradual, sustainable weight loss</Text>
              </View>
            </Card>
            <Text style={[styles.paragraph, { color: themeColors.text }]}>
              GLP-1 medications are typically administered as weekly injections. It's important to follow your healthcare provider's instructions carefully.
            </Text>
          </>
        );
      case 'Side Effects':
        return (
          <>
            <Text style={[styles.paragraph, { color: themeColors.text }]}>
              While GLP-1 medications are generally well-tolerated, they can cause side effects, especially when you first start treatment.
            </Text>
            <Card style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.infoCardTitle, { color: themeColors.text }]}>Common Side Effects</Text>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Nausea and vomiting</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Diarrhea or constipation</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Headache</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Fatigue</Text>
              </View>
            </Card>
            <Text style={[styles.paragraph, { color: themeColors.text }]}>
              Most side effects are mild to moderate and tend to improve over time. If you experience severe or persistent side effects, contact your healthcare provider.
            </Text>
            <Card style={[styles.tipCard, { backgroundColor: themeColors.backgroundSecondary }]}>
              <Text style={[styles.tipTitle, { color: themeColors.text }]}>Managing Side Effects</Text>
              <Text style={[styles.tipText, { color: themeColors.textSecondary }]}>
                Eat smaller meals, stay hydrated, and avoid fatty or spicy foods to help reduce nausea and digestive issues.
              </Text>
            </Card>
          </>
        );
      case 'Best Practices':
        return (
          <>
            <Text style={[styles.paragraph, { color: themeColors.text }]}>
              To maximize the benefits of your GLP-1 medication and support your weight loss journey, consider these best practices:
            </Text>
            <Card style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.infoCardTitle, { color: themeColors.text }]}>Nutrition</Text>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Focus on protein-rich foods</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Eat plenty of fruits and vegetables</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Stay hydrated with water</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Limit processed foods and added sugars</Text>
              </View>
            </Card>
            <Card style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.infoCardTitle, { color: themeColors.text }]}>Physical Activity</Text>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Aim for 150 minutes of moderate activity weekly</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Include strength training 2-3 times per week</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Start slowly and gradually increase intensity</Text>
              </View>
            </Card>
            <Text style={[styles.paragraph, { color: themeColors.text }]}>
              Remember that GLP-1 medications work best when combined with healthy lifestyle changes. Use your reduced appetite as an opportunity to establish better eating habits.
            </Text>
          </>
        );
      case 'Navigating Obstacles':
        return (
          <>
            <Text style={[styles.paragraph, { color: themeColors.text }]}>
              During your GLP-1 journey, you may encounter challenges. Here's how to navigate common obstacles:
            </Text>
            <Card style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.infoCardTitle, { color: themeColors.text }]}>Weight Loss Plateaus</Text>
              <Text style={[styles.infoCardText, { color: themeColors.textSecondary }]}>
                It's normal for weight loss to slow or pause temporarily. Stay consistent with your healthy habits and consider reviewing your diet and exercise routine.
              </Text>
            </Card>
            <Card style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.infoCardTitle, { color: themeColors.text }]}>Social Situations</Text>
              <Text style={[styles.infoCardText, { color: themeColors.textSecondary }]}>
                Plan ahead for social events involving food. Eat a small protein-rich snack beforehand, focus on socializing, and choose smaller portions.
              </Text>
            </Card>
            <Card style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.infoCardTitle, { color: themeColors.text }]}>Emotional Eating</Text>
              <Text style={[styles.infoCardText, { color: themeColors.textSecondary }]}>
                Develop alternative coping strategies for stress, boredom, or other emotions that trigger eating. Consider journaling, meditation, or talking with a friend.
              </Text>
            </Card>
            <Text style={[styles.paragraph, { color: themeColors.text }]}>
              Remember that setbacks are a normal part of any health journey. Focus on progress, not perfection, and be kind to yourself along the way.
            </Text>
          </>
        );
      case 'Sustainable Success':
        return (
          <>
            <Text style={[styles.paragraph, { color: themeColors.text }]}>
              As you progress in your GLP-1 journey, it's important to focus on long-term success and weight maintenance.
            </Text>
            <Card style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.infoCardTitle, { color: themeColors.text }]}>Building Sustainable Habits</Text>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Focus on lifestyle changes, not just weight loss</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Develop a consistent eating and exercise routine</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Practice mindful eating</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={[styles.bullet, { backgroundColor: themeColors.primary }]} />
                <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>Monitor your progress regularly</Text>
              </View>
            </Card>
            <Text style={[styles.paragraph, { color: themeColors.text }]}>
              Some people may eventually transition off GLP-1 medications. Work closely with your healthcare provider to develop a plan for maintaining your weight loss if you stop the medication.
            </Text>
            <Card style={[styles.tipCard, { backgroundColor: themeColors.backgroundSecondary }]}>
              <Text style={[styles.tipTitle, { color: themeColors.text }]}>Long-term Success</Text>
              <Text style={[styles.tipText, { color: themeColors.textSecondary }]}>
                Research shows that people who maintain weight loss typically continue to monitor their weight, stay physically active, and maintain consistent eating patterns.
              </Text>
            </Card>
          </>
        );
      default:
        return (
          <Text style={[styles.paragraph, { color: themeColors.text }]}>
            Content for this stage is coming soon.
          </Text>
        );
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={[themeColors.primary, themeColors.primaryLight]}
          style={styles.header}
        >
          <Text style={styles.stageTitle}>{stage.title}</Text>
          <Text style={styles.stageDescription}>{stage.description}</Text>
          
          {stage.isCompleted && (
            <View style={styles.completedBadge}>
              <Award size={16} color={Colors.card} />
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          )}
        </LinearGradient>
        
        <View style={styles.content}>
          {getStageContent()}
        </View>
      </ScrollView>
      
      <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
        {stage.isCompleted ? (
          <View style={styles.completedContainer}>
            <Check size={20} color={themeColors.success} />
            <Text style={[styles.completedText, { color: themeColors.success }]}>Stage Completed</Text>
          </View>
        ) : (
          <Button
            title="Mark as Completed"
            onPress={handleComplete}
            icon={<ArrowRight size={20} color={Colors.card} />}
          />
        )}
      </View>
      
      {/* Achievement unlocked modal */}
      <AchievementUnlockedModal
        achievement={unlockedAchievement}
        visible={achievementModalVisible}
        onClose={() => setAchievementModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    position: 'relative',
  },
  stageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.card,
    marginBottom: 8,
  },
  stageDescription: {
    fontSize: 16,
    color: Colors.card,
    opacity: 0.9,
  },
  completedBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: Colors.card,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoCardText: {
    fontSize: 14,
    lineHeight: 22,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  tipCard: {
    marginBottom: 20,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  completedContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});