import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AbilityMeter } from "@/components/AbilityMeter";
import { QuestionCard } from "@/components/QuestionCard";
import { ResultScreen } from "@/components/ResultScreen";
import { getCategoryById } from "@/data/questions";
import { useCAT } from "@/hooks/useCAT";
import { useColors } from "@/hooks/useColors";
import { useQuizProgress } from "@/hooks/useQuizProgress";

export default function QuizScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const colors = useColors();
  const { progress, loaded } = useQuizProgress();

  // Capture the initial completed set ONCE when progress first loads.
  // This snapshot is passed to QuizContent so the CAT engine knows which
  // questions were already answered in previous sessions.
  const initialProgressRef = useRef<{ completed: string[] } | null>(null);
  if (loaded && initialProgressRef.current === null) {
    initialProgressRef.current = {
      completed: [...(progress[categoryId]?.completed ?? [])],
    };
  }

  if (!loaded || initialProgressRef.current === null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <QuizContent
      key={categoryId + "-" + initialProgressRef.current.completed.length}
      categoryId={categoryId}
      initialCompleted={initialProgressRef.current.completed}
    />
  );
}

interface QuizContentProps {
  categoryId: string;
  initialCompleted: string[];
}

function QuizContent({ categoryId, initialCompleted }: QuizContentProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { markAnswer, resetCategory } = useQuizProgress();

  const category = getCategoryById(categoryId);
  const questions = category?.questions ?? [];

  // Stable set of previously answered question IDs (from prior sessions)
  const previouslyAnswered = new Set<string>(initialCompleted);
  const cat = useCAT(questions, previouslyAnswered);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }).start();
  }, [categoryId]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (!cat.currentQuestion) return;
      markAnswer(categoryId, cat.currentQuestion.id, correct);
      cat.submitAnswer(correct);
    },
    [cat, categoryId, markAnswer]
  );

  if (!category) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Category not found</Text>
      </View>
    );
  }

  const correctCount = cat.records.filter((r) => r.correct).length;

  if (cat.finished) {
    return (
      <ResultScreen
        correct={correctCount}
        total={cat.records.length}
        categoryTitle={category.title}
        categoryColor={category.color}
        ability={cat.ability}
        records={cat.records}
        isCAT
        onRetry={() => { resetCategory(categoryId); cat.reset(); }}
        onHome={() => router.back()}
      />
    );
  }

  const prevTheta = cat.records.length > 0 ? cat.records[cat.records.length - 1].thetaBefore : 0;
  const thetaDelta = cat.theta - prevTheta;
  const sessionTotal = questions.length - previouslyAnswered.size;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top > 0 ? 0 : 8,
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
          },
        ]}
      >
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.muted }]}
          >
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>

          <View style={[styles.catChip, { backgroundColor: category.color + "15", borderColor: category.color + "40" }]}>
            <View style={[styles.catDot, { backgroundColor: category.color }]} />
            <Text style={[styles.catLabel, { color: category.color }]}>
              CAT · {category.title}
            </Text>
          </View>

          <Text style={[styles.qCounter, { color: colors.mutedForeground }]}>
            {cat.questionCount + 1}/{sessionTotal > 0 ? sessionTotal : questions.length}
          </Text>
        </View>

        <AbilityMeter
          ability={cat.ability}
          status={cat.status}
          categoryColor={category.color}
          thetaDelta={thetaDelta}
        />
      </Animated.View>

      {cat.currentQuestion && (
        <QuestionCard
          key={cat.currentQuestion.id}
          question={cat.currentQuestion}
          questionNumber={cat.questionCount + 1}
          totalQuestions="CAT"
          categoryColor={category.color}
          onAnswer={handleAnswer}
          isCAT
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  qCounter: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flexShrink: 0,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
