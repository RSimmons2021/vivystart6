import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Animated, 
  Easing 
} from 'react-native';
import { Award } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Achievement } from '@/types';
import { useThemeStore } from '@/store/theme-store';

interface AchievementUnlockedModalProps {
  achievement: Achievement | null;
  visible: boolean;
  onClose: () => void;
}

export const AchievementUnlockedModal: React.FC<AchievementUnlockedModalProps> = ({
  achievement,
  visible,
  onClose
}) => {
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  const scaleAnim = new Animated.Value(0.5);
  const opacityAnim = new Animated.Value(0);
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [visible]);
  
  if (!achievement) return null;
  
  const getBadgeColor = () => {
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
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View 
          style={[
            styles.modalContent,
            { 
              backgroundColor: themeColors.card,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim
            }
          ]}
        >
          <View 
            style={[
              styles.badgeContainer,
              { backgroundColor: getBadgeColor() }
            ]}
          >
            <Award size={60} color={themeColors.card} />
          </View>
          
          <Text style={[styles.achievementTitle, { color: themeColors.text }]}>
            Achievement Unlocked!
          </Text>
          
          <Text style={[styles.title, { color: themeColors.text }]}>
            {achievement.title}
          </Text>
          
          <Text style={[styles.description, { color: themeColors.textSecondary }]}>
            {achievement.description}
          </Text>
          
          <Text style={[styles.points, { color: themeColors.primary }]}>
            +{achievement.points} points
          </Text>
          
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: themeColors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  badgeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  points: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
});