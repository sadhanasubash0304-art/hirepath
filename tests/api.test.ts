import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import catalogRoutes from '../server/routes/catalog.ts';
import quizRoutes from '../server/routes/quiz.ts';
import aiRoutes from '../server/routes/ai.ts';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1', catalogRoutes);
  app.use('/api/v1/quizzes', quizRoutes);
  app.use('/api/v1/ai', aiRoutes);
  return app;
}

test('GET /api/v1/health returns ok status', async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const addr = server.address() as { port: number };
  try {
    const res = await fetch(`http://127.0.0.1:${addr.port}/api/v1/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string };
    assert.equal(body.status, 'ok');
  } finally {
    server.close();
  }
});

test('GET /api/v1/careers returns all 12 career tracks', async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const addr = server.address() as { port: number };
  try {
    const res = await fetch(`http://127.0.0.1:${addr.port}/api/v1/careers`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { careers: Array<{ id: string }> };
    assert.equal(body.careers.length, 12);
  } finally {
    server.close();
  }
});

test('GET /api/v1/quizzes/:id strips correctIndex and explanations from client payload', async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const addr = server.address() as { port: number };
  try {
    const res = await fetch(`http://127.0.0.1:${addr.port}/api/v1/quizzes/quiz-fullstack-core`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      quiz: { questions: Array<Record<string, unknown>> };
    };
    assert.ok(body.quiz.questions.length > 0);
    for (const q of body.quiz.questions) {
      assert.equal('correctIndex' in q, false);
      assert.equal('explanation' in q, false);
    }
  } finally {
    server.close();
  }
});

test('Protected AI and quiz submit endpoints reject unauthenticated requests with 401', async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const addr = server.address() as { port: number };
  try {
    const aiRes = await fetch(`http://127.0.0.1:${addr.port}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });
    assert.equal(aiRes.status, 401);

    const quizRes = await fetch(
      `http://127.0.0.1:${addr.port}/api/v1/quizzes/quiz-fullstack-core/submit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: {} }),
      }
    );
    assert.equal(quizRes.status, 401);
  } finally {
    server.close();
  }
});
