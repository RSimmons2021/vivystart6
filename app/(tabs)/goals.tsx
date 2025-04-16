import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  TextInput,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Check, X, Edit, Trash2, Award } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/Button';
import { AchievementUnlockedModal } from '@/components/AchievementUnlockedModal';
import { useThemeStore } from '@/store/theme-store';
import Colors from '@/constants/colors';
import { Achievement } from '@/types';
import { useUserStore } from '@/store/user-store';
import { useGamificationStore } from '@/store/gamification-store';
import { useJourneyStore } from '@/store/journey-store';

export default function GoalsScreen() {
  const { user } = useUserStore();
  const { isDarkMode } = useThemeStore();
  const { achievements, unlockAchievement } = useGamificationStore();
  const { goals, addGoal, updateGoal, deleteGoal, updateGoalProgress, fetchJourneyStages } = useJourneyStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'weight' | 'nutrition' | 'activity' | 'medication' | 'other'>('weight');
  const [targetDate, setTargetDate] = useState('');
  
  // Achievement animation
  const [achievementModalVisible, setAchievementModalVisible] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const confettiAnimation = new Animated.Value(0);
  
  const categories = [
    { value: 'weight', label: 'Weight' },
    { value: 'nutrition', label: 'Nutrition' },
    { value: 'activity', label: 'Activity' },
    { value: 'medication', label: 'Medication' },
    { value: 'other', label: 'Other' },
  ];

  // Fetch goals from backend (now from store)
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchJourneyStages(user.id);
    setLoading(false);
  }, [user?.id]);

  const handleAddGoal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setCategory('weight');
    setTargetDate('');
    setModalVisible(true);
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category);
    setTargetDate(goal.targetDate || '');
    setModalVisible(true);
  };

  const handleSaveGoal = async () => {
    if (!title.trim() || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          title,
          description,
          category,
          targetDate: targetDate || undefined,
        });
      } else {
        await addGoal({
          title,
          description,
          category,
          targetDate: targetDate || undefined,
          isCompleted: false,
          progress: 0,
        });
      }
      setModalVisible(false);
    } catch {
      setError('Failed to save goal.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (id: string, progress: number) => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      await updateGoalProgress(id, progress);
    } catch {
      setError('Failed to update progress.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = (id: string, isCompleted: boolean) => {
    if (isCompleted) {
      handleUpdateProgress(id, 0);
    } else {
      handleUpdateProgress(id, 100);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      await deleteGoal(id);
    } catch {
      setError('Failed to delete goal.');
    } finally {
      setLoading(false);
    }
  };
  
  const checkAndUnlockAchievement = (achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.isUnlocked) {
      unlockAchievement(achievementId);
      setUnlockedAchievement(achievement);
      setAchievementModalVisible(true);
      
      // Animate confetti
      Animated.timing(confettiAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        confettiAnimation.setValue(0);
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'weight':
        return themeColors.primary;
      case 'nutrition':
        return themeColors.fruits;
      case 'activity':
        return themeColors.steps;
      case 'medication':
        return themeColors.secondary;
      default:
        return themeColors.accent;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Goals</Text>
        <TouchableOpacity 
          onPress={handleAddGoal} 
          style={[styles.addButton, { backgroundColor: themeColors.primary }]}
        >
          <Plus size={24} color={themeColors.card} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading...</Text>
        ) : error ? (
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        ) : goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No goals yet</Text>
            <Text style={[styles.emptySubtext, { color: themeColors.textTertiary }]}>Tap the + button to add your first goal</Text>
          </View>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id} style={[styles.goalCard, { backgroundColor: themeColors.card }]}>
              <View style={styles.goalHeader}>
                <View style={styles.goalTitleContainer}>
                  <View 
                    style={[
                      styles.categoryIndicator, 
                      { backgroundColor: getCategoryColor(goal.category) }
                    ]} 
                  />
                  <Text style={[styles.goalTitle, { color: themeColors.text }]}>{goal.title}</Text>
                </View>
                <View style={styles.goalActions}>
                  <TouchableOpacity 
                    onPress={() => handleToggleComplete(goal.id, goal.isCompleted)}
                    style={[
                      styles.actionButton,
                      goal.isCompleted ? [styles.completeButton, { backgroundColor: themeColors.success }] : [styles.incompleteButton, { borderColor: themeColors.success }]
                    ]}
                  >
                    {goal.isCompleted ? (
                      <Check size={16} color={themeColors.card} />
                    ) : (
                      <Check size={16} color={themeColors.success} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleEditGoal(goal)}
                    style={[styles.actionButton, { borderColor: themeColors.primary }]}
                  >
                    <Edit size={16} color={themeColors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteGoal(goal.id)}
                    style={[styles.actionButton, { borderColor: themeColors.error }]}
                  >
                    <Trash2 size={16} color={themeColors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {goal.description ? (
                <Text style={[styles.goalDescription, { color: themeColors.textSecondary }]}>{goal.description}</Text>
              ) : null}
              
              {goal.targetDate ? (
                <Text style={[styles.goalDate, { color: themeColors.textTertiary }]}>Target: {goal.targetDate}</Text>
              ) : null}
              
              <View style={styles.progressContainer}>
                <ProgressBar 
                  progress={goal.progress} 
                  color={getCategoryColor(goal.category)}
                  backgroundColor={themeColors.border}
                />
                <Text style={[styles.progressText, { color: themeColors.textSecondary }]}>{goal.progress}%</Text>
              </View>
              
              {!goal.isCompleted && (
                <View style={styles.progressButtons}>
                  <Button 
                    title="25%" 
                    onPress={() => handleUpdateProgress(goal.id, 25)}
                    variant="outline"
                    size="small"
                    style={styles.progressButton}
                  />
                  <Button 
                    title="50%" 
                    onPress={() => handleUpdateProgress(goal.id, 50)}
                    variant="outline"
                    size="small"
                    style={styles.progressButton}
                  />
                  <Button 
                    title="75%" 
                    onPress={() => handleUpdateProgress(goal.id, 75)}
                    variant="outline"
                    size="small"
                    style={styles.progressButton}
                  />
                  <Button 
                    title="100%" 
                    onPress={() => handleUpdateProgress(goal.id, 100)}
                    variant="outline"
                    size="small"
                    style={styles.progressButton}
                  />
                </View>
              )}
              
              {goal.isCompleted && (
                <View style={styles.completedBadge}>
                  <Award size={16} color={themeColors.success} />
                  <Text style={[styles.completedText, { color: themeColors.success }]}>Completed</Text>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {editingGoal ? 'Edit Goal' : 'New Goal'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter goal title"
              placeholderTextColor={themeColors.textTertiary}
            />
            
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter goal description"
              placeholderTextColor={themeColors.textTertiary}
              multiline
              numberOfLines={3}
            />
            
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    category === cat.value && [styles.categoryButtonActive, { backgroundColor: getCategoryColor(cat.value) }],
                    { borderColor: getCategoryColor(cat.value) }
                  ]}
                  onPress={() => setCategory(cat.value as any)}
                >
                  <Text 
                    style={[
                      styles.categoryButtonText,
                      category === cat.value && styles.categoryButtonTextActive,
                      { color: category === cat.value ? themeColors.card : getCategoryColor(cat.value) }
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Target Date (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.text }]}
              value={targetDate}
              onChangeText={setTargetDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={themeColors.textTertiary}
            />
            
            <Button
              title="Save Goal"
              onPress={handleSaveGoal}
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
      
      {/* Achievement unlocked modal */}
      <AchievementUnlockedModal
        achievement={unlockedAchievement}
        visible={achievementModalVisible}
        onClose={() => setAchievementModalVisible(false)}
      />
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  goalCard: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  completeButton: {
    borderWidth: 0,
  },
  incompleteButton: {
    backgroundColor: 'transparent',
  },
  goalDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  goalDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
    marginLeft: 8,
    width: 40,
  },
  progressButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    borderWidth: 0,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: Colors.card,
  },
  saveButton: {
    marginTop: 8,
  },
});