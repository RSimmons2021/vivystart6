import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { 
  Heart, 
  Trash2, 
  Clock, 
  Calendar, 
  Flame, 
  Leaf, 
  Drumstick 
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { useHealthStore } from '@/store/health-store';
import Colors from '@/constants/colors';
import { format, parseISO } from 'date-fns';

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams();
  const { meals, saveMeal, unsaveMeal, deleteMeal, updateMeal } = useHealthStore();
  
  const meal = meals.find(m => m.id === id);

  // Early return if meal is not found
  if (!meal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Meal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValues, setEditValues] = React.useState({
    name: meal.name,
    description: meal.description,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fruitsVeggies: meal.fruitsVeggies,
    imageUri: meal.imageUri,
  });

  const handleEditChange = (field: keyof typeof editValues, value: string | number) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateMeal(meal.id, editValues);
      setIsEditing(false);
    } catch (e) {
      setError('Failed to update meal.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      if (meal.isSaved) {
        await unsaveMeal(meal.id);
      } else {
        await saveMeal(meal.id);
      }
    } catch (e) {
      setError('Failed to update saved state.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteMeal(meal.id);
      // Optionally navigate away or show a success message
    } catch (e) {
      setError('Failed to delete meal.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {meal.imageUri && (
          <Image
            source={{ uri: meal.imageUri }}
            style={styles.mealImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            {isEditing ? (
              <TextInput
                style={styles.mealName}
                value={editValues.name}
                onChangeText={(text) => handleEditChange('name', text)}
                editable={!loading}
              />
            ) : (
              <Text style={styles.mealName}>{meal.name}</Text>
            )}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  meal.isSaved && styles.savedButton
                ]}
                onPress={handleToggleSave}
                disabled={loading}
              >
                <Heart 
                  size={20} 
                  color={meal.isSaved ? Colors.card : Colors.primary} 
                  fill={meal.isSaved ? Colors.primary : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleDelete}
                disabled={loading}
              >
                <Trash2 size={20} color={Colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsEditing((prev) => !prev)}
                disabled={loading}
              >
                <Text style={{ color: Colors.primary }}>{isEditing ? 'Cancel' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {error && (
            <Text style={{ color: Colors.error, textAlign: 'center', marginVertical: 8 }}>{error}</Text>
          )}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Calendar size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {format(parseISO(meal.date), 'MMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{meal.time}</Text>
            </View>
          </View>
          {isEditing ? (
            <Card style={styles.descriptionCard}>
              <TextInput
                style={styles.descriptionText}
                value={editValues.description}
                onChangeText={(text) => handleEditChange('description', text)}
                editable={!loading}
                multiline
              />
            </Card>
          ) : (
            meal.description && (
              <Card style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>{meal.description}</Text>
              </Card>
            )
          )}
          <Text style={styles.sectionTitle}>Nutrition</Text>
          <View style={styles.nutritionGrid}>
            <Card style={styles.nutritionCard}>
              <Flame size={20} color={Colors.primary} />
              {isEditing ? (
                <TextInput
                  style={styles.nutritionValue}
                  value={String(editValues.calories)}
                  onChangeText={(text) => handleEditChange('calories', parseInt(text) || 0)}
                  editable={!loading}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.nutritionValue}>{meal.calories}</Text>
              )}
              <Text style={styles.nutritionLabel}>Calories</Text>
            </Card>
            <Card style={styles.nutritionCard}>
              <Drumstick size={20} color={Colors.protein} />
              {isEditing ? (
                <TextInput
                  style={styles.nutritionValue}
                  value={String(editValues.protein)}
                  onChangeText={(text) => handleEditChange('protein', parseInt(text) || 0)}
                  editable={!loading}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.nutritionValue}>{meal.protein}g</Text>
              )}
              <Text style={styles.nutritionLabel}>Protein</Text>
            </Card>
            <Card style={styles.nutritionCard}>
              <View style={styles.carbsIcon}>
                <Text style={styles.carbsIconText}>C</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionValue}
                  value={String(editValues.carbs)}
                  onChangeText={(text) => handleEditChange('carbs', parseInt(text) || 0)}
                  editable={!loading}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.nutritionValue}>{meal.carbs}g</Text>
              )}
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </Card>
            <Card style={styles.nutritionCard}>
              <View style={styles.fatIcon}>
                <Text style={styles.fatIconText}>F</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionValue}
                  value={String(editValues.fat)}
                  onChangeText={(text) => handleEditChange('fat', parseInt(text) || 0)}
                  editable={!loading}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.nutritionValue}>{meal.fat}g</Text>
              )}
              <Text style={styles.nutritionLabel}>Fat</Text>
            </Card>
            <Card style={styles.nutritionCard}>
              <Leaf size={20} color={Colors.fruits} />
              {isEditing ? (
                <TextInput
                  style={styles.nutritionValue}
                  value={String(editValues.fruitsVeggies)}
                  onChangeText={(text) => handleEditChange('fruitsVeggies', parseInt(text) || 0)}
                  editable={!loading}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.nutritionValue}>{meal.fruitsVeggies}</Text>
              )}
              <Text style={styles.nutritionLabel}>Servings</Text>
            </Card>
          </View>
          {isEditing && (
            <TouchableOpacity
              style={[styles.saveButton, loading && { opacity: 0.5 }]}
              onPress={handleSaveEdit}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  mealImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  savedButton: {
    backgroundColor: Colors.primary,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  descriptionCard: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  nutritionCard: {
    width: '30%',
    margin: 6,
    alignItems: 'center',
    paddingVertical: 16,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  carbsIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carbsIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.card,
  },
  fatIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fatIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.card,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  saveButtonText: {
    fontSize: 16,
    color: Colors.card,
  },
});