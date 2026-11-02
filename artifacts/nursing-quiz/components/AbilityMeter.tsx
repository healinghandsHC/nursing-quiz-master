import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { abilityToLabel, CATStatus } from "@/hooks/useCAT";
import { useColors } from "@/hooks/useColors";

interface Props {
  ability: number;
  status: CATStatus;
  categoryColor: string;
  thetaDelta?: number;
}

const STATUS_LABELS: Record<CATStatus, string> = {
  calibrating: "Calibrating…",
  adapting: "Adapting to your level",
  confirming: "Confirming ability",
  complete: "Assessment complete",
};

export function AbilityMeter({ ability, status, categoryColor, thetaDelta }: Props) {
  const colors = useColors();
  const animatedWidth = useRef(new Animated.Value(ability)).current;
  const flashAnim = useRef(new Animated.Value(1)).current;
  const prevAbility = useRef(ability);

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: ability,
      useNativeDriver: false,
      tension: 60,
      friction: 8,
    }).start();

    if (thetaDelta !== undefined && thetaDelta !== 0) {
      // Flash animation on delta
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
    prevAbility.current = ability;
  }, [ability, thetaDelta]);

  const meterColor =
    ability >= 75
      ? colors.success
      : ability >= 55
      ? "#f59e0b"
      : ability >= 35
      ? "#f97316"
      : colors.destructive;

  const label = abilityToLabel(ability);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: flashAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.abilityScore, { color: meterColor }]}>
            {ability}
          </Text>
          <Text style={[styles.abilityLabel, { color: colors.mutedForeground }]}>
            {label}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.pulse, { backgroundColor: categoryColor }]} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            {STATUS_LABELS[status]}
          </Text>
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: meterColor,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
                extrapolate: "clamp",
              }),
            },
          ]}
        />
        {/* Zone markers */}
        <View style={[styles.marker, { left: "35%" }]} />
        <View style={[styles.marker, { left: "55%" }]} />
        <View style={[styles.marker, { left: "75%" }]} />
      </View>

      <View style={styles.zoneLabels}>
        <Text style={[styles.zoneLabel, { color: colors.mutedForeground }]}>
          Foundational
        </Text>
        <Text style={[styles.zoneLabel, { color: colors.mutedForeground }]}>
          Proficient
        </Text>
        <Text style={[styles.zoneLabel, { color: colors.mutedForeground }]}>
          Advanced
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  abilityScore: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 28,
  },
  abilityLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    opacity: 0.9,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: "visible",
    position: "relative",
  },
  fill: {
    height: "100%",
    borderRadius: 5,
  },
  marker: {
    position: "absolute",
    top: -2,
    width: 1,
    height: 14,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  zoneLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  zoneLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
  },
});
