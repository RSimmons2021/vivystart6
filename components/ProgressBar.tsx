import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Colors from '@/constants/colors';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = Colors.primary,
  backgroundColor = Colors.border,
  style,
}) => {
  const progressValue = Math.min(100, Math.max(0, progress));

  return (
    <View style={[styles.container, { height }, style]}>
      <View 
        style={[
          styles.progress, 
          { 
            width: `${progressValue}%`,
            backgroundColor: color 
          }
        ]} 
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor, zIndex: -1 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progress: {
    height: '100%',
  },
});