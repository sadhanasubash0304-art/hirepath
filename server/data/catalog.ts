export interface CareerSkillRequirement {
  name: string;
  targetLevel: number; // 0-100
  priority: 'Core' | 'Important' | 'Recommended';
}

export interface CareerTrack {
  id: string;
  title: string;
  category: string;
  shortTagline: string;
  description: string;
  demandOutlook: string;
  avgEntryReadinessHours: number;
  requiredTechnicalSkills: CareerSkillRequirement[];
  requiredSoftSkills: string[];
  prerequisites: string[];
  recommendedTechnologies: string[];
  suggestedProjectIds: string[];
  interviewTopics: string[];
}

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  category: string;
  skillTags: string[];
  resourceType: 'Documentation' | 'Course' | 'Guide' | 'Interactive' | 'Reference';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  url: string;
  estimatedMinutes: number;
  provider: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  skillTag: string;
}

export interface QuizDefinition {
  id: string;
  title: string;
  careerId: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeLimitSeconds: number;
  questions: QuizQuestion[];
}

export interface ProjectBlueprint {
  id: string;
  title: string;
  careerId: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  requiredSkills: string[];
  techStack: string[];
  objectives: string[];
  implementationSteps: string[];
  expectedOutcome: string;
  estimatedHours: number;
}

export interface InterviewQuestion {
  id: string;
  careerId: string;
  category: 'Technical' | 'HR' | 'Role-Specific';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  sampleAnswer: string;
  keySignals: string[];
}

export const CAREERS: CareerTrack[] = [
  {
    id: 'fullstack-dev',
    title: 'Full-Stack Developer',
    category: 'Software Engineering',
    shortTagline: 'Architect end-to-end web products from browser UI to database persistence.',
    description:
      'Full-Stack Developers bridge frontend user experiences with resilient backend APIs, relational data modeling, authentication, and cloud deployment pipelines.',
    demandOutlook: 'High demand across startups and enterprise product engineering teams',
    avgEntryReadinessHours: 240,
    requiredTechnicalSkills: [
      { name: 'TypeScript', targetLevel: 85, priority: 'Core' },
      { name: 'React', targetLevel: 85, priority: 'Core' },
      { name: 'Node.js', targetLevel: 80, priority: 'Core' },
      { name: 'PostgreSQL', targetLevel: 75, priority: 'Core' },
      { name: 'REST APIs', targetLevel: 85, priority: 'Core' },
      { name: 'Git', targetLevel: 80, priority: 'Important' },
      { name: 'Docker', targetLevel: 65, priority: 'Recommended' },
      { name: 'Testing', targetLevel: 70, priority: 'Important' },
    ],
    requiredSoftSkills: ['System decomposition', 'Technical communication', 'Debugging discipline', 'Code review collaboration'],
    prerequisites: ['Basic programming logic', 'Familiarity with HTTP and the web browser'],
    recommendedTechnologies: ['React 19', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
    suggestedProjectIds: ['proj-fullstack-tracker', 'proj-realtime-board'],
    interviewTopics: ['Event loop & async JS', 'REST vs WebSockets', 'SQL indexing & normalization', 'JWT & session security', 'React state & rendering'],
  },
  {
    id: 'frontend-dev',
    title: 'Frontend Developer',
    category: 'Web Engineering',
    shortTagline: 'Craft accessible, high-performance user interfaces and interactive design systems.',
    description:
      'Frontend Developers specialize in modern component architectures, semantic HTML, responsive CSS systems, state orchestration, web accessibility, and Core Web Vitals optimization.',
    demandOutlook: 'Strong demand for product-focused UI engineers',
    avgEntryReadinessHours: 180,
    requiredTechnicalSkills: [
      { name: 'HTML & CSS', targetLevel: 90, priority: 'Core' },
      { name: 'JavaScript', targetLevel: 88, priority: 'Core' },
      { name: 'TypeScript', targetLevel: 82, priority: 'Core' },
      { name: 'React', targetLevel: 88, priority: 'Core' },
      { name: 'Accessibility', targetLevel: 78, priority: 'Important' },
      { name: 'Performance', targetLevel: 75, priority: 'Important' },
      { name: 'Git', targetLevel: 75, priority: 'Important' },
    ],
    requiredSoftSkills: ['Visual attention to detail', 'Empathy for users', 'Design-to-engineering translation'],
    prerequisites: ['Basic HTML/CSS familiarity'],
    recommendedTechnologies: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Playwright', 'WCAG 2.2'],
    suggestedProjectIds: ['proj-design-system', 'proj-fullstack-tracker'],
    interviewTopics: ['DOM & browser rendering pipeline', 'React hooks & memoization', 'CSS Grid & Flexbox', 'ARIA & keyboard navigation', 'Bundle optimization'],
  },
  {
    id: 'backend-dev',
    title: 'Backend Developer',
    category: 'Systems & APIs',
    shortTagline: 'Build scalable APIs, distributed data pipelines, and secure server infrastructure.',
    description:
      'Backend Developers engineer server-side business logic, authentication boundaries, database queries, caching strategies, and fault-tolerant service integrations.',
    demandOutlook: 'Consistent high demand in fintech, SaaS, and cloud platforms',
    avgEntryReadinessHours: 220,
    requiredTechnicalSkills: [
      { name: 'Node.js', targetLevel: 85, priority: 'Core' },
      { name: 'TypeScript', targetLevel: 80, priority: 'Core' },
      { name: 'PostgreSQL', targetLevel: 85, priority: 'Core' },
      { name: 'REST APIs', targetLevel: 90, priority: 'Core' },
      { name: 'Authentication', targetLevel: 82, priority: 'Core' },
      { name: 'Redis', targetLevel: 72, priority: 'Important' },
      { name: 'Docker', targetLevel: 75, priority: 'Important' },
    ],
    requiredSoftSkills: ['Structured problem solving', 'API documentation', 'Incident triage'],
    prerequisites: ['Data structures basics', 'Command-line comfort'],
    recommendedTechnologies: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker', 'OpenAPI'],
    suggestedProjectIds: ['proj-rate-limited-api', 'proj-realtime-board'],
    interviewTopics: ['ACID transactions', 'Connection pooling', 'OAuth 2.0 & JWT', 'Rate limiting algorithms', 'Caching invalidation'],
  },
  {
    id: 'software-dev',
    title: 'Software Development Engineer',
    category: 'Core Engineering',
    shortTagline: 'Solve algorithmic problems and build maintainable production software systems.',
    description:
      'Software Development Engineers focus on computer science fundamentals, clean object-oriented and functional design, automated testing, and reliable multi-module codebases.',
    demandOutlook: 'Broadest entry-level hiring volume across global tech companies',
    avgEntryReadinessHours: 230,
    requiredTechnicalSkills: [
      { name: 'Data Structures', targetLevel: 85, priority: 'Core' },
      { name: 'Algorithms', targetLevel: 82, priority: 'Core' },
      { name: 'TypeScript', targetLevel: 78, priority: 'Important' },
      { name: 'Python', targetLevel: 80, priority: 'Core' },
      { name: 'Git', targetLevel: 85, priority: 'Core' },
      { name: 'Testing', targetLevel: 78, priority: 'Important' },
      { name: 'System Design', targetLevel: 70, priority: 'Recommended' },
    ],
    requiredSoftSkills: ['Analytical clarity', 'Test-driven mindset', 'Continuous learning'],
    prerequisites: ['Introductory programming in Python, Java, or C++'],
    recommendedTechnologies: ['Python', 'TypeScript', 'PostgreSQL', 'Git', 'Docker', 'GitHub Actions'],
    suggestedProjectIds: ['proj-rate-limited-api', 'proj-fullstack-tracker'],
    interviewTopics: ['Trees, graphs & dynamic programming', 'Time & space complexity', 'SOLID principles', 'Unit vs integration testing'],
  },
  {
    id: 'data-science',
    title: 'Data Scientist',
    category: 'Data & Analytics',
    shortTagline: 'Turn noisy datasets into statistical evidence, predictive models, and clear decisions.',
    description:
      'Data Scientists combine statistical inference, exploratory data analysis, Python modeling pipelines, and clear visual storytelling to guide product and business strategy.',
    demandOutlook: 'Strong demand across product analytics, healthcare, and finance',
    avgEntryReadinessHours: 230,
    requiredTechnicalSkills: [
      { name: 'Python', targetLevel: 88, priority: 'Core' },
      { name: 'SQL', targetLevel: 85, priority: 'Core' },
      { name: 'Statistics', targetLevel: 85, priority: 'Core' },
      { name: 'Pandas', targetLevel: 85, priority: 'Core' },
      { name: 'Scikit-learn', targetLevel: 78, priority: 'Important' },
      { name: 'Data Visualization', targetLevel: 80, priority: 'Important' },
    ],
    requiredSoftSkills: ['Statistical skepticism', 'Executive storytelling', 'Domain curiosity'],
    prerequisites: ['High school calculus & probability', 'Basic Python syntax'],
    recommendedTechnologies: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'PostgreSQL', 'Jupyter'],
    suggestedProjectIds: ['proj-churn-predictor', 'proj-executive-bi'],
    interviewTopics: ['Hypothesis testing & p-values', 'Bias-variance tradeoff', 'Feature engineering', 'Window functions in SQL', 'A/B testing pitfalls'],
  },
  {
    id: 'ai-engineering',
    title: 'AI Engineer',
    category: 'Applied AI',
    shortTagline: 'Integrate foundation models, retrieval pipelines, and structured tool-calling into apps.',
    description:
      'AI Engineers design reliable LLM-powered products using prompt architecture, structured JSON schemas, retrieval-augmented generation, evaluation harnesses, and latency/cost guardrails.',
    demandOutlook: 'Fastest-growing engineering specialization globally',
    avgEntryReadinessHours: 210,
    requiredTechnicalSkills: [
      { name: 'Python', targetLevel: 82, priority: 'Core' },
      { name: 'TypeScript', targetLevel: 80, priority: 'Core' },
      { name: 'LLM Integration', targetLevel: 88, priority: 'Core' },
      { name: 'Prompt Engineering', targetLevel: 85, priority: 'Core' },
      { name: 'Vector Embeddings', targetLevel: 78, priority: 'Important' },
      { name: 'REST APIs', targetLevel: 82, priority: 'Important' },
      { name: 'Evaluation', targetLevel: 75, priority: 'Important' },
    ],
    requiredSoftSkills: ['Failure-mode thinking', 'Product intuition', 'Safety & privacy awareness'],
    prerequisites: ['Comfort with REST APIs and JSON', 'Python or TypeScript fundamentals'],
    recommendedTechnologies: ['Google GenAI SDK', 'TypeScript', 'Python', 'Embeddings', 'Node.js', 'PostgreSQL'],
    suggestedProjectIds: ['proj-ai-study-copilot', 'proj-rate-limited-api'],
    interviewTopics: ['Structured outputs & tool calling', 'RAG chunking & retrieval metrics', 'Hallucination mitigation', 'Streaming SSE & latency budgets'],
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning Engineer',
    category: 'Applied AI',
    shortTagline: 'Train, optimize, and serve production machine learning models at scale.',
    description:
      'Machine Learning Engineers bridge research notebooks and production inference services, owning feature pipelines, model training, evaluation metrics, and reproducible MLOps.',
    demandOutlook: 'High compensation & strong specialized hiring demand',
    avgEntryReadinessHours: 260,
    requiredTechnicalSkills: [
      { name: 'Python', targetLevel: 90, priority: 'Core' },
      { name: 'PyTorch', targetLevel: 82, priority: 'Core' },
      { name: 'Scikit-learn', targetLevel: 85, priority: 'Core' },
      { name: 'Linear Algebra', targetLevel: 78, priority: 'Core' },
      { name: 'Docker', targetLevel: 75, priority: 'Important' },
      { name: 'MLOps', targetLevel: 75, priority: 'Important' },
    ],
    requiredSoftSkills: ['Experimental rigor', 'Reproducibility discipline', 'Cross-team collaboration'],
    prerequisites: ['Linear algebra, multivariable calculus, Python fluency'],
    recommendedTechnologies: ['Python', 'PyTorch', 'Scikit-learn', 'Docker', 'FastAPI', 'Weights & Biases'],
    suggestedProjectIds: ['proj-churn-predictor', 'proj-ai-study-copilot'],
    interviewTopics: ['Gradient descent & regularization', 'Precision/recall vs ROC-AUC', 'Data leakage detection', 'Model serving & quantization'],
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity Analyst',
    category: 'Security & Infrastructure',
    shortTagline: 'Defend applications, networks, and identities against real-world threat vectors.',
    description:
      'Cybersecurity Analysts protect modern systems through threat modeling, OWASP vulnerability remediation, network traffic analysis, IAM hardening, and incident response.',
    demandOutlook: 'Critical talent shortage across enterprise and cloud sectors',
    avgEntryReadinessHours: 220,
    requiredTechnicalSkills: [
      { name: 'Networking', targetLevel: 85, priority: 'Core' },
      { name: 'Linux', targetLevel: 85, priority: 'Core' },
      { name: 'OWASP Top 10', targetLevel: 85, priority: 'Core' },
      { name: 'Authentication', targetLevel: 80, priority: 'Core' },
      { name: 'Python', targetLevel: 72, priority: 'Important' },
      { name: 'Incident Response', targetLevel: 75, priority: 'Important' },
    ],
    requiredSoftSkills: ['Adversarial mindset', 'Clear incident reporting', 'Calm under pressure'],
    prerequisites: ['Operating system basics', 'Understanding of TCP/IP & DNS'],
    recommendedTechnologies: ['Linux', 'Wireshark', 'OWASP ZAP', 'Nmap', 'Python', 'IAM Policies'],
    suggestedProjectIds: ['proj-security-audit-kit', 'proj-rate-limited-api'],
    interviewTopics: ['XSS, CSRF & SQL injection defenses', 'TLS handshake & PKI', 'Zero-trust IAM', 'Log forensics & triage'],
  },
  {
    id: 'cloud-computing',
    title: 'Cloud & DevOps Engineer',
    category: 'Cloud & Infrastructure',
    shortTagline: 'Automate resilient cloud deployments, containers, observability, and CI/CD pipelines.',
    description:
      'Cloud Engineers design reproducible cloud environments using containers, Infrastructure as Code, automated CI/CD delivery, and service-level observability.',
    demandOutlook: 'High demand across every cloud-native engineering organization',
    avgEntryReadinessHours: 220,
    requiredTechnicalSkills: [
      { name: 'Linux', targetLevel: 85, priority: 'Core' },
      { name: 'Docker', targetLevel: 88, priority: 'Core' },
      { name: 'CI/CD', targetLevel: 82, priority: 'Core' },
      { name: 'Cloud Architecture', targetLevel: 82, priority: 'Core' },
      { name: 'Networking', targetLevel: 78, priority: 'Important' },
      { name: 'Terraform', targetLevel: 74, priority: 'Recommended' },
    ],
    requiredSoftSkills: ['Automation-first thinking', 'Reliability ownership', 'Documentation'],
    prerequisites: ['Linux shell basics', 'Git familiarity'],
    recommendedTechnologies: ['Docker', 'Google Cloud', 'GitHub Actions', 'Terraform', 'Linux', 'Nginx'],
    suggestedProjectIds: ['proj-cicd-blueprint', 'proj-rate-limited-api'],
    interviewTopics: ['Container layers & multi-stage builds', 'Load balancing & autoscaling', 'Blue-green vs canary deploys', 'VPC & IAM least privilege'],
  },
  {
    id: 'ui-ux-design',
    title: 'UI/UX Product Designer',
    category: 'Product & Design',
    shortTagline: 'Design intuitive, accessible digital experiences backed by user research and systems.',
    description:
      'UI/UX Designers translate complex user needs into clear information architecture, interactive prototypes, accessible design systems, and validated usability improvements.',
    demandOutlook: 'Steady demand across SaaS, consumer apps, and design agencies',
    avgEntryReadinessHours: 170,
    requiredTechnicalSkills: [
      { name: 'Figma', targetLevel: 90, priority: 'Core' },
      { name: 'User Research', targetLevel: 82, priority: 'Core' },
      { name: 'Wireframing', targetLevel: 85, priority: 'Core' },
      { name: 'Design Systems', targetLevel: 82, priority: 'Core' },
      { name: 'Accessibility', targetLevel: 80, priority: 'Important' },
      { name: 'HTML & CSS', targetLevel: 65, priority: 'Recommended' },
    ],
    requiredSoftSkills: ['User empathy', 'Critique receptivity', 'Cross-functional storytelling'],
    prerequisites: ['Interest in visual hierarchy and human-computer interaction'],
    recommendedTechnologies: ['Figma', 'WCAG Contrast Tools', 'Prototyping', 'Design Tokens'],
    suggestedProjectIds: ['proj-design-system', 'proj-ux-case-study'],
    interviewTopics: ['Information architecture', 'Usability testing methodology', 'Tokenized design systems', 'WCAG AA contrast & focus states'],
  },
  {
    id: 'digital-marketing',
    title: 'Digital Growth Marketer',
    category: 'Growth & Strategy',
    shortTagline: 'Drive measurable audience acquisition through SEO, content analytics, and funnels.',
    description:
      'Digital Growth Marketers combine technical SEO, conversion rate optimization, attribution analytics, and structured experimentation to grow sustainable user funnels.',
    demandOutlook: 'Strong demand in B2B SaaS, e-commerce, and creator platforms',
    avgEntryReadinessHours: 140,
    requiredTechnicalSkills: [
      { name: 'Technical SEO', targetLevel: 84, priority: 'Core' },
      { name: 'Web Analytics', targetLevel: 85, priority: 'Core' },
      { name: 'Content Strategy', targetLevel: 82, priority: 'Core' },
      { name: 'Conversion Optimization', targetLevel: 78, priority: 'Important' },
      { name: 'SQL', targetLevel: 60, priority: 'Recommended' },
    ],
    requiredSoftSkills: ['Clear persuasive writing', 'Hypothesis-driven experimentation', 'Audience insight'],
    prerequisites: ['Analytical curiosity and clear written communication'],
    recommendedTechnologies: ['Google Analytics 4', 'Search Console', 'Structured Data JSON-LD', 'A/B Testing'],
    suggestedProjectIds: ['proj-seo-funnel-audit', 'proj-executive-bi'],
    interviewTopics: ['Attribution modeling', 'Core Web Vitals impact on SEO', 'CAC vs LTV ratios', 'Experimentation sample sizing'],
  },
  {
    id: 'business-analytics',
    title: 'Business & Product Analyst',
    category: 'Data & Strategy',
    shortTagline: 'Bridge stakeholder questions and operational data with SQL, KPI models, and dashboards.',
    description:
      'Business Analysts diagnose operational bottlenecks, define North Star KPIs, write analytical SQL queries, and build executive reporting dashboards.',
    demandOutlook: 'High cross-industry demand across tech, consulting, and operations',
    avgEntryReadinessHours: 160,
    requiredTechnicalSkills: [
      { name: 'SQL', targetLevel: 88, priority: 'Core' },
      { name: 'Data Visualization', targetLevel: 85, priority: 'Core' },
      { name: 'Spreadsheets', targetLevel: 85, priority: 'Core' },
      { name: 'Statistics', targetLevel: 75, priority: 'Important' },
      { name: 'Python', targetLevel: 68, priority: 'Recommended' },
    ],
    requiredSoftSkills: ['Stakeholder alignment', 'Metric definition clarity', 'Executive synthesis'],
    prerequisites: ['Comfort with spreadsheets and structured thinking'],
    recommendedTechnologies: ['PostgreSQL', 'SQL', 'Python', 'Looker / BI Dashboards', 'Spreadsheets'],
    suggestedProjectIds: ['proj-executive-bi', 'proj-seo-funnel-audit'],
    interviewTopics: ['Cohort retention analysis', 'SQL joins & CTEs', 'Vanity vs actionable metrics', 'Root-cause metric drop diagnosis'],
  },
];

export const VERIFIED_RESOURCES: LearningResource[] = [
  {
    id: 'res-mdn-web',
    title: 'MDN Web Docs: Learn Web Development',
    description: 'Authoritative structured curriculum covering HTML, CSS, JavaScript, accessibility, and modern web APIs.',
    category: 'Web Development',
    skillTags: ['HTML & CSS', 'JavaScript', 'Accessibility'],
    resourceType: 'Documentation',
    difficulty: 'Beginner',
    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    estimatedMinutes: 360,
    provider: 'Mozilla MDN',
  },
  {
    id: 'res-react-docs',
    title: 'React Official Interactive Documentation',
    description: 'Modern React fundamentals covering components, state, effects, custom hooks, and performance patterns.',
    category: 'Web Development',
    skillTags: ['React', 'TypeScript', 'JavaScript'],
    resourceType: 'Interactive',
    difficulty: 'Intermediate',
    url: 'https://react.dev/learn',
    estimatedMinutes: 240,
    provider: 'React Team',
  },
  {
    id: 'res-ts-handbook',
    title: 'The TypeScript Handbook',
    description: 'Deep dive into static type narrowing, generics, utility types, and safe application modeling.',
    category: 'Programming',
    skillTags: ['TypeScript', 'JavaScript'],
    resourceType: 'Documentation',
    difficulty: 'Intermediate',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    estimatedMinutes: 200,
    provider: 'TypeScript',
  },
  {
    id: 'res-nodejs-learn',
    title: 'Node.js Official Learning Guides',
    description: 'Event loop architecture, asynchronous patterns, streams, HTTP servers, and environment security.',
    category: 'Web Development',
    skillTags: ['Node.js', 'REST APIs'],
    resourceType: 'Guide',
    difficulty: 'Intermediate',
    url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
    estimatedMinutes: 180,
    provider: 'OpenJS Foundation',
  },
  {
    id: 'res-postgres-docs',
    title: 'PostgreSQL Official Tutorial & SQL Reference',
    description: 'Relational schema design, joins, transactions, indexing strategies, and analytical window functions.',
    category: 'Database Management',
    skillTags: ['PostgreSQL', 'SQL'],
    resourceType: 'Documentation',
    difficulty: 'Intermediate',
    url: 'https://www.postgresql.org/docs/current/tutorial.html',
    estimatedMinutes: 240,
    provider: 'PostgreSQL Global',
  },
  {
    id: 'res-webdev-vitals',
    title: 'web.dev Performance & Core Web Vitals',
    description: 'Practical guides on LCP, INP, CLS optimization, bundle splitting, and accessible UI engineering.',
    category: 'Web Development',
    skillTags: ['Performance', 'Accessibility', 'HTML & CSS'],
    resourceType: 'Guide',
    difficulty: 'Intermediate',
    url: 'https://web.dev/explore/learn-performance',
    estimatedMinutes: 150,
    provider: 'Google Chrome Developers',
  },
  {
    id: 'res-mit-missing',
    title: 'MIT Missing Semester of Your CS Education',
    description: 'Essential practical mastery of shell scripting, Git internals, debugging tools, and developer workflows.',
    category: 'Programming',
    skillTags: ['Git', 'Linux', 'Testing'],
    resourceType: 'Course',
    difficulty: 'Beginner',
    url: 'https://missing.csail.mit.edu/',
    estimatedMinutes: 420,
    provider: 'MIT CSAIL',
  },
  {
    id: 'res-git-book',
    title: 'Pro Git Official Book',
    description: 'Complete reference on branching strategies, rebasing, conflict resolution, and Git internals.',
    category: 'Programming',
    skillTags: ['Git'],
    resourceType: 'Reference',
    difficulty: 'Beginner',
    url: 'https://git-scm.com/book/en/v2',
    estimatedMinutes: 210,
    provider: 'Git SCM',
  },
  {
    id: 'res-python-tutorial',
    title: 'Python Official Tutorial',
    description: 'Core Python data structures, modules, error handling, and standard library foundations.',
    category: 'Programming',
    skillTags: ['Python', 'Data Structures'],
    resourceType: 'Documentation',
    difficulty: 'Beginner',
    url: 'https://docs.python.org/3/tutorial/',
    estimatedMinutes: 240,
    provider: 'Python Software Foundation',
  },
  {
    id: 'res-kaggle-learn',
    title: 'Kaggle Learn Micro-Courses (Pandas, SQL & ML)',
    description: 'Hands-on interactive notebooks for Pandas, SQL analytics, feature engineering, and model validation.',
    category: 'Data Science',
    skillTags: ['Python', 'Pandas', 'SQL', 'Scikit-learn'],
    resourceType: 'Interactive',
    difficulty: 'Beginner',
    url: 'https://www.kaggle.com/learn',
    estimatedMinutes: 300,
    provider: 'Kaggle',
  },
  {
    id: 'res-sklearn-guide',
    title: 'Scikit-learn Supervised & Unsupervised Guide',
    description: 'Algorithm selection, cross-validation, preprocessing pipelines, and classification/regression metrics.',
    category: 'AI and Machine Learning',
    skillTags: ['Scikit-learn', 'Python', 'Statistics'],
    resourceType: 'Documentation',
    difficulty: 'Intermediate',
    url: 'https://scikit-learn.org/stable/user_guide.html',
    estimatedMinutes: 300,
    provider: 'Scikit-learn',
  },
  {
    id: 'res-pytorch-tutorials',
    title: 'PyTorch Official Deep Learning Tutorials',
    description: 'Tensors, autograd, neural network modules, training loops, and model deployment workflows.',
    category: 'AI and Machine Learning',
    skillTags: ['PyTorch', 'Python', 'Linear Algebra'],
    resourceType: 'Course',
    difficulty: 'Advanced',
    url: 'https://pytorch.org/tutorials/',
    estimatedMinutes: 360,
    provider: 'PyTorch Foundation',
  },
  {
    id: 'res-gemini-docs',
    title: 'Google Gemini API Developer Documentation',
    description: 'Structured outputs, function calling, thinking mode, streaming, and production SDK patterns.',
    category: 'AI and Machine Learning',
    skillTags: ['LLM Integration', 'Prompt Engineering', 'TypeScript'],
    resourceType: 'Documentation',
    difficulty: 'Intermediate',
    url: 'https://ai.google.dev/gemini-api/docs',
    estimatedMinutes: 160,
    provider: 'Google AI',
  },
  {
    id: 'res-owasp-top10',
    title: 'OWASP Top 10 Web Application Security Risks',
    description: 'Industry-standard taxonomy of injection, broken access control, cryptographic failures, and SSRF.',
    category: 'Cybersecurity',
    skillTags: ['OWASP Top 10', 'Authentication'],
    resourceType: 'Reference',
    difficulty: 'Intermediate',
    url: 'https://owasp.org/www-project-top-ten/',
    estimatedMinutes: 140,
    provider: 'OWASP Foundation',
  },
  {
    id: 'res-docker-guide',
    title: 'Docker Official Get Started Guide',
    description: 'Container images, multi-stage Dockerfiles, networking, volumes, and multi-container Compose stacks.',
    category: 'Cloud Computing',
    skillTags: ['Docker', 'CI/CD'],
    resourceType: 'Guide',
    difficulty: 'Beginner',
    url: 'https://docs.docker.com/get-started/',
    estimatedMinutes: 150,
    provider: 'Docker',
  },
  {
    id: 'res-gcp-learn',
    title: 'Google Cloud Architecture & Skills Path',
    description: 'Cloud compute, serverless containers, managed databases, IAM security, and observability patterns.',
    category: 'Cloud Computing',
    skillTags: ['Cloud Architecture', 'Networking', 'CI/CD'],
    resourceType: 'Course',
    difficulty: 'Intermediate',
    url: 'https://cloud.google.com/learn/training',
    estimatedMinutes: 300,
    provider: 'Google Cloud',
  },
  {
    id: 'res-roadmap-sh',
    title: 'roadmap.sh Community Developer Roadmaps',
    description: 'Visual skill maps and topic checklists across Frontend, Backend, DevOps, AI, and Cybersecurity.',
    category: 'Career Development',
    skillTags: ['System Design', 'Git', 'REST APIs'],
    resourceType: 'Reference',
    difficulty: 'Beginner',
    url: 'https://roadmap.sh/',
    estimatedMinutes: 90,
    provider: 'roadmap.sh',
  },
  {
    id: 'res-figma-learn',
    title: 'Figma Design Systems & Prototyping Library',
    description: 'Auto-layout, component variants, design tokens, accessibility contrast, and interactive prototypes.',
    category: 'Web Development',
    skillTags: ['Figma', 'Design Systems', 'Wireframing'],
    resourceType: 'Course',
    difficulty: 'Beginner',
    url: 'https://help.figma.com/hc/en-us/categories/360002051613',
    estimatedMinutes: 180,
    provider: 'Figma',
  },
  {
    id: 'res-google-seo',
    title: 'Google Search Central SEO Starter Guide',
    description: 'Crawling, indexing, structured metadata, Core Web Vitals, and search quality fundamentals.',
    category: 'Career Development',
    skillTags: ['Technical SEO', 'Content Strategy', 'Web Analytics'],
    resourceType: 'Guide',
    difficulty: 'Beginner',
    url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
    estimatedMinutes: 120,
    provider: 'Google Search Central',
  },
  {
    id: 'res-tech-interview',
    title: 'Tech Interview Handbook',
    description: 'Structured guide to coding interviews, behavioral STAR storytelling, and algorithm patterns.',
    category: 'Interview Preparation',
    skillTags: ['Data Structures', 'Algorithms', 'System Design'],
    resourceType: 'Guide',
    difficulty: 'Intermediate',
    url: 'https://www.techinterviewhandbook.org/',
    estimatedMinutes: 240,
    provider: 'Tech Interview Handbook',
  },
];

export const QUIZZES: QuizDefinition[] = [
  {
    id: 'quiz-fullstack-core',
    title: 'Full-Stack Web Architecture Assessment',
    careerId: 'fullstack-dev',
    description: 'Evaluates TypeScript, React state lifecycle, REST API security, and relational SQL indexing.',
    difficulty: 'Intermediate',
    timeLimitSeconds: 420,
    questions: [
      {
        id: 'q-fs-1',
        prompt: 'In React, why should state updates derived from previous state use a functional updater like setCount(prev => prev + 1)?',
        options: [
          'It bypasses the virtual DOM reconciliation phase entirely.',
          'It guarantees the latest state value when multiple updates are batched in the same render cycle.',
          'It automatically persists state into browser storage.',
          'It prevents TypeScript from checking the state type.',
        ],
        correctIndex: 1,
        explanation: 'React batches multiple setState calls. Passing an updater function receives the most recent queued state rather than a stale closure.',
        skillTag: 'React',
      },
      {
        id: 'q-fs-2',
        prompt: 'Which HTTP status code is most semantically accurate when a client sends valid JSON that fails domain validation rules?',
        options: ['200 OK', '401 Unauthorized', '422 Unprocessable Entity (or 400 Bad Request)', '502 Bad Gateway'],
        correctIndex: 2,
        explanation: '400 or 422 signals client-side payload validation failure; 401 is for missing/invalid authentication, and 5xx indicates server failure.',
        skillTag: 'REST APIs',
      },
      {
        id: 'q-fs-3',
        prompt: 'What is the primary benefit of adding a B-Tree index on a foreign key column like applications(job_id) in PostgreSQL?',
        options: [
          'It encrypts the column values at rest.',
          'It accelerates WHERE filtering and JOIN lookups without scanning the entire table.',
          'It eliminates the need for primary keys.',
          'It increases write speed on INSERT operations.',
        ],
        correctIndex: 1,
        explanation: 'Indexes speed up read queries, JOINs, and WHERE clauses on large tables at the cost of a small write overhead.',
        skillTag: 'PostgreSQL',
      },
      {
        id: 'q-fs-4',
        prompt: 'In TypeScript, what does the `unknown` type enforce compared to `any`?',
        options: [
          'It allows calling any method on the value without checks.',
          'It requires type narrowing or validation before operating on the value.',
          'It compiles to a runtime class wrapper.',
          'It is only valid for function return types.',
        ],
        correctIndex: 1,
        explanation: '`unknown` is the type-safe counterpart of `any`: you must narrow or validate its shape before accessing properties.',
        skillTag: 'TypeScript',
      },
      {
        id: 'q-fs-5',
        prompt: 'Why should third-party AI API keys never be placed in client-side Vite environment variables (VITE_*)?',
        options: [
          'Vite cannot bundle strings longer than 16 characters.',
          'All VITE_* variables are embedded into public browser JS bundles and visible to any user.',
          'Browsers block HTTPS calls containing API keys.',
          'Serverless backends cannot read JSON responses from AI providers.',
        ],
        correctIndex: 1,
        explanation: 'Frontend bundles are shipped to every user browser. Sensitive API keys belong strictly on backend servers.',
        skillTag: 'Node.js',
      },
    ],
  },
  {
    id: 'quiz-frontend-ui',
    title: 'Frontend Systems & Accessibility Check',
    careerId: 'frontend-dev',
    description: 'Covers semantic HTML, WCAG contrast, CSS layout engines, and React rendering performance.',
    difficulty: 'Beginner',
    timeLimitSeconds: 360,
    questions: [
      {
        id: 'q-fe-1',
        prompt: 'What is the minimum WCAG AA contrast ratio required for normal body text?',
        options: ['2.0 : 1', '3.0 : 1', '4.5 : 1', '7.5 : 1'],
        correctIndex: 2,
        explanation: 'WCAG AA mandates at least 4.5:1 contrast for standard text and 3:1 for large text (18pt+ or 14pt+ bold).',
        skillTag: 'Accessibility',
      },
      {
        id: 'q-fe-2',
        prompt: 'Which CSS properties are composited on the GPU without triggering layout reflow during animations?',
        options: [
          'width and height',
          'margin and padding',
          'transform and opacity',
          'top and left',
        ],
        correctIndex: 2,
        explanation: 'Animating `transform` and `opacity` stays on the compositor thread and avoids expensive layout/paint recalculations.',
        skillTag: 'Performance',
      },
      {
        id: 'q-fe-3',
        prompt: 'Why should interactive actions use <button> instead of <div onClick={...}>?',
        options: [
          'Div elements cannot accept Tailwind classes.',
          'Native <button> provides keyboard focusability, Enter/Space activation, and screen reader semantics automatically.',
          'Buttons automatically submit GET requests without JavaScript.',
          'Div elements are deprecated in HTML5.',
        ],
        correctIndex: 1,
        explanation: 'Native buttons ship with built-in keyboard navigation, focus rings, disabled states, and ARIA role semantics.',
        skillTag: 'HTML & CSS',
      },
      {
        id: 'q-fe-4',
        prompt: 'When rendering a dynamic list in React, why is using the array index as `key` problematic when items reorder or delete?',
        options: [
          'React throws a syntax error when keys are numbers.',
          'React reuses component DOM/state by index position, causing mismatched local state on reordered rows.',
          'Array indices disable CSS Flexbox.',
          'It doubles memory usage in Vite.',
        ],
        correctIndex: 1,
        explanation: 'Stable unique IDs let React reconcile moved or deleted elements accurately without scrambling component state.',
        skillTag: 'React',
      },
    ],
  },
  {
    id: 'quiz-data-ai',
    title: 'Data Science & Applied AI Foundations',
    careerId: 'data-science',
    description: 'Tests train/test leakage, evaluation metrics, SQL analytics, and structured LLM engineering.',
    difficulty: 'Intermediate',
    timeLimitSeconds: 420,
    questions: [
      {
        id: 'q-ds-1',
        prompt: 'What causes data leakage when scaling numeric features before splitting into train and test sets?',
        options: [
          'The training set shrinks by 20%.',
          'Test-set distribution statistics (mean/variance) leak into the training transformation, inflating validation accuracy.',
          'SQL databases refuse floating-point values.',
          'Python garbage collection slows down.',
        ],
        correctIndex: 1,
        explanation: 'Always fit scalers/imputers strictly on training folds and apply `.transform()` to validation/test folds.',
        skillTag: 'Scikit-learn',
      },
      {
        id: 'q-ds-2',
        prompt: 'In an imbalanced fraud-detection dataset where 99% of rows are legitimate, why is raw Accuracy misleading?',
        options: [
          'Accuracy cannot be computed on binary labels.',
          'A dummy model predicting "legitimate" for every row gets 99% accuracy while catching 0% of fraud.',
          'Accuracy requires a GPU.',
          'Accuracy only works with unsupervised clustering.',
        ],
        correctIndex: 1,
        explanation: 'For imbalanced classes, Precision, Recall, F1-score, and PR-AUC reveal actual minority-class detection performance.',
        skillTag: 'Statistics',
      },
      {
        id: 'q-ds-3',
        prompt: 'Which SQL clause computes a running total per user without collapsing rows into one summary row per user?',
        options: [
          'GROUP BY user_id',
          'SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at)',
          'HAVING COUNT(*) > 1',
          'DISTINCT ON (user_id)',
        ],
        correctIndex: 1,
        explanation: 'Window functions (`OVER (PARTITION BY ... ORDER BY ...)`) retain row granularity while computing partitioned aggregates.',
        skillTag: 'SQL',
      },
      {
        id: 'q-ds-4',
        prompt: 'Why is a `responseSchema` paired with `responseMimeType: "application/json"` preferred for production AI workflows?',
        options: [
          'It eliminates all server latency.',
          'It constrains the model output to predictable typed JSON keys that backend code can safely parse.',
          'It replaces the need for authentication.',
          'It increases token limits automatically.',
        ],
        correctIndex: 1,
        explanation: 'Schema-constrained JSON guarantees predictable field names and types for reliable downstream UI and DB persistence.',
        skillTag: 'LLM Integration',
      },
    ],
  },
  {
    id: 'quiz-security-cloud',
    title: 'Cloud Security & DevOps Readiness',
    careerId: 'cybersecurity',
    description: 'Assesses OWASP Top 10 defenses, container hygiene, least-privilege IAM, and TLS security.',
    difficulty: 'Intermediate',
    timeLimitSeconds: 360,
    questions: [
      {
        id: 'q-sec-1',
        prompt: 'What is the most effective defense against SQL Injection in backend database layers?',
        options: [
          'Checking if the input string contains the word SELECT in lowercase.',
          'Using parameterized queries / prepared statements or type-safe ORM query builders.',
          'Base64-encoding user inputs before concatenating them into SQL strings.',
          'Disabling HTTPS on internal routes.',
        ],
        correctIndex: 1,
        explanation: 'Parameterized queries separate SQL syntax from user-supplied values so inputs can never alter query structure.',
        skillTag: 'OWASP Top 10',
      },
      {
        id: 'q-sec-2',
        prompt: 'Why are multi-stage Docker builds widely used in production deployments?',
        options: [
          'They allow running Windows binaries on Linux kernels without emulation.',
          'They compile artifacts in a builder stage and copy only runtime files to a minimal final image, reducing size and attack surface.',
          'They eliminate the need for environment variables.',
          'They automatically create a Kubernetes cluster.',
        ],
        correctIndex: 1,
        explanation: 'Multi-stage builds strip build tools, source headers, and dev dependencies from the final production container.',
        skillTag: 'Docker',
      },
      {
        id: 'q-sec-3',
        prompt: 'What does "Broken Object Level Authorization (BOLA / IDOR)" mean in an API?',
        options: [
          'The server crashes when JSON payloads exceed 1MB.',
          'An authenticated user accesses or modifies another user’s record simply by changing a document ID in the URL or body.',
          'Passwords are stored with bcrypt instead of Argon2.',
          'CORS headers allow GET requests.',
        ],
        correctIndex: 1,
        explanation: 'Authentication verifies who you are; authorization must verify whether your UID owns or has permission for that specific record.',
        skillTag: 'Authentication',
      },
    ],
  },
];

export const PROJECT_BLUEPRINTS: ProjectBlueprint[] = [
  {
    id: 'proj-fullstack-tracker',
    title: 'Multi-Role Cohort Learning & Milestone Tracker',
    careerId: 'fullstack-dev',
    difficulty: 'Intermediate',
    description:
      'Build a full-stack web application where mentors publish curriculum tracks and learners log verified milestone completions with real-time progress analytics.',
    requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'REST APIs'],
    techStack: ['React', 'TypeScript', 'Express', 'PostgreSQL', 'Tailwind CSS'],
    objectives: [
      'Implement role-based route protection and token verification.',
      'Model normalized user, track, and milestone relationships.',
      'Display interactive progress charts with responsive empty/loading states.',
    ],
    implementationSteps: [
      'Design normalized schema and REST API contract.',
      'Implement authenticated backend endpoints with Zod payload validation.',
      'Build accessible dashboard views with real-time progress calculations.',
      'Add unit & integration tests for auth and milestone updates.',
    ],
    expectedOutcome: 'Deployed full-stack repository with README architecture diagram and live demo URL.',
    estimatedHours: 24,
  },
  {
    id: 'proj-ai-study-copilot',
    title: 'Structured AI Technical Interview & Rubric Evaluator',
    careerId: 'ai-engineering',
    difficulty: 'Intermediate',
    description:
      'Engineer a server-side Gemini application that generates role-specific technical prompts and evaluates answers against deterministic scoring rubrics.',
    requiredSkills: ['TypeScript', 'LLM Integration', 'Prompt Engineering', 'REST APIs'],
    techStack: ['Node.js', 'Express', '@google/genai', 'React', 'TypeScript'],
    objectives: [
      'Keep AI SDK calls strictly server-side with sliding-window rate limiting.',
      'Enforce structured JSON output schemas for deterministic rubric scoring.',
      'Persist historical feedback sessions per authenticated user.',
    ],
    implementationSteps: [
      'Create backend Gemini service with retry/backoff and error normalization.',
      'Define responseSchema for scores, strengths, and next study actions.',
      'Build timed practice UI with side-by-side rubric breakdown.',
    ],
    expectedOutcome: 'Production-hardened AI evaluation service with clear latency and error handling.',
    estimatedHours: 18,
  },
  {
    id: 'proj-design-system',
    title: 'WCAG-AA Accessible Component & Token Library',
    careerId: 'frontend-dev',
    difficulty: 'Beginner',
    description:
      'Create a reusable set of keyboard-accessible form controls, modals, data tables, and segmented filters built with semantic tokens.',
    requiredSkills: ['HTML & CSS', 'React', 'TypeScript', 'Accessibility', 'Figma'],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
    objectives: [
      'Achieve full keyboard navigation (Tab, Escape, Arrow keys) on all interactive controls.',
      'Verify >= 4.5:1 contrast across dark and light surface tokens.',
      'Document component props and usage guidelines cleanly.',
    ],
    implementationSteps: [
      'Define color, spacing, and typography CSS variables.',
      'Build accessible Button, Input, Dialog, and DataTable primitives.',
      'Audit contrast and screen reader labels across viewports.',
    ],
    expectedOutcome: 'Reusable component showcase ready for frontend engineering interviews.',
    estimatedHours: 14,
  },
  {
    id: 'proj-rate-limited-api',
    title: 'Hardened Multi-Tenant REST API with Caching & Health Probes',
    careerId: 'backend-dev',
    difficulty: 'Intermediate',
    description:
      'Design a high-throughput backend service featuring JWT auth guards, sliding-window rate limiting, structured logging, and OpenAPI documentation.',
    requiredSkills: ['Node.js', 'REST APIs', 'Authentication', 'Docker', 'PostgreSQL'],
    techStack: ['Node.js', 'TypeScript', 'Express', 'PostgreSQL', 'Docker'],
    objectives: [
      'Prevent IDOR/BOLA vulnerabilities through strict ownership checks.',
      'Containerize API with multi-stage Dockerfile and Compose stack.',
      'Write automated API integration tests covering 401/403/429 cases.',
    ],
    implementationSteps: [
      'Scaffold modular Express routers with Zod DTO validation.',
      'Implement token verification and sliding-window rate limiter.',
      'Write multi-stage Dockerfile and automated supertest suite.',
    ],
    expectedOutcome: 'Containerized, documented API repository passing security and integration suites.',
    estimatedHours: 20,
  },
  {
    id: 'proj-churn-predictor',
    title: 'Explainable Customer Retention Pipeline & Feature Audit',
    careerId: 'data-science',
    difficulty: 'Intermediate',
    description:
      'Build an end-to-end tabular ML pipeline comparing baseline logistic regression against gradient-boosted trees with leakage-free validation.',
    requiredSkills: ['Python', 'Pandas', 'Scikit-learn', 'Statistics', 'SQL'],
    techStack: ['Python', 'Pandas', 'Scikit-learn', 'SQL', 'Matplotlib'],
    objectives: [
      'Extract behavioral cohorts cleanly with SQL window functions.',
      'Prevent preprocessing leakage using Scikit-learn Pipelines.',
      'Translate model feature importances into concrete product actions.',
    ],
    implementationSteps: [
      'Perform exploratory data analysis and missingness audit.',
      'Build stratified k-fold cross-validation pipeline.',
      'Report PR-AUC, calibration curves, and business impact summary.',
    ],
    expectedOutcome: 'Reproducible repository + executive analytical memo.',
    estimatedHours: 22,
  },
  {
    id: 'proj-security-audit-kit',
    title: 'Automated OWASP Security Header & Dependency Audit CLI',
    careerId: 'cybersecurity',
    difficulty: 'Intermediate',
    description:
      'Develop a diagnostic toolkit that inspects HTTP security headers, TLS configuration, and common misconfigurations with remediation guidance.',
    requiredSkills: ['Networking', 'OWASP Top 10', 'Linux', 'Python'],
    techStack: ['Python', 'Linux', 'HTTP/TLS', 'Docker'],
    objectives: [
      'Check CSP, HSTS, X-Content-Type-Options, and CORS policies.',
      'Generate prioritized severity reports with actionable fixes.',
      'Package tool cleanly for CI/CD pipeline checks.',
    ],
    implementationSteps: [
      'Implement non-destructive HTTP header and TLS certificate inspector.',
      'Map findings directly to OWASP ASVS controls.',
      'Output clean JSON and Markdown security audit summaries.',
    ],
    expectedOutcome: 'Open-source security hygiene CLI ready for DevSecOps portfolios.',
    estimatedHours: 16,
  },
];

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'iq-fs-1',
    careerId: 'fullstack-dev',
    category: 'Technical',
    difficulty: 'Intermediate',
    question: 'Explain how you would prevent a race condition when two users simultaneously claim the last seat or apply/book a limited slot in a database.',
    sampleAnswer:
      'Use a database transaction with row-level locking (SELECT ... FOR UPDATE) or an atomic conditional update (UPDATE slots SET remaining = remaining - 1 WHERE id = $1 AND remaining > 0 RETURNING *), and ensure the API endpoint handles conflict errors cleanly with HTTP 409.',
    keySignals: ['Database transactions', 'Row-level locking or atomic conditional updates', 'Idempotency & HTTP 409 handling'],
  },
  {
    id: 'iq-fs-2',
    careerId: 'fullstack-dev',
    category: 'Role-Specific',
    difficulty: 'Intermediate',
    question: 'Walk through what happens from the moment a user submits a login form in React until an authenticated dashboard renders.',
    sampleAnswer:
      'Client validates inputs, triggers auth provider or POST /login over HTTPS, receives a short-lived signed token/session, attaches Bearer/HttpOnly credentials to subsequent API calls, backend middleware verifies signature & expiration before querying user-scoped data, and React transitions safely with loading/error guards.',
    keySignals: ['HTTPS & credential hygiene', 'Token verification middleware', 'User-scoped authorization check'],
  },
  {
    id: 'iq-fe-1',
    careerId: 'frontend-dev',
    category: 'Technical',
    difficulty: 'Intermediate',
    question: 'How do you diagnose and fix a React dashboard that feels sluggish when filtering a 2,000-row table?',
    sampleAnswer:
      'Profile with React DevTools Profiler to identify unnecessary re-renders, memoize expensive derived filtering with useMemo, debounce live search input, virtualize long rows (or paginate server-side), and avoid recreating inline object/callback props on memoized rows.',
    keySignals: ['Measurement before optimization', 'Virtualization or pagination', 'Memoization & debouncing'],
  },
  {
    id: 'iq-be-1',
    careerId: 'backend-dev',
    category: 'Technical',
    difficulty: 'Advanced',
    question: 'Design a rate limiter for an AI endpoint so a single user cannot exhaust API quotas while legitimate bursts still succeed.',
    sampleAnswer:
      'Implement a token-bucket or sliding-window counter keyed by authenticated user ID (falling back to IP for unauthenticated routes). Store counters in Redis using atomic INCR + EXPIRE or Lua scripts in distributed deployments, returning HTTP 429 with Retry-After headers when exceeded.',
    keySignals: ['Token bucket / sliding window', 'Per-UID keying', 'Atomic distributed state & 429 Retry-After'],
  },
  {
    id: 'iq-ds-1',
    careerId: 'data-science',
    category: 'Technical',
    difficulty: 'Intermediate',
    question: 'A stakeholder notices conversion dropped 12% yesterday. How do you systematically investigate before concluding a model or feature broke?',
    sampleAnswer:
      'First verify telemetry & logging integrity (did tracking drop?), then segment by platform, browser, geography, and acquisition channel to isolate the blast radius, check recent deployments or pricing changes, and compare against historical day-of-week seasonality.',
    keySignals: ['Data quality check first', 'Dimensional segmentation', 'Deployment & seasonality checks'],
  },
  {
    id: 'iq-ai-1',
    careerId: 'ai-engineering',
    category: 'Role-Specific',
    difficulty: 'Intermediate',
    question: 'How do you evaluate whether a prompt or model upgrade actually improved your AI career assistant rather than introducing regressions?',
    sampleAnswer:
      'Maintain a golden evaluation dataset of 50+ representative user queries including edge cases (missing context, adversarial prompts, formatting constraints). Run automated LLM-as-judge and deterministic schema assertions on both versions, measuring accuracy, schema validity, latency, and token cost.',
    keySignals: ['Golden evaluation dataset', 'Deterministic + rubric assertions', 'Latency & cost tradeoffs'],
  },
  {
    id: 'iq-sec-1',
    careerId: 'cybersecurity',
    category: 'Technical',
    difficulty: 'Intermediate',
    question: 'What is the difference between Authentication and Authorization, and how do security rules enforce both?',
    sampleAnswer:
      'Authentication proves identity (verifying a signed token or credentials). Authorization determines what that verified identity is permitted to read or modify on a specific resource (e.g. checking resource.data.uid == request.auth.uid and validating role permissions on every endpoint).',
    keySignals: ['Identity vs resource permission', 'Server/rule-level enforcement', 'Least privilege'],
  },
  {
    id: 'iq-hr-1',
    careerId: 'fullstack-dev',
    category: 'HR',
    difficulty: 'Beginner',
    question: 'Tell me about a time you hit a technical gap while building a project and how you bridged it under a deadline.',
    sampleAnswer:
      'Use the STAR method: clearly state the Situation and concrete gap, the Task you owned, the Action you took (breaking down docs, building a minimal reproduction, seeking targeted feedback), and the measurable Result and lesson carried forward.',
    keySignals: ['STAR structure', 'Ownership without blaming', 'Concrete learning outcome'],
  },
  {
    id: 'iq-hr-2',
    careerId: 'software-dev',
    category: 'HR',
    difficulty: 'Beginner',
    question: 'How do you prioritize tasks when multiple features, bug fixes, and learning goals compete for your time?',
    sampleAnswer:
      'Evaluate impact versus urgency: unblock critical user-facing bugs and core deliverables first, time-box exploratory work, communicate trade-offs early with teammates, and track progress incrementally.',
    keySignals: ['Impact vs urgency framework', 'Proactive communication', 'Time-boxing'],
  },
];
