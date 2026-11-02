import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Category } from "@/data/questions";
import { useColors } from "@/hooks/useColors";

interface Props {
  category: Category;
  completed: number;
  correct: number;
  total: number;
  onPress: () => void;
}

export function CategoryCard({ category, completed, correct, total, onPress }: Props) {
  const colors = useColors();
  const percentage = completed > 0 ? Math.round((correct / completed) * 100) : 0;
  const progressWidth = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconBadge, { backgroundColor: category.color + "18" }]}>
        <Feather name={category.icon as any} size={22} color={category.color} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {category.title}
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={1}>
          {category.description}
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: category.color,
                  width: `${progressWidth}%` as any,
                },
              ]}
            />
          </View>
          <Text style={[styles.statsText, { color: colors.mutedForeground }]}>
            {completed}/{total}
          </Text>
          {completed > 0 && (
            <Text style={[styles.percentText, { color: category.color }]}>
              {percentage}%
            </Text>
          )}
        </View>
      </View>

      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  description: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  statsText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  percentText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    minWidth: 30,
    textAlign: "right",
  },
});
