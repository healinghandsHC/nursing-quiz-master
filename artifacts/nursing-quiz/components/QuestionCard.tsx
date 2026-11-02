import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Question } from "@/data/questions";
import { useColors } from "@/hooks/useColors";

interface Props {
  question: Question;
  questionNumber: number;
  totalQuestions: number | "CAT";
  categoryColor: string;
  onAnswer: (correct: boolean) => void;
  isCAT?: boolean;
  ability?: number;
}

const DIFFICULTY_ICONS: Record<string, string> = {
  easy: "battery-charging",
  medium: "zap",
  hard: "alert-triangle",
};

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  categoryColor,
  onAnswer,
  isCAT = false,
}: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Animations
  const cardAnim = useRef(new Animated.Value(0)).current;
  const optionAnims = useRef(
    question.options.map(() => new Animated.Value(0))
  ).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const correctFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger entrance animations
    Animated.spring(cardAnim, {
      toValue: 1,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
    optionAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        delay: 80 + i * 60,
        useNativeDriver: true,
      }).start();
    });
  }, [question.id]);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    const correct = index === question.correctIndex;

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(correctFlash, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(correctFlash, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(feedbackAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(feedbackAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(feedbackAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(feedbackAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleNext = () => {
    if (selected === null) return;
    const correct = selected === question.correctIndex;
    // Save the answer immediately — do not defer inside the animation callback
    onAnswer(correct);
    // Animate out concurrently
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setSelected(null);
      setShowExplanation(false);
    });
  };

  const getOptionStyle = (index: number) => {
    if (selected === null) return { borderColor: colors.border, backgroundColor: colors.card };
    if (index === question.correctIndex)
      return { borderColor: colors.success, backgroundColor: colors.success + "14" };
    if (index === selected && selected !== question.correctIndex)
      return { borderColor: colors.destructive, backgroundColor: colors.destructive + "10" };
    return { borderColor: colors.border, backgroundColor: colors.card };
  };

  const difficultyColor =
    question.difficulty === "easy"
      ? colors.success
      : question.difficulty === "medium"
      ? "#f59e0b"
      : colors.destructive;

  const difficultyIcon = DIFFICULTY_ICONS[question.difficulty] ?? "zap";

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: cardAnim,
          transform: [
            {
              translateX: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
            },
            { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
          ],
        },
      ]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row */}
        <View style={styles.meta}>
          <Text style={[styles.questionCount, { color: colors.mutedForeground }]}>
            {isCAT ? `Q${questionNumber}` : `Question ${questionNumber} of ${totalQuestions}`}
          </Text>
          <View style={[styles.difficultyChip, { backgroundColor: difficultyColor + "18", borderColor: difficultyColor + "40" }]}>
            <Feather name={difficultyIcon as any} size={11} color={difficultyColor} />
            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
              {question.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Question text */}
        <Text style={[styles.questionText, { color: colors.foreground }]}>
          {question.text}
        </Text>

        {/* Options */}
        <View style={styles.options}>
          {question.options.map((option, index) => {
            const isCorrect = selected !== null && index === question.correctIndex;
            const isWrong = selected === index && selected !== question.correctIndex;

            return (
              <Animated.View
                key={index}
                style={{
                  opacity: optionAnims[index],
                  transform: [
                    {
                      translateY: optionAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                }}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    getOptionStyle(index),
                    pressed && selected === null && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={() => handleSelect(index)}
                  disabled={selected !== null}
                >
                  <View
                    style={[
                      styles.optionBullet,
                      {
                        backgroundColor: isCorrect
                          ? colors.success
                          : isWrong
                          ? colors.destructive
                          : selected !== null
                          ? colors.muted
                          : categoryColor + "18",
                        borderColor: isCorrect
                          ? colors.success
                          : isWrong
                          ? colors.destructive
                          : categoryColor + "50",
                      },
                    ]}
                  >
                    {isCorrect ? (
                      <Feather name="check" size={14} color="#fff" />
                    ) : isWrong ? (
                      <Feather name="x" size={14} color="#fff" />
                    ) : (
                      <Text style={[styles.optionBulletText, {
                        color: selected !== null ? colors.mutedForeground : categoryColor,
                      }]}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isCorrect
                          ? colors.success
                          : isWrong
                          ? colors.destructive
                          : colors.foreground,
                        fontFamily: isCorrect || isWrong ? "Inter_600SemiBold" : "Inter_400Regular",
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Post-answer section */}
        {selected !== null && (
          <Animated.View style={{ opacity: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1] }) }}>
            {/* Explanation toggle */}
            <Pressable
              onPress={() => setShowExplanation((v) => !v)}
              style={[styles.explanationToggle, { borderColor: categoryColor + "60", backgroundColor: categoryColor + "08" }]}
            >
              <Feather name="book-open" size={13} color={categoryColor} />
              <Text style={[styles.explanationToggleText, { color: categoryColor }]}>
                {showExplanation ? "Hide" : "Read"} Clinical Rationale
              </Text>
              <Feather name={showExplanation ? "chevron-up" : "chevron-down"} size={13} color={categoryColor} />
            </Pressable>

            {showExplanation && (
              <View style={[styles.explanation, { backgroundColor: categoryColor + "08", borderColor: categoryColor + "25" }]}>
                <Text style={[styles.explanationText, { color: colors.foreground }]}>
                  {question.explanation}
                </Text>
              </View>
            )}

            {/* Next button */}
            <Pressable
              style={({ pressed }) => [
                styles.nextButton,
                { backgroundColor: categoryColor, opacity: pressed ? 0.88 : 1 },
              ]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {isCAT ? "Next Question" : (questionNumber === (totalQuestions as number) ? "See Results" : "Next Question")}
              </Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 60,
    gap: 16,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionCount: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  difficultyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
  },
  questionText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 25,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  optionBullet: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionBulletText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  explanationToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  explanationToggleText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  explanation: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  explanationText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
