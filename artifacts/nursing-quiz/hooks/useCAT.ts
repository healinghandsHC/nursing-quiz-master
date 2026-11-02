import { useCallback, useRef, useState } from "react";

import type { Question } from "@/data/questions";

// IRT difficulty b-parameters (theta scale)
const DIFFICULTY_B: Record<string, number> = {
  easy: -1.0,
  medium: 0.0,
  hard: 1.0,
};

// How much theta shifts per answer (simplified EAP update)
const THETA_DELTA: Record<string, { correct: number; wrong: number }> = {
  easy:   { correct: 0.25, wrong: -0.70 },
  medium: { correct: 0.45, wrong: -0.45 },
  hard:   { correct: 0.70, wrong: -0.25 },
};

const THETA_MIN = -2.5;
const THETA_MAX = 2.5;
const MIN_QUESTIONS = 5;

export type CATStatus =
  | "calibrating"   // first few questions
  | "adapting"      // algorithm is finding your level
  | "confirming"    // near the end, high confidence
  | "complete";

export interface AnswerRecord {
  questionId: string;
  correct: boolean;
  difficulty: string;
  thetaBefore: number;
  thetaAfter: number;
}

// Probability of correct answer at given theta for item with difficulty b
function prob(theta: number, b: number): number {
  return 1 / (1 + Math.exp(-(theta - b)));
}

// Fisher information at current theta for an item
function information(theta: number, b: number): number {
  const p = prob(theta, b);
  return p * (1 - p);
}

// Convert theta [-2.5, 2.5] to 0-100 ability score
export function thetaToAbility(theta: number): number {
  return Math.round(((theta - THETA_MIN) / (THETA_MAX - THETA_MIN)) * 100);
}

export function abilityToLabel(ability: number): string {
  if (ability >= 82) return "Advanced";
  if (ability >= 66) return "Proficient";
  if (ability >= 50) return "Developing";
  if (ability >= 34) return "Emerging";
  return "Foundational";
}

export function abilityToPassLikelihood(ability: number): string {
  if (ability >= 75) return "High pass likelihood";
  if (ability >= 55) return "Borderline — review weak areas";
  return "More practice recommended";
}

interface CATState {
  theta: number;
  answered: Set<string>;
  records: AnswerRecord[];
  questionCount: number;
}

export function useCAT(questions: Question[], previouslyAnswered: Set<string> = new Set()) {
  // Pool of questions not yet answered in prior sessions
  const freshPool = questions.filter((q) => !previouslyAnswered.has(q.id));
  // Fall back to full pool if all questions already covered
  const startPool = freshPool.length > 0 ? freshPool : questions;

  const state = useRef<CATState>({
    theta: 0,
    answered: new Set(previouslyAnswered),
    records: [],
    questionCount: 0,
  });

  const [theta, setTheta] = useState(0);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
    () => selectNextQuestion(startPool, new Set(previouslyAnswered), 0)
  );
  const [status, setStatus] = useState<CATStatus>("calibrating");
  const [finished, setFinished] = useState(false);

  const selectNext = useCallback(
    (answeredSet: Set<string>, currentTheta: number): Question | null => {
      return selectNextQuestion(questions, answeredSet, currentTheta);
    },
    [questions]
  );

  const updateStatus = useCallback(
    (count: number, total: number): CATStatus => {
      if (count < 3) return "calibrating";
      if (count < Math.floor(total * 0.6)) return "adapting";
      if (count < total) return "confirming";
      return "complete";
    },
    []
  );

  const submitAnswer = useCallback(
    (correct: boolean) => {
      const s = state.current;
      if (!currentQuestion) return;

      const diff = currentQuestion.difficulty;
      const delta = THETA_DELTA[diff];
      const thetaBefore = s.theta;
      const thetaAfter = Math.max(
        THETA_MIN,
        Math.min(THETA_MAX, s.theta + (correct ? delta.correct : delta.wrong))
      );

      const record: AnswerRecord = {
        questionId: currentQuestion.id,
        correct,
        difficulty: diff,
        thetaBefore,
        thetaAfter,
      };

      s.theta = thetaAfter;
      s.answered.add(currentQuestion.id);
      s.records = [...s.records, record];
      s.questionCount += 1;

      setTheta(thetaAfter);
      setRecords([...s.records]);

      const newStatus = updateStatus(s.questionCount, questions.length);
      setStatus(newStatus);

      // Check stopping criteria: all questions answered OR max reached
      const remaining = questions.filter((q) => !s.answered.has(q.id));
      if (remaining.length === 0 || s.questionCount >= questions.length) {
        setFinished(true);
        setCurrentQuestion(null);
        return;
      }

      // Early termination: high confidence after minimum questions
      if (s.questionCount >= MIN_QUESTIONS) {
        const ability = thetaToAbility(thetaAfter);
        const stdErr = standardError(s.records);
        if (stdErr < 0.35 && (ability >= 78 || ability <= 28)) {
          setFinished(true);
          setCurrentQuestion(null);
          return;
        }
      }

      const next = selectNextQuestion(remaining, s.answered, thetaAfter);
      setCurrentQuestion(next);
    },
    [currentQuestion, questions, updateStatus]
  );

  const reset = useCallback(() => {
    // On explicit retry, start fresh from the full question pool
    state.current = {
      theta: 0,
      answered: new Set(),
      records: [],
      questionCount: 0,
    };
    setTheta(0);
    setRecords([]);
    setStatus("calibrating");
    setFinished(false);
    setCurrentQuestion(selectNextQuestion(questions, new Set(), 0));
  }, [questions]);

  return {
    currentQuestion,
    theta,
    ability: thetaToAbility(theta),
    status,
    finished,
    records,
    questionCount: state.current.questionCount,
    totalQuestions: questions.length,
    submitAnswer,
    reset,
  };
}

// Select question maximizing Fisher information at current theta
function selectNextQuestion(
  available: Question[],
  answered: Set<string>,
  theta: number
): Question | null {
  const pool = available.filter((q) => !answered.has(q.id));
  if (pool.length === 0) return null;

  // For first 2 questions, always start with medium
  if (answered.size === 0) {
    const mediums = pool.filter((q) => q.difficulty === "medium");
    if (mediums.length > 0) {
      return mediums[Math.floor(Math.random() * mediums.length)];
    }
  }

  // Select item with maximum information at current theta
  let best: Question = pool[0];
  let bestInfo = -Infinity;

  for (const q of pool) {
    const b = DIFFICULTY_B[q.difficulty] ?? 0;
    const info = information(theta, b);
    // Add small random jitter to prevent always picking same difficulty
    const jitter = Math.random() * 0.02;
    if (info + jitter > bestInfo) {
      bestInfo = info + jitter;
      best = q;
    }
  }

  return best;
}

// Estimate standard error from answer history
function standardError(records: AnswerRecord[]): number {
  if (records.length < 3) return 1.0;
  // Simplified: based on consistency of recent answers
  const recent = records.slice(-4);
  const correctCount = recent.filter((r) => r.correct).length;
  const inconsistency = Math.abs(correctCount - recent.length / 2) / recent.length;
  return Math.max(0.1, 0.8 - inconsistency * 0.8 - records.length * 0.05);
}
