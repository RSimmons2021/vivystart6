import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  ChevronRight, 
  Syringe, 
  Scale, 
  Activity, 
  X,
  Plus,
  ChevronDown,
  ThermometerSun,
  Check
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useThemeStore } from '@/store/theme-store';
import { useUserStore } from '@/store/user-store';
import { useHealthStore } from '@/store/health-store';
import Colors from '@/constants/colors';
import { SideEffect } from '@/types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO,
  isToday
} from 'date-fns';
import { supabase } from '@/lib/supabase';

// Conversion functions
const kgToLbs = (kg: number) => Math.round(kg * 2.20462);
const lbsToKg = (lbs: number) => lbs / 2.20462;

// List of popular GLP-1 medications with dosages
const GLP1_MEDICATIONS = [
  { id: 'ozempic_0.25', name: 'Ozempic', dosage: '0.25 mg' },
  { id: 'ozempic_0.5', name: 'Ozempic', dosage: '0.5 mg' },
  { id: 'ozempic_1.0', name: 'Ozempic', dosage: '1.0 mg' },
  { id: 'ozempic_2.0', name: 'Ozempic', dosage: '2.0 mg' },
  { id: 'wegovy_0.25', name: 'Wegovy', dosage: '0.25 mg' },
  { id: 'wegovy_0.5', name: 'Wegovy', dosage: '0.5 mg' },
  { id: 'wegovy_1.0', name: 'Wegovy', dosage: '1.0 mg' },
  { id: 'wegovy_1.7', name: 'Wegovy', dosage: '1.7 mg' },
  { id: 'wegovy_2.4', name: 'Wegovy', dosage: '2.4 mg' },
  { id: 'mounjaro_2.5', name: 'Mounjaro', dosage: '2.5 mg' },
  { id: 'mounjaro_5.0', name: 'Mounjaro', dosage: '5.0 mg' },
  { id: 'mounjaro_7.5', name: 'Mounjaro', dosage: '7.5 mg' },
  { id: 'mounjaro_10.0', name: 'Mounjaro', dosage: '10.0 mg' },
  { id: 'mounjaro_12.5', name: 'Mounjaro', dosage: '12.5 mg' },
  { id: 'mounjaro_15.0', name: 'Mounjaro', dosage: '15.0 mg' },
  { id: 'saxenda_0.6', name: 'Saxenda', dosage: '0.6 mg' },
  { id: 'saxenda_1.2', name: 'Saxenda', dosage: '1.2 mg' },
  { id: 'saxenda_1.8', name: 'Saxenda', dosage: '1.8 mg' },
  { id: 'saxenda_2.4', name: 'Saxenda', dosage: '2.4 mg' },
  { id: 'saxenda_3.0', name: 'Saxenda', dosage: '3.0 mg' },
  { id: 'rybelsus_3', name: 'Rybelsus', dosage: '3 mg' },
  { id: 'rybelsus_7', name: 'Rybelsus', dosage: '7 mg' },
  { id: 'rybelsus_14', name: 'Rybelsus', dosage: '14 mg' },
  { id: 'trulicity_0.75', name: 'Trulicity', dosage: '0.75 mg' },
  { id: 'trulicity_1.5', name: 'Trulicity', dosage: '1.5 mg' },
  { id: 'trulicity_3.0', name: 'Trulicity', dosage: '3.0 mg' },
  { id: 'trulicity_4.5', name: 'Trulicity', dosage: '4.5 mg' },
  { id: 'zepbound_2.5', name: 'Zepbound', dosage: '2.5 mg' },
  { id: 'zepbound_5.0', name: 'Zepbound', dosage: '5.0 mg' },
  { id: 'zepbound_7.5', name: 'Zepbound', dosage: '7.5 mg' },
  { id: 'zepbound_10.0', name: 'Zepbound', dosage: '10.0 mg' },
  { id: 'zepbound_12.5', name: 'Zepbound', dosage: '12.5 mg' },
  { id: 'zepbound_15.0', name: 'Zepbound', dosage: '15.0 mg' },
  { id: 'other', name: 'Other (Custom)', dosage: '' }
];

// Common side effects of GLP-1 medications
const COMMON_SIDE_EFFECTS = [
  'Nausea',
  'Vomiting',
  'Diarrhea',
  'Constipation',
  'Stomach pain',
  'Headache',
  'Fatigue',
  'Dizziness',
  'Decreased appetite',
  'Acid reflux',
  'Gas',
  'Bloating',
  'Injection site reaction',
  'Muscle pain',
  'Hair loss',
  'Dry mouth',
  'Insomnia',
  'Anxiety',
  'Mood changes'
];

// Severity levels for side effects
const SEVERITY_LEVELS = [
  { id: 'mild', label: 'Mild', color: '#FFD700' }, // Yellow
  { id: 'moderate', label: 'Moderate', color: '#FF8C00' }, // Orange
  { id: 'severe', label: 'Severe', color: '#FF3B30' } // Red
];

export default function ShotsScreen() {
  const { user, weightUnit } = useUserStore();
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const { 
    shots, 
    addShot, 
    deleteShot, 
    weightLogs, 
    addWeightLog, 
    deleteWeightLog,
    sideEffects, 
    addSideEffect, 
    deleteSideEffect, 
    setShots, 
    setWeightLogs, 
    setSideEffects,
    fetchShots,
    fetchWeightLogs,
    fetchSideEffects
  } = useHealthStore();
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'shots' | 'weight' | 'sideEffects'>('shots');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shotModalVisible, setShotModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [sideEffectModalVisible, setSideEffectModalVisible] = useState(false);
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMedication, setSelectedMedication] = useState(GLP1_MEDICATIONS[0]);
  const [customMedication, setCustomMedication] = useState('');
  const [customDosage, setCustomDosage] = useState('');
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const [weight, setWeight] = useState('');
  const [selectedSideEffect, setSelectedSideEffect] = useState(COMMON_SIDE_EFFECTS[0]);
  const [customSideEffect, setCustomSideEffect] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState(SEVERITY_LEVELS[0]);
  const [sideEffectNotes, setSideEffectNotes] = useState('');
  const [showSideEffectDropdown, setShowSideEffectDropdown] = useState(false);
  const [pendingDeleteWeightId, setPendingDeleteWeightId] = useState<string | null>(null);

  // Defensive check: show loading or error if user not found
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>User not found</Text>
      </SafeAreaView>
    );
  }

  // Helper functions moved here before use
  const getShotsForDate = (date: Date) => {
    return shots.filter(shot => {
      const shotDate = parseISO(shot.date);
      return isSameDay(shotDate, date);
    });
  };
  
  const getWeightForDate = (date: Date) => {
    return weightLogs.filter(log => {
      const logDate = parseISO(log.date);
      return isSameDay(logDate, date);
    });
  };
  
  const getSideEffectsForDate = (date: Date) => {
    return sideEffects.filter(effect => {
      const effectDate = parseISO(effect.date);
      return isSameDay(effectDate, date);
    });
  };

  const selectedDateShots = useMemo(() => getShotsForDate(selectedDate), [shots, selectedDate]);
  const selectedDateWeight = useMemo(() => getWeightForDate(selectedDate), [weightLogs, selectedDate]);
  const selectedDateSideEffects = useMemo(() => getSideEffectsForDate(selectedDate), [sideEffects, selectedDate]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    (async () => {
      await Promise.all([
        fetchShots(),
        fetchWeightLogs(),
        fetchSideEffects()
      ]);
      setLoading(false);
    })();
  }, [user?.id]);

  useEffect(() => {
    console.log('===== DEBUG OUTPUT =====');
    console.log('Current user:', user?.id);
    console.log('Shots count:', shots.length);
    console.log('Weight logs count:', weightLogs.length);
    console.log('Side effects count:', sideEffects.length);
    console.log('Selected date:', selectedDate);
    console.log('Filtered shots:', selectedDateShots);
    console.log('Filtered weight:', selectedDateWeight);
    console.log('Filtered side effects:', selectedDateSideEffects);
    
    // Health store already verifies Supabase connection
    console.log('Store state:', useHealthStore.getState());
  }, [shots, weightLogs, sideEffects, selectedDate]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // API-backed state
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Add loading and error state for actions
  

  // Shot handlers
  const openShotModal = () => {
    setTime('');
    setLocation('');
    setNotes('');
    setSelectedMedication(GLP1_MEDICATIONS[0]);
    setCustomMedication('');
    setCustomDosage('');
    setShotModalVisible(true);
  };
  
  const handleAddShot = async () => {
    if (!time) {
      setActionError('Please enter a time');
      return;
    }
    
    // Format time as HH:MM if it's just a number
    const formattedTime = time.includes(':') ? time : `${time.padStart(2, '0')}:00`;
    
    setActionLoading(true);
    setActionError(null);
    
    try {
      const medication = selectedMedication.id === 'other' 
        ? `${customMedication} ${customDosage}`.trim() 
        : `${selectedMedication.name} ${selectedMedication.dosage}`;
      
      await addShot({
        date: selectedDate.toISOString(),
        time: formattedTime,
        location,
        notes,
        medication
      });
      
      setTime('');
      setLocation('');
      setNotes('');
      setShotModalVisible(false);
    } catch (error) {
      console.error('Error adding shot:', error);
      setActionError('Failed to add shot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteShot = async (id: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteShot(id);
      setShots(shots => shots.filter(shot => shot.id !== id));
    } catch (e) {
      setActionError('Failed to delete shot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteWeight = async (id: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteWeightLog(id);
      setWeightLogs(weightLogs => weightLogs.filter(log => log.id !== id));
    } catch (e) {
      setActionError('Failed to delete weight log.');
    } finally {
      setActionLoading(false);
    }
  };

  // Weight handlers
  const openWeightModal = () => {
    setWeight('');
    setWeightModalVisible(true);
  };
  
  const handleAddWeight = async () => {
    if (!weight || isNaN(parseFloat(weight))) return;
    setActionLoading(true);
    setActionError(null);
    try {
      // Always store weight in kg
      const weightInKg = weightUnit === 'lbs' ? lbsToKg(parseFloat(weight)) : parseFloat(weight);
      await addWeightLog({
        date: format(selectedDate, 'yyyy-MM-dd'),
        weight: weightInKg,
        notes: ''
      });
      await fetchWeightLogs(); // Refresh weight logs after add
      setWeightModalVisible(false);
    } catch (e) {
      setActionError('Failed to add weight log.');
    } finally {
      setActionLoading(false);
    }
  };

  // Side effect handlers
  const openSideEffectModal = () => {
    setSelectedSideEffect(COMMON_SIDE_EFFECTS[0]);
    setCustomSideEffect('');
    setSelectedSeverity(SEVERITY_LEVELS[0]);
    setSideEffectNotes('');
    setSideEffectModalVisible(true);
  };
  
  const handleAddSideEffect = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const effectName = selectedSideEffect === 'Other' ? customSideEffect : selectedSideEffect;
      if (!effectName) return;
      await addSideEffect({
        date: format(selectedDate, 'yyyy-MM-dd'),
        type: effectName,
        severity: selectedSeverity.id as 'mild' | 'moderate' | 'severe',
        notes: sideEffectNotes
      });
      await fetchSideEffects(); // Refresh side effects after add
      setSideEffectModalVisible(false);
    } catch (e) {
      setActionError('Failed to add side effect.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSideEffect = async (id: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteSideEffect(id);
      await fetchSideEffects(); // Refresh side effects after delete
    } catch (e) {
      setActionError('Failed to delete side effect.');
    } finally {
      setActionLoading(false);
    }
  };

  // Data retrieval functions
  const hasShot = (date: Date) => {
    return shots.some(shot => {
      const shotDate = parseISO(shot.date);
      return isSameDay(shotDate, date);
    });
  };
  
  const hasWeight = (date: Date) => {
    return weightLogs.some(log => {
      const logDate = parseISO(log.date);
      return isSameDay(logDate, date);
    });
  };
  
  const hasSideEffect = (date: Date) => {
    return sideEffects.some(effect => {
      const effectDate = parseISO(effect.date);
      return isSameDay(effectDate, date);
    });
  };
  
  const hasAnyData = (date: Date) => {
    return hasShot(date) || hasWeight(date) || hasSideEffect(date);
  };
  
  // Convert weight for display
  const displayWeight = (weightInKg: number) => {
    if (weightUnit === 'lbs') {
      return `${kgToLbs(weightInKg)} lbs`;
    } else {
      return `${Math.round(weightInKg)} kg`;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <View style={[styles.calendarHeader, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={prevMonth}>
            <ChevronLeft size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: themeColors.text }]}>
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={nextMonth}>
            <ChevronRight size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekdaysRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Text 
              key={index} 
              style={[styles.weekdayText, { color: themeColors.textSecondary }]}
            >
              {day}
            </Text>
          ))}
        </View>
        
        <View style={styles.daysGrid}>
          {monthDays.map((day, index) => {
            const isSelected = isSameDay(day, selectedDate);
            const hasData = hasAnyData(day);
            const isCurrentDay = isToday(day);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isSelected && [styles.selectedDay, { backgroundColor: themeColors.primary }]
                ]}
                onPress={() => handleDateSelect(day)}
              >
                <Text 
                  style={[
                    styles.dayText, 
                    isSelected && styles.selectedDayText,
                    isCurrentDay && { fontWeight: 'bold' },
                    { color: isSelected ? '#fff' : themeColors.text }
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                {hasData && (
                  <View 
                    style={[
                      styles.injectionDot,
                      isSelected ? { backgroundColor: '#fff' } : { backgroundColor: themeColors.primary }
                    ]} 
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={styles.selectedDateHeader}>
          <Text style={[styles.selectedDateText, { color: themeColors.text }]}>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              { backgroundColor: '#9c5dc0' },
              activeTab === 'shots' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('shots')}
          >
            <Syringe size={20} color="#fff" />
            <Text style={styles.tabButtonText}>Shots</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              { backgroundColor: '#e84393' },
              activeTab === 'weight' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('weight')}
          >
            <Scale size={20} color="#fff" />
            <Text style={styles.tabButtonText}>Weight</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              { backgroundColor: '#0984e3' },
              activeTab === 'sideEffects' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('sideEffects')}
          >
            <ThermometerSun size={20} color="#fff" />
            <Text style={styles.tabButtonText}>Side Effects</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.dataList}>
          {activeTab === 'shots' && (
            <>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: '#9c5dc0' }]}
                onPress={openShotModal}
              >
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Shot</Text>
              </TouchableOpacity>
              
              {selectedDateShots.length === 0 ? (
                <View style={styles.emptyState}>
                  <Syringe size={40} color={themeColors.textTertiary} />
                  <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                    No shots recorded for this date
                  </Text>
                  {__DEV__ && (
                    <Text style={{ color: 'red', fontSize: 10 }}>
                      DEBUG: {JSON.stringify(shots)}
                    </Text>
                  )}
                </View>
              ) : (
                selectedDateShots.map(shot => (
                  <Card key={shot.id} style={styles.dataCard}>
                    <View style={styles.dataCardHeader}>
                      <TouchableOpacity 
                        style={[styles.deleteButton, { marginRight: 36, paddingHorizontal: 20, paddingVertical: 14 }]}
                        onPress={() => handleDeleteShot(shot.id)}
                      >
                        <X size={22} color="#FF3B30" />
                      </TouchableOpacity>
                      <View style={styles.dataCardTitle}>
                        <Syringe size={18} color="#9c5dc0" />
                        <Text style={[styles.dataCardTitleText, { color: themeColors.text }]}>
                          {shot.medication}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.dataCardDetails}>
                      {shot.time && (
                        <View style={styles.dataCardDetail}>
                          <Text style={[styles.dataCardDetailLabel, { color: themeColors.textSecondary }]}>
                            Time:
                          </Text>
                          <Text style={[styles.dataCardDetailValue, { color: themeColors.text }]}>
                            {shot.time}
                          </Text>
                        </View>
                      )}
                      
                      {shot.location && (
                        <View style={styles.dataCardDetail}>
                          <Text style={[styles.dataCardDetailLabel, { color: themeColors.textSecondary }]}>
                            Location:
                          </Text>
                          <Text style={[styles.dataCardDetailValue, { color: themeColors.text }]}>
                            {shot.location}
                          </Text>
                        </View>
                      )}
                      
                      {shot.notes && (
                        <View style={styles.dataCardDetail}>
                          <Text style={[styles.dataCardDetailLabel, { color: themeColors.textSecondary }]}>
                            Notes:
                          </Text>
                          <Text style={[styles.dataCardDetailValue, { color: themeColors.text }]}>
                            {shot.notes}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card>
                ))
              )}
            </>
          )}
          
          {activeTab === 'weight' && (
            <>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: '#e84393' }]}
                onPress={openWeightModal}
              >
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Weight</Text>
              </TouchableOpacity>
              
              {selectedDateWeight.length === 0 ? (
                <View style={styles.emptyState}>
                  <Scale size={40} color={themeColors.textTertiary} />
                  <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                    No weight recorded for this date
                  </Text>
                  {__DEV__ && (
                    <Text style={{ color: 'red', fontSize: 10 }}>
                      DEBUG: {JSON.stringify(weightLogs)}
                    </Text>
                  )}
                </View>
              ) : (
                selectedDateWeight.map((log, index) => (
                  <Card key={index} style={styles.dataCard}>
                    <View style={styles.dataCardHeader}>
                      <TouchableOpacity onPress={() => setPendingDeleteWeightId(log.id)}>
                        <X size={22} color="#FF3B30" />
                      </TouchableOpacity>
                      <View style={styles.dataCardTitle}>
                        <Scale size={18} color="#e84393" />
                        <Text style={[styles.dataCardTitleText, { color: themeColors.text }]}>
                          {displayWeight(log.weight)}
                        </Text>
                      </View>
                    </View>
                    
                    {log.notes && (
                      <View style={styles.dataCardDetails}>
                        <View style={styles.dataCardDetail}>
                          <Text style={[styles.dataCardDetailLabel, { color: themeColors.textSecondary }]}>
                            Notes:
                          </Text>
                          <Text style={[styles.dataCardDetailValue, { color: themeColors.text }]}>
                            {log.notes}
                          </Text>
                        </View>
                      </View>
                    )}
                  </Card>
                ))
              )}
            </>
          )}
          
          {activeTab === 'sideEffects' && (
            <>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: '#0984e3' }]}
                onPress={openSideEffectModal}
              >
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Side Effect</Text>
              </TouchableOpacity>
              
              {selectedDateSideEffects.length === 0 ? (
                <View style={styles.emptyState}>
                  <ThermometerSun size={40} color={themeColors.textTertiary} />
                  <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                    No side effects recorded for this date
                  </Text>
                  {__DEV__ && (
                    <Text style={{ color: 'red', fontSize: 10 }}>
                      DEBUG: {JSON.stringify(sideEffects)}
                    </Text>
                  )}
                </View>
              ) : (
                selectedDateSideEffects.map((effect, index) => (
                  <Card key={index} style={styles.dataCard}>
                    <View style={styles.dataCardHeader}>
                      <TouchableOpacity onPress={() => handleDeleteSideEffect(effect.id)}>
                        <X size={18} color={themeColors.textTertiary} />
                      </TouchableOpacity>
                      <View style={styles.dataCardTitle}>
                        <ThermometerSun size={18} color="#0984e3" />
                        <Text style={[styles.dataCardTitleText, { color: themeColors.text }]}>
                          {effect.type} - {effect.severity.charAt(0).toUpperCase() + effect.severity.slice(1)}
                        </Text>
                      </View>
                    </View>
                    
                    {effect.notes && (
                      <View style={styles.dataCardDetails}>
                        <View style={styles.dataCardDetail}>
                          <Text style={[styles.dataCardDetailLabel, { color: themeColors.textSecondary }]}>
                            Notes:
                          </Text>
                          <Text style={[styles.dataCardDetailValue, { color: themeColors.text }]}>
                            {effect.notes}
                          </Text>
                        </View>
                      </View>
                    )}
                  </Card>
                ))
              )}
            </>
          )}
        </ScrollView>
      </View>
      
      {/* Shot Modal */}
      <Modal
        visible={shotModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Add Shot</Text>
              <TouchableOpacity onPress={() => setShotModalVisible(false)}>
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Medication</Text>
              <TouchableOpacity 
                style={[styles.dropdown, { borderColor: themeColors.border }]}
                onPress={() => setShowMedicationDropdown(!showMedicationDropdown)}
              >
                <Text style={[styles.dropdownText, { color: themeColors.text }]}>
                  {selectedMedication.id === 'other' 
                    ? 'Other (Custom)' 
                    : `${selectedMedication.name} ${selectedMedication.dosage}`}
                </Text>
                <ChevronDown size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
              
              {showMedicationDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {GLP1_MEDICATIONS.map((med) => (
                      <TouchableOpacity
                        key={med.id}
                        style={[
                          styles.dropdownItem,
                          selectedMedication.id === med.id && { backgroundColor: themeColors.backgroundSecondary }
                        ]}
                        onPress={() => {
                          setSelectedMedication(med);
                          setShowMedicationDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: themeColors.text }]}>
                          {med.id === 'other' 
                            ? 'Other (Custom)' 
                            : `${med.name} ${med.dosage}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              
              {selectedMedication.id === 'other' && (
                <>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary, marginTop: 16 }]}>
                    Custom Medication
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: themeColors.border, color: themeColors.text }]}
                    placeholder="Enter medication name"
                    placeholderTextColor={themeColors.textTertiary}
                    value={customMedication}
                    onChangeText={setCustomMedication}
                  />
                  
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                    Custom Dosage
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: themeColors.border, color: themeColors.text }]}
                    placeholder="Enter dosage (e.g., 0.5 mg)"
                    placeholderTextColor={themeColors.textTertiary}
                    value={customDosage}
                    onChangeText={setCustomDosage}
                  />
                </>
              )}
              
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Time</Text>
              <TextInput
                style={[styles.input, { borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="Enter time (e.g., 8:00 AM)"
                placeholderTextColor={themeColors.textTertiary}
                value={time}
                onChangeText={setTime}
              />
              
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Injection Location</Text>
              <TextInput
                style={[styles.input, { borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="Enter location (e.g., Left thigh)"
                placeholderTextColor={themeColors.textTertiary}
                value={location}
                onChangeText={setLocation}
              />
              
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Notes</Text>
              <TextInput
                style={[styles.textArea, { borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="Enter any notes"
                placeholderTextColor={themeColors.textTertiary}
                multiline={true}
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
              />
              
              <Button 
                title="Add Shot" 
                onPress={handleAddShot} 
                style={{ backgroundColor: '#9c5dc0', marginTop: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Weight Modal */}
      <Modal
        visible={weightModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWeightModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Add Weight</Text>
              <TouchableOpacity onPress={() => setWeightModalVisible(false)}>
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                Weight ({weightUnit})
              </Text>
              <TextInput
                style={[styles.input, { borderColor: themeColors.border, color: themeColors.text }]}
                placeholder={`Enter weight in ${weightUnit}`}
                placeholderTextColor={themeColors.textTertiary}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
              
              <Button 
                title="Add Weight" 
                onPress={handleAddWeight} 
                style={{ backgroundColor: '#e84393', marginTop: 20 }}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Side Effects Modal */}
      <Modal
        visible={sideEffectModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSideEffectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Add Side Effect</Text>
              <TouchableOpacity onPress={() => setSideEffectModalVisible(false)}>
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Side Effect</Text>
              <TouchableOpacity 
                style={[styles.dropdown, { borderColor: themeColors.border }]}
                onPress={() => setShowSideEffectDropdown(!showSideEffectDropdown)}
              >
                <Text style={[styles.dropdownText, { color: themeColors.text }]}>
                  {selectedSideEffect}
                </Text>
                <ChevronDown size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
              
              {showSideEffectDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {[...COMMON_SIDE_EFFECTS, 'Other'].map((effect) => (
                      <TouchableOpacity
                        key={effect}
                        style={[
                          styles.dropdownItem,
                          selectedSideEffect === effect && { backgroundColor: themeColors.backgroundSecondary }
                        ]}
                        onPress={() => {
                          setSelectedSideEffect(effect);
                          setShowSideEffectDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: themeColors.text }]}>
                          {effect}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              
              {selectedSideEffect === 'Other' && (
                <>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary, marginTop: 16 }]}>
                    Custom Side Effect
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: themeColors.border, color: themeColors.text }]}
                    placeholder="Enter side effect"
                    placeholderTextColor={themeColors.textTertiary}
                    value={customSideEffect}
                    onChangeText={setCustomSideEffect}
                  />
                </>
              )}
              
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary, marginTop: 16 }]}>Severity</Text>
              <View style={styles.severityContainer}>
                {SEVERITY_LEVELS.map((severity) => (
                  <TouchableOpacity
                    key={severity.id}
                    style={[
                      styles.severityBox,
                      { backgroundColor: severity.color },
                      selectedSeverity.id === severity.id && styles.selectedSeverityBox
                    ]}
                    onPress={() => setSelectedSeverity(severity)}
                  >
                    <Text style={styles.severityText}>{severity.label}</Text>
                    {selectedSeverity.id === severity.id && (
                      <Check size={16} color="#fff" style={styles.severityCheckIcon} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary, marginTop: 16 }]}>Notes</Text>
              <TextInput
                style={[styles.textArea, { borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="Enter any notes"
                placeholderTextColor={themeColors.textTertiary}
                multiline={true}
                numberOfLines={4}
                value={sideEffectNotes}
                onChangeText={setSideEffectNotes}
              />
              
              <Button 
                title="Add Side Effect" 
                onPress={handleAddSideEffect} 
                style={{ backgroundColor: '#0984e3', marginTop: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Delete Weight Confirmation Modal */}
      <Modal
        visible={!!pendingDeleteWeightId}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDeleteWeightId(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmBox, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.confirmText, { color: themeColors.text }]}>Are you sure you want to delete this entry?</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 }}>
              <TouchableOpacity onPress={() => setPendingDeleteWeightId(null)} style={[styles.confirmCancelBtn, { backgroundColor: themeColors.backgroundSecondary }]}>
                <Text style={[styles.confirmCancelText, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (pendingDeleteWeightId) await handleDeleteWeight(pendingDeleteWeightId);
                  setPendingDeleteWeightId(null);
                }}
                style={[styles.confirmDeleteBtn, { backgroundColor: '#FF3B30' }]}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    fontSize: 12,
    width: 40,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: '#9c5dc0',
  },
  dayText: {
    fontSize: 14,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  injectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  selectedDateHeader: {
    marginTop: 16,
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTabButton: {
    opacity: 1,
  },
  tabButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
  },
  dataList: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
  },
  dataCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  dataCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButton: {
    marginRight: 36,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  deleteIcon: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  dataCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataCardTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dataCardDetails: {
    marginTop: 4,
  },
  dataCardDetail: {
    marginBottom: 8,
  },
  dataCardDetailLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  dataCardDetailValue: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
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
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  // Severity selection styles
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  severityBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  selectedSeverityBox: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  severityText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  severityCheckIcon: {
    marginLeft: 6,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 16,
    minWidth: 260,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  confirmCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  confirmCancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmDeleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  confirmDeleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});