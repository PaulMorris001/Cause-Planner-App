import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Animated,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Plus, X, Bell, BellOff } from 'lucide-react-native';
import Button from '@/components/Button';
import colors from '@/constants/colors';
import { formatTime12H, formatStringTime12H } from '@/utils/timeUtils';

interface HabitDraft {
  title: string;
  completed: boolean;
  reminderEnabled?: boolean;
  reminderTime?: string;
  notificationId?: string;
}

interface AddEditGoalModalProps {
  visible: boolean;
  isEditing: boolean;
  scaleAnim: Animated.Value;
  isTablet: boolean;
  normalize: (size: number) => number;

  // Form field values
  title: string;
  description: string;
  dueDate: Date;
  dueTime: Date;
  habits: HabitDraft[];
  newHabit: string;
  newHabitTime: Date | null;

  // Date/time picker visibility
  showDatePicker: boolean;
  showTimePicker: boolean;
  showHabitTimePicker: boolean;

  // Setters for form fields
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeDueDate: (date: Date) => void;
  onChangeDueTime: (time: Date) => void;
  onChangeNewHabit: (value: string) => void;
  onChangeNewHabitTime: (time: Date | null) => void;

  // Picker visibility toggles
  onShowDatePicker: () => void;
  onHideDatePicker: () => void;
  onShowTimePicker: () => void;
  onHideTimePicker: () => void;
  onShowHabitTimePicker: () => void;
  onHideHabitTimePicker: () => void;

  // Actions
  onAddHabit: () => void;
  onRemoveHabit: (index: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function AddEditGoalModal({
  visible,
  isEditing,
  scaleAnim,
  isTablet,
  normalize,
  title,
  description,
  dueDate,
  dueTime,
  habits,
  newHabit,
  newHabitTime,
  showDatePicker,
  showTimePicker,
  showHabitTimePicker,
  onChangeTitle,
  onChangeDescription,
  onChangeDueDate,
  onChangeDueTime,
  onChangeNewHabit,
  onChangeNewHabitTime,
  onShowDatePicker,
  onHideDatePicker,
  onShowTimePicker,
  onHideTimePicker,
  onShowHabitTimePicker,
  onHideHabitTimePicker,
  onAddHabit,
  onRemoveHabit,
  onSubmit,
  onClose,
}: AddEditGoalModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeAreaModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
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
                  isTablet && styles.modalContentTablet,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { fontSize: normalize(24) }]}>
                    {isEditing ? 'Edit Goal' : 'Create Goal'}
                  </Text>
                  <TouchableOpacity onPress={onClose}>
                    <X size={normalize(24)} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Title */}
                  <Text style={[styles.label, { fontSize: normalize(14) }]}>Goal Title *</Text>
                  <TextInput
                    style={[styles.input, { fontSize: normalize(16) }]}
                    placeholder="Enter your goal"
                    placeholderTextColor={colors.textLight}
                    value={title}
                    onChangeText={onChangeTitle}
                  />

                  {/* Description */}
                  <Text style={[styles.label, { fontSize: normalize(14) }]}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { fontSize: normalize(16) }]}
                    placeholder="Describe your goal"
                    placeholderTextColor={colors.textLight}
                    value={description}
                    onChangeText={onChangeDescription}
                    multiline
                    numberOfLines={3}
                  />

                  {/* Due Date */}
                  <Text style={[styles.label, { fontSize: normalize(14) }]}>Due Date *</Text>
                  <TouchableOpacity style={styles.input} onPress={onShowDatePicker}>
                    <Text style={{ color: colors.text, fontSize: normalize(16) }}>
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
                      onHideDatePicker();
                      const normalized = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                        12,
                        0,
                        0
                      );
                      onChangeDueDate(normalized);
                    }}
                    onCancel={onHideDatePicker}
                  />

                  {/* Due Time */}
                  <Text style={[styles.label, { fontSize: normalize(14) }]}>Due Time</Text>
                  <TouchableOpacity style={styles.input} onPress={onShowTimePicker}>
                    <Text style={{ color: colors.text, fontSize: normalize(16) }}>
                      {dueTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showTimePicker}
                    mode="time"
                    date={dueTime}
                    onConfirm={(time) => {
                      onHideTimePicker();
                      onChangeDueTime(time);
                    }}
                    onCancel={onHideTimePicker}
                  />

                  {/* Sub Tasks */}
                  <Text style={[styles.label, { fontSize: normalize(14) }]}>Sub Tasks</Text>
                  <View style={styles.habitInputRow}>
                    <TextInput
                      style={[styles.input, styles.habitInput, { fontSize: normalize(16) }]}
                      placeholder="Add a sub task"
                      placeholderTextColor={colors.textLight}
                      value={newHabit}
                      onChangeText={onChangeNewHabit}
                    />
                    <TouchableOpacity
                      style={[styles.timeButton, newHabitTime && styles.timeButtonActive]}
                      onPress={onShowHabitTimePicker}
                    >
                      {newHabitTime ? (
                        <Bell size={normalize(20)} color="white" />
                      ) : (
                        <BellOff size={normalize(20)} color={colors.textLight} />
                      )}
                    </TouchableOpacity>
                    <DateTimePickerModal
                      isVisible={showHabitTimePicker}
                      mode="time"
                      onConfirm={(time) => {
                        onChangeNewHabitTime(time);
                        onHideHabitTimePicker();
                      }}
                      onCancel={onHideHabitTimePicker}
                    />
                    <TouchableOpacity style={styles.addHabitButton} onPress={onAddHabit}>
                      <Plus size={normalize(24)} color={colors.surface} />
                    </TouchableOpacity>
                  </View>

                  {newHabitTime ? (
                    <View style={styles.reminderPreview}>
                      <Text style={[styles.reminderPreviewText, { fontSize: normalize(14) }]}>
                        Reminder set for: {formatTime12H(newHabitTime)}
                      </Text>
                      <TouchableOpacity onPress={() => onChangeNewHabitTime(null)}>
                        <X size={normalize(16)} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {/* Habit chips */}
                  <View style={styles.habitsList}>
                    {habits.map((habit, index) => (
                      <View key={index} style={styles.habitChip}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.habitChipText, { fontSize: normalize(14) }]}>
                            {habit.title}
                          </Text>
                          {habit.reminderEnabled && habit.reminderTime ? (
                            <Text
                              style={[styles.habitChipSubtext, { fontSize: normalize(12) }]}
                            >
                              {'🔔'} {formatStringTime12H(habit.reminderTime)}
                            </Text>
                          ) : null}
                        </View>
                        <TouchableOpacity onPress={() => onRemoveHabit(index)}>
                          <X size={normalize(20)} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  <Button
                    title={isEditing ? 'Update Goal' : 'Create Goal'}
                    onPress={onSubmit}
                    style={styles.createButton}
                    textStyle={{ fontSize: normalize(16) }}
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
    maxWidth: '90%',
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
  scrollContent: {
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  habitInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  habitInput: {
    flex: 1,
  },
  timeButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  addHabitButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  reminderPreviewText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  habitsList: {
    marginTop: 12,
    gap: 8,
  },
  habitChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 10,
  },
  habitChipText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  habitChipSubtext: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
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
