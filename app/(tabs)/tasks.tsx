import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
  FlatList,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Task, TaskType, Priority, ReminderTime } from '@/types';
import Mascot from '@/components/Mascot';
import SearchBar from '@/components/SearchBar';
import * as Analytics from '@/utils/analytics';
import { useResponsive } from '@/utils/responsive';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  formatLocalDate,
  formatStringTime12H,
  parseTime12H,
  parseLocalDate,
  formatLocalDateTime,
} from '@/utils/timeUtils';

import TaskCard from '@/components/tasks/TaskCard';
import AddEditTaskModal from '@/components/tasks/AddEditTaskModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import TaskActionSheet from '@/components/tasks/TaskActionSheet';

const IOS_PERSISTENT_BANNER_KEY = '@ios_persistent_banner_confirmed';

export default function TasksScreen() {
  const { sortedTasks, addTask, updateTask, deleteTask, classes, refreshTasks } = useApp();
  const router = useRouter();
  const { isTablet } = useResponsive();

  // Modal visibility
  const [showModal, setShowModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Selected task state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Add/edit form state
  const [repeat, setRepeat] = useState<string>('none');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('task');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');
  const [reminder, setReminder] = useState<ReminderTime>('1d');
  const [customReminderDate, setCustomReminderDate] = useState(new Date());
  const [showCustomReminderPicker, setShowCustomReminderPicker] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [showPersistentBanner, setShowPersistentBanner] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'missed' | TaskType>('all');

  // Animation refs
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const detailScaleAnim = React.useRef(new Animated.Value(0)).current;

  // iOS persistent banner check
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const check = async () => {
      const confirmed = await AsyncStorage.getItem(IOS_PERSISTENT_BANNER_KEY);
      if (confirmed) return;
      const hasAlarmTask = sortedTasks.some((t) => t.alarmEnabled && !t.completed);
      setShowPersistentBanner(hasAlarmTask);
    };
    check();
  }, [sortedTasks]);

  // Add/edit modal open animation
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

  // Detail modal open animation
  React.useEffect(() => {
    if (showDetailModal) {
      Animated.spring(detailScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      detailScaleAnim.setValue(0);
    }
  }, [showDetailModal, detailScaleAnim]);

  // Static option lists
  const taskTypes: TaskType[] = ['task', 'event', 'exam', 'paper', 'appointment', 'homework', 'work', 'internship', 'daily habit'];
  const priorities: Priority[] = ['low', 'medium', 'high'];
  const reminders: ReminderTime[] = ['none', '1h', '2h', '1d', '2d', 'custom'];
  const reminderLabel: Record<ReminderTime, string> = {
    none: 'None',
    '1h': '1h',
    '2h': '2h',
    '1d': '1d',
    '2d': '2d',
    custom: 'Custom',
  };

  // Helper: check if a task is past due without completion
  const isTaskMissed = (task: Task) => {
    if (task.completed) return false;
    const [year, month, day] = task.dueDate.split('-').map(Number);
    const due = new Date(year, month - 1, day);
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      due.setHours(hours, minutes, 0, 0);
    } else {
      due.setHours(23, 59, 59, 999);
    }
    const gracePeriod = new Date(due.getTime() + 10 * 60000);
    return new Date() > gracePeriod;
  };

  // Helper: human-readable days until due
  const getDaysUntil = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < 0) return `${Math.abs(diff)} days ago`;
    return `In ${diff} days`;
  };

  // Helper: formatted date string
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filtered and sorted task list
  const filteredTasks = React.useMemo(() => {
    const filtered = sortedTasks.filter((task) => {
      const matchesSearch = task.description.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesFilter = true;
      if (activeFilter === 'active') {
        matchesFilter = !task.completed && !isTaskMissed(task);
      } else if (activeFilter === 'completed') {
        matchesFilter = task.completed;
      } else if (activeFilter === 'missed') {
        matchesFilter = isTaskMissed(task);
      } else if (activeFilter !== 'all') {
        matchesFilter = task.type === activeFilter;
      }
      return matchesSearch && matchesFilter;
    });

    if (activeFilter === 'all') {
      return filtered.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [sortedTasks, searchQuery, activeFilter]);

  // Reset add/edit form to defaults
  const resetForm = () => {
    setDescription('');
    setTaskType('task');
    setSelectedClass('');
    setDueDate(new Date());
    setDueTime(new Date());
    setPriority('medium');
    setReminder('none');
    setCustomReminderDate(new Date());
    setAlarmEnabled(false);
    setRepeat('none');
  };

  // Submit add or edit
  const handleAddTask = () => {
    if (!description) return;
    const formattedDate = formatLocalDate(dueDate);
    const formattedTime = dueTime.toTimeString().split(' ')[0].substring(0, 5);

    if (isEditing && selectedTask) {
      updateTask(selectedTask.id, {
        description,
        type: taskType,
        className: selectedClass,
        dueDate: formattedDate,
        dueTime: formattedTime,
        repeat,
        priority,
        reminder,
        customReminderDate: reminder === 'custom' ? formatLocalDateTime(customReminderDate) : undefined,
        alarmEnabled,
        completed: false,
      });
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        description,
        type: taskType,
        className: selectedClass,
        dueDate: formattedDate,
        dueTime: formattedTime,
        repeat,
        priority,
        reminder,
        customReminderDate: reminder === 'custom' ? formatLocalDateTime(customReminderDate) : undefined,
        alarmEnabled,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      addTask(newTask);
      Analytics.logCustomEvent('task_created', {
        type: taskType,
        priority,
        has_class: !!selectedClass,
        reminder_set: alarmEnabled,
      });
    }

    resetForm();
    setShowModal(false);
    setIsEditing(false);
    setSelectedTask(null);
  };

  // Toggle task complete/incomplete
  const toggleTaskComplete = async (task: Task) => {
    updateTask(task.id, { completed: !task.completed });
    if (!task.completed) {
      Analytics.logCustomEvent('task_completed', {
        type: task.type,
        priority: task.priority,
        days_to_due: Math.ceil(
          (parseLocalDate(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24),
        ),
      });
    }
  };

  // Long-press opens action sheet
  const handleLongPress = (task: Task) => {
    setSelectedTask(task);
    setShowActionSheet(true);
  };

  // Open edit modal for a given task
  const handleEdit = (taskToEdit: Task | null = selectedTask) => {
    if (!taskToEdit) return;
    setDescription(taskToEdit.description);
    setTaskType(taskToEdit.type);
    setSelectedClass(taskToEdit.className || '');
    setDueDate(parseLocalDate(taskToEdit.dueDate));
    setDueTime(taskToEdit.dueTime ? parseTime12H(formatStringTime12H(taskToEdit.dueTime)) : new Date());
    setPriority(taskToEdit.priority);
    setReminder(taskToEdit.reminder || 'none');
    if (taskToEdit.customReminderDate) {
      const isUTC = /Z|[+-]\d{2}:?\d{2}$/.test(taskToEdit.customReminderDate);
      const dtMatch = taskToEdit.customReminderDate.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (isUTC) {
        setCustomReminderDate(new Date(taskToEdit.customReminderDate));
      } else if (dtMatch) {
        const [, y, mo, d, h, min] = dtMatch.map(Number);
        setCustomReminderDate(new Date(y, mo - 1, d, h, min, 0, 0));
      }
    }
    setAlarmEnabled(taskToEdit.alarmEnabled);
    setRepeat(taskToEdit.repeat || 'none');
    setIsEditing(true);
    setShowActionSheet(false);
    setShowModal(true);
  };

  // Delete from action sheet
  const handleDelete = () => {
    if (!selectedTask) return;
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(selectedTask.id);
          await refreshTasks();
          setShowActionSheet(false);
          setSelectedTask(null);
        },
      },
    ]);
  };

  // Tap opens detail modal
  const handleTaskPress = (task: Task) => {
    setSelectedTaskForDetail(task);
    setShowDetailModal(true);
  };

  // Edit triggered from detail modal
  const handleEditFromDetail = () => {
    if (!selectedTaskForDetail) return;
    setSelectedTask(selectedTaskForDetail);
    setShowDetailModal(false);
    handleEdit(selectedTaskForDetail);
  };

  // Delete triggered from detail modal
  const handleDeleteFromDetail = () => {
    if (!selectedTaskForDetail) return;
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTask(selectedTaskForDetail.id);
          setShowDetailModal(false);
          setSelectedTaskForDetail(null);
        },
      },
    ]);
  };

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTasks();
    setRefreshing(false);
  };

  // Close add/edit modal and clean up
  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedTask(null);
    resetForm();
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ResponsiveContainer>
        <FlatList
          key={isTablet ? 'tablet' : 'mobile'}
          numColumns={isTablet ? 2 : 1}
          columnWrapperStyle={isTablet ? styles.columnWrapper : null}
          data={filteredTasks}
          renderItem={({ item: task }) => (
            <TaskCard
              task={task}
              onPress={handleTaskPress}
              onLongPress={handleLongPress}
              onToggleComplete={toggleTaskComplete}
              isTaskMissed={isTaskMissed}
              getDaysUntil={getDaysUntil}
              formatDate={formatDate}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.taskListContent,
            isTablet && { paddingHorizontal: 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>My Tasks 📋</Text>
                  <Text style={styles.subtitle}>
                    You have {filteredTasks.filter((t) => !t.completed).length} tasks pending
                  </Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
                  <Plus size={24} color={colors.surface} />
                </TouchableOpacity>
              </View>

              {showPersistentBanner && (
                <View style={styles.persistentBanner}>
                  <View style={styles.persistentBannerTop}>
                    <Text style={styles.persistentBannerIcon}>🔔</Text>
                    <View style={styles.persistentBannerTextBlock}>
                      <Text style={styles.persistentBannerTitle}>Action needed for alarms</Text>
                      <Text style={styles.persistentBannerBody}>
                        To keep alarm banners on screen, go to{' '}
                        <Text style={styles.persistentBannerBold}>
                          Settings → Notifications → Cause Planner → Banner Style
                        </Text>
                        {' '}and select{' '}
                        <Text style={styles.persistentBannerBold}>Persistent</Text>.
                      </Text>
                    </View>
                  </View>
                  <View style={styles.persistentBannerActions}>
                    <TouchableOpacity
                      style={styles.persistentBannerPrimaryBtn}
                      onPress={() => Linking.openSettings()}
                    >
                      <Text style={styles.persistentBannerPrimaryBtnText}>Open Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.persistentBannerSecondaryBtn}
                      onPress={async () => {
                        await AsyncStorage.setItem(IOS_PERSISTENT_BANNER_KEY, 'true');
                        setShowPersistentBanner(false);
                      }}
                    >
                      <Text style={styles.persistentBannerSecondaryBtnText}>Done, I've set it ✓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.searchContainer}>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search tasks..."
                />
              </View>

              <View style={styles.filtersContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filtersScroll}
                >
                  {['all', 'active', 'missed', 'completed'].map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                      onPress={() => setActiveFilter(f as typeof activeFilter)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          activeFilter === f && styles.filterChipTextActive,
                        ]}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <View style={styles.filterDivider} />
                  {taskTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.filterChip, activeFilter === type && styles.filterChipActive]}
                      onPress={() => setActiveFilter(type)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          activeFilter === type && styles.filterChipTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Mascot size={80} />
              <Text style={styles.emptyText}>
                {searchQuery || activeFilter !== 'all'
                  ? 'No tasks match your filters'
                  : 'No tasks yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || activeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Tap the + button to create your first task'}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </ResponsiveContainer>

      <AddEditTaskModal
        visible={showModal}
        isEditing={isEditing}
        isTablet={isTablet}
        scaleAnim={scaleAnim}
        description={description}
        taskType={taskType}
        selectedClass={selectedClass}
        dueDate={dueDate}
        dueTime={dueTime}
        priority={priority}
        reminder={reminder}
        customReminderDate={customReminderDate}
        alarmEnabled={alarmEnabled}
        repeat={repeat}
        showDatePicker={showDatePicker}
        showTimePicker={showTimePicker}
        showCustomReminderPicker={showCustomReminderPicker}
        classes={classes}
        taskTypes={taskTypes}
        priorities={priorities}
        reminders={reminders}
        reminderLabel={reminderLabel}
        onClose={handleCloseModal}
        onSubmit={handleAddTask}
        onNavigateToClasses={() => {
          setShowModal(false);
          router.push('/(tabs)/classes');
        }}
        onChangeDescription={setDescription}
        onChangeTaskType={setTaskType}
        onChangeSelectedClass={setSelectedClass}
        onChangeDueDate={setDueDate}
        onChangeDueTime={setDueTime}
        onChangePriority={setPriority}
        onChangeReminder={setReminder}
        onChangeCustomReminderDate={setCustomReminderDate}
        onChangeAlarmEnabled={setAlarmEnabled}
        onChangeRepeat={setRepeat}
        onSetShowDatePicker={setShowDatePicker}
        onSetShowTimePicker={setShowTimePicker}
        onSetShowCustomReminderPicker={setShowCustomReminderPicker}
        onShowPersistentBanner={() => setShowPersistentBanner(true)}
      />

      <TaskDetailModal
        visible={showDetailModal}
        task={selectedTaskForDetail}
        detailScaleAnim={detailScaleAnim}
        formatDate={formatDate}
        onClose={() => setShowDetailModal(false)}
        onToggleComplete={toggleTaskComplete}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />

      <TaskActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onEdit={() => handleEdit()}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 4,
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
    alignSelf: 'flex-end',
  },
  taskListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
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
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
  searchContainer: {
    paddingBottom: 12,
  },
  filtersContainer: {
    paddingBottom: 12,
  },
  filtersScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  // ── iOS persistent banner ──────────────────────────────────────────────────
  persistentBanner: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  persistentBannerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  persistentBannerIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
  persistentBannerTextBlock: {
    flex: 1,
  },
  persistentBannerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#92400E',
    marginBottom: 4,
  },
  persistentBannerBody: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 19,
  },
  persistentBannerBold: {
    fontWeight: '700' as const,
  },
  persistentBannerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  persistentBannerPrimaryBtn: {
    flex: 1,
    backgroundColor: '#EA580C',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  persistentBannerPrimaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  persistentBannerSecondaryBtn: {
    flex: 1,
    backgroundColor: '#FED7AA',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  persistentBannerSecondaryBtnText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700' as const,
  },
});
