import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, CheckCircle } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Button from '@/components/Button';
import colors from '@/constants/colors';
import { Task, TaskType, Priority, ReminderTime, Class } from '@/types';
import { formatTime12H } from '@/utils/timeUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IOS_PERSISTENT_BANNER_KEY = '@ios_persistent_banner_confirmed';

interface AddEditTaskModalProps {
  visible: boolean;
  isEditing: boolean;
  isTablet: boolean;
  scaleAnim: Animated.Value;

  // Form state
  description: string;
  taskType: TaskType;
  selectedClass: string;
  dueDate: Date;
  dueTime: Date;
  priority: Priority;
  reminder: ReminderTime;
  customReminderDate: Date;
  alarmEnabled: boolean;
  repeat: string;

  // Date picker visibility
  showDatePicker: boolean;
  showTimePicker: boolean;
  showCustomReminderPicker: boolean;

  // Data
  classes: Class[];
  taskTypes: TaskType[];
  priorities: Priority[];
  reminders: ReminderTime[];
  reminderLabel: Record<ReminderTime, string>;

  // Handlers
  onClose: () => void;
  onSubmit: () => void;
  onNavigateToClasses: () => void;
  onChangeDescription: (value: string) => void;
  onChangeTaskType: (value: TaskType) => void;
  onChangeSelectedClass: (value: string) => void;
  onChangeDueDate: (date: Date) => void;
  onChangeDueTime: (time: Date) => void;
  onChangePriority: (value: Priority) => void;
  onChangeReminder: (value: ReminderTime) => void;
  onChangeCustomReminderDate: (date: Date) => void;
  onChangeAlarmEnabled: (value: boolean) => void;
  onChangeRepeat: (value: string) => void;
  onSetShowDatePicker: (value: boolean) => void;
  onSetShowTimePicker: (value: boolean) => void;
  onSetShowCustomReminderPicker: (value: boolean) => void;
  onShowPersistentBanner: () => void;
}

export default function AddEditTaskModal({
  visible,
  isEditing,
  isTablet,
  scaleAnim,
  description,
  taskType,
  selectedClass,
  dueDate,
  dueTime,
  priority,
  reminder,
  customReminderDate,
  alarmEnabled,
  repeat,
  showDatePicker,
  showTimePicker,
  showCustomReminderPicker,
  classes,
  taskTypes,
  priorities,
  reminders,
  reminderLabel,
  onClose,
  onSubmit,
  onNavigateToClasses,
  onChangeDescription,
  onChangeTaskType,
  onChangeSelectedClass,
  onChangeDueDate,
  onChangeDueTime,
  onChangePriority,
  onChangeReminder,
  onChangeCustomReminderDate,
  onChangeAlarmEnabled,
  onChangeRepeat,
  onSetShowDatePicker,
  onSetShowTimePicker,
  onSetShowCustomReminderPicker,
  onShowPersistentBanner,
}: AddEditTaskModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeAreaModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={onClose}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <Animated.View
                style={[
                  styles.modalContent,
                  { transform: [{ scale: scaleAnim }] },
                  isTablet && styles.modalContentTablet,
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{isEditing ? 'Edit Task' : 'Create Task'}</Text>
                  <TouchableOpacity onPress={onClose}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.label}>Description *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter task description"
                    placeholderTextColor={colors.textLight}
                    value={description}
                    onChangeText={onChangeDescription}
                  />

                  <Text style={styles.label}>Type *</Text>
                  <View style={styles.optionGrid}>
                    {taskTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.optionChip,
                          taskType === type && { backgroundColor: colors.taskColors[type] },
                        ]}
                        onPress={() => onChangeTaskType(type)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            taskType === type && { color: colors.surface },
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Class</Text>
                  <TouchableOpacity onPress={onNavigateToClasses} style={styles.helperNote}>
                    <Text style={styles.helperNoteText}>
                      Don't see your class? Click{' '}
                      <Text style={styles.helperNoteLink}>HERE</Text>
                      {' '}to create a class.
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.optionGrid}>
                    <TouchableOpacity
                      style={[
                        styles.optionChip,
                        !selectedClass && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => onChangeSelectedClass('')}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          !selectedClass && { color: colors.surface },
                        ]}
                      >
                        None
                      </Text>
                    </TouchableOpacity>
                    {classes.map((cls) => (
                      <TouchableOpacity
                        key={cls.id}
                        style={[
                          styles.optionChip,
                          selectedClass === cls.name && { backgroundColor: cls.color },
                        ]}
                        onPress={() => onChangeSelectedClass(cls.name)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            selectedClass === cls.name && { color: colors.surface },
                          ]}
                        >
                          {cls.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Due Date *</Text>
                  <TouchableOpacity style={styles.input} onPress={() => onSetShowDatePicker(true)}>
                    <Text style={styles.inputText}>
                      {dueDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showDatePicker}
                    mode="date"
                    date={dueDate}
                    onConfirm={(date) => {
                      onSetShowDatePicker(false);
                      const normalized = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                        12,
                        0,
                        0,
                      );
                      onChangeDueDate(normalized);
                    }}
                    onCancel={() => onSetShowDatePicker(false)}
                  />

                  <Text style={styles.label}>Due Time</Text>
                  <TouchableOpacity style={styles.input} onPress={() => onSetShowTimePicker(true)}>
                    <Text style={styles.inputText}>{formatTime12H(dueTime)}</Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showTimePicker}
                    mode="time"
                    date={dueTime}
                    onConfirm={(time) => {
                      onSetShowTimePicker(false);
                      onChangeDueTime(time);
                    }}
                    onCancel={() => onSetShowTimePicker(false)}
                  />

                  <Text style={styles.label}>Priority</Text>
                  <View style={styles.optionGrid}>
                    {priorities.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.optionChip,
                          priority === p && { backgroundColor: colors.priorityColors[p] },
                        ]}
                        onPress={() => onChangePriority(p)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            priority === p && { color: colors.surface },
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Reminder</Text>
                  <View style={styles.optionGrid}>
                    {reminders.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.optionChip,
                          reminder === r && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => {
                          onChangeReminder(r);
                          if (r === 'custom') {
                            const minDate = new Date();
                            minDate.setMinutes(minDate.getMinutes() + 1);
                            onChangeCustomReminderDate(minDate);
                            onSetShowCustomReminderPicker(true);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            reminder === r && { color: colors.surface },
                          ]}
                        >
                          {reminderLabel[r]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {reminder === 'custom' && (
                    <TouchableOpacity
                      style={[styles.input, { marginTop: 8 }]}
                      onPress={() => onSetShowCustomReminderPicker(true)}
                    >
                      <Text style={styles.inputText}>
                        {customReminderDate.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <DateTimePickerModal
                    isVisible={showCustomReminderPicker}
                    mode="datetime"
                    date={customReminderDate}
                    minimumDate={new Date()}
                    onConfirm={(date) => {
                      if (date > new Date()) {
                        onSetShowCustomReminderPicker(false);
                        onChangeCustomReminderDate(date);
                      } else {
                        onSetShowCustomReminderPicker(false);
                        Alert.alert(
                          'Invalid Date',
                          'Reminder must be set for a future date and time.',
                          [{ text: 'OK' }],
                        );
                      }
                    }}
                    onCancel={() => onSetShowCustomReminderPicker(false)}
                  />

                  <Text style={styles.label}>Repeat</Text>
                  <View style={styles.optionGrid}>
                    {['none', 'daily'].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.optionChip,
                          repeat === r && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => onChangeRepeat(r)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            repeat === r && { color: colors.surface },
                          ]}
                        >
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.checkboxRow, alarmEnabled && styles.checkboxRowActive]}
                    onPress={async () => {
                      const next = !alarmEnabled;
                      onChangeAlarmEnabled(next);
                      if (next && Platform.OS === 'ios') {
                        const confirmed = await AsyncStorage.getItem(IOS_PERSISTENT_BANNER_KEY);
                        if (!confirmed) onShowPersistentBanner();
                      }
                    }}
                  >
                    <View style={[styles.checkbox, alarmEnabled && styles.checkboxChecked]}>
                      {alarmEnabled && <CheckCircle size={20} color={colors.surface} />}
                    </View>
                    <Text style={styles.checkboxLabel}>Enable alarm sound</Text>
                  </TouchableOpacity>

                  <Button
                    title={isEditing ? 'Update Task' : 'Create Task'}
                    onPress={onSubmit}
                    disabled={!description}
                    style={styles.createButton}
                  />
                </ScrollView>
              </Animated.View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeAreaModal: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '90%',
  },
  modalContentTablet: {
    width: 600,
    maxWidth: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputText: {
    fontSize: 16,
    color: colors.text,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    textTransform: 'capitalize',
  },
  helperNote: {
    marginBottom: 8,
    paddingVertical: 6,
  },
  helperNoteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  helperNoteLink: {
    color: colors.primary,
    fontWeight: '600' as const,
    textDecorationLine: 'underline',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  checkboxRowActive: {
    opacity: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
});
