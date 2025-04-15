import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/theme-store';

interface StreakCounterProps {
  count: number;
  label: string;
  style?: any;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  count,
  label,
  style
}) => {
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: count > 0 ? '#FF6B00' : themeColors.border }]}>
        <Flame size={16} color={themeColors.card} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.count, { color: themeColors.text }]}>{count}</Text>
        <Text style={[styles.label, { color: themeColors.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  count: {
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
  },
});