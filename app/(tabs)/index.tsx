import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Award, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useJourneyStore } from '@/store/journey-store';
import { useThemeStore } from '@/store/theme-store';
import { useGamificationStore } from '@/store/gamification-store';
import Colors from '@/constants/colors';

const { width, height } = Dimensions.get('window');

export default function JourneyScreen() {
  const router = useRouter();
  const { journeyStages } = useJourneyStore();
  const { isDarkMode } = useThemeStore();
  const { level, points, getUnlockedAchievements } = useGamificationStore();
  
  const navigateToSettings = () => {
    router.push('/settings');
  };

  const navigateToStage = (stageId: string) => {
    router.push(`/journey/${stageId}`);
  };
  
  const navigateToAchievements = () => {
    router.push('/achievements');
  };
  
  const navigateToChallenges = () => {
    router.push('/challenges');
  };

  // Sort stages by order
  const sortedStages = [...journeyStages].sort((a, b) => a.order - b.order);

  // Get theme-specific colors
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  // Get unlocked achievements count
  const unlockedAchievements = getUnlockedAchievements();
  
  // Define gradient colors explicitly as a tuple with at least two colors
  const gradientColors: [string, string] = isDarkMode 
    ? ['#2A4374', '#3A5795'] 
    : ['#4A7BF7', '#6B92FF'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Journey</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: themeColors.primary }]}
            onPress={navigateToAchievements}
          >
            <Award size={20} color={themeColors.card} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: themeColors.secondary }]}
            onPress={navigateToChallenges}
          >
            <Trophy size={20} color={themeColors.card} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: themeColors.backgroundSecondary }]}
            onPress={navigateToSettings}
          >
            <Settings size={20} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.levelContainer}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelTitle, { color: themeColors.text }]}>Level {level}</Text>
          <Text style={[styles.pointsText, { color: themeColors.textSecondary }]}>
            {points} points • {unlockedAchievements.length} achievements
          </Text>
        </View>
      </View>
      
      <View style={styles.journeyContainer}>
        <LinearGradient
          colors={gradientColors}
          style={styles.background}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          {/* Sun rays */}
          <View style={styles.sunRaysContainer}>
            {Array.from({ length: 12 }).map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.sunRay, 
                  { transform: [{ rotate: `${index * 30}deg` }] }
                ]} 
              />
            ))}
          </View>
          
          {/* Sun */}
          <View style={styles.sun} />
          
          {/* Title */}
          <Text style={styles.journeyTitle}>THE GLP-1 JOURNEY</Text>
          
          {/* Mountain */}
          <View style={styles.mountainContainer}>
            <View style={[styles.mountain, isDarkMode && styles.darkMountain]}>
              <View style={styles.mountainSnow} />
            </View>
            
            {/* Clouds */}
            <View style={[styles.cloud, styles.cloud1]} />
            <View style={[styles.cloud, styles.cloud2]} />
            <View style={[styles.cloud, styles.cloud3]} />
            
            {/* Journey Stages */}
            {sortedStages.map((stage, index) => {
              // Calculate position based on index
              // Distribute stages evenly from bottom to top
              const totalStages = sortedStages.length;
              const stageHeight = height * 0.5 / totalStages;
              const bottomPosition = height * 0.15 + (index * stageHeight);
              
              // Alternate left and right alignment
              const isEven = index % 2 === 0;
              
              return (
                <TouchableOpacity
                  key={stage.id}
                  style={[
                    styles.stageButton,
                    { 
                      bottom: bottomPosition,
                      left: isEven ? '5%' : undefined,
                      right: !isEven ? '5%' : undefined,
                    }
                  ]}
                  onPress={() => navigateToStage(stage.id)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.stageBanner,
                    stage.isCompleted ? styles.completedStage : {},
                    isDarkMode && styles.darkStageBanner
                  ]}>
                    <Text style={styles.stageText}>{stage.title}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
      </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelText: {
    color: Colors.card,
    fontSize: 18,
    fontWeight: 'bold',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 14,
  },
  journeyContainer: {
    flex: 1,
  },
  background: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  sunRaysContainer: {
    position: 'absolute',
    top: 60,
    width: 400,
    height: 400,
    opacity: 0.3,
  },
  sunRay: {
    position: 'absolute',
    top: 0,
    left: 200,
    width: 4,
    height: 200,
    backgroundColor: '#FFFFFF',
    transformOrigin: 'bottom',
  },
  sun: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF9C4',
    marginTop: 60,
    shadowColor: '#FFF9C4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  journeyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mountainContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '80%',
  },
  mountain: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '90%',
    backgroundColor: '#8B5A2B', // Brown mountain color
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
  },
  darkMountain: {
    backgroundColor: '#5D3C1D', // Darker brown for dark mode
  },
  mountainSnow: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '15%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
  },
  cloud: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    zIndex: 1,
  },
  cloud1: {
    top: '20%',
    right: '10%',
    width: 100,
    height: 50,
  },
  cloud2: {
    top: '30%',
    left: '5%',
    width: 120,
    height: 60,
  },
  cloud3: {
    top: '15%',
    right: '30%',
    width: 80,
    height: 40,
  },
  stageButton: {
    position: 'absolute',
    width: '45%',
    zIndex: 2,
  },
  stageBanner: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    transform: [{ skewY: '-2deg' }],
  },
  darkStageBanner: {
    backgroundColor: '#152A47', // Darker blue for dark mode
  },
  completedStage: {
    backgroundColor: '#2E7D32', // Green for completed stages
  },
  stageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});