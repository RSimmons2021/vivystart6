import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Award, Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Achievement } from '@/types';
import { useThemeStore } from '@/store/theme-store';

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  onPress,
  size = 'medium'
}) => {
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60, iconSize: 24 };
      case 'medium':
        return { width: 80, height: 80, iconSize: 32 };
      case 'large':
        return { width: 100, height: 100, iconSize: 40 };
      default:
        return { width: 80, height: 80, iconSize: 32 };
    }
  };
  
  const { width, height, iconSize } = getBadgeSize();
  
  const getBadgeColor = () => {
    if (!achievement.isUnlocked) {
      return themeColors.border;
    }
    
    switch (achievement.category) {
      case 'weight':
        return themeColors.primary;
      case 'nutrition':
        return themeColors.fruits;
      case 'activity':
        return themeColors.steps;
      case 'medication':
        return themeColors.secondary;
      case 'streak':
        return themeColors.warning;
      case 'journey':
        return themeColors.accent;
      default:
        return themeColors.primary;
    }
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          width, 
          height,
          backgroundColor: achievement.isUnlocked ? 'transparent' : themeColors.backgroundSecondary,
          opacity: achievement.isUnlocked ? 1 : 0.7
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View 
        style={[
          styles.badge,
          { 
            width: width * 0.8, 
            height: height * 0.8,
            backgroundColor: getBadgeColor(),
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center'
          }
        ]}
      >
        {achievement.isUnlocked ? (
          <Award size={iconSize} color={themeColors.card} />
        ) : (
          <>
            {/* Show faded real icon for locked achievement */}
            {React.createElement(
              require('lucide-react-native')[achievement.icon.charAt(0).toUpperCase() + achievement.icon.slice(1)] || Lock,
              {
                size: iconSize,
                color: themeColors.textTertiary,
                style: { opacity: 0.4, position: 'absolute' }
              }
            )}
            {/* Overlay lock icon */}
            <Lock size={iconSize * 0.7} color={themeColors.textTertiary} style={{ position: 'absolute' }} />
          </>
        )}
      </View>
      <Text 
        style={[
          styles.title,
          { 
            color: achievement.isUnlocked ? themeColors.text : themeColors.textTertiary,
            fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12
          }
        ]}
        numberOfLines={1}
      >
        {achievement.title}
      </Text>
      <Text 
        style={{
          color: achievement.isUnlocked ? themeColors.textSecondary : themeColors.textTertiary,
          fontSize: size === 'small' ? 8 : size === 'large' ? 12 : 10,
          textAlign: 'center',
          opacity: achievement.isUnlocked ? 1 : 0.7,
          marginTop: 2,
          minHeight: 24
        }}
        numberOfLines={2}
      >
        {achievement.description}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  badge: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
    fontWeight: '500',
  },
});