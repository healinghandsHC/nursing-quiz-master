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

import { CategoryCard } from "@/components/CategoryCard";
import { categories } from "@/data/questions";
import { useColors } from "@/hooks/useColors";
import { useQuizProgress } from "@/hooks/useQuizProgress";

export default function HomeScreen() {
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPadding + 16,
          paddingBottom:
            Platform.OS === "web" ? 34 + 84 : 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            NCLEX PREP
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Nursing Review
          </Text>
        </View>
        {totalCompleted > 0 && (
          <Pressable
            onPress={resetAll}
            style={[styles.resetBtn, { borderColor: colors.border }]}
          >
            <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {totalCompleted > 0 && (
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" },
          ]}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {totalCompleted}/{totalQuestions}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                Answered
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.primary + "30" }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {totalCorrect}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                Correct
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.primary + "30" }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {overallPercent}%
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                Overall
              </Text>
            </View>
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Subject Categories
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
        {categories.length} subjects · {totalQuestions} NCLEX-style questions
      </Text>

      <View style={styles.categories}>
        {categories.map((category) => {
          const cat = progress[category.id] ?? { completed: [], correct: [] };
          return (
            <CategoryCard
              key={category.id}
              category={category}
              completed={cat.completed.length}
              correct={cat.correct.length}
              total={category.questions.length}
              onPress={() =>
                router.push({
                  pathname: "/quiz/[categoryId]",
                  params: { categoryId: category.id },
                })
              }
            />
          );
        })}
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  categories: {
    gap: 0,
  },
});
