import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trophy } from 'lucide-react-native';
import { ChallengeCard } from '@/components/ChallengeCard';
import { useGamificationStore } from '@/store/gamification-store';
import { useThemeStore } from '@/store/theme-store';
import Colors from '@/constants/colors';

export default function ChallengesScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  const { challenges } = useGamificationStore();
  
  const activeChallenges = challenges.filter(c => !c.isCompleted);
  const completedChallenges = challenges.filter(c => c.isCompleted);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Challenges</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.banner}>
          <Trophy size={24} color={themeColors.card} />
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: themeColors.card }]}>
              Weekly Challenges
            </Text>
            <Text style={[styles.bannerSubtitle, { color: themeColors.card }]}>
              Complete challenges to earn points and level up
            </Text>
          </View>
        </View>
        
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Active Challenges
        </Text>
        
        {activeChallenges.length === 0 ? (
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            No active challenges at the moment
          </Text>
        ) : (
          activeChallenges.map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))
        )}
        
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Completed Challenges
        </Text>
        
        {completedChallenges.length === 0 ? (
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            You haven't completed any challenges yet
          </Text>
        ) : (
          completedChallenges.map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  bannerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
});