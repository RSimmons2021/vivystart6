import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Platform, Text } from 'react-native';
import { useThemeStore } from '@/store/theme-store';
import Colors from '@/constants/colors';

// Platform-aware imports for icons
let ICONS_MAP: Record<string, any>;
if (Platform.OS === 'web') {
  // @ts-ignore
  const { Home, LineChart, Target, MessageSquare, Syringe } = require('lucide-react');
  ICONS_MAP = {
    index: Home,
    goals: Target,
    coach: MessageSquare,
    shots: Syringe,
    progress: LineChart,
  };
} else {
  const { Home, LineChart, Target, MessageSquare, Syringe } = require('lucide-react-native');
  ICONS_MAP = {
    index: Home,
    goals: Target,
    coach: MessageSquare,
    shots: Syringe,
    progress: LineChart,
  };
}
const TITLES_MAP: Record<string, string> = {
  index: 'Journey',
  goals: 'Goals',
  coach: 'Coach',
  shots: 'Shots',
  progress: 'Progress',
};

export interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  position?: any;
}

export default function CustomTabBar({ state, descriptors, navigation, position }: CustomTabBarProps) {
  // Guard: If state or state.routes is undefined, render nothing to prevent crash
  if (!state || !state.routes) {
    return null;
  }
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // Filter routes to only those with icon and title
  const visibleRoutes = state.routes.filter((route: any) => ICONS_MAP[route.name] && TITLES_MAP[route.name]);
  // Track tab bar container width in px
  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth > 0 ? containerWidth / visibleRoutes.length : 0;
  // Find the index of the focused route among the visible routes
  const focusedRouteKey = state.routes[state.index]?.key;
  const visibleIndex = visibleRoutes.findIndex((route: any) => route.key === focusedRouteKey);

  // Animated value for highlight position (native only)
  const translateX = Platform.OS === 'web' ? undefined : useRef(new Animated.Value(visibleIndex * tabWidth)).current;

  // Animate or transition highlight bar
  useEffect(() => {
    if (Platform.OS !== 'web' && translateX && containerWidth > 0) {
      Animated.spring(translateX, {
        toValue: visibleIndex * tabWidth,
        useNativeDriver: true,
        speed: 18,
        bounciness: 7,
      }).start();
    }
  }, [visibleIndex, tabWidth, containerWidth]);

  return (
    <View
      style={[styles.tabBar, { backgroundColor: themeColors.card, borderTopColor: themeColors.border, height: Platform.OS === 'ios' ? 90 : 70, paddingBottom: Platform.OS === 'ios' ? 30 : 10 }]}
      onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <View style={{ flexDirection: 'row', position: 'relative', flex: 1 }}>
        {/* Highlight bar: Animated for native, CSS transition for web */}
        {Platform.OS === 'web' ? (
          <div
            style={{
              position: 'absolute',
              height: 3,
              bottom: 0,
              left: tabWidth * visibleIndex,
              width: tabWidth,
              backgroundColor: themeColors.primary,
              borderRadius: 2,
              transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
              zIndex: 0,
            }}
          />
        ) : (
          <Animated.View
            style={[
              styles.highlight,
              {
                backgroundColor: themeColors.primary,
                width: tabWidth,
                transform: [{ translateX: translateX ?? 0 }],
                left: 0,
              },
            ]}
          />
        )}
        {visibleRoutes.map((route: any, idx: number) => {
          const Icon = ICONS_MAP[route.name];
          const title = TITLES_MAP[route.name];
          const { options } = descriptors[route.key];
          const isFocused = visibleIndex === idx;
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              style={styles.tab}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            >
              <Icon size={24} color={isFocused ? themeColors.primary : themeColors.textTertiary} />
              {Platform.OS === 'web' ? (
                <span style={{ color: isFocused ? themeColors.primary : themeColors.textTertiary, fontSize: 12, fontWeight: 500, marginTop: 2 }}>{title}</span>
              ) : (
                <Text style={{ color: isFocused ? themeColors.primary : themeColors.textTertiary, fontSize: 12, fontWeight: '500', marginTop: 2 }}>{title}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    zIndex: 0, // ensure stacking context
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    zIndex: 1, // tab buttons above highlight
  },
  highlight: {
    position: 'absolute',
    height: 3,
    bottom: 0,
    borderRadius: 2,
    zIndex: 0, // highlight below tab buttons
  },
});
