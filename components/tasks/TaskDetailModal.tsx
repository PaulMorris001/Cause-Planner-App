import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Edit2, Trash2 } from 'lucide-react-native';
import colors from '@/constants/colors';
import { Task } from '@/types';
import { formatStringTime12H } from '@/utils/timeUtils';

interface TaskDetailModalProps {
  visible: boolean;
  task: Task | null;
  detailScaleAnim: Animated.Value;
  formatDate: (dateStr: string) => string;
  onClose: () => void;
  onToggleComplete: (task: Task) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskDetailModal({
  visible,
  task,
  detailScaleAnim,
  formatDate,
  onClose,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskDetailModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeAreaModal}>
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
              style={[styles.modalContent, { transform: [{ scale: detailScaleAnim }] }]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Task Details</Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.modalScrollContent}
                style={{ maxHeight: Dimensions.get('window').height * 0.5 }}
              >
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{task?.description}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: task
                          ? colors.taskColors[task.type] + '20'
                          : colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: task ? colors.taskColors[task.type] : colors.text },
                      ]}
                    >
                      {task?.type}
                    </Text>
                  </View>
                </View>

                {task?.className && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Class</Text>
                    <Text style={styles.detailValue}>{task.className}</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>
                    {task && formatDate(task.dueDate)}
                    {task?.dueTime && ` at ${formatStringTime12H(task.dueTime)}`}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Priority</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={[
                        styles.priorityDot,
                        {
                          backgroundColor: task
                            ? colors.priorityColors[task.priority]
                            : colors.background,
                        },
                      ]}
                    />
                    <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>
                      {task?.priority}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Reminder</Text>
                  <Text style={styles.detailValue}>
                    {(!task?.reminder || task?.reminder === 'none') && 'No reminder'}
                    {task?.reminder === '1h' && '1 hour before'}
                    {task?.reminder === '2h' && '2 hours before'}
                    {task?.reminder === '1d' && '1 day before'}
                    {task?.reminder === '2d' && '2 days before'}
                    {task?.reminder === 'custom' && 'Custom reminder'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Alarm</Text>
                  <Text style={styles.detailValue}>
                    {task?.alarmEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: task?.completed ? colors.success : colors.textSecondary },
                    ]}
                  >
                    {task?.completed ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailButton, styles.toggleButton]}
                  onPress={() => {
                    if (task) {
                      onToggleComplete(task);
                      onClose();
                    }
                  }}
                >
                  <Text style={styles.detailButtonText}>
                    Mark as {task?.completed ? 'Incomplete' : 'Complete'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailButton, styles.editButton]}
                  onPress={onEdit}
                >
                  <Edit2 size={18} color={colors.surface} />
                  <Text style={styles.detailButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailButton, styles.deleteButton]}
                  onPress={onDelete}
                >
                  <Trash2 size={18} color={colors.surface} />
                  <Text style={styles.detailButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeAreaModal: {
    flex: 1,
    backgroundColor: 'transparent',
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
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    paddingHorizontal: 10,
  },
  toggleButton: {
    backgroundColor: colors.primary,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error || '#ef4444',
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.surface,
  },
});
