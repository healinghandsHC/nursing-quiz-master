import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { categories } from "@/data/questions";
import { useColors } from "@/hooks/useColors";
import { useQuizProgress } from "@/hooks/useQuizProgress";

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { progress, resetAll } = useQuizProgress();

  const totalQuestions = categories.reduce((sum, c) => sum + c.questions.length, 0);
  const totalCompleted = Object.values(progress).reduce(
    (sum, p) => sum + p.completed.length,
    0
  );
  const totalCorrect = Object.values(progress).reduce(
    (sum, p) => sum + p.correct.length,
    0
  );
  const overallPercent =
    totalCompleted > 0 ? Math.round((totalCorrect / totalCompleted) * 100) : 0;

  const topPadding = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const passColor =
    overallPercent >= 80
      ? colors.success
      : overallPercent >= 67
      ? colors.warning
      : colors.destructive;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPadding + 16,
          paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>
        Progress
      </Text>

      <View
        style={[
          styles.overallCard,
          { backgroundColor: passColor + "10", borderColor: passColor + "30" },
        ]}
      >
        <View style={[styles.scoreCircle, { borderColor: passColor }]}>
          <Text style={[styles.scorePercent, { color: passColor }]}>
            {overallPercent}%
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
            overall
          </Text>
        </View>
        <View style={styles.overallStats}>
          <Text style={[styles.overallTitle, { color: colors.foreground }]}>
            Overall Score
          </Text>
          <Text style={[styles.overallSub, { color: colors.mutedForeground }]}>
            {totalCompleted} of {totalQuestions} questions answered
          </Text>
          <View style={styles.miniStats}>
            <View style={styles.miniStat}>
              <Feather name="check" size={12} color={colors.success} />
              <Text style={[styles.miniStatText, { color: colors.success }]}>
                {totalCorrect} correct
              </Text>
            </View>
            <View style={styles.miniStat}>
              <Feather name="x" size={12} color={colors.destructive} />
              <Text style={[styles.miniStatText, { color: colors.destructive }]}>
                {totalCompleted - totalCorrect} incorrect
              </Text>
            </View>
          </View>
        </View>
      </View>

      {totalCompleted === 0 && (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="book-open" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No progress yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Start answering questions to track your performance across each subject.
          </Text>
          <Pressable
            style={[styles.startBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/")}
          >
            <Text style={styles.startBtnText}>Start Studying</Text>
          </Pressable>
        </View>
      )}

      {totalCompleted > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            By Subject
          </Text>

          {categories.map((category) => {
            const cat = progress[category.id] ?? {
              completed: [],
              correct: [],
            };
            const pct =
              cat.completed.length > 0
                ? Math.round((cat.correct.length / cat.completed.length) * 100)
                : 0;
            const barWidth =
              category.questions.length > 0
                ? (cat.completed.length / category.questions.length) * 100
                : 0;

            return (
              <Pressable
                key={category.id}
                style={[
                  styles.subjectCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/quiz/[categoryId]",
                    params: { categoryId: category.id },
                  })
                }
              >
                <View style={styles.subjectHeader}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: category.color },
                    ]}
                  />
                  <Text
                    style={[styles.subjectTitle, { color: colors.foreground }]}
                  >
                    {category.title}
                  </Text>
                  <Text
                    style={[styles.subjectPct, { color: category.color }]}
                  >
                    {cat.completed.length > 0 ? `${pct}%` : "—"}
                  </Text>
                </View>

                <View
                  style={[styles.bar, { backgroundColor: colors.muted }]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: category.color,
                        width: `${barWidth}%` as any,
                      },
                    ]}
                  />
                </View>

                <View style={styles.subjectStats}>
                  <Text
                    style={[styles.subjectStatText, { color: colors.mutedForeground }]}
                  >
                    {cat.completed.length}/{category.questions.length} answered
                  </Text>
                  {cat.completed.length > 0 && (
                    <Text
                      style={[styles.subjectStatText, { color: colors.mutedForeground }]}
                    >
                      {cat.correct.length} correct
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}

          <Pressable
            style={[styles.resetBtn, { borderColor: colors.border }]}
            onPress={resetAll}
          >
            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
            <Text style={[styles.resetText, { color: colors.mutedForeground }]}>
              Reset All Progress
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
  },
  pageTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  overallCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scorePercent: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  scoreLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  overallStats: {
    flex: 1,
    gap: 4,
  },
  overallTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  overallSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  miniStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  miniStatText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  startBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  subjectCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subjectTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  subjectPct: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  bar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  subjectStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subjectStatText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
