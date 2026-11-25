import { Router } from 'express';
import {
  CAREERS,
  VERIFIED_RESOURCES,
  PROJECT_BLUEPRINTS,
  INTERVIEW_QUESTIONS,
} from '../data/catalog.ts';

const router = Router();

router.get('/careers', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim().toLowerCase();

  let results = CAREERS;
  if (category && category !== 'all') {
    results = results.filter((c) => c.category.toLowerCase() === category);
  }
  if (search) {
    results = results.filter(
      (c) =>
        c.title.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search) ||
        c.requiredTechnicalSkills.some((s) => s.name.toLowerCase().includes(search))
    );
  }

  res.json({
    careers: results,
    categories: Array.from(new Set(CAREERS.map((c) => c.category))),
  });
});

router.get('/careers/:id', (req, res) => {
  const career = CAREERS.find((c) => c.id === req.params.id);
  if (!career) {
    return res.status(404).json({ error: 'Career track not found' });
  }
  const projects = PROJECT_BLUEPRINTS.filter((p) =>
    career.suggestedProjectIds.includes(p.id) || p.careerId === career.id
  );
  const resources = VERIFIED_RESOURCES.filter((r) =>
    r.skillTags.some((tag) =>
      career.requiredTechnicalSkills.some((reqSkill) => reqSkill.name === tag)
    )
  );
  const interviewQuestions = INTERVIEW_QUESTIONS.filter((q) => q.careerId === career.id);

  res.json({ career, projects, resources, interviewQuestions });
});

router.get('/resources', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const category = String(req.query.category || 'all').trim();
  const difficulty = String(req.query.difficulty || 'all').trim();
  const sort = String(req.query.sort || 'title').trim();
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));

  let items = [...VERIFIED_RESOURCES];
  if (category !== 'all') {
    items = items.filter((r) => r.category.toLowerCase() === category.toLowerCase());
  }
  if (difficulty !== 'all') {
    items = items.filter((r) => r.difficulty.toLowerCase() === difficulty.toLowerCase());
  }
  if (search) {
    items = items.filter(
      (r) =>
        r.title.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.skillTags.some((t) => t.toLowerCase().includes(search))
    );
  }

  if (sort === 'duration_asc') {
    items.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
  } else if (sort === 'duration_desc') {
    items.sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);
  } else {
    items.sort((a, b) => a.title.localeCompare(b.title));
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const offset = (page - 1) * limit;
  const paginated = items.slice(offset, offset + limit);

  res.json({
    resources: paginated,
    total,
    page,
    totalPages,
    categories: Array.from(new Set(VERIFIED_RESOURCES.map((r) => r.category))),
  });
});

router.get('/projects', (req, res) => {
  const careerId = String(req.query.careerId || 'all').trim();
  const difficulty = String(req.query.difficulty || 'all').trim();

  let items = [...PROJECT_BLUEPRINTS];
  if (careerId !== 'all') {
    items = items.filter((p) => p.careerId === careerId);
  }
  if (difficulty !== 'all') {
    items = items.filter((p) => p.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  res.json({ projects: items });
});

router.get('/interview/questions', (req, res) => {
  const careerId = String(req.query.careerId || 'all').trim();
  const category = String(req.query.category || 'all').trim();
  const difficulty = String(req.query.difficulty || 'all').trim();

  let items = [...INTERVIEW_QUESTIONS];
  if (careerId !== 'all') {
    items = items.filter((q) => q.careerId === careerId);
  }
  if (category !== 'all') {
    items = items.filter((q) => q.category.toLowerCase() === category.toLowerCase());
  }
  if (difficulty !== 'all') {
    items = items.filter((q) => q.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  res.json({ questions: items });
});

export default router;
