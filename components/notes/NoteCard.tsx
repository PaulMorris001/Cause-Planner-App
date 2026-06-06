import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '@/constants/colors';
import { Note } from '@/types';

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onLongPress: (note: Note) => void;
  isTablet: boolean;
  formatDate: (dateStr: string) => string;
}

export default function NoteCard({
  note,
  onPress,
  onLongPress,
  isTablet,
  formatDate,
}: NoteCardProps) {
  return (
    <TouchableOpacity
      style={[styles.noteCard, isTablet && styles.noteCardTablet]}
      onPress={() => onPress(note)}
      onLongPress={() => onLongPress(note)}
    >
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>{note.title}</Text>
        {note.className ? (
          <View style={styles.classTag}>
            <Text style={styles.classTagText}>{note.className}</Text>
          </View>
        ) : null}
      </View>
      {note.content ? (
        <Text style={styles.notePreview} numberOfLines={2} ellipsizeMode="tail">
          {note.content}
        </Text>
      ) : null}
      <Text style={styles.noteDate}>{formatDate(note.updatedAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  noteCardTablet: {
    width: '48%',
    marginBottom: 0,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  classTag: {
    backgroundColor: colors.primaryLight + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  classTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  notePreview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: colors.textLight,
  },
});
