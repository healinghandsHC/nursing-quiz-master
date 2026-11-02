import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { AnswerRecord } from "@/hooks/useCAT";
import { abilityToLabel, abilityToPassLikelihood } from "@/hooks/useCAT";
import { useColors } from "@/hooks/useColors";

interface Props {
  correct: number;
  total: number;
  categoryTitle: string;
  categoryColor: string;
  ability?: number;
  records?: AnswerRecord[];
  isCAT?: boolean;
  onRetry: () => void;
  onHome: () => void;
}

export function ResultScreen({
  correct,
  total,
  categoryTitle,
  categoryColor,
  ability,
  records = [],
  isCAT = false,
  onRetry,
  onHome,
}: Props) {
  const colors = useColors();
  const percentage = Math.round((correct / total) * 100);
  const displayAbility = ability ?? percentage;

  const circleAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    const isPass = displayAbility >= 67;
    if (isPass) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.sequence([
      Animated.spring(circleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(scoreAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const getGrade = () => {
    if (displayAbility >= 82) return { label: "Advanced", icon: "star" as const };
    if (displayAbility >= 66) return { label: "Proficient", icon: "thumbs-up" as const };
    if (displayAbility >= 50) return { label: "Developing", icon: "trending-up" as const };
    if (displayAbility >= 35) return { label: "Emerging", icon: "refresh-cw" as const };
    return { label: "Foundational", icon: "book" as const };
  };

  const grade = getGrade();
  const passColor =
    displayAbility >= 75
      ? colors.success
      : displayAbility >= 55
      ? "#f59e0b"
      : colors.destructive;

  // Build sparkline of ability trajectory from records
  const abilityHistory = records.map((r) => r.thetaAfter);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Main result card */}
      <Animated.View
        style={[
          styles.resultCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: circleAnim,
            transform: [{ scale: circleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: passColor + "18" }]}>
          <Feather name={grade.icon} size={36} color={passColor} />
        </View>

        <Text style={[styles.gradeLabel, { color: passColor }]}>{grade.label}</Text>
        {isCAT && (
          <Text style={[styles.catBadge, { color: colors.mutedForeground }]}>
            Computer Adaptive Test
          </Text>
        )}

        {/* Score ring */}
        <Animated.View
          style={[
            styles.scoreRing,
            {
              borderColor: passColor,
              backgroundColor: passColor + "0e",
              opacity: scoreAnim,
              transform: [{ scale: scoreAnim }],
            },
          ]}
        >
          {isCAT ? (
            <>
              <Text style={[styles.ringValue, { color: passColor }]}>{displayAbility}</Text>
              <Text style={[styles.ringLabel, { color: colors.mutedForeground }]}>Ability</Text>
            </>
          ) : (
            <>
              <Text style={[styles.ringValue, { color: passColor }]}>{percentage}%</Text>
              <Text style={[styles.ringLabel, { color: colors.mutedForeground }]}>Score</Text>
            </>
          )}
        </Animated.View>

        {/* Pass likelihood */}
        {isCAT && (
          <View style={[styles.passChip, { backgroundColor: passColor + "14", borderColor: passColor + "30" }]}>
            <Feather
              name={displayAbility >= 75 ? "check-circle" : displayAbility >= 55 ? "alert-circle" : "x-circle"}
              size={14}
              color={passColor}
            />
            <Text style={[styles.passText, { color: passColor }]}>
              {abilityToPassLikelihood(displayAbility)}
            </Text>
          </View>
        )}

        {/* Stats row */}
        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{correct}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Correct</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.destructive }]}>{total - correct}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Incorrect</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{total}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Questions</Text>
          </View>
        </View>
      </Animated.View>

      {/* Ability trajectory sparkline */}
      {isCAT && abilityHistory.length > 1 && (
        <Animated.View
          style={[
            styles.trajectoryCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [{ translateY: slideAnim }],
              opacity: scoreAnim,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Ability Trajectory
          </Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            How your estimated ability changed during the test
          </Text>
          <View style={styles.sparkline}>
            {abilityHistory.map((t, i) => {
              const normalised = ((t + 2.5) / 5) * 100;
              const h = Math.max(8, (normalised / 100) * 56);
              const barColor = normalised >= 75 ? colors.success : normalised >= 55 ? "#f59e0b" : colors.destructive;
              return (
                <View key={i} style={[styles.sparkBar, { height: h, backgroundColor: barColor, opacity: 0.8 + (i / abilityHistory.length) * 0.2 }]} />
              );
            })}
          </View>
          <View style={styles.sparkLabels}>
            <Text style={[styles.sparkLabel, { color: colors.mutedForeground }]}>Start</Text>
            <Text style={[styles.sparkLabel, { color: colors.mutedForeground }]}>End</Text>
          </View>
        </Animated.View>
      )}

      {/* Difficulty breakdown */}
      {records.length > 0 && (
        <Animated.View
          style={[
            styles.breakdownCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [{ translateY: slideAnim }],
              opacity: scoreAnim,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Performance by Difficulty
          </Text>
          {(["easy", "medium", "hard"] as const).map((diff) => {
            const dRecords = records.filter((r) => r.difficulty === diff);
            if (dRecords.length === 0) return null;
            const dCorrect = dRecords.filter((r) => r.correct).length;
            const pct = Math.round((dCorrect / dRecords.length) * 100);
            const dColor = diff === "easy" ? colors.success : diff === "medium" ? "#f59e0b" : colors.destructive;
            return (
              <View key={diff} style={styles.breakdownRow}>
                <View style={[styles.diffDot, { backgroundColor: dColor }]} />
                <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Text>
                <View style={[styles.breakdownBar, { backgroundColor: colors.muted }]}>
                  <View style={[styles.breakdownFill, { width: `${pct}%` as any, backgroundColor: dColor }]} />
                </View>
                <Text style={[styles.breakdownPct, { color: dColor }]}>{pct}%</Text>
                <Text style={[styles.breakdownCount, { color: colors.mutedForeground }]}>
                  {dCorrect}/{dRecords.length}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      )}

      {/* Tip */}
      {displayAbility < 67 && (
        <View style={[styles.tipBox, { backgroundColor: colors.warning + "12", borderColor: colors.warning + "30" }]}>
          <Feather name="alert-circle" size={14} color={colors.warning} />
          <Text style={[styles.tipText, { color: colors.foreground }]}>
            The NCLEX passing standard is approximately 67th percentile. Focus on medium and hard questions where you struggled.
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.retryButton, { backgroundColor: categoryColor, opacity: pressed ? 0.88 : 1 }]}
          onPress={onRetry}
        >
          <Feather name="refresh-cw" size={16} color="#fff" />
          <Text style={styles.retryButtonText}>Retake Quiz</Text>
        </Pressable>
        <Pressable
          style={[styles.homeButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={onHome}
        >
          <Feather name="grid" size={16} color={colors.foreground} />
          <Text style={[styles.homeButtonText, { color: colors.foreground }]}>All Categories</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 60, gap: 14 },
  resultCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeLabel: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  catBadge: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: -6,
  },
  scoreRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
  },
  ringValue: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    lineHeight: 34,
  },
  ringLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  passChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  passText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 14,
    width: "100%",
    marginTop: 4,
  },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statDivider: { width: 1 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  trajectoryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -4 },
  sparkline: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 60,
    gap: 3,
    marginTop: 4,
  },
  sparkBar: {
    flex: 1,
    borderRadius: 3,
    minHeight: 8,
  },
  sparkLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sparkLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  breakdownCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  diffDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: {
    width: 60,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  breakdownFill: { height: "100%", borderRadius: 4 },
  breakdownPct: {
    width: 36,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  breakdownCount: {
    width: 30,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  tipBox: {
    flexDirection: "row",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  actions: { gap: 10 },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  retryButtonText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
  },
  homeButtonText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
