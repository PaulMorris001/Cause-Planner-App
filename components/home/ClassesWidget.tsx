import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BookOpen, Clock } from 'lucide-react-native';
import colors from '@/constants/colors';

interface ClassesWidgetProps {
  recentClasses: any[];
  normalize: (n: number) => number;
  onNavigate: () => void;
}

export default function ClassesWidget({ recentClasses, normalize, onNavigate }: ClassesWidgetProps) {
  return (
    <View style={styles.classesSection}>
      <View style={styles.classesSectionHeader}>
        <Text style={[styles.sectionTitle, { fontSize: normalize(20), textAlign: 'left' }]}>
          <Text style={{ fontWeight: '800' }}>My Classes</Text>
        </Text>
        <TouchableOpacity onPress={onNavigate}>
          <Text style={[styles.viewAllText, { fontSize: normalize(14) }]}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentClasses.length === 0 ? (
        <View style={styles.classesEmptyState}>
          <View style={styles.classesEmptyIconWrap}>
            <BookOpen size={28} color={colors.primary} />
          </View>
          <Text style={[styles.classesEmptyTitle, { fontSize: normalize(16) }]}>No classes yet</Text>
          <Text style={[styles.classesEmptyText, { fontSize: normalize(13) }]}>
            Add your first class to see it here on your home screen.
          </Text>
          <TouchableOpacity
            style={styles.classesEmptyCTA}
            onPress={onNavigate}
            activeOpacity={0.8}
          >
            <Text style={[styles.classesEmptyCTAText, { fontSize: normalize(14) }]}>Add a Class</Text>
          </TouchableOpacity>
        </View>
      ) : (
        recentClasses.map(cls => (
          <TouchableOpacity
            key={cls.id}
            style={[styles.classCard, { borderLeftColor: cls.color }]}
            onPress={onNavigate}
          >
            <View style={[styles.classCardIcon, { backgroundColor: cls.color + '20' }]}>
              <BookOpen size={20} color={cls.color} />
            </View>
            <View style={styles.classCardContent}>
              <Text style={[styles.classCardName, { fontSize: normalize(15) }]} numberOfLines={1}>
                {cls.name}
              </Text>
              {cls.section ? (
                <Text style={[styles.classCardSection, { fontSize: normalize(12) }]}>{cls.section}</Text>
              ) : null}
              <View style={styles.classCardMetaRow}>
                <Clock size={12} color={colors.textLight} />
                <Text style={[styles.classCardMetaText, { fontSize: normalize(11) }]}>{cls.time}</Text>
              </View>
              <Text style={[styles.classCardDays, { fontSize: normalize(11) }]} numberOfLines={1}>
                {cls.daysOfWeek.join(', ')}
              </Text>
            </View>
            <View style={[styles.classColorDot, { backgroundColor: cls.color }]} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  classesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  classesSectionHeader: {
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
  classCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  classCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  classCardContent: {
    flex: 1,
    gap: 2,
  },
  classCardName: {
    fontWeight: '700',
    color: colors.text,
  },
  classCardSection: {
    color: colors.textSecondary,
  },
  classCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  classCardMetaText: {
    color: colors.textLight,
  },
  classCardDays: {
    color: colors.textSecondary,
  },
  classColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  classesEmptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  classesEmptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  classesEmptyTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  classesEmptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  classesEmptyCTA: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  classesEmptyCTAText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
