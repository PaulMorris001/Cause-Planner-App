import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, Circle, Bell } from 'lucide-react-native';
import colors from '@/constants/colors';
import { Goal } from '@/types';
import { parseLocalDate, formatStringTime12H } from '@/utils/timeUtils';

interface GoalCardProps {
  goal: Goal;
  onToggleComplete: (goal: Goal) => void;
  onLongPress: (goal: Goal) => void;
  onToggleHabit: (goal: Goal, habitIndex: number) => void;
  calculateProgress: (habits?: { completed: boolean }[]) => number;
  normalize: (size: number) => number;
}

export default function GoalCard({
  goal,
  onToggleComplete,
  onLongPress,
  onToggleHabit,
  calculateProgress,
  normalize,
}: GoalCardProps) {
  return (
    <View style={styles.goalCard}>
      <TouchableOpacity
        style={styles.goalHeader}
        onPress={() => onToggleComplete(goal)}
        onLongPress={() => onLongPress(goal)}
      >
        <View style={styles.goalHeaderLeft}>
          {goal.completed ? (
            <CheckCircle size={normalize(28)} color={colors.success} />
          ) : (
            <Circle size={normalize(28)} color={colors.primary} />
          )}
          <View style={styles.goalHeaderText}>
            <Text
              style={[
                styles.goalTitle,
                goal.completed && styles.goalTitleCompleted,
                { fontSize: normalize(18) },
              ]}
            >
              {goal.title}
            </Text>
            {goal.description ? (
              <Text style={[styles.goalDescription, { fontSize: normalize(14) }]}>
                {goal.description}
              </Text>
            ) : null}
            {goal.dueDate ? (
              <Text style={[styles.goalDueDate, { fontSize: normalize(12) }]}>
                Due: {parseLocalDate(goal.dueDate).toLocaleDateString()}
                {goal.dueTime ? ` at ${formatStringTime12H(goal.dueTime)}` : ''}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Habits / Sub Tasks Section */}
      {goal.habits && goal.habits.length > 0 && (
        <View style={styles.habitsSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.habitsTitle, { fontSize: normalize(14) }]}>Sub Tasks</Text>
            <Text style={[styles.progressText, { fontSize: normalize(14) }]}>
              {Math.round(calculateProgress(goal.habits))}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${calculateProgress(goal.habits)}%` },
              ]}
            />
          </View>
          <View>
            {goal.habits.map((habit, index) => (
              <TouchableOpacity
                key={index}
                style={styles.habitItem}
                onPress={() => onToggleHabit(goal, index)}
              >
                {habit.completed ? (
                  <CheckCircle size={normalize(20)} color={colors.primary} />
                ) : (
                  <Circle size={normalize(20)} color={colors.border} />
                )}
                <Text
                  style={[
                    styles.habitTitle,
                    habit.completed && styles.habitTitleCompleted,
                    { fontSize: normalize(14) },
                  ]}
                >
                  {habit.title}
                </Text>
                {habit.reminderEnabled && habit.reminderTime ? (
                  <View style={styles.habitBadge}>
                    <Bell size={normalize(12)} color={colors.primary} />
                    <Text style={[styles.habitBadgeText, { fontSize: normalize(12) }]}>
                      {habit.reminderTime}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalHeader: {
    marginBottom: 12,
  },
  goalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  goalTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  goalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  goalDueDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  habitsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  habitTitle: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 10,
    flex: 1,
  },
  habitTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  habitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  habitBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
});
