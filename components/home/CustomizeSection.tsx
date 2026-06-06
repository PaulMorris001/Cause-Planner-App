import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LayoutGrid, Plus } from 'lucide-react-native';
import colors from '@/constants/colors';

interface CustomizeSectionProps {
  activeWidgets: Set<string>;
  widgetMeta: Record<string, { label: string; color: string }>;
  width: number;
  normalize: (n: number) => number;
  onAddWidget: () => void;
}

export default function CustomizeSection({
  activeWidgets,
  widgetMeta,
  width,
  normalize,
  onAddWidget,
}: CustomizeSectionProps) {
  return (
    <View style={[styles.customizeSection, { width: width - 40 }]}>
      {/* Icon + title */}
      <View style={styles.customizeHeader}>
        <View style={styles.customizeIconWrap}>
          <LayoutGrid size={20} color={colors.primary} />
        </View>
        <Text style={[styles.customizeTitle, { fontSize: normalize(17) }]}>Customize Your Experience</Text>
      </View>

      {/* Active widget chips */}
      {activeWidgets.size > 0 && (
        <View style={styles.activeWidgetsList}>
          {Array.from(activeWidgets).map(key => {
            const meta = widgetMeta[key];
            if (!meta) return null;
            return (
              <View key={key} style={[styles.activeWidgetChip, { borderColor: meta.color }]}>
                <View style={[styles.activeWidgetDot, { backgroundColor: meta.color }]} />
                <Text style={[styles.activeWidgetLabel, { color: meta.color, fontSize: normalize(12) }]}>
                  {meta.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Add button */}
      <TouchableOpacity style={styles.customizeAddButton} activeOpacity={0.8} onPress={onAddWidget}>
        <Plus size={28} color="white" />
      </TouchableOpacity>

      {/* Subtitle */}
      <Text style={[styles.customizeSubtitle, { fontSize: normalize(12) }]}>
        {activeWidgets.size > 0 ? 'Tap + to add more widgets' : 'Add widgets to personalize your home screen'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  customizeSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary + '25',
    backgroundColor: colors.primary + '08',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 16,
  },
  customizeHeader: {
    alignItems: 'center',
    gap: 10,
  },
  customizeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customizeTitle: {
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  activeWidgetsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  activeWidgetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeWidgetDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  activeWidgetLabel: {
    fontWeight: '600',
  },
  customizeSubtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  customizeAddButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
