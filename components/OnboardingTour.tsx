import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    GraduationCap,
    ListChecks,
    Target,
    Sparkles,
    User,
    Flame,
} from 'lucide-react-native';
import colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface OnboardingTourProps {
    visible: boolean;
    onComplete: () => void;
}

interface Step {
    key: string;
    iconName: string;
    iconBg: string;
    title: string;
    description: string;
    tabHint: string | null;
}

const STEPS: Step[] = [
    {
        key: 'welcome',
        iconName: 'welcome',
        iconBg: colors.primary,
        title: 'Welcome to Cause Planner!',
        description: "Your all-in-one student productivity companion. Let's take a quick tour of everything you can do.",
        tabHint: null,
    },
    {
        key: 'tasks',
        iconName: 'tasks',
        iconBg: '#2563EB',
        title: 'Tasks',
        description: 'Create and manage all your assignments, exams, homework, and events. Set due dates, priorities, and reminders so you never miss a deadline.',
        tabHint: 'Find it: Tasks tab →',
    },
    {
        key: 'goals',
        iconName: 'goals',
        iconBg: '#10B981',
        title: 'Goals',
        description: 'Set long-term goals and break them into sub tasks. Check off sub tasks daily to build consistency and achieve what matters most to you.',
        tabHint: 'Find it: Goals tab →',
    },
    {
        key: 'ai',
        iconName: 'ai',
        iconBg: '#8B5CF6',
        title: 'AI Study Buddy',
        description: 'Chat with your personal AI assistant. Get help studying, summarize notes, plan your week, or just ask any question you have.',
        tabHint: 'Find it: AI Buddy tab →',
    },
    {
        key: 'account',
        iconName: 'account',
        iconBg: '#F59E0B',
        title: 'Account & Settings',
        description: 'Manage your profile, view your subscription plan, and configure the app to your preferences.',
        tabHint: 'Find it: Account tab →',
    },
    {
        key: 'streak',
        iconName: 'streak',
        iconBg: '#EF4444',
        title: 'Streaks & Rewards',
        description: 'Earn points for daily check-ins and completing tasks. Build streaks, hit milestones, and level up as you grow your productivity!',
        tabHint: 'Find it: Home screen dashboard',
    },
];

function StepIcon({ iconName, size }: { iconName: string; size: number }) {
    const props = { size, color: 'white' };
    switch (iconName) {
        case 'welcome': return <GraduationCap {...props} />;
        case 'tasks':   return <ListChecks {...props} />;
        case 'goals':   return <Target {...props} />;
        case 'ai':      return <Sparkles {...props} />;
        case 'account': return <User {...props} />;
        case 'streak':  return <Flame {...props} />;
        default:        return <GraduationCap {...props} />;
    }
}

export default function OnboardingTour({ visible, onComplete }: OnboardingTourProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList<Step>>(null);

    useEffect(() => {
        if (visible) {
            setCurrentIndex(0);
            // Reset FlatList scroll position to first slide
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: 0, animated: false });
            }, 0);
        }
    }, [visible]);

    const goToNext = () => {
        if (currentIndex < STEPS.length - 1) {
            const next = currentIndex + 1;
            setCurrentIndex(next);
            flatListRef.current?.scrollToIndex({ index: next, animated: true });
        } else {
            onComplete();
        }
    };

    const currentStep = STEPS[currentIndex];
    const isLast = currentIndex === STEPS.length - 1;

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onComplete}
        >
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.stepCounter}>{currentIndex + 1} / {STEPS.length}</Text>
                    <TouchableOpacity
                        onPress={onComplete}
                        style={styles.skipButton}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </View>

                {/* Slides */}
                <FlatList
                    ref={flatListRef}
                    data={STEPS}
                    horizontal
                    pagingEnabled
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.key}
                    getItemLayout={(_, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                    renderItem={({ item }) => (
                        <View style={styles.slide}>
                            <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
                                <StepIcon iconName={item.iconName} size={52} />
                            </View>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                            {item.tabHint && (
                                <View style={[styles.tabHintBadge, { borderColor: item.iconBg }]}>
                                    <Text style={[styles.tabHintText, { color: item.iconBg }]}>
                                        {item.tabHint}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                    style={styles.flatList}
                />

                {/* Progress dots */}
                <View style={styles.dotsRow}>
                    {STEPS.map((step, i) => (
                        <View
                            key={step.key}
                            style={[
                                styles.dot,
                                i === currentIndex
                                    ? [styles.dotActive, { backgroundColor: currentStep.iconBg }]
                                    : styles.dotInactive,
                            ]}
                        />
                    ))}
                </View>

                {/* CTA button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.nextButton, { backgroundColor: currentStep.iconBg }]}
                        onPress={goToNext}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.nextText}>
                            {isLast ? "Let's Go! 🚀" : 'Next →'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
    },
    stepCounter: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    skipButton: {
        paddingVertical: 4,
    },
    skipText: {
        fontSize: 15,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    flatList: {
        flex: 1,
    },
    slide: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 36,
        paddingBottom: 20,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: 28,
    },
    tabHintBadge: {
        borderWidth: 1.5,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    tabHintText: {
        fontSize: 14,
        fontWeight: '700',
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 20,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        width: 24,
    },
    dotInactive: {
        width: 8,
        backgroundColor: '#E2E8F0',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 8,
    },
    nextButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    nextText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
