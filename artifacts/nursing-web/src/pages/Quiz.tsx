import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, X, BookOpen, Zap, AlertTriangle, Battery } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryById } from "@/data/questions";
import { useCAT, abilityToLabel, abilityToPassLikelihood } from "@/hooks/useCAT";
import { useQuizProgress } from "@/context/QuizProgressContext";

const STATUS_LABELS: Record<string, string> = {
  calibrating: "Calibrating...",
  adapting: "Adapting to your level",
  confirming: "Confirming ability",
  complete: "Complete",
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  easy: { label: "Easy", color: "text-emerald-600", icon: Battery },
  medium: { label: "Medium", color: "text-amber-600", icon: Zap },
  hard: { label: "Hard", color: "text-red-500", icon: AlertTriangle },
};

export default function Quiz() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [, navigate] = useLocation();
  const { progress, loaded, markAnswer, resetCategory } = useQuizProgress();

  // Capture the initial completed set once when progress loads — stable for the whole session
  const initialCompletedRef = useRef<Set<string> | null>(null);
  if (loaded && initialCompletedRef.current === null) {
    initialCompletedRef.current = new Set(progress[categoryId]?.completed ?? []);
  }

  const category = getCategoryById(categoryId ?? "");
  const questions = category?.questions ?? [];

  const cat = useCAT(questions, initialCompletedRef.current ?? new Set());

  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Navigate to results when finished
  useEffect(() => {
    if (cat.finished) {
      navigate(`/results/${categoryId}`);
    }
  }, [cat.finished, categoryId, navigate]);

  if (!loaded || !category) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
  };

  const handleNext = () => {
    if (selected === null || !cat.currentQuestion) return;
    const correct = selected === cat.currentQuestion.correctIndex;
    markAnswer(categoryId!, cat.currentQuestion.id, correct);
    cat.submitAnswer(correct);
    setSelected(null);
    setShowExplanation(false);
  };

  const handleExit = () => navigate("/");

  const question = cat.currentQuestion;
  if (!question) return null;

  const diffConf = DIFFICULTY_CONFIG[question.difficulty] ?? DIFFICULTY_CONFIG.medium;
  const DiffIcon = diffConf.icon;
  const abilityPercent = cat.ability;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleExit}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          data-testid="button-exit-quiz"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
          <span className="text-sm font-medium text-slate-700">{category.title}</span>
        </div>
        <span className="text-sm text-slate-400 tabular-nums">
          {cat.questionCount + 1} / {questions.length - (initialCompletedRef.current?.size ?? 0) || questions.length}
        </span>
      </div>

      {/* Ability meter */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>{STATUS_LABELS[cat.status]}</span>
          <span className="font-semibold" style={{ color: category.color }}>
            {abilityToLabel(abilityPercent)} · {abilityPercent}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: category.color }}
            animate={{ width: `${abilityPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-6 space-y-5">
              {/* Difficulty + question */}
              <div className="flex items-center gap-2">
                <DiffIcon className={`h-3.5 w-3.5 ${diffConf.color}`} />
                <span className={`text-xs font-semibold uppercase tracking-wide ${diffConf.color}`}>
                  {diffConf.label}
                </span>
              </div>
              <p className="text-base font-semibold text-slate-900 leading-relaxed" data-testid="text-question">
                {question.text}
              </p>

              {/* Answer options */}
              <div className="space-y-2.5">
                {question.options.map((option, i) => {
                  const isCorrect = selected !== null && i === question.correctIndex;
                  const isWrong = selected === i && i !== question.correctIndex;
                  const isSelected = selected === i;
                  const isRevealed = selected !== null;

                  return (
                    <motion.button
                      key={i}
                      onClick={() => handleSelect(i)}
                      disabled={isRevealed}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      data-testid={`option-${i}`}
                      className={[
                        "w-full text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-start gap-3",
                        !isRevealed && "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                        isCorrect && "border-emerald-500 bg-emerald-50",
                        isWrong && "border-red-400 bg-red-50",
                        !isCorrect && !isWrong && isRevealed && "border-slate-100 bg-slate-50 opacity-60",
                        !isRevealed && "border-slate-200 bg-white",
                      ].filter(Boolean).join(" ")}
                    >
                      <span
                        className={[
                          "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold mt-0.5",
                          isCorrect && "bg-emerald-500 text-white",
                          isWrong && "bg-red-400 text-white",
                          !isCorrect && !isWrong && "bg-slate-100 text-slate-500",
                        ].filter(Boolean).join(" ")}
                      >
                        {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : isWrong ? <XCircle className="h-4 w-4" /> : String.fromCharCode(65 + i)}
                      </span>
                      <span className={[
                        "text-sm leading-relaxed",
                        isCorrect && "text-emerald-800 font-medium",
                        isWrong && "text-red-700",
                        !isCorrect && !isWrong && "text-slate-700",
                      ].filter(Boolean).join(" ")}>
                        {option}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Post-answer section */}
              <AnimatePresence>
                {selected !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 pt-2 border-t border-slate-100"
                  >
                    <button
                      onClick={() => setShowExplanation((v) => !v)}
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      data-testid="button-toggle-explanation"
                    >
                      <BookOpen className="h-4 w-4" />
                      {showExplanation ? "Hide" : "Read"} clinical rationale
                    </button>

                    <AnimatePresence>
                      {showExplanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
                            {question.explanation}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      onClick={handleNext}
                      className="w-full gap-2"
                      style={{ backgroundColor: category.color, borderColor: category.color }}
                      data-testid="button-next-question"
                    >
                      Next Question
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
