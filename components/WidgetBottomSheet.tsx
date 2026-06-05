import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
} from 'react-native';
import { BookOpen, FileText, Target, CalendarDays, X, Check } from 'lucide-react-native';
import colors from '@/constants/colors';

const SHEET_HEIGHT = 460;

interface WidgetItem {
    key: string;
    label: string;
    iconBg: string;
    Icon: React.ComponentType<{ size: number; color: string }>;
}

const WIDGETS_ROW1: WidgetItem[] = [
    { key: 'classes',  label: 'Classes',  iconBg: '#2563EB', Icon: BookOpen },
    { key: 'notes',    label: 'Notes',    iconBg: '#10B981', Icon: FileText },
    { key: 'goals',    label: 'Goals',    iconBg: '#F59E0B', Icon: Target },
];

const WIDGETS_ROW2: WidgetItem[] = [
    { key: 'calendar', label: 'Calendar', iconBg: '#EF4444', Icon: CalendarDays },
];

interface WidgetBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (selectedKeys: string[]) => void;
    activeWidgets?: Set<string>;
}

function WidgetCell({
    widget,
    isSelected,
    onPress,
}: {
    widget: WidgetItem;
    isSelected: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.widgetItem} onPress={onPress} activeOpacity={0.75}>
            <View style={[
                styles.widgetIconCircle,
                { backgroundColor: widget.iconBg + '18' },
                isSelected && { borderWidth: 2.5, borderColor: widget.iconBg },
            ]}>
                <widget.Icon size={26} color={widget.iconBg} />
                {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: widget.iconBg }]}>
                        <Check size={9} color="white" strokeWidth={3} />
                    </View>
                )}
            </View>
            <Text style={[styles.widgetLabel, isSelected && { color: widget.iconBg }]}>
                {widget.label}
            </Text>
        </TouchableOpacity>
    );
}

export default function WidgetBottomSheet({ visible, onClose, onConfirm, activeWidgets }: WidgetBottomSheetProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    // Step 1: when parent opens, pre-populate with already-active widgets, then mount Modal
    useEffect(() => {
        if (visible) {
            setSelectedKeys(new Set(activeWidgets));
            translateY.setValue(SHEET_HEIGHT);
            backdropOpacity.setValue(0);
            setModalVisible(true);
        }
    }, [visible]);

    // Step 2: once Modal is mounted, animate it in
    useEffect(() => {
        if (!modalVisible) return;
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 4,
                speed: 14,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start();
    }, [modalVisible]);

    // Animate out first, then hide Modal and notify parent
    const handleClose = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: SHEET_HEIGHT,
                duration: 220,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setModalVisible(false);
            onClose();
        });
    }, [onClose]);

    const toggleWidget = useCallback((key: string) => {
        setSelectedKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    const selectionCount = selectedKeys.size;

    return (
        <Modal
            visible={modalVisible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={handleClose}>
                <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
            </TouchableWithoutFeedback>

            {/* Sheet */}
            <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                {/* Handle */}
                <View style={styles.handleBar} />

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Add Widgets</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <X size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.headerSubtitle}>Tap to select widgets for your home screen</Text>

                {/* Grid — row 1: 3 items, row 2: 2 items centered */}
                <View style={styles.grid}>
                    <View style={styles.gridRow}>
                        {WIDGETS_ROW1.map((widget) => (
                            <WidgetCell
                                key={widget.key}
                                widget={widget}
                                isSelected={selectedKeys.has(widget.key)}
                                onPress={() => toggleWidget(widget.key)}
                            />
                        ))}
                    </View>
                    <View style={[styles.gridRow, styles.gridRowCentered]}>
                        {WIDGETS_ROW2.map((widget) => (
                            <WidgetCell
                                key={widget.key}
                                widget={widget}
                                isSelected={selectedKeys.has(widget.key)}
                                onPress={() => toggleWidget(widget.key)}
                            />
                        ))}
                    </View>
                </View>

                {/* Footer — count + Done button */}
                <View style={styles.footer}>
                    <Text style={styles.selectionCount}>
                        {selectionCount > 0
                            ? `${selectionCount} widget${selectionCount > 1 ? 's' : ''} selected`
                            : 'None selected'}
                    </Text>
                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={() => {
                            onConfirm(Array.from(selectedKeys));
                            handleClose();
                        }}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SHEET_HEIGHT,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 12,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
    },
    closeButton: {
        padding: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 28,
    },
    grid: {
        gap: 20,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gridRowCentered: {
        justifyContent: 'center',
        gap: 32,
    },
    widgetItem: {
        width: '28%',
        alignItems: 'center',
        gap: 8,
    },
    widgetIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    widgetLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 28,
    },
    selectionCount: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    doneButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 14,
    },
    doneButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
