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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Download } from 'lucide-react-native';
import Button from '@/components/Button';
import colors from '@/constants/colors';
import { Note } from '@/types';

interface NoteDetailModalProps {
  visible: boolean;
  note: Note | null;
  editContent: string;
  isSaving: boolean;
  detailScaleAnim: Animated.Value;
  isTablet: boolean;
  formatDate: (dateStr: string) => string;
  onChangeContent: (text: string) => void;
  onSave: () => Promise<void>;
  onDelete: () => void;
  onDownload: () => void;
  onClose: () => void;
}

export default function NoteDetailModal({
  visible,
  note,
  editContent,
  isSaving,
  detailScaleAnim,
  isTablet,
  formatDate,
  onChangeContent,
  onSave,
  onDelete,
  onDownload,
  onClose,
}: NoteDetailModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
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
                  { transform: [{ scale: detailScaleAnim }] },
                  isTablet && styles.modalContentTablet,
                ]}
              >
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{note?.title}</Text>
                  <TouchableOpacity onPress={onClose}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Class tag */}
                {note?.className ? (
                  <View
                    style={[
                      styles.classTag,
                      { marginBottom: 16, alignSelf: 'flex-start' },
                    ]}
                  >
                    <Text style={styles.classTagText}>{note.className}</Text>
                  </View>
                ) : null}

                {/* Content editor */}
                <Text style={styles.label}>Content</Text>
                <TextInput
                  style={[styles.input, styles.contentInput]}
                  placeholder="Write your notes here..."
                  placeholderTextColor={colors.textLight}
                  value={editContent}
                  onChangeText={onChangeContent}
                  onBlur={onSave}
                  multiline
                  numberOfLines={10}
                  textAlignVertical="top"
                  autoFocus
                />

                {/* Action buttons */}
                <View style={styles.detailModalActions}>
                  <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                    <Text style={styles.deleteButtonText}>Delete Note</Text>
                  </TouchableOpacity>
                  <Button
                    title="Done"
                    onPress={async () => {
                      await onSave();
                      onClose();
                    }}
                    isLoading={isSaving}
                    style={styles.saveButton}
                  />
                </View>

                {/* Download button */}
                <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
                  <Download size={20} color={colors.primary} />
                  <Text style={styles.downloadButtonText}>Download Note</Text>
                </TouchableOpacity>

                {/* Dates */}
                {note ? (
                  <>
                    <Text style={styles.dateInfo}>
                      Created: {formatDate(note.createdAt)}
                    </Text>
                    <Text style={styles.dateInfo}>
                      Updated: {formatDate(note.updatedAt)}
                    </Text>
                  </>
                ) : null}
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
    width: '100%',
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
  contentInput: {
    minHeight: 200,
    maxHeight: 400,
  },
  detailModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error || '#ef4444',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '20',
    marginTop: 12,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  dateInfo: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
});
