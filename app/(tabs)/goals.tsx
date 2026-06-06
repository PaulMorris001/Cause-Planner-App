import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Target, Trash2, Edit2 } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Goal } from '@/types';
import { cancelNotification, scheduleGoalNotification, scheduleHabitReminder } from '@/utils/notificationService';
import { formatStringTime12H, parseTime12H, formatLocalDate, parseLocalDate } from '@/utils/timeUtils';
import UpgradeModal from '@/components/UpgradeModal';
import * as Analytics from '@/utils/analytics';
import { useResponsive } from '@/utils/responsive';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import GoalCard from '@/components/goals/GoalCard';
import AddEditGoalModal from '@/components/goals/AddEditGoalModal';

export default function GoalsScreen() {
  const { goals, addGoal, updateGoal, deleteGoal, refreshGoals } = useApp();
  const { user, checkPermission } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [purpose, setPurpose] = useState<any>(null);
  const [purposeLoading, setPurposeLoading] = useState(true);

  // Edit/Delete state
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [habits, setHabits] = useState<{
    title: string;
    completed: boolean;
    reminderEnabled?: boolean;
    reminderTime?: string;
    notificationId?: string;
  }[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [newHabitTime, setNewHabitTime] = useState<Date | null>(null);
  const [showHabitTimePicker, setShowHabitTimePicker] = useState(false);

  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const { isTablet, normalize } = useResponsive();

  // ─── Access guard ───────────────────────────────────────────────────────────
  const checkAccess = () => {
    if (checkPermission && !checkPermission('canAccessGoals')) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  // ─── Purpose statement ──────────────────────────────────────────────────────
  const fetchPurpose = async () => {
    if (!user?.uid) {
      setPurposeLoading(false);
      return;
    }
    try {
      const apiService = (await import('@/utils/apiService')).default;
      const response = await apiService.get(`/api/users/${user.uid}/purpose`);
      if (response.success) {
        setPurpose(response.purpose ?? null);
      } else {
        setPurpose(null);
      }
    } catch (error) {
      console.error('[Goals] Error fetching purpose:', error);
      setPurpose(null);
    } finally {
      setPurposeLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshGoals();
      fetchPurpose();
    }, [user?.uid])
  );

  // Animate modal open/close
  React.useEffect(() => {
    if (showModal) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [showModal, scaleAnim]);

  // ─── Form helpers ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(new Date());
    setDueTime(new Date());
    setHabits([]);
    setNewHabit('');
    setNewHabitTime(null);
  };

  const addHabitToState = () => {
    const habitTitle = newHabit.trim();
    if (!habitTitle) return;

    let reminderTimeStr: string | undefined;
    if (newHabitTime instanceof Date && !isNaN(newHabitTime.getTime())) {
      const h = String(newHabitTime.getHours()).padStart(2, '0');
      const m = String(newHabitTime.getMinutes()).padStart(2, '0');
      reminderTimeStr = `${h}:${m}`;
    }

    setHabits([...habits, {
      title: habitTitle,
      completed: false,
      reminderEnabled: !!reminderTimeStr,
      reminderTime: reminderTimeStr,
    }]);
    setNewHabit('');
    setNewHabitTime(null);
  };

  const removeHabitFromState = (index: number) => {
    setHabits(habits.filter((_, i) => i !== index));
  };

  // ─── Goal CRUD ───────────────────────────────────────────────────────────────
  const handleAddGoal = async () => {
    if (!checkAccess()) return;
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for your goal.');
      return;
    }
    if (!dueDate) {
      Alert.alert('Required Field', 'Please select a due date.');
      return;
    }

    const formattedDate = formatLocalDate(dueDate);
    const formattedTime = dueTime.toTimeString().split(' ')[0].substring(0, 5);

    // Schedule habit notifications
    const processedHabits = await Promise.all(habits.map(async (habit) => {
      if (habit.reminderEnabled && habit.reminderTime) {
        if (habit.notificationId) {
          await cancelNotification(habit.notificationId);
        }
        const notifId = await scheduleHabitReminder(title, habit.title, habit.reminderTime);
        return { ...habit, notificationId: notifId || undefined };
      } else if (!habit.reminderEnabled && habit.notificationId) {
        await cancelNotification(habit.notificationId);
        return { ...habit, notificationId: undefined };
      }
      return habit;
    }));

    if (isEditing && selectedGoal) {
      const updatedGoal: Partial<Goal> = {
        title,
        description,
        dueDate: formattedDate,
        dueTime: formattedTime,
        habits: processedHabits,
      };
      updateGoal(selectedGoal.id, updatedGoal);

      (async () => {
        if (selectedGoal.notificationId) {
          await cancelNotification(selectedGoal.notificationId);
        }
        const notificationId = await scheduleGoalNotification({
          ...selectedGoal,
          ...updatedGoal,
        } as Goal);
        if (notificationId) {
          updateGoal(selectedGoal.id, { notificationId });
        }
      })();
    } else {
      const tempGoal: Goal = {
        id: Date.now().toString(),
        title,
        description,
        dueDate: formattedDate,
        dueTime: formattedTime,
        completed: false,
        createdAt: new Date().toISOString(),
        habits: processedHabits,
      };

      (async () => {
        const notificationId = await scheduleGoalNotification(tempGoal);
        addGoal({ ...tempGoal, notificationId: notificationId || undefined });
      })();

      Analytics.logCustomEvent('goal_created', {
        has_description: !!description,
        habit_count: habits.length,
        has_reminder: true,
      });
    }

    resetForm();
    setShowModal(false);
    setIsEditing(false);
    setSelectedGoal(null);
  };

  const toggleGoalComplete = (goal: Goal) => {
    if (!checkAccess()) return;
    updateGoal(goal.id, { completed: !goal.completed });

    if (!goal.completed) {
      Analytics.logCustomEvent('goal_completed', {
        habit_count: goal.habits?.length || 0,
        days_since_created: Math.ceil(
          (new Date().getTime() - new Date(goal.createdAt).getTime()) / (1000 * 3600 * 24)
        ),
      });
    }
  };

  const toggleHabit = (goal: Goal, habitIndex: number) => {
    if (!checkAccess()) return;
    if (!goal.habits) return;
    const updatedHabits = [...goal.habits];
    updatedHabits[habitIndex] = {
      ...updatedHabits[habitIndex],
      completed: !updatedHabits[habitIndex].completed,
    };
    updateGoal(goal.id, { habits: updatedHabits });
  };

  const calculateProgress = (habits?: { completed: boolean }[]) => {
    if (!habits || habits.length === 0) return 0;
    return (habits.filter(h => h.completed).length / habits.length) * 100;
  };

  const handleLongPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowActionSheet(true);
  };

  const handleEdit = () => {
    if (!checkAccess()) return;
    if (!selectedGoal) return;

    setTitle(selectedGoal.title);
    setDescription(selectedGoal.description || '');
    setDueDate(selectedGoal.dueDate ? parseLocalDate(selectedGoal.dueDate) : new Date());
    setDueTime(
      selectedGoal.dueTime ? parseTime12H(formatStringTime12H(selectedGoal.dueTime)) : new Date()
    );
    setHabits(selectedGoal.habits || []);

    setIsEditing(true);
    setShowActionSheet(false);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!checkAccess()) return;
    if (!selectedGoal) return;

    if (selectedGoal.notificationId) {
      await cancelNotification(selectedGoal.notificationId);
    }
    if (selectedGoal.habits) {
      for (const habit of selectedGoal.habits) {
        if (habit.notificationId) {
          await cancelNotification(habit.notificationId);
        }
      }
    }

    await deleteGoal(selectedGoal.id);
    await refreshGoals();
    setShowActionSheet(false);
    setSelectedGoal(null);
  };

  // Close modal and reset any editing state
  const handleModalClose = () => {
    setShowModal(false);
    if (isEditing) {
      setIsEditing(false);
      setSelectedGoal(null);
      resetForm();
    }
  };

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGoals(), fetchPurpose()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Goals"
        message="Upgrade to the Standard plan to set unlimited goals and track your habits."
      />
      <ResponsiveContainer>
        {/* Header */}
        <View style={[styles.header, isTablet && { paddingHorizontal: 40 }]}>
          <View>
            <Text style={styles.title}>My Goals 🎯</Text>
            <Text style={[styles.subtitle, { fontSize: normalize(14) }]}>Track your personal goals</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (checkAccess()) setShowModal(true);
            }}
          >
            <Plus size={24} color={colors.surface} />
          </TouchableOpacity>
        </View>

        {/* Scrollable list */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Purpose Statement */}
          {purpose && (
            <View style={[styles.purposeSection, isTablet && { paddingHorizontal: 40 }]}>
              <View style={styles.purposeCard}>
                <View style={styles.purposeHeader}>
                  <View style={styles.purposeIconContainer}>
                    <Target size={normalize(24)} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.purposeTitle, { fontSize: normalize(18) }]}>
                      My Purpose Statement
                    </Text>
                    <Text style={[styles.purposeSubtitle, { fontSize: normalize(12) }]}>
                      From your introductory survey
                    </Text>
                  </View>
                </View>
                <View style={styles.purposeContent}>
                  {purpose[1] && (
                    <View style={styles.purposeItem}>
                      <Text style={[styles.purposeLabel, { fontSize: normalize(13) }]}>My Vibe:</Text>
                      <Text style={[styles.purposeText, { fontSize: normalize(15) }]}>{purpose[1].join(', ')}</Text>
                    </View>
                  )}
                  {purpose[2] && (
                    <View style={styles.purposeItem}>
                      <Text style={[styles.purposeLabel, { fontSize: normalize(13) }]}>School Means:</Text>
                      <Text style={[styles.purposeText, { fontSize: normalize(15) }]}>{purpose[2].join(', ')}</Text>
                    </View>
                  )}
                  {purpose[3] && (
                    <View style={styles.purposeItem}>
                      <Text style={[styles.purposeLabel, { fontSize: normalize(13) }]}>Education Matters Because:</Text>
                      <Text style={[styles.purposeText, { fontSize: normalize(15) }]}>{purpose[3].join(', ')}</Text>
                    </View>
                  )}
                  {purpose[4] && (
                    <View style={styles.purposeItem}>
                      <Text style={[styles.purposeLabel, { fontSize: normalize(13) }]}>I Wanna Be:</Text>
                      <Text style={[styles.purposeText, { fontSize: normalize(15) }]}>{purpose[4].join(', ')}</Text>
                    </View>
                  )}
                  {purpose[5] && (
                    <View style={styles.purposeItem}>
                      <Text style={[styles.purposeLabel, { fontSize: normalize(13) }]}>I Stand For:</Text>
                      <Text style={[styles.purposeText, { fontSize: normalize(15) }]}>{purpose[5].join(', ')}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Goals list */}
          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Target size={normalize(64)} color={colors.textLight} />
              <Text style={[styles.emptyText, { fontSize: normalize(20) }]}>No goals yet</Text>
              <Text style={[styles.emptySubtext, { fontSize: normalize(14) }]}>
                Set your first goal and start tracking
              </Text>
            </View>
          ) : (
            <View style={[styles.goalsList, isTablet && { paddingHorizontal: 40 }]}>
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onToggleComplete={toggleGoalComplete}
                  onLongPress={handleLongPress}
                  onToggleHabit={toggleHabit}
                  calculateProgress={calculateProgress}
                  normalize={normalize}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </ResponsiveContainer>

      {/* Add / Edit Goal Modal */}
      <AddEditGoalModal
        visible={showModal}
        isEditing={isEditing}
        scaleAnim={scaleAnim}
        isTablet={isTablet}
        normalize={normalize}
        title={title}
        description={description}
        dueDate={dueDate}
        dueTime={dueTime}
        habits={habits}
        newHabit={newHabit}
        newHabitTime={newHabitTime}
        showDatePicker={showDatePicker}
        showTimePicker={showTimePicker}
        showHabitTimePicker={showHabitTimePicker}
        onChangeTitle={setTitle}
        onChangeDescription={setDescription}
        onChangeDueDate={setDueDate}
        onChangeDueTime={setDueTime}
        onChangeNewHabit={setNewHabit}
        onChangeNewHabitTime={setNewHabitTime}
        onShowDatePicker={() => setShowDatePicker(true)}
        onHideDatePicker={() => setShowDatePicker(false)}
        onShowTimePicker={() => setShowTimePicker(true)}
        onHideTimePicker={() => setShowTimePicker(false)}
        onShowHabitTimePicker={() => setShowHabitTimePicker(true)}
        onHideHabitTimePicker={() => setShowHabitTimePicker(false)}
        onAddHabit={addHabitToState}
        onRemoveHabit={removeHabitFromState}
        onSubmit={handleAddGoal}
        onClose={handleModalClose}
      />

      {/* Action Sheet (Edit / Delete) */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <SafeAreaView style={styles.safeAreaModal}>
          <TouchableOpacity
            style={styles.actionSheetOverlay}
            activeOpacity={1}
            onPress={() => setShowActionSheet(false)}
          >
            <View style={[styles.actionSheetContent, isTablet && { width: 600, alignSelf: 'center' }]}>
              <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                <Edit2 size={normalize(20)} color={colors.primary} />
                <Text style={[styles.actionButtonText, { fontSize: normalize(16) }]}>Edit Goal</Text>
              </TouchableOpacity>
              <View style={styles.actionDivider} />
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Trash2 size={normalize(20)} color="#FF3B30" />
                <Text style={[styles.actionButtonText, { color: '#FF3B30', fontSize: normalize(16) }]}>
                  Delete Goal
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaModal: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
  goalsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  purposeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  purposeCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  purposeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  purposeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purposeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  purposeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  purposeContent: {
    gap: 16,
  },
  purposeItem: {
    gap: 4,
  },
  purposeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  purposeText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    fontWeight: '500',
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  actionDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
