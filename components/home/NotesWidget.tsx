import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FileText } from 'lucide-react-native';
import colors from '@/constants/colors';

interface NotesWidgetProps {
  recentNotes: any[];
  normalize: (n: number) => number;
  formatNoteDate: (dateStr: string) => string;
  onNavigate: () => void;
}

export default function NotesWidget({ recentNotes, normalize, formatNoteDate, onNavigate }: NotesWidgetProps) {
  return (
    <View style={styles.notesSection}>
      <View style={styles.notesSectionHeader}>
        <Text style={[styles.sectionTitle, { fontSize: normalize(20), textAlign: 'left' }]}>
          <Text style={{ fontWeight: '800' }}>My Notes</Text>
        </Text>
        <TouchableOpacity onPress={onNavigate}>
          <Text style={[styles.viewAllText, { fontSize: normalize(14) }]}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentNotes.length === 0 ? (
        <View style={styles.notesEmptyState}>
          <View style={styles.notesEmptyIconWrap}>
            <FileText size={28} color={colors.primary} />
          </View>
          <Text style={[styles.notesEmptyTitle, { fontSize: normalize(16) }]}>No notes yet</Text>
          <Text style={[styles.notesEmptyText, { fontSize: normalize(13) }]}>
            Start capturing your ideas and study notes here.
          </Text>
          <TouchableOpacity
            style={styles.notesEmptyCTA}
            onPress={onNavigate}
            activeOpacity={0.8}
          >
            <Text style={[styles.notesEmptyCTAText, { fontSize: normalize(14) }]}>Add a Note</Text>
          </TouchableOpacity>
        </View>
      ) : (
        recentNotes.map(note => (
          <TouchableOpacity
            key={note.id}
            style={styles.noteCard}
            onPress={onNavigate}
          >
            <View style={styles.noteCardIconWrap}>
              <FileText size={18} color={colors.primary} />
            </View>
            <View style={styles.noteCardContent}>
              <View style={styles.noteCardHeader}>
                <Text style={[styles.noteCardTitle, { fontSize: normalize(15) }]} numberOfLines={1}>
                  {note.title}
                </Text>
                {note.className ? (
                  <View style={styles.noteClassTag}>
                    <Text style={[styles.noteClassTagText, { fontSize: normalize(10) }]}>{note.className}</Text>
                  </View>
                ) : null}
              </View>
              {note.content ? (
                <Text style={[styles.noteCardPreview, { fontSize: normalize(12) }]} numberOfLines={2}>
                  {note.content}
                </Text>
              ) : null}
              <Text style={[styles.noteCardDate, { fontSize: normalize(11) }]}>
                {formatNoteDate(note.updatedAt)}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  notesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  notesSectionHeader: {
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
  noteCard: {
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
  noteCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  noteCardContent: {
    flex: 1,
    gap: 4,
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteCardTitle: {
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  noteClassTag: {
    backgroundColor: colors.primary + '18',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  noteClassTagText: {
    color: colors.primary,
    fontWeight: '600',
  },
  noteCardPreview: {
    color: colors.textSecondary,
    lineHeight: 18,
  },
  noteCardDate: {
    color: colors.textLight,
  },
  notesEmptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  notesEmptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  notesEmptyTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  notesEmptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  notesEmptyCTA: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  notesEmptyCTAText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
