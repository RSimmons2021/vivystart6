import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Bell, 
  Lock, 
  HelpCircle, 
  FileText, 
  LogOut, 
  ChevronRight,
  Moon,
  Award,
  Trophy,
  Scale
} from 'lucide-react-native';
import { useUserStore } from '@/store/user-store';
import { useThemeStore } from '@/store/theme-store';
import { useGamificationStore } from '@/store/gamification-store';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { user, clearUser, setOnboarded, weightUnit, toggleWeightUnit } = useUserStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { level, points, getUnlockedAchievements } = useGamificationStore();
  const router = useRouter();
  
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  
  // Get theme-specific colors
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  // Get unlocked achievements count
  const unlockedAchievements = getUnlockedAchievements();
  
  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            clearUser();
            setOnboarded(false);
            router.replace('/onboarding');
          },
        },
      ]
    );
  };
  
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };
  
  const navigateToAchievements = () => {
    router.push('/achievements');
  };
  
  const navigateToChallenges = () => {
    router.push('/challenges');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
          <View style={[styles.profileAvatar, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.profileInitial}>{user?.name?.[0] || 'U'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: themeColors.text }]}>
              {user?.name || 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: themeColors.textSecondary }]}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Account</Text>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: themeColors.card }]}>
            <View style={styles.settingIconContainer}>
              <User size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Profile</Text>
            </View>
            <ChevronRight size={20} color={themeColors.textTertiary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: themeColors.card }]}>
            <View style={styles.settingIconContainer}>
              <Bell size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.card}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: themeColors.card }]}>
            <View style={styles.settingIconContainer}>
              <Lock size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Privacy & Security</Text>
            </View>
            <ChevronRight size={20} color={themeColors.textTertiary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Achievements</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: themeColors.card }]}
            onPress={navigateToAchievements}
          >
            <View style={styles.settingIconContainer}>
              <Award size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Achievements</Text>
              <Text style={[styles.settingSubtitle, { color: themeColors.textTertiary }]}>
                {unlockedAchievements.length} unlocked
              </Text>
            </View>
            <ChevronRight size={20} color={themeColors.textTertiary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: themeColors.card }]}
            onPress={navigateToChallenges}
          >
            <View style={styles.settingIconContainer}>
              <Trophy size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Challenges</Text>
              <Text style={[styles.settingSubtitle, { color: themeColors.textTertiary }]}>
                Level {level} • {points} points
              </Text>
            </View>
            <ChevronRight size={20} color={themeColors.textTertiary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Preferences</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: themeColors.card }]}
            onPress={toggleTheme}
          >
            <View style={styles.settingIconContainer}>
              <Moon size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.card}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: themeColors.card }]}
            onPress={toggleWeightUnit}
          >
            <View style={styles.settingIconContainer}>
              <Scale size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Weight Unit</Text>
              <Text style={[styles.settingSubtitle, { color: themeColors.textTertiary }]}>
                {weightUnit === 'lbs' ? 'Pounds (lbs)' : 'Kilograms (kg)'}
              </Text>
            </View>
            <Switch
              value={weightUnit === 'kg'}
              onValueChange={toggleWeightUnit}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.card}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Support</Text>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: themeColors.card }]}>
            <View style={styles.settingIconContainer}>
              <HelpCircle size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Help Center</Text>
            </View>
            <ChevronRight size={20} color={themeColors.textTertiary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: themeColors.card }]}>
            <View style={styles.settingIconContainer}>
              <FileText size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>Terms & Policies</Text>
            </View>
            <ChevronRight size={20} color={themeColors.textTertiary} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: themeColors.error }]}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 24,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});