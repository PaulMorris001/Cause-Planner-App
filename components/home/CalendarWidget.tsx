import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import colors from '@/constants/colors';
import { formatStringTime12H } from '@/utils/timeUtils';
import { getMonthDays, getTasksForDate, getClassesForDate } from '@/utils/calendarUtils';

const CALENDAR_CELL_WIDTH = '14.28%' as const; // 100% ÷ 7 days

interface CalendarWidgetProps {
  sortedTasks: any[];
  classes: any[];
  normalize: (n: number) => number;
  onNavigate: () => void;
}

export default function CalendarWidget({ sortedTasks, classes, normalize, onNavigate }: CalendarWidgetProps) {
  const [calWidgetDate, setCalWidgetDate] = useState(new Date());
  const [calWidgetSelected, setCalWidgetSelected] = useState<Date | null>(null);

  return (
    <>
      <View style={styles.calendarSection}>
        {/* Header row */}
        <View style={styles.calendarSectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: normalize(20) }]}>
            <Text style={{ fontWeight: '800' }}>My Calendar</Text>
          </Text>
          <TouchableOpacity onPress={onNavigate}>
            <Text style={[styles.viewAllText, { fontSize: normalize(14) }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Month navigation */}
        <View style={styles.calWidgetNav}>
          <TouchableOpacity
            style={styles.calWidgetNavBtn}
            onPress={() => { const d = new Date(calWidgetDate); d.setMonth(d.getMonth() - 1); setCalWidgetDate(d); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.calWidgetMonthTitle, { fontSize: normalize(16) }]}>
            {calWidgetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            style={styles.calWidgetNavBtn}
            onPress={() => { const d = new Date(calWidgetDate); d.setMonth(d.getMonth() + 1); setCalWidgetDate(d); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Weekday labels */}
        <View style={styles.calWidgetWeekDaysRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <Text key={d} style={[styles.calWidgetWeekDayText, { fontSize: normalize(11) }]}>{d}</Text>
          ))}
        </View>

        {/* Day cells */}
        <View style={styles.calWidgetDaysGrid}>
          {getMonthDays(calWidgetDate).map((day, index) => {
            const tasks = getTasksForDate(day, sortedTasks);
            const dayClasses = getClassesForDate(day, classes);
            const isToday = day?.toDateString() === new Date().toDateString();
            const isSelected = day && calWidgetSelected && day.toDateString() === calWidgetSelected.toDateString();
            const allEvents = [
              ...tasks.map(t => ({ id: t.id, color: (colors.taskColors as Record<string, string>)[t.type] || colors.primary })),
              ...dayClasses.map(c => ({ id: c.id, color: c.color })),
            ];
            const hasMore = allEvents.length > 3;
            const displayEvents = allEvents.slice(0, hasMore ? 2 : 3);

            return (
              <TouchableOpacity
                key={index}
                style={styles.calWidgetDayCell}
                onPress={() => day && setCalWidgetSelected(day)}
                disabled={!day}
                activeOpacity={0.7}
              >
                {day && (
                  <>
                    <View style={[
                      styles.calWidgetDayNumber,
                      isToday && styles.calWidgetDayNumberToday,
                      isSelected && !isToday && styles.calWidgetDayNumberSelected,
                    ]}>
                      <Text style={[
                        styles.calWidgetDayNumberText,
                        { fontSize: normalize(13) },
                        isToday && styles.calWidgetDayNumberTextToday,
                        isSelected && !isToday && styles.calWidgetDayNumberTextSelected,
                      ]}>
                        {day.getDate()}
                      </Text>
                    </View>
                    <View style={styles.calWidgetDayEvents}>
                      {displayEvents.map((ev, i) => (
                        <View key={`${ev.id}-${i}`} style={[styles.calWidgetEventDot, { backgroundColor: ev.color }]} />
                      ))}
                      {hasMore && <Text style={styles.calWidgetMoreText}>+</Text>}
                    </View>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Calendar day detail modal */}
      <Modal
        visible={!!calWidgetSelected}
        transparent
        animationType="slide"
        onRequestClose={() => setCalWidgetSelected(null)}
      >
        <View style={styles.calDayModalOverlay}>
          {/* Backdrop — tap to dismiss */}
          <TouchableWithoutFeedback onPress={() => setCalWidgetSelected(null)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>

          {/* Sheet — touch stopper prevents taps from reaching the backdrop */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.calDayModalSheet}>
              <View style={styles.calDayModalHandle} />
              <View style={styles.calDayModalHeader}>
                <Text style={[styles.calDayModalTitle, { fontSize: normalize(18) }]}>
                  {calWidgetSelected?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <TouchableOpacity
                  style={styles.calDayModalClose}
                  onPress={() => setCalWidgetSelected(null)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {(() => {
                  const tasks = getTasksForDate(calWidgetSelected, sortedTasks);
                  const dayClasses = getClassesForDate(calWidgetSelected, classes);
                  if (tasks.length === 0 && dayClasses.length === 0) {
                    return (
                      <Text style={[styles.calDayModalEmpty, { fontSize: normalize(14) }]}>
                        Nothing scheduled for this day.
                      </Text>
                    );
                  }
                  return (
                    <>
                      {dayClasses.length > 0 && (
                        <>
                          <Text style={[styles.calDayModalSectionTitle, { fontSize: normalize(11) }]}>Classes</Text>
                          {dayClasses.map((cls: any) => (
                            <View key={cls.id} style={[styles.calDayModalItem, { borderLeftColor: cls.color }]}>
                              <Text style={[styles.calDayModalItemTitle, { fontSize: normalize(14) }]}>{cls.name}</Text>
                              <Text style={[styles.calDayModalItemMeta, { fontSize: normalize(12) }]}>{cls.time}</Text>
                            </View>
                          ))}
                        </>
                      )}
                      {tasks.length > 0 && (
                        <>
                          <Text style={[styles.calDayModalSectionTitle, { fontSize: normalize(11), marginTop: dayClasses.length > 0 ? 12 : 0 }]}>Tasks</Text>
                          {tasks.map((task: any) => (
                            <View key={task.id} style={[styles.calDayModalItem, { borderLeftColor: (colors.taskColors as Record<string, string>)[task.type] || colors.primary }]}>
                              <Text style={[styles.calDayModalItemTitle, { fontSize: normalize(14) }]}>{task.description}</Text>
                              <Text style={[styles.calDayModalItemMeta, { fontSize: normalize(12) }]}>
                                {task.type}{task.dueTime ? ` • ${formatStringTime12H(task.dueTime)}` : ''}
                              </Text>
                            </View>
                          ))}
                        </>
                      )}
                    </>
                  );
                })()}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  calendarSectionHeader: {
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
  calWidgetNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calWidgetNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calWidgetMonthTitle: {
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  calWidgetWeekDaysRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calWidgetWeekDayText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calWidgetDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calWidgetDayCell: {
    width: CALENDAR_CELL_WIDTH,
    aspectRatio: 1,
    padding: 2,
    alignItems: 'center',
  },
  calWidgetDayNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calWidgetDayNumberToday: {
    backgroundColor: colors.primary,
  },
  calWidgetDayNumberSelected: {
    backgroundColor: colors.primary + '30',
  },
  calWidgetDayNumberText: {
    fontWeight: '600',
    color: colors.text,
  },
  calWidgetDayNumberTextToday: {
    color: '#FFFFFF',
  },
  calWidgetDayNumberTextSelected: {
    color: colors.primary,
  },
  calWidgetDayEvents: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
    gap: 2,
  },
  calWidgetEventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  calWidgetMoreText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  calDayModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  calDayModalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  calDayModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  calDayModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calDayModalTitle: {
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  calDayModalClose: {
    padding: 4,
  },
  calDayModalSectionTitle: {
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calDayModalItem: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 12,
  },
  calDayModalItemTitle: {
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  calDayModalItemMeta: {
    color: colors.textSecondary,
  },
  calDayModalEmpty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 8,
  },
});
