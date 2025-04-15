import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import Colors from '@/constants/colors';
import { Challenge } from '@/types';
import { useThemeStore } from '@/store/theme-store';

interface ChallengeCardProps {
  challenge: Challenge;
  style?: any;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  style
}) => {
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  const getChallengeColor = () => {
    switch (challenge.category) {
      case 'weight':
        return themeColors.primary;
      case 'nutrition':
        return themeColors.fruits;
      case 'activity':
        return themeColors.steps;
      case 'medication':
        return themeColors.secondary;
      default:
        return themeColors.primary;
    }
  };
  
  return (
    <Card style={[styles.container, style, { backgroundColor: themeColors.card }]}>
      <View style={styles.header}>
        <View 
          style={[
            styles.categoryIndicator, 
            { backgroundColor: getChallengeColor() }
          ]} 
        />
        <Text style={[styles.title, { color: themeColors.text }]}>{challenge.title}</Text>
      </View>
      <Text style={[styles.description, { color: themeColors.textSecondary }]}>
        {challenge.description}
      </Text>
      <View style={styles.progressContainer}>
        <ProgressBar 
          progress={challenge.progress} 
          color={getChallengeColor()}
          backgroundColor={themeColors.border}
        />
        <Text style={[styles.progressText, { color: themeColors.textSecondary }]}>
          {challenge.progress}%
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={[styles.reward, { color: themeColors.text }]}>
          Reward: {challenge.reward} points
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
    marginLeft: 8,
    width: 40,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reward: {
    fontSize: 14,
    fontWeight: '500',
  },
});