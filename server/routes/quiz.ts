import { Router } from 'express';
import { QUIZZES } from '../data/catalog.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.get('/', (_req, res) => {
  const summaries = QUIZZES.map((q) => ({
    id: q.id,
    title: q.title,
    careerId: q.careerId,
    description: q.description,
    difficulty: q.difficulty,
    timeLimitSeconds: q.timeLimitSeconds,
    questionCount: q.questions.length,
  }));
  res.json({ quizzes: summaries });
});

router.get('/:id', (req, res) => {
  const quiz = QUIZZES.find((q) => q.id === req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Strip correctIndex and explanation so client cannot tamper or inspect answers before submission
  res.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      careerId: quiz.careerId,
      description: quiz.description,
      difficulty: quiz.difficulty,
      timeLimitSeconds: quiz.timeLimitSeconds,
      questions: quiz.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: question.options,
        skillTag: question.skillTag,
      })),
    },
  });
});

router.post('/:id/submit', requireAuth, (req: AuthRequest, res) => {
  const quiz = QUIZZES.find((q) => q.id === req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const body = req.body as { answers?: Record<string, number> };
  if (!body || typeof body.answers !== 'object' || body.answers === null) {
    return res.status(400).json({ error: 'Invalid answers payload' });
  }

  let correctCount = 0;
  const skillBoosts: Record<string, number> = {};

  const results = quiz.questions.map((question) => {
    const selected = body.answers?.[question.id];
    const isCorrect = typeof selected === 'number' && selected === question.correctIndex;
    if (isCorrect) {
      correctCount += 1;
      skillBoosts[question.skillTag] = (skillBoosts[question.skillTag] || 0) + 8;
    }
    return {
      questionId: question.id,
      prompt: question.prompt,
      selectedIndex: typeof selected === 'number' ? selected : -1,
      correctIndex: question.correctIndex,
      isCorrect,
      explanation: question.explanation,
      skillTag: question.skillTag,
    };
  });

  const totalQuestions = quiz.questions.length;
  const score = Math.round((correctCount / totalQuestions) * 100);

  res.json({
    quizId: quiz.id,
    quizTitle: quiz.title,
    careerId: quiz.careerId,
    difficulty: quiz.difficulty,
    score,
    correctCount,
    totalQuestions,
    skillBoosts,
    results,
  });
});

export default router;
