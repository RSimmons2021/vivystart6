import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { parseISO, format, subDays, subMonths, subYears } from 'date-fns';

interface WeightLog {
  date: string;
  weight: number;
}

interface WeightChartProps {
  weightLogs: WeightLog[];
  startWeight: number;
  goalWeight: number;
  period: 'week' | 'month' | 'year';
  height?: number;
  isDarkMode?: boolean;
  weightUnit?: 'lbs' | 'kg';
}

// Conversion functions
const kgToLbs = (kg: number) => Math.round(kg * 2.20462);
const lbsToKg = (lbs: number) => lbs / 2.20462;

// Mock implementation for environments where react-native-chart-kit is not available
const MockLineChart = ({ 
  data, 
  width, 
  height, 
  chartConfig, 
  style,
  isDarkMode
}: any) => {
  const backgroundColor = isDarkMode ? '#242424' : '#f0f0f0';
  const textColor = isDarkMode ? '#FFFFFF' : '#333333';
  
  return (
    <View style={[{ width, height, backgroundColor, borderRadius: 8 }, style]}>
      <Text style={{ textAlign: 'center', marginTop: height / 2 - 10, color: textColor }}>
        Chart visualization (requires react-native-chart-kit)
      </Text>
    </View>
  );
};

// Try to import LineChart, use mock if not available
let LineChart;
try {
  LineChart = require('react-native-chart-kit').LineChart;
} catch (e) {
  LineChart = MockLineChart;
}

// Use the actual LineChart if available, otherwise use the mock
const ChartComponent = LineChart || MockLineChart;

export const WeightChart: React.FC<WeightChartProps> = ({ 
  weightLogs, 
  startWeight, 
  goalWeight, 
  period, 
  height = 220,
  isDarkMode = false,
  weightUnit = 'lbs'
}) => {
  const screenWidth = Dimensions.get('window').width - 40;
  
  // Filter logs based on selected period
  const today = new Date();
  const filteredLogs = weightLogs.filter(log => {
    const logDate = parseISO(log.date);
    if (period === 'week') {
      return logDate >= subDays(today, 7);
    } else if (period === 'month') {
      return logDate >= subMonths(today, 1);
    } else {
      return logDate >= subYears(today, 1);
    }
  });
  
  // Sort logs by date
  const sortedLogs = [...filteredLogs].sort((a, b) => 
    parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );
  
  // Prepare data for chart with date labels
  const labels = sortedLogs.map(log => {
    const date = parseISO(log.date);
    if (period === 'week') {
      return format(date, 'MM/dd');
    } else if (period === 'month') {
      return format(date, 'MM/dd');
    } else {
      return format(date, 'MM/yyyy');
    }
  });
  
  // Convert weights to the selected unit
  const convertWeight = (weight: number) => {
    return weightUnit === 'lbs' ? kgToLbs(weight) : Math.round(weight);
  };
  
  const data = sortedLogs.map(log => convertWeight(log.weight));
  
  // Add start weight if no logs
  if (sortedLogs.length === 0 && startWeight > 0) {
    labels.push('Start');
    data.push(convertWeight(startWeight));
  }
  
  // Add goal weight line
  const goalWeightConverted = convertWeight(goalWeight);
  const goalLine = Array(data.length).fill(goalWeightConverted);
  
  // Calculate min and max for y-axis
  const startWeightConverted = convertWeight(startWeight);
  const allWeights = [...data, startWeightConverted, goalWeightConverted].filter(w => w > 0);
  const minWeight = Math.min(...allWeights) - 5;
  const maxWeight = Math.max(...allWeights) + 5;
  
  const chartConfig = {
    backgroundColor: isDarkMode ? '#242424' : '#ffffff',
    backgroundGradientFrom: isDarkMode ? '#242424' : '#ffffff',
    backgroundGradientTo: isDarkMode ? '#242424' : '#ffffff',
    decimalPlaces: 0, // No decimals for weight
    color: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#9c5dc0',
    },
    propsForBackgroundLines: {
      stroke: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    propsForLabels: {
      fontSize: 10,
    },
  };
  
  const chartData = {
    labels,
    datasets: [
      {
        data: data.length > 0 ? data : [startWeightConverted, startWeightConverted],
        color: (opacity = 1) => `rgba(156, 93, 192, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: goalLine.length > 0 ? goalLine : [goalWeightConverted, goalWeightConverted],
        color: (opacity = 1) => `rgba(232, 67, 147, ${opacity})`,
        strokeWidth: 2,
        withDots: false,
      },
    ],
    legend: ['Current', 'Goal'],
  };
  
  // For Android in light mode, we need to ensure the chart is visible
  const androidLightModeStyle = Platform.OS === 'android' && !isDarkMode ? 
    { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0e0e0' } : {};
  
  return (
    <View style={styles.container}>
      {data.length > 0 || startWeight > 0 ? (
        <ChartComponent
          data={chartData}
          width={screenWidth}
          height={height}
          chartConfig={chartConfig}
          bezier
          fromZero={false}
          yAxisSuffix={` ${weightUnit}`}
          yAxisInterval={5}
          segments={5}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          yLabelsOffset={10}
          hidePointsAtIndex={goalLine.map((_, index) => index)}
          style={[styles.chart, androidLightModeStyle]}
          isDarkMode={isDarkMode}
          transparent={false}
        />
      ) : (
        <View style={[styles.emptyChart, { height, backgroundColor: isDarkMode ? '#242424' : '#f0f0f0' }]}>
          <Text style={[styles.emptyText, { color: isDarkMode ? '#fff' : '#000' }]}>No weight data available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 16,
  },
  emptyChart: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
  },
});