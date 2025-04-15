import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from '@/components/ProgressBar';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/theme-store';

interface LevelProgressBarProps {
  level: number;
  points: number;
  style?: any;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  level,
  points,
  style
}) => {
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  // Calculate progress to next level
  const pointsForCurrentLevel = (level - 1) * 100;
  const pointsForNextLevel = level * 100;
  const pointsNeeded = pointsForNextLevel - pointsForCurrentLevel;
  const currentLevelPoints = points - pointsForCurrentLevel;
  const progress = (currentLevelPoints / pointsNeeded) * 100;
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.levelInfo}>
        <Text style={[styles.levelText, { color: themeColors.text }]}>Level {level}</Text>
        <Text style={[styles.pointsText, { color: themeColors.textSecondary }]}>
          {currentLevelPoints}/{pointsNeeded} points to level {level + 1}
        </Text>
      </View>
      <ProgressBar 
        progress={progress} 
        height={8} 
        color={themeColors.primary}
        backgroundColor={themeColors.border}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 14,
  },
});