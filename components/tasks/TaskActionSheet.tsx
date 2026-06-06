import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Edit2, Trash2 } from 'lucide-react-native';
import colors from '@/constants/colors';

interface TaskActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskActionSheet({
  visible,
  onClose,
  onEdit,
  onDelete,
}: TaskActionSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeAreaModal}>
        <TouchableOpacity
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.actionSheetContent}>
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Edit2 size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Edit Task</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <Trash2 size={20} color="#FF3B30" />
              <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Delete Task</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeAreaModal: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  actionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
});
