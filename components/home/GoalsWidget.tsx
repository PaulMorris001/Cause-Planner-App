import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle, Circle, Target } from 'lucide-react-native';
import colors from '@/constants/colors';

interface GoalsWidgetProps {
  recentGoals: any[];
  normalize: (n: number) => number;
  onNavigate: () => void;
}

export default function GoalsWidget({ recentGoals, normalize, onNavigate }: GoalsWidgetProps) {
  return (
    <View style={styles.goalsSection}>
      <View style={styles.goalsSectionHeader}>
        <Text style={[styles.sectionTitle, { fontSize: normalize(20), textAlign: 'left' }]}>
          <Text style={{ fontWeight: '800' }}>My Goals</Text>
        </Text>
        <TouchableOpacity onPress={onNavigate}>
          <Text style={[styles.viewAllText, { fontSize: normalize(14) }]}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentGoals.length === 0 ? (
        <View style={styles.goalsEmptyState}>
          <View style={styles.goalsEmptyIconWrap}>
            <Target size={28} color={colors.primary} />
          </View>
          <Text style={[styles.goalsEmptyTitle, { fontSize: normalize(16) }]}>No goals yet</Text>
          <Text style={[styles.goalsEmptyText, { fontSize: normalize(13) }]}>
            Set your first goal and start building consistency.
          </Text>
          <TouchableOpacity
            style={styles.goalsEmptyCTA}
            onPress={onNavigate}
            activeOpacity={0.8}
          >
            <Text style={[styles.goalsEmptyCTAText, { fontSize: normalize(14) }]}>Add a Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        recentGoals.map(goal => {
          const totalHabits = goal.habits?.length ?? 0;
          const doneHabits = goal.habits?.filter((h: any) => h.completed).length ?? 0;
          const progress = totalHabits > 0 ? Math.round((doneHabits / totalHabits) * 100) : null;
          const dueDateStr = goal.dueDate
            ? (() => {
                const [y, m, d] = goal.dueDate.split('-').map(Number);
                return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              })()
            : null;

          return (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalWidgetCard}
              onPress={onNavigate}
            >
              <View style={styles.goalWidgetLeft}>
                {goal.completed
                  ? <CheckCircle size={22} color={colors.success} />
                  : <Circle size={22} color={colors.primary} />
                }
              </View>
              <View style={styles.goalWidgetContent}>
                <Text
                  style={[styles.goalWidgetTitle, { fontSize: normalize(15) }, goal.completed && styles.goalWidgetTitleDone]}
                  numberOfLines={1}
                >
                  {goal.title}
                </Text>
                {goal.description ? (
                  <Text style={[styles.goalWidgetDesc, { fontSize: normalize(12) }]} numberOfLines={1}>
                    {goal.description}
                  </Text>
                ) : null}
                {progress !== null && (
                  <View style={styles.goalWidgetProgress}>
                    <View style={styles.goalWidgetProgressBar}>
                      <View style={[styles.goalWidgetProgressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={[styles.goalWidgetProgressText, { fontSize: normalize(11) }]}>
                      {doneHabits}/{totalHabits} subtasks
                    </Text>
                  </View>
                )}
                {dueDateStr ? (
                  <Text style={[styles.goalWidgetDue, { fontSize: normalize(11) }]}>Due: {dueDateStr}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  goalsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
    textAlign: 'right',
  },
  goalWidgetCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalWidgetLeft: {
    marginRight: 12,
    marginTop: 1,
  },
  goalWidgetContent: {
    flex: 1,
    gap: 4,
  },
  goalWidgetTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  goalWidgetTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  goalWidgetDesc: {
    color: colors.textSecondary,
  },
  goalWidgetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalWidgetProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  goalWidgetProgressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  goalWidgetProgressText: {
    color: colors.textSecondary,
  },
  goalWidgetDue: {
    color: colors.textLight,
  },
  goalsEmptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  goalsEmptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  goalsEmptyTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  goalsEmptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  goalsEmptyCTA: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  goalsEmptyCTAText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
