import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { JourneyStage } from '@/types';
import Colors from '@/constants/colors';

interface JourneyMountainProps {
  stages: JourneyStage[];
  onStagePress: (stage: JourneyStage) => void;
}

export const JourneyMountain: React.FC<JourneyMountainProps> = ({
  stages,
  onStagePress,
}) => {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4A7BF7', '#6B92FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <View style={styles.sunContainer}>
          <View style={styles.sun} />
          <View style={styles.sunRays} />
        </View>
        
        <View style={styles.mountainContainer}>
          <View style={styles.mountain} />
          <View style={styles.mountainSnow} />
        </View>
        
        <View style={styles.stagesContainer}>
          {sortedStages.map((stage, index) => (
            <TouchableOpacity
              key={stage.id}
              style={[
                styles.stageButton,
                { bottom: 100 + index * 120 }
              ]}
              onPress={() => onStagePress(stage)}
              activeOpacity={0.8}
            >
              <View style={styles.stageContainer}>
                <Text style={styles.stageTitle}>{stage.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.journeyTitle}>THE GLP-1 JOURNEY</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 800,
    width: '100%',
  },
  background: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    overflow: 'hidden',
  },
  journeyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.card,
    marginTop: 20,
    textAlign: 'center',
  },
  sunContainer: {
    position: 'absolute',
    top: 100,
    left: '50%',
    marginLeft: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  sun: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  sunRays: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderWidth: 30,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mountainContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 600,
  },
  mountain: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 500,
    backgroundColor: '#6B4226',
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
  },
  mountainSnow: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 100,
    backgroundColor: 'white',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  stagesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  stageButton: {
    position: 'absolute',
    left: '10%',
    right: '10%',
  },
  stageContainer: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  stageTitle: {
    color: Colors.card,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});