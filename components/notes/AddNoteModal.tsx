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
import { X } from 'lucide-react-native';
import Button from '@/components/Button';
import colors from '@/constants/colors';
import { Class } from '@/types';

interface AddNoteModalProps {
  visible: boolean;
  isEditing: boolean;
  title: string;
  selectedClass: string;
  classes: Class[];
  scaleAnim: Animated.Value;
  isTablet: boolean;
  onChangeTitle: (value: string) => void;
  onChangeClass: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function AddNoteModal({
  visible,
  isEditing,
  title,
  selectedClass,
  classes,
  scaleAnim,
  isTablet,
  onChangeTitle,
  onChangeClass,
  onSubmit,
  onClose,
}: AddNoteModalProps) {
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
                  { transform: [{ scale: scaleAnim }] },
                  isTablet && styles.modalContentTablet,
                ]}
              >
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isEditing ? 'Edit Note' : 'New Note'}
                  </Text>
                  <TouchableOpacity onPress={onClose}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Title input */}
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Note title"
                  placeholderTextColor={colors.textLight}
                  value={title}
                  onChangeText={onChangeTitle}
                  autoFocus
                />

                {/* Class selector */}
                <Text style={styles.label}>Class (Optional)</Text>
                <View style={styles.classGrid}>
                  {/* "None" chip */}
                  <TouchableOpacity
                    style={[
                      styles.classChip,
                      !selectedClass && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => onChangeClass('')}
                  >
                    <Text
                      style={[
                        styles.classChipText,
                        !selectedClass && { color: colors.surface },
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>

                  {/* Per-class chips */}
                  {classes.map((cls) => (
                    <TouchableOpacity
                      key={cls.id}
                      style={[
                        styles.classChip,
                        selectedClass === cls.name && { backgroundColor: cls.color },
                      ]}
                      onPress={() => onChangeClass(cls.name)}
                    >
                      <Text
                        style={[
                          styles.classChipText,
                          selectedClass === cls.name && { color: colors.surface },
                        ]}
                      >
                        {cls.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Button
                  title={isEditing ? 'Update Note' : 'Create Note'}
                  onPress={onSubmit}
                  disabled={!title}
                  style={styles.createButton}
                />
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
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  classChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
  },
});
