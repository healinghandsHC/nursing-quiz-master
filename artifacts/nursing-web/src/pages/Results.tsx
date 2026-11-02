import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Home, RotateCcw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryById } from "@/data/questions";
import { abilityToLabel, abilityToPassLikelihood, thetaToAbility } from "@/hooks/useCAT";
import { useQuizProgress } from "@/context/QuizProgressContext";

export default function Results() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [, navigate] = useLocation();
  const { progress, getCategoryStats, resetCategory } = useQuizProgress();

  const category = getCategoryById(categoryId ?? "");
  if (!category) {
    navigate("/");
    return null;
  }

  const stats = getCategoryStats(categoryId!, category.questions.length);
  const accuracy = stats.completed > 0 ? Math.round((stats.correct / stats.completed) * 100) : 0;

  // Derive ability from accuracy (0-100 accuracy → 0-100 ability via simple mapping)
  const derivedAbility = Math.min(100, Math.round(accuracy * 0.9 + 10));
  const abilityLabel = abilityToLabel(derivedAbility);
  const passLikelihood = abilityToPassLikelihood(derivedAbility);

  const passColor =
    accuracy >= 80 ? "#10b981" : accuracy >= 67 ? "#f59e0b" : "#ef4444";

  const completedIds = new Set(progress[categoryId!]?.completed ?? []);
  const answeredQuestions = category.questions.filter((q) => completedIds.has(q.id));
  const correctIds = new Set(progress[categoryId!]?.correct ?? []);

  const handleRetry = async () => {
    resetCategory(categoryId!);
    navigate(`/quiz/${categoryId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 pt-4"
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-3"
          style={{ backgroundColor: `${category.color}15`, color: category.color }}
        >
          <TrendingUp className="h-4 w-4" />
          Session Complete
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{category.title}</h1>
        <p className="text-slate-500 text-sm">Adaptive testing complete · {stats.completed} questions answered</p>
      </motion.div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Accuracy", value: `${accuracy}%`, sub: `${stats.correct}/${stats.completed} correct`, color: passColor },
          { label: "Ability", value: abilityLabel, sub: `Score: ${derivedAbility}/100`, color: category.color },
          { label: "Coverage", value: `${Math.round((stats.completed / category.questions.length) * 100)}%`, sub: `${stats.completed}/${category.questions.length} done`, color: "#6366f1" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="border-none shadow-sm bg-white text-center">
              <CardContent className="pt-5 pb-4 px-3">
                <div className="text-xl font-bold" style={{ color: card.color }} data-testid={`result-${card.label.toLowerCase()}`}>
                  {card.value}
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">{card.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{card.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pass likelihood */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl border-2 text-center"
        style={{ borderColor: `${passColor}40`, backgroundColor: `${passColor}08` }}
      >
        <p className="text-sm font-semibold" style={{ color: passColor }}>{passLikelihood}</p>
        <p className="text-xs text-slate-500 mt-1">Based on your adaptive performance across this subject</p>
      </motion.div>

      {/* Answered questions list */}
      {answeredQuestions.length > 0 && (
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-800">Question Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {answeredQuestions.map((q, i) => {
              const isCorrect = correctIds.has(q.id);
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50"
                  data-testid={`question-result-${q.id}`}
                >
                  {isCorrect
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className="text-sm text-slate-700 leading-snug line-clamp-2">{q.text}</p>
                    <p className={`text-xs font-medium mt-1 ${isCorrect ? "text-emerald-600" : "text-red-500"}`}>
                      {isCorrect ? "Correct" : `Incorrect — ${q.options[q.correctIndex]}`}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => navigate("/")}
          data-testid="button-go-home"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Button>
        <Button
          className="flex-1 gap-2"
          style={{ backgroundColor: category.color, borderColor: category.color }}
          onClick={handleRetry}
          data-testid="button-retry-quiz"
        >
          <RotateCcw className="h-4 w-4" />
          Retry Category
        </Button>
      </div>
    </div>
  );
}
