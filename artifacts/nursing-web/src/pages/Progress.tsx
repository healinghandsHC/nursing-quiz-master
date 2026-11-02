import { motion } from "framer-motion";
import { Link } from "wouter";
import { RotateCcw, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/questions";
import { abilityToLabel } from "@/hooks/useCAT";
import { useQuizProgress } from "@/context/QuizProgressContext";
import * as Icons from "lucide-react";

export default function Progress() {
  const { getCategoryStats, resetAll } = useQuizProgress();

  const allStats = categories.map((c) => getCategoryStats(c.id, c.questions.length));
  const totalCompleted = allStats.reduce((a, s) => a + s.completed, 0);
  const totalCorrect = allStats.reduce((a, s) => a + s.correct, 0);
  const totalAvailable = categories.reduce((a, c) => a + c.questions.length, 0);
  const overallAccuracy = totalCompleted > 0 ? Math.round((totalCorrect / totalCompleted) * 100) : 0;
  const derivedAbility = totalCompleted > 0 ? Math.min(100, Math.round(overallAccuracy * 0.9 + 10)) : 0;

  const passColor = overallAccuracy >= 80 ? "#10b981" : overallAccuracy >= 67 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Progress</h1>
          <p className="text-slate-500 mt-1">Your performance across all 10 NCLEX subject areas.</p>
        </div>
        {totalCompleted > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-slate-500 hover:text-red-600 hover:border-red-200"
            onClick={resetAll}
            data-testid="button-reset-all"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All
          </Button>
        )}
      </div>

      {/* Overall summary */}
      {totalCompleted > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border-2 bg-white"
          style={{ borderColor: `${passColor}30` }}
        >
          <div className="flex items-center gap-6">
            <div
              className="w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center flex-shrink-0"
              style={{ borderColor: passColor }}
            >
              <span className="text-2xl font-bold" style={{ color: passColor }}>{overallAccuracy}%</span>
              <span className="text-xs text-slate-400">overall</span>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">
                {abilityToLabel(derivedAbility)} · {derivedAbility}/100
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {totalCompleted} of {totalAvailable} questions answered · {totalCorrect} correct
              </div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full w-64 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: passColor }}
                  animate={{ width: `${(totalCompleted / totalAvailable) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{Math.round((totalCompleted / totalAvailable) * 100)}% question bank complete</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Per-category breakdown */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">By Subject</h2>
        {categories.map((category, i) => {
          const Icon = (Icons as any)[category.icon] || Icons.Activity;
          const stats = getCategoryStats(category.id, category.questions.length);
          const accuracy = stats.completed > 0 ? Math.round((stats.correct / stats.completed) * 100) : null;
          const fillPercent = (stats.completed / stats.total) * 100;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/quiz/${category.id}`}>
                <Card
                  className="border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer group"
                  data-testid={`category-progress-${category.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-2.5 rounded-xl flex-shrink-0"
                        style={{ backgroundColor: `${category.color}15`, color: category.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-slate-800">{category.title}</span>
                          <div className="flex items-center gap-3 text-xs">
                            {accuracy !== null && (
                              <span className="font-bold" style={{ color: category.color }}>{accuracy}%</span>
                            )}
                            <span className="text-slate-400 tabular-nums">
                              {stats.completed}/{stats.total}
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: category.color }}
                            animate={{ width: `${fillPercent}%` }}
                            transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
