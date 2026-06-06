import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
  Share,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, FileText, Edit2, Trash2, Sparkles } from "lucide-react-native";
import colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import SearchBar from "@/components/SearchBar";
import * as Analytics from "@/utils/analytics";
import { useResponsive } from '@/utils/responsive';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { Note } from "@/types";
import { useStreak } from "@/contexts/StreakContext";
import { useAuth } from "@/contexts/AuthContext";
import UpgradeModal from "@/components/UpgradeModal";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import NoteCard from "@/components/notes/NoteCard";
import NoteDetailModal from "@/components/notes/NoteDetailModal";
import AddNoteModal from "@/components/notes/AddNoteModal";

export default function NotesScreen() {
  const { notes, addNote, updateNote, deleteNote, classes, refreshNotes } = useApp();
  const { checkPermission, isTrialActive } = useAuth();
  const { awardPoints } = useStreak();
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("All");
  const [title, setTitle] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editContent, setEditContent] = useState("");

  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const detailScaleAnim = React.useRef(new Animated.Value(0)).current;

  const { isTablet, normalize } = useResponsive();

  useFocusEffect(
    useCallback(() => {
      refreshNotes();
    }, [])
  );

  // Animate add/edit modal
  React.useEffect(() => {
    if (showModal) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [showModal, scaleAnim]);

  // Animate detail modal
  React.useEffect(() => {
    if (showDetailModal) {
      Animated.spring(detailScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      detailScaleAnim.setValue(0);
    }
  }, [showDetailModal, detailScaleAnim]);

  // ─── Access guard ────────────────────────────────────────────────────────────
  const checkAccess = () => {
    if (checkPermission && !checkPermission('canAccessNotes')) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  // ─── Long-press action sheet ─────────────────────────────────────────────────
  const handleLongPress = (note: Note) => {
    setSelectedNote(note);
    setShowActionSheet(true);
  };

  // ─── Edit note (title / class only) ─────────────────────────────────────────
  const handleEdit = () => {
    if (!selectedNote || !checkAccess()) return;
    setTitle(selectedNote.title);
    setSelectedClass(selectedNote.className || "");
    setIsEditing(true);
    setShowActionSheet(false);
    setShowModal(true);
  };

  // ─── Delete note (from action sheet) ────────────────────────────────────────
  const handleDelete = () => {
    if (!selectedNote || !checkAccess()) return;

    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteNote(selectedNote.id);
          refreshNotes();
          setShowActionSheet(false);
          setSelectedNote(null);
        },
      },
    ]);
  };

  // ─── Create / update note (from add modal) ───────────────────────────────────
  const handleCreateNote = () => {
    if (!title) return;
    if (!checkAccess()) return;

    if (isEditing && selectedNote) {
      updateNote(selectedNote.id, { title, className: selectedClass });
      setIsEditing(false);
      setSelectedNote(null);
    } else {
      addNote({
        title,
        className: selectedClass,
        content: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      awardPoints(5, 'feature').catch(err => console.error('Error awarding points:', err));
      Analytics.logCustomEvent('note_created', { has_class: !!selectedClass });
    }

    setShowModal(false);
    setTitle("");
    setSelectedClass("");
  };

  // ─── Open note for reading / editing ────────────────────────────────────────
  const handleOpenNote = (note: Note) => {
    if (!checkAccess()) return;
    setSelectedNote(note);
    setEditContent(note.content);
    setShowDetailModal(true);
  };

  // ─── Save note content (auto-save on blur, and on Done press) ───────────────
  const handleUpdateNote = async () => {
    if (!selectedNote || !checkAccess()) return;
    setIsSaving(true);
    try {
      await updateNote(selectedNote.id, { content: editContent });
      Analytics.logCustomEvent('note_saved', {
        content_length: editContent.length,
        has_class: !!selectedNote.className,
      });
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Delete note from detail modal ──────────────────────────────────────────
  const handleDeleteNote = () => {
    if (!selectedNote || !checkAccess()) return;
    deleteNote(selectedNote.id);
    setShowDetailModal(false);
    setSelectedNote(null);
  };

  // ─── Download / share note as file ──────────────────────────────────────────
  const handleDownloadNote = async () => {
    if (!selectedNote) return;

    try {
      const content = `${selectedNote.title}\n\n${selectedNote.content}`;
      const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (dir && sharingAvailable) {
        const safeTitle = selectedNote.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || 'note';
        const filename = `${safeTitle}_${Date.now()}.txt`;
        const normalizedDir = dir.endsWith('/') ? dir : `${dir}/`;
        const fileUri = `${normalizedDir}${filename}`;

        // @ts-ignore
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: `Download ${selectedNote.title}`,
            UTI: 'public.plain-text',
          });
          return;
        }
      }

      await Share.share({ message: content, title: selectedNote.title });
    } catch (error: any) {
      console.error("[Notes] Error sharing note:", error);
      try {
        const content = `${selectedNote?.title}\n\n${selectedNote?.content}`;
        await Share.share({ message: content, title: selectedNote?.title });
      } catch (fallbackError) {
        Alert.alert("Share Error", `Could not share note: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // ─── Filtering ───────────────────────────────────────────────────────────────
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.className && note.className.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass = filterClass === "All" || note.className === filterClass;
    return matchesSearch && matchesClass;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotes();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ResponsiveContainer>
        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName="Notes"
          message="Upgrade to the Standard plan to create, edit, and organize unlimited notes."
        />

        {/* Header */}
        <View style={[styles.header, isTablet && { paddingHorizontal: 40 }]}>
          <View>
            <Text style={styles.title}>My Notes 📓</Text>
            <Text style={[styles.subtitle, { fontSize: normalize(14) }]}>Capture your thoughts</Text>
            {isTrialActive && isTrialActive() && (
              <View style={styles.trialBadge}>
                <Sparkles size={12} color={colors.premium} />
                <Text style={styles.trialBadgeText}>Premium</Text>
              </View>
            )}
            {!checkPermission('canAccessNotes') && (
              <Sparkles size={16} color={colors.premium} />
            )}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (checkAccess()) setShowModal(true);
            }}
          >
            <Plus size={24} color={colors.surface} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes..."
          />
        </View>

        {/* Class filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, filterClass === "All" && styles.filterChipActive]}
            onPress={() => setFilterClass("All")}
          >
            <Text
              style={[
                styles.filterChipText,
                filterClass === "All" && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {classes.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              style={[
                styles.filterChip,
                filterClass === cls.name && [
                  styles.filterChipActive,
                  { backgroundColor: cls.color },
                ],
              ]}
              onPress={() => setFilterClass(cls.name)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterClass === cls.name && styles.filterChipTextActive,
                ]}
              >
                {cls.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notes list */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {filteredNotes.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>
                {searchQuery ? "No notes found" : "No notes yet"}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? "Try a different search" : "Create your first note"}
              </Text>
            </View>
          ) : (
            <View style={[styles.notesList, isTablet && styles.notesListTablet]}>
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onPress={handleOpenNote}
                  onLongPress={handleLongPress}
                  isTablet={isTablet}
                  formatDate={formatDate}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </ResponsiveContainer>

      {/* Add / Edit Note Modal */}
      <AddNoteModal
        visible={showModal}
        isEditing={isEditing}
        title={title}
        selectedClass={selectedClass}
        classes={classes}
        scaleAnim={scaleAnim}
        isTablet={isTablet}
        onChangeTitle={setTitle}
        onChangeClass={setSelectedClass}
        onSubmit={handleCreateNote}
        onClose={() => {
          setShowModal(false);
          setIsEditing(false);
          setTitle("");
          setSelectedClass("");
        }}
      />

      {/* Note Detail / Edit Modal */}
      <NoteDetailModal
        visible={showDetailModal}
        note={selectedNote}
        editContent={editContent}
        isSaving={isSaving}
        detailScaleAnim={detailScaleAnim}
        isTablet={isTablet}
        formatDate={formatDate}
        onChangeContent={setEditContent}
        onSave={handleUpdateNote}
        onDelete={handleDeleteNote}
        onDownload={handleDownloadNote}
        onClose={() => setShowDetailModal(false)}
      />

      {/* Action Sheet (Edit / Delete) */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <SafeAreaView style={styles.safeAreaModal}>
          <TouchableOpacity
            style={styles.actionSheetOverlay}
            activeOpacity={1}
            onPress={() => setShowActionSheet(false)}
          >
            <View style={styles.actionSheetContent}>
              <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                <Edit2 size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>Edit Note</Text>
              </TouchableOpacity>
              <View style={styles.actionDivider} />
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Trash2 size={20} color="#FF3B30" />
                <Text style={[styles.actionButtonText, { color: "#FF3B30" }]}>
                  Delete Note
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaModal: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.premium + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  trialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.premium,
  },
  title: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    maxHeight: 45,
  },
  filterContent: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.surface,
    fontWeight: "700" as const,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
  notesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notesListTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 40,
    gap: 16,
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  actionSheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  actionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
});
