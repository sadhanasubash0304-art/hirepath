import { Router } from 'express';
import { Type } from '@google/genai';
import { ai, MODELS, ThinkingLevel, withGeminiRetry, GeminiApiError } from '../lib/gemini.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { createRateLimiter } from '../middleware/rateLimit.ts';
import { CAREERS, VERIFIED_RESOURCES } from '../data/catalog.ts';

const router = Router();
const aiLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 15 });

router.use(requireAuth);
router.use(aiLimiter);

// 1. Multi-turn HirePath AI Career Assistant (with Thinking Mode toggle)
router.post('/chat', async (req: AuthRequest, res) => {
  try {
    const {
      message,
      history = [],
      mode = 'deep',
      userContext = {},
    } = req.body as {
      message?: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      mode?: 'deep' | 'fast';
      userContext?: {
        displayName?: string;
        targetCareerTitle?: string;
        skills?: Array<{ name: string; level: number }>;
        experienceLevel?: string;
      };
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    if (message.length > 4000) {
      return res.status(400).json({ error: 'Message exceeds maximum length of 4000 characters.' });
    }

    const useDeepMode = mode !== 'fast';
    const selectedModel = useDeepMode ? MODELS.DEEP : MODELS.FAST;

    const contextSummary = [
      userContext.displayName ? `Learner Name: ${userContext.displayName}` : null,
      userContext.targetCareerTitle ? `Target Career Goal: ${userContext.targetCareerTitle}` : null,
      userContext.experienceLevel ? `Experience Level: ${userContext.experienceLevel}` : null,
      userContext.skills && userContext.skills.length > 0
        ? `Current Skills: ${userContext.skills.map((s) => `${s.name} (${s.level}/100)`).join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    const systemInstruction = `You are HirePath AI, an expert career readiness advisor, technical mentor, and educational coach aligned with UN SDG 4 (Quality Education).
Your purpose is to help students and job seekers bridge the gap between academic study and industry expectations.
${contextSummary ? `\nCurrent Learner Context:\n${contextSummary}` : ''}

Rules:
- Give concrete, actionable, structured technical guidance (use concise markdown headings and bullet lists where helpful).
- Never invent user work experience, degrees, or credentials.
- Never claim that completing a roadmap or readiness score guarantees employment.
- Keep responses focused, encouraging, and directly tailored to the learner's goals and skills.`;

    const recentHistory = Array.isArray(history) ? history.slice(-12) : [];
    const formattedHistory = recentHistory.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(turn.content || '').slice(0, 4000) }],
    }));

    const reply = await withGeminiRetry(async () => {
      const chat = ai.chats.create({
        model: selectedModel,
        history: formattedHistory,
        config: {
          systemInstruction,
          ...(useDeepMode
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
            : {}),
        },
      });

      const response = await chat.sendMessage({ message: message.trim() });
      return response.text || 'I could not generate a response. Please try rephrasing your question.';
    });

    res.json({
      reply,
      modelUsed: selectedModel,
      thinkingLevel: useDeepMode ? 'HIGH' : 'DEFAULT',
    });
  } catch (err: unknown) {
    const apiErr = err instanceof GeminiApiError ? err : new GeminiApiError('AI chat failed.', 500);
    res.status(apiErr.status).json({ error: apiErr.message });
  }
});

// 2. Personalized AI Learning Roadmap Generator (Gemini 4 Hydrogen + ThinkingLevel.HIGH)
router.post('/roadmap', async (req: AuthRequest, res) => {
  try {
    const {
      careerId,
      experienceLevel = 'beginner',
      weeklyHours = 10,
      currentSkills = [],
      learningGoal = '',
    } = req.body as {
      careerId?: string;
      experienceLevel?: string;
      weeklyHours?: number;
      currentSkills?: string[];
      learningGoal?: string;
    };

    const career = CAREERS.find((c) => c.id === careerId) || CAREERS[0];
    const safeHours = Math.min(60, Math.max(2, Number(weeklyHours) || 10));
    const availableResourceTitles = VERIFIED_RESOURCES.map((r) => `${r.title} (${r.url})`).join('; ');

    const responseJson = await withGeminiRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODELS.DEEP,
        contents: `Generate an 8-stage personalized learning roadmap for a learner targeting "${career.title}".
Experience Level: ${experienceLevel}
Weekly Study Commitment: ${safeHours} hours/week
Current Known Skills: ${currentSkills.length > 0 ? currentSkills.join(', ') : 'Foundational programming only'}
Custom Goal: ${learningGoal || 'Become job-ready for entry-level industry roles'}
Required Career Technical Skills: ${career.requiredTechnicalSkills.map((s) => s.name).join(', ')}
Verified Resources Pool (prefer referencing these real resources when relevant): ${availableResourceTitles}

Design 8 progressive stages from fundamentals through deployment, real-world projects, and interview prep. Keep each stage practical, concise, and tailored to skip/accelerate areas already in Current Known Skills.`,
        config: {
          systemInstruction:
            'You are a senior engineering curriculum architect. Produce realistic, industry-accurate learning stages without fabricating URLs.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              careerTitle: { type: Type.STRING },
              stages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stageNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    objective: { type: Type.STRING },
                    estimatedHours: { type: Type.INTEGER },
                    topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lessons: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          durationMinutes: { type: Type.INTEGER },
                          practicalTask: { type: Type.STRING },
                        },
                      },
                    },
                    recommendedResourceTitle: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      return response.text || '{}';
    });

    const parsed = JSON.parse(responseJson);
    res.json({
      careerId: career.id,
      careerTitle: parsed.careerTitle || career.title,
      stages: Array.isArray(parsed.stages) ? parsed.stages : [],
      modelUsed: MODELS.DEEP,
    });
  } catch (err: unknown) {
    const apiErr = err instanceof GeminiApiError ? err : new GeminiApiError('Roadmap generation failed.', 500);
    res.status(apiErr.status).json({ error: apiErr.message });
  }
});

// 3. Skill Gap Improvement Plan Generator
router.post('/skill-gap', async (req: AuthRequest, res) => {
  try {
    const {
      targetName,
      userSkills = {},
      requiredSkills = [],
    } = req.body as {
      targetName?: string;
      userSkills?: Record<string, number>;
      requiredSkills?: Array<{ name: string; targetLevel: number; priority?: string }>;
    };

    if (!targetName || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({ error: 'Target role and required skills are required.' });
    }

    const gapLines = requiredSkills.map((reqSkill) => {
      const current = Number(userSkills[reqSkill.name] || 0);
      const gap = Math.max(0, reqSkill.targetLevel - current);
      return `${reqSkill.name}: Current ${current}/100 vs Target ${reqSkill.targetLevel}/100 (Gap: ${gap}, Priority: ${reqSkill.priority || 'Core'})`;
    });

    const plan = await withGeminiRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODELS.DEEP,
        contents: `Analyze this learner's skill gaps for "${targetName}" and produce a concrete 4-week improvement plan:
${gapLines.join('\n')}

Structure the plan into:
1. Top Priority Gaps to Close First
2. Week-by-Week Execution Strategy (Weeks 1-4)
3. Practical Verification Milestones
Note clearly that skill readiness guides preparation and does not guarantee employment.`,
        config: {
          systemInstruction:
            'You are HirePath Skill Diagnostics Engine. Provide sharp, realistic engineering study plans grounded strictly in the provided gap metrics.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        },
      });
      return response.text || '';
    });

    res.json({ plan, modelUsed: MODELS.DEEP });
  } catch (err: unknown) {
    const apiErr = err instanceof GeminiApiError ? err : new GeminiApiError('Skill-gap analysis failed.', 500);
    res.status(apiErr.status).json({ error: apiErr.message });
  }
});

// 4. Resume Summary & ATS Feedback Assistant (Never fabricates user experience)
router.post('/resume-assist', async (req: AuthRequest, res) => {
  try {
    const { action, resumeData, targetRole } = req.body as {
      action?: 'summary' | 'review';
      resumeData?: Record<string, unknown>;
      targetRole?: string;
    };

    if (!resumeData || typeof resumeData !== 'object') {
      return res.status(400).json({ error: 'Resume data is required.' });
    }

    const isSummary = action === 'summary';
    const selectedModel = isSummary ? MODELS.FAST : MODELS.DEEP;

    const output = await withGeminiRetry(async () => {
      const prompt = isSummary
        ? `Write a concise, ATS-friendly 3-sentence professional summary for ${targetRole || 'a technology role'} using ONLY the verified facts in this candidate profile JSON. Do NOT invent employers, degrees, metrics, or skills not present:\n${JSON.stringify(resumeData).slice(0, 6000)}`
        : `Perform an ATS & recruiter critique of this resume targeting ${targetRole || 'a software/tech role'}. Identify missing quantifiable impact statements, formatting/clarity improvements, and skill alignment gaps based strictly on what is written (do NOT fabricate credentials):\n${JSON.stringify(resumeData).slice(0, 6000)}`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an honest ATS & technical recruiter reviewer. Never invent user experience, dates, or qualifications.',
          ...(isSummary ? {} : { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }),
        },
      });
      return response.text || '';
    });

    res.json({ output, modelUsed: selectedModel });
  } catch (err: unknown) {
    const apiErr = err instanceof GeminiApiError ? err : new GeminiApiError('Resume assist failed.', 500);
    res.status(apiErr.status).json({ error: apiErr.message });
  }
});

// 5. Interview Answer Evaluation
router.post('/interview-feedback', async (req: AuthRequest, res) => {
  try {
    const { careerTitle, question, userAnswer } = req.body as {
      careerTitle?: string;
      question?: string;
      userAnswer?: string;
    };

    if (!question || !userAnswer || userAnswer.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide a substantive answer (at least 10 characters).' });
    }

    const rawJson = await withGeminiRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODELS.DEEP,
        contents: `Evaluate this candidate's interview answer for a ${careerTitle || 'Software Engineering'} role.
Question: ${question}
Candidate Answer: ${userAnswer.slice(0, 4000)}`,
        config: {
          systemInstruction:
            'You are a calibrated senior technical interviewer. Score fairly from 0 to 100 and give actionable, specific feedback.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              refinedExample: { type: Type.STRING },
            },
          },
        },
      });
      return response.text || '{}';
    });

    const parsed = JSON.parse(rawJson);
    res.json({
      score: Math.min(100, Math.max(0, Number(parsed.score) || 65)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      refinedExample: parsed.refinedExample || '',
      modelUsed: MODELS.DEEP,
    });
  } catch (err: unknown) {
    const apiErr = err instanceof GeminiApiError ? err : new GeminiApiError('Interview evaluation failed.', 500);
    res.status(apiErr.status).json({ error: apiErr.message });
  }
});

export default router;
