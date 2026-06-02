import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useStreak } from '@/contexts/StreakContext';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Flame, Trophy, ListChecks, CheckCircle, Circle, Clock, LayoutGrid, Sparkles, Plus, BookOpen, FileText } from 'lucide-react-native';
import * as Sentry from '@sentry/react-native';
import { formatStringTime12H } from '@/utils/timeUtils';
import UpgradeModal from '@/components/UpgradeModal';
import TrialCountdownModal from '@/components/TrialCountdownModal';
import DailyStreakModal from '@/components/DailyStreakModal';
import OnboardingTour from '@/components/OnboardingTour';
import WidgetBottomSheet from '@/components/WidgetBottomSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useResponsive } from '@/utils/responsive';
import ResponsiveContainer from '@/components/ResponsiveContainer';

export default function HomeScreen() {
  const ctx = useApp();
  const sortedTasks = ctx?.sortedTasks || [];
  const classes = ctx?.classes || [];
  const notes = ctx?.notes || [];
  const isLoading = ctx?.isLoading;
  const refreshAllData = ctx?.refreshAllData;
  const initialLoadFailed = ctx?.initialLoadFailed ?? false;
  const retryInitialLoad = ctx?.retryInitialLoad;

  // Use optional chaining or try-catch for useStreak as it might be missing during early render/crashes
  let streakCtx: any = {};
  try {
    streakCtx = useStreak();
  } catch (e) {
    console.warn('StreakContext not found in HomeScreen, using fallback');
  }

  const {
    streakData = null,
    refreshStreak = async () => {},
    showDailyModal = false,
    setShowDailyModal = () => {},
    modalStreakCount = 0,
    isLoading: isStreakLoading = false
  } = streakCtx || {};

  const { user, checkPermission, isTrialActive, getTrialDaysRemaining } = useAuth();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showWidgetSheet, setShowWidgetSheet] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<Set<string>>(new Set());

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshAllData({ silent: true }),
      refreshStreak()
    ]);
    setRefreshing(false);
  };

  const educationQuotes = useMemo(() => [
    "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
    "The beautiful thing about learning is that no one can take it away from you. - B.B. King",
    "Education is not preparation for life; education is life itself. - John Dewey",
    "Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi",
    "The roots of education are bitter, but the fruit is sweet. - Aristotle",
    "Intelligence plus character—that is the goal of true education. - Martin Luther King Jr.",
  ], []);

  const [currentQuote, setCurrentQuote] = useState(educationQuotes[0]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const quoteIndexRef = React.useRef(0);

  useEffect(() => {
    const checkTrialModal = async () => {
      if (!user?.uid || !isTrialActive || !isTrialActive()) return;
      // iOS cannot display two native Modals simultaneously. Wait for the
      // streak modal to close before showing the trial modal so it isn't
      // silently swallowed by the OS.
      if (showDailyModal) return;

      // Key is scoped to the user so a new account on the same device
      // always sees the modal even if another account saw it today.
      const storageKey = `@trial_modal_last_shown_${user.uid}`;
      const lastShown = await AsyncStorage.getItem(storageKey);
      const today = new Date().toDateString();

      if (lastShown !== today) {
        setShowTrialModal(true);
        await AsyncStorage.setItem(storageKey, today);
      }
    };

    checkTrialModal();
  }, [user, showDailyModal]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user?.uid) return;
      // Don't stack on top of the streak modal — wait until it closes
      if (showDailyModal) return;
      const key = `@onboarding_complete_${user.uid}`;
      const done = await AsyncStorage.getItem(key);
      if (!done) {
        setShowTour(true);
      }
    };
    checkOnboarding();
  }, [user?.uid, showDailyModal]);

  const completeTour = async () => {
    setShowTour(false);
    if (user?.uid) {
      await AsyncStorage.setItem(`@onboarding_complete_${user.uid}`, 'true');
    }
  };

  // Load persisted active widgets for this user
  useEffect(() => {
    if (!user?.uid) return;
    AsyncStorage.getItem(`@active_widgets_${user.uid}`).then(val => {
      if (val) setActiveWidgets(new Set(JSON.parse(val)));
    });
  }, [user?.uid]);

  const handleWidgetsConfirm = useCallback(async (keys: string[]) => {
    if (!keys.length) return;
    const next = new Set([...activeWidgets, ...keys]);
    setActiveWidgets(next);
    if (user?.uid) {
      await AsyncStorage.setItem(`@active_widgets_${user.uid}`, JSON.stringify(Array.from(next)));
    }
  }, [activeWidgets, user?.uid]);

  const lastFocusRef = React.useRef(0);

  // Refresh gamification points whenever coming back to this screen
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Only refresh if it's been more than 30 seconds since last focus refresh
      // This prevents loops if focus triggers too rapidly
      if (typeof refreshStreak === 'function' && now - lastFocusRef.current > 30000) {
        lastFocusRef.current = now;
        refreshStreak({ silent: true });
      }
    }, [refreshStreak])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      quoteIndexRef.current = (quoteIndexRef.current + 1) % educationQuotes.length;
      setCurrentQuote(educationQuotes[quoteIndexRef.current]);
    }, 10000);
    return () => clearInterval(interval);
  }, [educationQuotes]);

  // Get today's tasks info
  const todayTasksInfo = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const todayTasks = sortedTasks.filter(task => task.dueDate === todayStr);
    return {
      completed: todayTasks.filter(t => t.completed).length,
      total: todayTasks.length,
      remaining: todayTasks.filter(t => !t.completed).length
    };
  }, [sortedTasks]);

  // Get the 3 closest upcoming tasks (not completed)
  const upcomingTasks = useMemo(() => {
    return sortedTasks
      .filter(task => !task.completed)
      .slice(0, 3);
  }, [sortedTasks]);

  // Latest 3 created classes for the widget
  const recentClasses = useMemo(() => classes.slice(0, 3), [classes]);

  // Latest 3 notes for the widget (notes are already newest-first from context)
  const recentNotes = useMemo(() => notes.slice(0, 3), [notes]);

  const formatNoteDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const getDaysUntil = useCallback((dateStr: string) => {
    // Parse as local date — never use new Date("YYYY-MM-DD") directly
    // because JS treats bare date strings as UTC midnight, shifting the
    // date back one day for users west of UTC (e.g. all US timezones).
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < 0) return `${Math.abs(diff)} days ago`;
    return `In ${diff} days`;
  }, []);

  const { isTablet, normalize, width } = useResponsive();

  if (!ctx) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Crushing your goals...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ResponsiveContainer>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && { paddingHorizontal: 40 }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {initialLoadFailed && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>Failed to load data. Check your connection.</Text>
              <TouchableOpacity onPress={retryInitialLoad} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.heroSection}>
            <Text style={[styles.appTitle, { fontSize: normalize(23) }]}>Cause Planner</Text>
            <Text style={[styles.heroSubtitle, { fontSize: normalize(14) }]}>Making a difference, one task at a time</Text>

            <Text style={[styles.greetingText, { fontSize: normalize(18) }]}>Hello, {firstName} 👋</Text>

            <View style={[styles.statsGrid, isTablet && { gap: 16 }]}>
              {/* Row 1 */}
              <View style={styles.statsRow}>
                <View style={[styles.statBox, isTablet && styles.statBoxTablet, { backgroundColor: '#E0F2FE' }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: 'white' }]}>
                    <ListChecks size={normalize(28)} color={colors.primary} />
                  </View>
                  <Text style={[styles.statValue, { fontSize: normalize(22) }]}>{todayTasksInfo.remaining}</Text>
                  <Text style={[styles.statLabel, { fontSize: normalize(13) }]}>Today's Tasks</Text>
                </View>

                <View style={[styles.statBox, isTablet && styles.statBoxTablet, { backgroundColor: '#EFF6FF' }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: 'white' }]}>
                    <Flame size={normalize(28)} color={colors.secondary} />
                  </View>
                  <Text style={[styles.statValue, { fontSize: normalize(22) }]}>{streakData?.current || 0}</Text>
                  <Text style={[styles.statLabel, { fontSize: normalize(13) }]}>Current Streak</Text>
                </View>
              </View>

              {/* Row 2 */}
              <View style={styles.statsRow}>
                <View style={[styles.statBox, isTablet && styles.statBoxTablet, { backgroundColor: '#DBEAFE' }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: 'white' }]}>
                    <Zap size={normalize(28)} color={colors.primaryLight} />
                  </View>
                  <Text style={[styles.statValue, { fontSize: normalize(22) }]}>{streakData?.points || 0}</Text>
                  <Text style={[styles.statLabel, { fontSize: normalize(13) }]}>Total Points</Text>
                </View>

                <View style={[styles.statBox, isTablet && styles.statBoxTablet, { backgroundColor: '#D1FAE5' }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: 'white' }]}>
                    <Trophy size={normalize(28)} color={colors.success} />
                  </View>
                  <Text style={[styles.statValue, { fontSize: normalize(22) }]}>{streakData?.level || 1}</Text>
                  <Text style={[styles.statLabel, { fontSize: normalize(13) }]}>Levels</Text>
                </View>
              </View>
            </View>



          <TouchableOpacity
            style={styles.importButton}
            onPress={() => {
              if (checkPermission && checkPermission('canSyncSyllabus')) {
                router.push('/syllabus-parser');
              } else {
                setShowUpgradeModal(true);
              }
            }}
          >
            <Clock size={20} color={colors.primary} />
            <Text style={styles.importButtonText}>Import Syllabus</Text>
            {isTrialActive && isTrialActive() && (
              <View style={styles.trialBadge}>
                <Sparkles size={12} color={colors.premium} />
                <Text style={styles.trialBadgeText}>Premium</Text>
              </View>
            )}
            {!checkPermission('canSyncSyllabus') && (
              <Sparkles size={16} color={colors.premium} style={{ marginLeft: 'auto' }} />
            )}
          </TouchableOpacity>
        </View>


        <View style={styles.quoteSection}>
          <Text style={[styles.quoteText, { fontSize: normalize(15) }]}>&ldquo;{currentQuote}&rdquo;</Text>
        </View>

        {upcomingTasks.length > 0 && (
          <View style={styles.tasksSection}>
            <View style={styles.tasksSectionHeader}>
              <Text style={[styles.sectionTitle, { fontSize: normalize(20) }]}>
                <Text style={{ fontWeight: '800' }}>Tasks</Text>
                <Text style={{ fontWeight: '400' }}> - Don't let deadlines sneak up on you!</Text>
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
                <Text style={[styles.viewAllText, { fontSize: normalize(14) }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={isTablet ? styles.taskListTablet : null}>
              {upcomingTasks
                .filter(task => task.id) 
                .map((task, index) => (
                  <TouchableOpacity
                    key={`${task.id}-${index}`}
                    style={[styles.taskCard, isTablet && styles.taskCardTablet]}
                    onPress={() => router.push('/(tabs)/tasks')}
                  >
                    <View style={[styles.taskIcon, { backgroundColor: colors.taskColors[task.type] }]}>
                      {task.completed ? (
                        <CheckCircle size={20} color={colors.surface} />
                      ) : (
                        <Circle size={20} color={colors.surface} />
                      )}
                    </View>
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, { fontSize: normalize(15) }]} numberOfLines={1}>
                        {task.description}
                      </Text>
                      <View style={styles.taskMeta}>
                        <View style={[styles.typeBadge, { backgroundColor: colors.taskColors[task.type] + '20' }]}>
                          <Text style={[styles.typeBadgeText, { color: colors.taskColors[task.type], fontSize: normalize(10) }]}>
                            {task.type}
                          </Text>
                        </View>
                        {task.className && (
                          <Text style={[styles.taskClass, { fontSize: normalize(11) }]}>{task.className}</Text>
                        )}
                      </View>
                      <View style={styles.taskDateRow}>
                        <Clock size={12} color={colors.textLight} />
                        <Text style={[styles.taskDate, { fontSize: normalize(11) }]}>
                          {getDaysUntil(task.dueDate)}
                          {task.dueTime && ` at ${formatStringTime12H(task.dueTime)}`}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.priorityDot, { backgroundColor: colors.priorityColors[task.priority] }]} />
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}

        {/* Classes widget */}
        {activeWidgets.has('classes') && (
          <View style={styles.classesSection}>
            <View style={styles.classesSectionHeader}>
              <Text style={[styles.sectionTitle, { fontSize: normalize(20), textAlign: 'left' }]}>
                <Text style={{ fontWeight: '800' }}>My Classes</Text>
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/classes')}>
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
                  onPress={() => router.push('/(tabs)/classes')}
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
                  onPress={() => router.push('/(tabs)/classes')}
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
        )}

        {/* Notes widget */}
        {activeWidgets.has('notes') && (
          <View style={styles.notesSection}>
            <View style={styles.notesSectionHeader}>
              <Text style={[styles.sectionTitle, { fontSize: normalize(20), textAlign: 'left' }]}>
                <Text style={{ fontWeight: '800' }}>My Notes</Text>
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/notes')}>
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
                  onPress={() => router.push('/(tabs)/notes')}
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
                  onPress={() => router.push('/(tabs)/notes')}
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
        )}

        {/* Customize section */}
        <View style={[styles.customizeSection, { width: width - 40 }]}>
          {/* Top half — icon + title, pinned to bottom edge of this half */}
          <View style={styles.customizeTop}>
            <View style={styles.customizeIconWrap}>
              <LayoutGrid size={20} color={colors.primary} />
            </View>
            <Text style={[styles.customizeTitle, { fontSize: normalize(17) }]}>Customize Your{'\n'}Experience</Text>
          </View>

          {/* Button — sits at the exact vertical centre */}
          <TouchableOpacity style={styles.customizeAddButton} activeOpacity={0.8} onPress={() => setShowWidgetSheet(true)}>
            <Plus size={28} color="white" />
          </TouchableOpacity>

          {/* Bottom half — subtitle, pinned to top edge of this half */}
          <View style={styles.customizeBottom}>
            <Text style={[styles.customizeSubtitle, { fontSize: normalize(12) }]}>Add widgets to personalize{'\n'}your home screen</Text>
          </View>
        </View>

      </ScrollView>
      </ResponsiveContainer>


      {showTour && (
        <OnboardingTour
          visible={showTour}
          onComplete={completeTour}
        />
      )}

      <WidgetBottomSheet
        visible={showWidgetSheet}
        onClose={() => setShowWidgetSheet(false)}
        onConfirm={handleWidgetsConfirm}
      />

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Syllabus Parser"
        message="Automatically import your assignments and exams from your syllabus with the premium plan!"
      />

      <DailyStreakModal
        visible={showDailyModal}
        streakCount={modalStreakCount}
        onClose={() => setShowDailyModal(false)}
      />

      <TrialCountdownModal
        visible={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        daysRemaining={getTrialDaysRemaining ? getTrialDaysRemaining() : 0}
        onUpgrade={() => {
          setShowTrialModal(false);
          router.push('/(tabs)/account');
        }}
      />
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    // paddingBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
  },
  retryButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontWeight: '700',
    color: colors.text,
    textAlign: 'left',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statBoxTablet: {
    padding: 16,
    borderRadius: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 1,
    textAlign: 'center',
  },
  tasksSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tasksSectionHeader: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
    textAlign: "right",
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskListTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  taskCardTablet: {
    width: '48%', // 2 columns
    marginBottom: 0,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  taskClass: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  taskDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDate: {
    fontSize: 11,
    color: colors.textLight,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  quoteSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  importButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.premium + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    gap: 4,
  },
  trialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.premium,
  },
  customizeSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    aspectRatio: 1,
    borderWidth: 1.5,
    borderColor: colors.primary + '25',
    backgroundColor: colors.primary + '08',
    alignItems: 'center',
    padding: 24,
  },
  customizeTop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
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
  customizeBottom: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
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

