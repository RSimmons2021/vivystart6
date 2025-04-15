import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Colors from '@/constants/colors';

interface Ring {
  progress: number;
  color: string;
  strokeWidth: number;
}

interface MultiRingProgressProps {
  size: number;
  rings: Ring[];
  children?: React.ReactNode;
  isDarkMode?: boolean;
}

export const MultiRingProgress: React.FC<MultiRingProgressProps> = ({
  size,
  rings,
  children,
  isDarkMode = false,
}) => {
  // Sort rings by stroke width (thickest first)
  const sortedRings = [...rings].sort((a, b) => b.strokeWidth - a.strokeWidth);
  const backgroundColor = isDarkMode ? Colors.dark.border : Colors.light.border;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G transform={`translate(${size / 2}, ${size / 2})`}>
          {sortedRings.map((ring, index) => {
            const radius = (size - ring.strokeWidth) / 2 - index * 10;
            const circumference = radius * 2 * Math.PI;
            const progressValue = Math.min(100, Math.max(0, ring.progress));
            const strokeDashoffset = circumference - (progressValue / 100) * circumference;
            
            return (
              <React.Fragment key={index}>
                <Circle
                  r={radius}
                  stroke={backgroundColor}
                  strokeWidth={ring.strokeWidth}
                  fill="transparent"
                />
                <Circle
                  r={radius}
                  stroke={ring.color}
                  strokeWidth={ring.strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  transform={`rotate(-90)`}
                />
              </React.Fragment>
            );
          })}
        </G>
      </Svg>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});