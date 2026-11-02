import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface QuizProgress {
  [categoryId: string]: {
    completed: string[];
    correct: string[];
  };
}

interface QuizProgressContextValue {
  progress: QuizProgress;
  loaded: boolean;
  markAnswer: (categoryId: string, questionId: string, correct: boolean) => void;
  resetCategory: (categoryId: string) => void;
  resetAll: () => void;
  getCategoryStats: (
    categoryId: string,
    totalQuestions: number
  ) => { completed: number; correct: number; total: number; percentage: number };
}

const STORAGE_KEY = "@nursing_quiz_progress";

const QuizProgressContext = createContext<QuizProgressContextValue | null>(null);

export function QuizProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<QuizProgress>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProgress(JSON.parse(raw));
    } catch {
      setProgress({});
    }
    setLoaded(true);
  }, []);

  const markAnswer = useCallback((categoryId: string, questionId: string, correct: boolean) => {
    setProgress((prev) => {
      const cat = prev[categoryId] ?? { completed: [], correct: [] };
      const completed = cat.completed.includes(questionId) ? cat.completed : [...cat.completed, questionId];
      const correctList = correct && !cat.correct.includes(questionId) ? [...cat.correct, questionId] : cat.correct;
      const updated = { ...prev, [categoryId]: { completed, correct: correctList } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetCategory = useCallback((categoryId: string) => {
    setProgress((prev) => {
      const updated = { ...prev, [categoryId]: { completed: [], correct: [] } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetAll = useCallback(() => {
    setProgress({});
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
  }, []);

  const getCategoryStats = useCallback(
    (categoryId: string, totalQuestions: number) => {
      const cat = progress[categoryId] ?? { completed: [], correct: [] };
      return {
        completed: cat.completed.length,
        correct: cat.correct.length,
        total: totalQuestions,
        percentage: cat.completed.length > 0 ? Math.round((cat.correct.length / cat.completed.length) * 100) : 0,
      };
    },
    [progress]
  );

  return (
    <QuizProgressContext.Provider value={{ progress, loaded, markAnswer, resetCategory, resetAll, getCategoryStats }}>
      {children}
    </QuizProgressContext.Provider>
  );
}

export function useQuizProgress(): QuizProgressContextValue {
  const ctx = useContext(QuizProgressContext);
  if (!ctx) throw new Error("useQuizProgress must be used within QuizProgressProvider");
  return ctx;
}
