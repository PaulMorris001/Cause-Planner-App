import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import colors from '@/constants/colors';
import { Task } from '@/types';
import { formatStringTime12H } from '@/utils/timeUtils';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onLongPress: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  isTaskMissed: (task: Task) => boolean;
  getDaysUntil: (dateStr: string) => string;
  formatDate: (dateStr: string) => string;
}

export default function TaskCard({
  task,
  onPress,
  onLongPress,
  onToggleComplete,
  isTaskMissed,
  getDaysUntil,
  formatDate,
}: TaskCardProps) {
  const missed = isTaskMissed(task);

  return (
    <Pressable
      style={[
        styles.taskCard,
        task.completed && styles.taskCardCompleted,
        missed && { borderColor: '#FECACA', borderWidth: 1 },
      ]}
      onPress={() => onPress(task)}
      onLongPress={() => onLongPress(task)}
    >
      <View style={styles.taskLeft}>
        <TouchableOpacity
          onPress={() => onToggleComplete(task)}
          style={[styles.taskIcon, { backgroundColor: colors.taskColors[task.type] }]}
          activeOpacity={0.7}
        >
          {task.completed ? (
            <CheckCircle size={24} color={colors.surface} />
          ) : (
            <Circle size={24} color={colors.surface} />
          )}
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
            {task.description}
          </Text>

          <View style={styles.taskMeta}>
            <View style={[styles.typeBadge, { backgroundColor: colors.taskColors[task.type] + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: colors.taskColors[task.type] }]}>
                {task.type}
              </Text>
            </View>

            {missed && (
              <View style={[styles.typeBadge, { backgroundColor: '#FEE2E2', marginLeft: 6 }]}>
                <Text style={[styles.typeBadgeText, { color: '#EF4444' }]}>Missed</Text>
              </View>
            )}

            {task.className && (
              <Text style={styles.taskClass}>{task.className}</Text>
            )}
          </View>

          <Text style={[styles.taskDate, missed && { color: '#EF4444' }]}>
            {getDaysUntil(task.dueDate)} • {formatDate(task.dueDate)}
            {task.dueTime && ` at ${formatStringTime12H(task.dueTime)}`}
          </Text>
        </View>
      </View>

      <View style={[styles.priorityDot, { backgroundColor: colors.priorityColors[task.priority] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 6,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  taskClass: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  taskDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 12,
  },
});
