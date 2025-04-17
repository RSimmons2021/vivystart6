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
import Colors from '@/constants/colors';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { DailyLog } from '@/types';

// Define message type for chat
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function CoachScreen() {
  const { user, fetchUser } = useUserStore();
  const { isDarkMode } = useThemeStore();
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your GLP-1 AI assistant. How can I help you with your health journey today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [loading, setLoading] = useState(false);
  
  // Get theme-specific colors
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const [dailyLog, setDailyLog] = useState<DailyLog | undefined>(undefined);

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

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleSave = async () => {
    setModalLoading(true);
    setModalError(null);
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    try {
      switch (modalType) {
        case 'weight': {
          const weightValue = parseFloat(weightInput);
          if (!isNaN(weightValue) && weightValue > 0) {
            await addWeightLog({
              date: weightDate || currentDate,
              weight: weightValue,
            });
          }
          break;
        }
        case 'fruits': {
          const fruitsValue = parseInt(fruitsInput);
          if (!isNaN(fruitsValue) && fruitsValue >= 0) {
            await updateDailyLog(currentDate, {
              fruitsVeggiesServings: fruitsValue,
            });
          }
          break;
        }
        case 'protein': {
          const proteinValue = parseInt(proteinInput);
          if (!isNaN(proteinValue) && proteinValue >= 0) {
            await updateDailyLog(currentDate, {
              proteinGrams: proteinValue,
            });
          }
          break;
        }
        case 'steps': {
          const stepsValue = parseInt(stepsInput);
          if (!isNaN(stepsValue) && stepsValue >= 0) {
            await updateDailyLog(currentDate, {
              steps: stepsValue,
            });
          }
          break;
        }
        case 'water': {
          const waterValue = parseInt(waterInput);
          if (!isNaN(waterValue) && waterValue >= 0) {
            await updateDailyLog(currentDate, {
              waterOz: waterValue,
            });
          }
          break;
        }
      }
      setModalVisible(false);
    } catch (e) {
      setModalError('Failed to save. Please try again.');
    } finally {
      setModalLoading(false);
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

  // Fetch chat history when chat modal opens
  useEffect(() => {
    if (chatModalVisible && user?.id) {
      setLoading(true);
      fetch(`http://localhost:5000/gemini-chat/history?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.history) {
            setMessages(
              data.history.map((msg: any) => ({
                id: msg.id?.toString() || Math.random().toString(),
                text: msg.message,
                isUser: msg.is_user,
                timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
              }))
            );
          }
        })
        .catch(() => {
          setMessages([
            {
              id: 'error',
              text: 'Could not load chat history.',
              isUser: false,
              timestamp: new Date()
            }
          ]);
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatModalVisible, user?.id]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || !user?.id) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:5000/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text, user_id: user.id })
      });
      const data = await res.json();
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-ai',
        text: data.content || 'Sorry, I could not process your request.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (err) {
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-ai',
        text: 'Sorry, there was an error connecting to the AI assistant.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } finally {
      setLoading(false);
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
        {item.text}
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
                  progress={(dailyLog?.fruitsVeggiesServings ?? 0) / 5 * 100}
                  color={themeColors.fruits}
                  backgroundColor={themeColors.border}
                >
                  <Leaf size={20} color={themeColors.fruits} />
                </CircularProgress>
                <View style={styles.trackerTitleContent}>
                  <Text style={[styles.trackerTitle, { color: themeColors.text }]}>Fruits & Veggies</Text>
                  <Text style={[styles.trackerSubtitle, { color: themeColors.textSecondary }]}>
                    {(dailyLog?.fruitsVeggiesServings ?? 0)} / 5 servings
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
                style={styles.addButton}
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
              title={modalLoading ? 'Saving...' : 'Save'}
              onPress={handleSave}
              style={styles.saveButton}
              disabled={modalLoading}
            />
            {modalError && (
              <Text style={{ color: Colors.error, textAlign: 'center', marginTop: 8 }}>{modalError}</Text>
            )}
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
          
          {loading && (
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: themeColors.textTertiary }}>AI is typing...</Text>
            </View>
          )}
          
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
              disabled={inputMessage.trim() === '' || loading}
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