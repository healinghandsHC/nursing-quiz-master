import { useQuizProgress } from "@/context/QuizProgressContext";
import { categories } from "@/data/questions";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import { Brain, CheckCircle2, Target } from "lucide-react";

export default function Home() {
  const { getCategoryStats, progress } = useQuizProgress();

  const allStats = categories.map((c) => getCategoryStats(c.id, c.questions.length));
  const totalCompleted = allStats.reduce((acc, curr) => acc + curr.completed, 0);
  const totalCorrect = allStats.reduce((acc, curr) => acc + curr.correct, 0);
  const totalAvailable = categories.reduce((acc, curr) => acc + curr.questions.length, 0);
  
  const overallPercentage = totalCompleted > 0 ? Math.round((totalCorrect / totalCompleted) * 100) : 0;
  const completionPercentage = Math.round((totalCompleted / totalAvailable) * 100);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-2">Track your NCLEX preparation progress across all subject areas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Overall Accuracy</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{overallPercentage}%</div>
            <p className="text-xs text-slate-500 mt-1">{totalCorrect} correct out of {totalCompleted} answered</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Questions Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalCompleted}</div>
            <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${completionPercentage}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2">{completionPercentage}% of question bank</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Readiness</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">
              {totalCompleted < 20 ? "Needs More Data" : overallPercentage > 75 ? "High Probability" : "Keep Practicing"}
            </div>
            <p className="text-xs text-slate-600 mt-1">Based on adaptive testing metrics</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Subject Areas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {categories.map((category, i) => {
            const Icon = (Icons as any)[category.icon] || Icons.Activity;
            const stats = getCategoryStats(category.id, category.questions.length);
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="flex flex-col h-full hover:shadow-md transition-shadow border-none shadow-sm overflow-hidden group">
                  <div className="h-2 w-full" style={{ backgroundColor: category.color }} />
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${category.color}15`, color: category.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-sm text-slate-500 mb-6">{category.description}</p>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-end text-sm">
                        <span className="font-medium text-slate-700">
                          {stats.completed} / {stats.total} Answered
                        </span>
                        {stats.completed > 0 && (
                          <span className="text-xs text-slate-500">
                            {stats.percentage}% Accuracy
                          </span>
                        )}
                      </div>
                      <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
                      
                      <Link href={`/quiz/${category.id}`}>
                        <Button className="w-full mt-2" variant="outline" data-testid={`start-quiz-${category.id}`}>
                          {stats.completed > 0 ? "Continue Practice" : "Start Practice"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
