import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  X, 
  MessageSquare, 
  Scale, 
  Leaf, 
  Drumstick, 
  Footprints,
  Calendar,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/Card';
import { CircularProgress } from '@/components/CircularProgress';
import { Button } from '@/components/Button';
import { useHealthStore } from '@/store/health-store';
import { useUserStore } from '@/store/user-store';
import { useThemeStore } from '@/store/theme-store';
import { useGamificationStore } from '@/store/gamification-store';
import Colors from '@/constants/colors';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { DailyLog } from '@/types';
import { supabase } from '@/lib/supabase';

// Define message type for chat
interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
}

// Helper to map DB chat message to frontend ChatMessage
function mapChatMessage(row: any): ChatMessage {
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    isUser: row.is_user,
    timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
  };
}

// Fetch chat history for user from Supabase
async function fetchChatHistory(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });
  if (error || !data) return [];
  return data.map(mapChatMessage);
}

// Save message to Supabase
async function saveChatMessage(userId: string, message: string, isUser: boolean): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('chat_history')
    .insert([{ user_id: userId, message, is_user: isUser }])
    .select('*');
  if (error || !data || !data[0]) return null;
  return mapChatMessage(data[0]);
}

export default function CoachScreen() {
  const { user, fetchUser, updateUser } = useUserStore();
  const { isDarkMode } = useThemeStore();
  const { checkAchievementsAndChallenges, addPoints } = useGamificationStore();
  const { 
    addWeightLog, 
    getDailyLog, 
    updateDailyLog,
    fetchWeightLogs,
    fetchShots,
    fetchSideEffects,
    fetchWaterLogs,
    fetchStepLogs,
    fetchDailyLogs
  } = useHealthStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'weight' | 'fruits' | 'protein' | 'steps' | 'water'>('weight');
  const [weightInput, setWeightInput] = useState('');
  const [weightDate, setWeightDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fruitsInput, setFruitsInput] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [waterInput, setWaterInput] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Chat state
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  // Goal weight state
  const [goalWeightInput, setGoalWeightInput] = useState(user?.goalWeight ? String(user.goalWeight) : '');
  const [goalWeightModalVisible, setGoalWeightModalVisible] = useState(false);

  // Get theme-specific colors
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const [dailyLog, setDailyLog] = useState<DailyLog | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    (async () => {
      await Promise.all([
        fetchWeightLogs(),
        fetchShots(),
        fetchSideEffects(),
        fetchWaterLogs(),
        fetchStepLogs(),
        fetchDailyLogs()
      ]);
      setLoading(false);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const log = await getDailyLog(today);
      setDailyLog(log);
    })();
  }, [today, getDailyLog, user?.id]);

  useEffect(() => {
    if (user?.id) fetchUser(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    // Fetch persistent chat history from Supabase
    fetchChatHistory(user.id).then(history => {
      setMessages(history);
    });
  }, [user?.id]);

  // Calendar related functions
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const handlePrevMonth = () => {
    setCalendarDate(subMonths(calendarDate, 1));
  };
  
  const handleNextMonth = () => {
    setCalendarDate(addMonths(calendarDate, 1));
  };
  
  const handleDayPress = (day: Date) => {
    setWeightDate(format(day, 'yyyy-MM-dd'));
    setDatePickerVisible(false);
  };

  const handleAddPress = (type: 'weight' | 'fruits' | 'protein' | 'steps' | 'water') => {
    setModalType(type);
    
    // Reset inputs
    setWeightInput('');
    setWeightDate(format(new Date(), 'yyyy-MM-dd'));
    setFruitsInput('');
    setProteinInput('');
    setStepsInput('');
    setWaterInput('');
    
    setModalVisible(true);
  };

  const handleSave = async () => {
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    let loggedType: 'weight' | 'fruits' | 'protein' | 'steps' | null = null;
    let loggedValue = 0;
    try {
      switch (modalType) {
        case 'weight': {
          const weightValue = parseFloat(weightInput);
          if (!isNaN(weightValue) && weightValue > 0) {
            await addWeightLog({
              date: weightDate || currentDate,
              weight: weightValue,
            });
            loggedType = 'weight';
            loggedValue = weightValue;
          }
          break;
        }
        case 'fruits': {
          const fruitsValue = parseInt(fruitsInput);
          if (!isNaN(fruitsValue) && fruitsValue >= 0) {
            const logData = { fruitsVeggies: fruitsValue };
            console.log('Calling updateDailyLog with:', logData);
            await updateDailyLog(currentDate, logData);
            loggedType = 'fruits';
            loggedValue = fruitsValue;
          }
          break;
        }
        case 'protein': {
          const proteinValue = parseInt(proteinInput);
          if (!isNaN(proteinValue) && proteinValue >= 0) {
            const logData = { proteinGrams: proteinValue };
            console.log('Calling updateDailyLog with:', logData);
            await updateDailyLog(currentDate, logData);
            loggedType = 'protein';
            loggedValue = proteinValue;
          }
          break;
        }
        case 'steps': {
          const stepsValue = parseInt(stepsInput);
          if (!isNaN(stepsValue) && stepsValue >= 0) {
            const logData = { steps: stepsValue };
            console.log('Calling updateDailyLog with:', logData);
            await updateDailyLog(currentDate, logData);
            loggedType = 'steps';
            loggedValue = stepsValue;
          }
          break;
        }
        case 'water': {
          const waterValue = parseInt(waterInput);
          if (!isNaN(waterValue) && waterValue >= 0) {
            const logData = { waterOz: waterValue };
            console.log('Calling updateDailyLog with:', logData);
            await updateDailyLog(currentDate, logData);
            // no achievements for water
          }
          break;
        }
      }
      // Refresh the dailyLog state after update
      const updatedLog = await getDailyLog(currentDate);
      setDailyLog(updatedLog);
      await fetchDailyLogs();
      // Evaluate achievements/challenges
      if (user?.id && loggedType) {
        checkAchievementsAndChallenges(loggedType, loggedValue, user.id);
        // Award base points for logging
        switch (loggedType) {
          case 'steps':
            addPoints(Math.floor(loggedValue / 1000) * 5);
            break;
          case 'protein':
            addPoints(Math.floor(loggedValue / 10) * 2);
            break;
          case 'fruits':
            addPoints(loggedValue);
            break;
          case 'weight':
            addPoints(10);
            break;
        }
      }
      setModalVisible(false);
    } catch (e) {
      console.error('CoachScreen log error:', e);
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'weight':
        return 'Log Weight';
      case 'fruits':
        return 'Log Fruits & Veggies';
      case 'protein':
        return 'Log Protein';
      case 'steps':
        return 'Log Steps';
      case 'water':
        return 'Log Water';
      default:
        return 'Log Data';
    }
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'weight':
        return (
          <>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Current Weight (lbs)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.text }]}
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="Enter weight"
              placeholderTextColor={themeColors.textTertiary}
              keyboardType="numeric"
            />
            
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Date</Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={[styles.dateInput, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.text }]}
                value={weightDate}
                onChangeText={setWeightDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={themeColors.textTertiary}
              />
              <TouchableOpacity 
                style={[styles.calendarButton, { backgroundColor: themeColors.primary }]}
                onPress={() => setDatePickerVisible(true)}
              >
                <Calendar size={20} color={themeColors.card} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.dateHelpText, { color: themeColors.textTertiary }]}>
              You can log weight for past dates in YYYY-MM-DD format
            </Text>
          </>
        );
      case 'fruits':
        return (
          <>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Fruits & Veggies (servings)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.text }]}
              value={fruitsInput}
              onChangeText={setFruitsInput}
              placeholder="Enter servings"
              placeholderTextColor={themeColors.textTertiary}
              keyboardType="numeric"
            />
          </>
        );
      case 'protein':
        return (
          <>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Protein (grams)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.text }]}
              value={proteinInput}
              onChangeText={setProteinInput}
              placeholder="Enter grams"
              placeholderTextColor={themeColors.textTertiary}
              keyboardType="numeric"
            />
          </>
        );
      case 'steps':
        return (
          <>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Steps</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.text }]}
              value={stepsInput}
              onChangeText={setStepsInput}
              placeholder="Enter steps"
              placeholderTextColor={themeColors.textTertiary}
              keyboardType="numeric"
            />
          </>
        );
      case 'water':
        return (
          <>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Water (oz)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.text }]}
              value={waterInput}
              onChangeText={setWaterInput}
              placeholder="Enter ounces"
              placeholderTextColor={themeColors.textTertiary}
              keyboardType="numeric"
            />
          </>
        );
      default:
        return null;
    }
  };

  // Handle opening the chat modal
  const handleOpenChat = () => {
    setChatModalVisible(true);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user?.id) return;
    try {
      console.log("[DEBUG] Saving user message...");
      const userMsg = await saveChatMessage(user.id, inputMessage, true);
      if (userMsg) setMessages(prev => [...prev, userMsg]);
      setInputMessage('');
      console.log("[DEBUG] Getting Supabase session for Authorization header...");
      const sessionResult = await supabase.auth.getSession();
      const accessToken = sessionResult?.data?.session?.access_token;
      if (!accessToken) {
        console.error("[DEBUG] No access token found. User may not be authenticated.");
      }
      console.log("[DEBUG] Sending message to Gemini Edge Function...");
      const response = await fetch('https://xkjixvyxiaphavaptmfl.functions.supabase.co/gemini-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` })
        },
        body: JSON.stringify({ user_id: user.id, message: inputMessage })
      });
      console.log("[DEBUG] Gemini response status:", response.status);
      let data;
      try {
        data = await response.json();
        console.log("[DEBUG] Gemini response data:", data);
      } catch (jsonErr) {
        console.error("[DEBUG] Error parsing Gemini response JSON:", jsonErr);
        data = {};
      }
      const aiMsg = data.reply ? await saveChatMessage(user.id, data.reply, false) : null;
      if (aiMsg) setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error("[DEBUG] Error in handleSendMessage:", e);
    }
  };

  // Render chat message item
  const renderChatItem = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageBubble, 
      item.isUser ? 
        [styles.userBubble, { backgroundColor: themeColors.primary }] : 
        [styles.aiBubble, { backgroundColor: themeColors.backgroundSecondary }]
    ]}>
      <Text style={[
        styles.messageText, 
        { color: item.isUser ? themeColors.card : themeColors.text }
      ]}>
        {item.message}
      </Text>
      <Text style={[
        styles.messageTime, 
        { color: item.isUser ? 'rgba(255,255,255,0.7)' : themeColors.textTertiary }
      ]}>
        {format(item.timestamp, 'h:mm a')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Coach</Text>
        <Text style={[styles.date, { color: themeColors.textSecondary }]}>{format(new Date(), 'EEE, MMM d')}</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <TouchableOpacity onPress={handleOpenChat}>
          <LinearGradient
            colors={isDarkMode ? ['#2A4374', '#3A5795'] : [themeColors.primary, themeColors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <View style={styles.bannerContent}>
              <MessageSquare size={24} color={themeColors.card} />
              <View style={styles.bannerTextContainer}>
                <Text style={[styles.bannerText, { color: themeColors.card }]}>
                  How can I help you today?
                </Text>
                <Text style={[styles.bannerSubtext, { color: themeColors.card }]}>
                  Tap to ask a question to your AI assistant
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.trackers}>
          <Card style={[styles.trackerCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.trackerHeader}>
              <View style={styles.trackerTitleContainer}>
                <CircularProgress
                  size={40}
                  strokeWidth={4}
                  progress={100}
                  color={themeColors.primary}
                  backgroundColor={themeColors.border}
                >
                  <Scale size={20} color={themeColors.primary} />
                </CircularProgress>
                <View style={styles.trackerTitleContent}>
                  <Text style={[styles.trackerTitle, { color: themeColors.text }]}>Weight</Text>
                  <Text style={[styles.trackerSubtitle, { color: themeColors.textSecondary }]}>
                    {user?.currentWeight || '0'} lbs
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: themeColors.primary }]}
                onPress={() => handleAddPress('weight')}
              >
                <Plus size={20} color={themeColors.card} />
              </TouchableOpacity>
            </View>
          </Card>
          
          <Card style={[styles.trackerCard, { backgroundColor: themeColors.card }]}> 
            <View style={styles.trackerHeader}>
              <View style={styles.trackerTitleContainer}>
                <CircularProgress
                  size={40}
                  strokeWidth={4}
                  progress={user?.goalWeight && user?.currentWeight ? Math.max(0, Math.min(100, 100 - ((user.currentWeight - user.goalWeight) / (user.currentWeight || 1)) * 100)) : 0}
                  color={themeColors.primary}
                  backgroundColor={themeColors.border}
                >
                  <Scale size={20} color={themeColors.primary} />
                </CircularProgress>
                <View style={styles.trackerTitleContent}>
                  <Text style={[styles.trackerTitle, { color: themeColors.text }]}>Goal Weight</Text>
                  <Text style={[styles.trackerSubtitle, { color: themeColors.textSecondary }]}> {user?.goalWeight ? `${user.goalWeight} lbs` : 'Set your goal'} </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  setGoalWeightInput(user?.goalWeight ? String(user.goalWeight) : '');
                  setGoalWeightModalVisible(true);
                }}
              >
                <Plus size={20} color={themeColors.card} />
              </TouchableOpacity>
            </View>
          </Card>

          <Card style={[styles.trackerCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.trackerHeader}>
              <View style={styles.trackerTitleContainer}>
                <CircularProgress
                  size={40}
                  strokeWidth={4}
                  progress={(dailyLog?.fruitsVeggies ?? 0) / 5 * 100}
                  color={themeColors.fruits}
                  backgroundColor={themeColors.border}
                >
                  <Leaf size={20} color={themeColors.fruits} />
                </CircularProgress>
                <View style={styles.trackerTitleContent}>
                  <Text style={[styles.trackerTitle, { color: themeColors.text }]}>Fruits & Veggies</Text>
                  <Text style={[styles.trackerSubtitle, { color: themeColors.textSecondary }]}>
                    {(dailyLog?.fruitsVeggies ?? 0)} / 5 servings
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => handleAddPress('fruits')}
              >
                <Plus size={20} color={themeColors.card} />
              </TouchableOpacity>
            </View>
          </Card>
          
          <Card style={[styles.trackerCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.trackerHeader}>
              <View style={styles.trackerTitleContainer}>
                <CircularProgress
                  size={40}
                  strokeWidth={4}
                  progress={(dailyLog?.proteinGrams ?? 0) / 100 * 100}
                  color={themeColors.protein}
                  backgroundColor={themeColors.border}
                >
                  <Drumstick size={20} color={themeColors.protein} />
                </CircularProgress>
                <View style={styles.trackerTitleContent}>
                  <Text style={[styles.trackerTitle, { color: themeColors.text }]}>Protein</Text>
                  <Text style={[styles.trackerSubtitle, { color: themeColors.textSecondary }]}>
                    {(dailyLog?.proteinGrams ?? 0)} / 100 grams
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: themeColors.protein }]}
                onPress={() => handleAddPress('protein')}
              >
                <Plus size={20} color={themeColors.card} />
              </TouchableOpacity>
            </View>
          </Card>
          
          <Card style={[styles.trackerCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.trackerHeader}>
              <View style={styles.trackerTitleContainer}>
                <CircularProgress
                  size={40}
                  strokeWidth={4}
                  progress={(dailyLog?.steps ?? 0) / 10000 * 100}
                  color={themeColors.steps}
                  backgroundColor={themeColors.border}
                >
                  <Footprints size={20} color={themeColors.steps} />
                </CircularProgress>
                <View style={styles.trackerTitleContent}>
                  <Text style={[styles.trackerTitle, { color: themeColors.text }]}>Steps</Text>
                  <Text style={[styles.trackerSubtitle, { color: themeColors.textSecondary }]}>
                    {(dailyLog?.steps ?? 0).toLocaleString()} / 10,000 steps
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: themeColors.steps }]}
                onPress={() => handleAddPress('steps')}
              >
                <Plus size={20} color={themeColors.card} />
              </TouchableOpacity>
            </View>
          </Card>
          
          <Card style={[styles.trackerCard, { backgroundColor: themeColors.card }]}> 
            <View style={styles.trackerHeader}>
              <View style={styles.trackerTitleContainer}>
                <CircularProgress
                  size={40}
                  strokeWidth={4}
                  progress={(dailyLog?.waterOz ?? 0) / 64 * 100}
                  color={themeColors.primary}
                  backgroundColor={themeColors.border}
                >
                  <Text style={{ color: themeColors.primary, fontWeight: 'bold' }}>💧</Text>
                </CircularProgress>
                <View style={styles.trackerTitleContent}>
                  <Text style={[styles.trackerTitle, { color: themeColors.text }]}>Water</Text>
                  <Text style={[styles.trackerSubtitle, { color: themeColors.textSecondary }]}> {(dailyLog?.waterOz ?? 0)} / 64 oz</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => handleAddPress('water')}
              >
                <Plus size={20} color={themeColors.card} />
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </ScrollView>
      
      {/* Log Data Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>{getModalTitle()}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            {renderModalContent()}
            
            <Button
              title="Save"
              onPress={handleSave}
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
      
      {/* Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavButton}>
                <ChevronLeft size={24} color={themeColors.text} />
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: themeColors.text }]}>
                {format(calendarDate, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavButton}>
                <ChevronRight size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.weekdaysContainer}>
              {weekdays.map((day, index) => (
                <Text key={index} style={[styles.weekdayText, { color: themeColors.textSecondary }]}>
                  {day}
                </Text>
              ))}
            </View>
            
            <View style={styles.daysContainer}>
              {Array(monthStart.getDay())
                .fill(null)
                .map((_, index) => (
                  <View key={`empty-${index}`} style={styles.emptyDay} />
                ))}
              
              {days.map((day, index) => {
                const isSelected = weightDate === format(day, 'yyyy-MM-dd');
                const isToday = isSameDay(day, new Date());
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      isSelected && [styles.selectedDay, { backgroundColor: themeColors.primary }],
                      isToday && [styles.currentDay, { borderColor: themeColors.primary }]
                    ]}
                    onPress={() => handleDayPress(day)}
                  >
                    <Text 
                      style={[
                        styles.dayText,
                        { color: themeColors.text },
                        isSelected && styles.selectedDayText,
                        isToday && [styles.currentDayText, { color: themeColors.primary }]
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <Button
              title="Confirm"
              onPress={() => setDatePickerVisible(false)}
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
      
      {/* Goal Weight Modal */}
      <Modal
        visible={goalWeightModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGoalWeightModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>  
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Set Goal Weight</Text>
              <TouchableOpacity onPress={() => setGoalWeightModalVisible(false)}>
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Goal Weight (lbs)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.text }]}
              value={goalWeightInput}
              onChangeText={setGoalWeightInput}
              placeholder="Enter goal weight"
              placeholderTextColor={themeColors.textTertiary}
              keyboardType="numeric"
            />
            <Button
              title="Save"
              onPress={async () => {
                if (goalWeightInput && !isNaN(Number(goalWeightInput))) {
                  await updateUser({ goalWeight: Number(goalWeightInput) });
                  setGoalWeightModalVisible(false);
                }
              }}
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
      
      {/* Chat Modal */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setChatModalVisible(false)}
      >
        <SafeAreaView style={[styles.chatContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.chatHeader, { backgroundColor: themeColors.card }]}>
            <View style={styles.chatHeaderContent}>
              <TouchableOpacity 
                onPress={() => setChatModalVisible(false)}
                style={styles.chatBackButton}
              >
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
              <Text style={[styles.chatHeaderTitle, { color: themeColors.text }]}>AI Health Assistant</Text>
            </View>
          </View>
          
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderChatItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            style={[styles.inputContainer, { backgroundColor: themeColors.card }]}
          >
            <TextInput
              style={[styles.chatInput, { 
                backgroundColor: themeColors.backgroundSecondary,
                color: themeColors.text
              }]}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Type your question here..."
              placeholderTextColor={themeColors.textTertiary}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: themeColors.primary }]}
              onPress={handleSendMessage}
              disabled={inputMessage.trim() === ''}
            >
              <Send size={20} color={themeColors.card} />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  banner: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  bannerTextContainer: {
    marginLeft: 12,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bannerSubtext: {
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
  },
  trackers: {
    marginBottom: 20,
  },
  trackerCard: {
    marginBottom: 16,
  },
  trackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trackerTitleContent: {
    marginLeft: 12,
  },
  trackerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  trackerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateInput: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateHelpText: {
    fontSize: 12,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  
  // Calendar styles
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyDay: {
    width: 40,
    height: 40,
    margin: 2,
  },
  dayButton: {
    width: 40,
    height: 40,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: Colors.primary,
  },
  currentDay: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 14,
  },
  selectedDayText: {
    color: Colors.card,
    fontWeight: '600',
  },
  currentDayText: {
    fontWeight: '600',
  },
  
  // Chat styles
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chatHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatBackButton: {
    marginRight: 16,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chatList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chatInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
});