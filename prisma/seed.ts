import { config } from "dotenv";
config({ path: ".env.local" });

import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function thumb(seed: string) {
  return `https://picsum.photos/seed/${seed}/640/360`;
}

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seeding…");

  // -------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------
  const categoryDefs = [
    { slug: "business", name: "Business", icon: "Briefcase" },
    { slug: "technology", name: "Technology", icon: "Cpu" },
    { slug: "design", name: "Design", icon: "Palette" },
    { slug: "marketing", name: "Marketing", icon: "Megaphone" },
    { slug: "data", name: "Data", icon: "BarChart3" },
    { slug: "leadership", name: "Leadership", icon: "Users" },
    { slug: "finance", name: "Finance", icon: "Landmark" },
    { slug: "personal-development", name: "Personal Development", icon: "Sparkles" },
    { slug: "software-development", name: "Software Development", icon: "Code2" },
    { slug: "project-management", name: "Project Management", icon: "ClipboardList" },
  ];
  const categories: Record<string, { id: string }> = {};
  for (const def of categoryDefs) {
    categories[def.slug] = await prisma.courseCategory.upsert({
      where: { slug: def.slug },
      update: {},
      create: def,
    });
  }

  // -------------------------------------------------------------------
  // Skills
  // -------------------------------------------------------------------
  const skillNames = [
    "JavaScript",
    "TypeScript",
    "React",
    "Python",
    "SQL",
    "UX Research",
    "Figma",
    "Public Speaking",
    "Negotiation",
    "Financial Modeling",
    "SEO",
    "Content Strategy",
    "Agile",
    "Data Visualization",
    "Machine Learning",
    "Excel",
    "Leadership",
    "Copywriting",
  ];
  const skills: Record<string, { id: string }> = {};
  for (const name of skillNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    skills[name] = await prisma.courseSkill.upsert({ where: { slug }, update: {}, create: { slug, name } });
  }

  // -------------------------------------------------------------------
  // Users: admin, instructors, students
  // -------------------------------------------------------------------
  const passwordHash = await hash("Password123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@elearning.dev" },
    update: {},
    create: {
      email: "admin@elearning.dev",
      username: "admin",
      name: "Jordan Reyes",
      role: "ADMIN",
      passwordHash,
      emailVerified: new Date(),
      profile: { create: { bio: "Platform administrator." } },
      notificationPrefs: { create: {} },
    },
  });

  const instructorDefs = [
    { username: "maya-chen", name: "Maya Chen", title: "Senior Product Designer", expertise: ["Design", "UX Research", "Figma"] },
    { username: "daniel-osei", name: "Daniel Osei", title: "Staff Software Engineer", expertise: ["Software Development", "React", "TypeScript"] },
    { username: "sofia-almeida", name: "Sofia Almeida", title: "Growth Marketing Lead", expertise: ["Marketing", "SEO", "Content Strategy"] },
    { username: "ravi-kapoor", name: "Ravi Kapoor", title: "Data Science Manager", expertise: ["Data", "Python", "Machine Learning"] },
    { username: "elena-petrov", name: "Elena Petrov", title: "VP of Finance", expertise: ["Finance", "Financial Modeling", "Excel"] },
    { username: "marcus-webb", name: "Marcus Webb", title: "Executive Coach", expertise: ["Leadership", "Public Speaking", "Negotiation"] },
  ];
  const instructors: Record<string, { id: string; name: string }> = {};
  for (const def of instructorDefs) {
    const user = await prisma.user.upsert({
      where: { email: `${def.username}@elearning.dev` },
      update: {},
      create: {
        email: `${def.username}@elearning.dev`,
        username: def.username,
        name: def.name,
        role: "INSTRUCTOR",
        passwordHash,
        emailVerified: new Date(),
        avatarUrl: `https://i.pravatar.cc/150?u=${def.username}`,
        profile: { create: { bio: `${def.title} and instructor.`, headline: def.title } },
        instructorProfile: { create: { title: def.title, expertise: def.expertise, yearsExperience: 8 } },
        notificationPrefs: { create: {} },
      },
    });
    instructors[def.username] = user;
  }

  const studentDefs = [
    { username: "alex-morgan", name: "Alex Morgan" },
    { username: "priya-shah", name: "Priya Shah" },
    { username: "liam-oconnor", name: "Liam O'Connor" },
    { username: "grace-kim", name: "Grace Kim" },
  ];
  const students: Record<string, { id: string; name: string }> = {};
  for (const def of studentDefs) {
    const user = await prisma.user.upsert({
      where: { email: `${def.username}@elearning.dev` },
      update: {},
      create: {
        email: `${def.username}@elearning.dev`,
        username: def.username,
        name: def.name,
        role: "STUDENT",
        passwordHash,
        emailVerified: new Date(),
        avatarUrl: `https://i.pravatar.cc/150?u=${def.username}`,
        profile: { create: {} },
        notificationPrefs: { create: {} },
      },
    });
    students[def.username] = user;
  }

  // -------------------------------------------------------------------
  // Courses
  // -------------------------------------------------------------------
  type CourseDef = {
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    category: keyof typeof categories;
    instructor: keyof typeof instructors;
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
    price: number | null;
    isFeatured?: boolean;
    skills: (keyof typeof skills)[];
    outcomes: string[];
    requirements: string[];
    sections: { title: string; lessons: { title: string; minutes: number; type?: "VIDEO" | "QUIZ" | "ARTICLE" }[] }[];
  };

  const courseDefs: CourseDef[] = [
    {
      slug: "ux-research-foundations",
      title: "UX Research Foundations",
      subtitle: "Plan, run, and synthesize research your team will actually trust",
      description:
        "Learn the full UX research cycle — from framing the right question to running interviews and turning findings into decisions stakeholders act on.",
      category: "design",
      instructor: "maya-chen",
      difficulty: "BEGINNER",
      price: 0,
      isFeatured: true,
      skills: ["UX Research", "Figma"],
      outcomes: [
        "Plan a research study with a clear objective",
        "Conduct effective user interviews",
        "Synthesize findings into actionable insights",
        "Present research to stakeholders",
      ],
      requirements: ["No prior experience required"],
      sections: [
        {
          title: "Getting Started with Research",
          lessons: [
            { title: "Why research matters", minutes: 8 },
            { title: "Types of research methods", minutes: 12 },
            { title: "Choosing the right method", minutes: 10, type: "ARTICLE" },
          ],
        },
        {
          title: "Running Interviews",
          lessons: [
            { title: "Writing a discussion guide", minutes: 14 },
            { title: "Conducting the interview", minutes: 18 },
            { title: "Avoiding leading questions", minutes: 9 },
            { title: "Knowledge check", minutes: 5, type: "QUIZ" },
          ],
        },
        {
          title: "Synthesis & Presentation",
          lessons: [
            { title: "Affinity mapping", minutes: 15 },
            { title: "Turning insights into recommendations", minutes: 13 },
            { title: "Presenting to stakeholders", minutes: 11 },
          ],
        },
      ],
    },
    {
      slug: "design-systems-at-scale",
      title: "Design Systems at Scale",
      subtitle: "Build a component library that survives contact with a real product",
      description: "A practical guide to building, documenting, and governing a design system across multiple product teams.",
      category: "design",
      instructor: "maya-chen",
      difficulty: "INTERMEDIATE",
      price: 49,
      skills: ["Figma", "UX Research"],
      outcomes: ["Structure a token-based design system", "Document components for engineering handoff", "Govern contributions from multiple teams"],
      requirements: ["Basic Figma familiarity"],
      sections: [
        {
          title: "Foundations",
          lessons: [
            { title: "What makes a system, a system", minutes: 10 },
            { title: "Design tokens", minutes: 16 },
          ],
        },
        {
          title: "Components",
          lessons: [
            { title: "Component anatomy", minutes: 14 },
            { title: "Variants and states", minutes: 12 },
            { title: "Documentation that gets read", minutes: 9, type: "ARTICLE" },
          ],
        },
      ],
    },
    {
      slug: "react-for-professionals",
      title: "React for Professionals",
      subtitle: "Production patterns for building maintainable React applications",
      description: "Go beyond tutorials — learn the patterns, testing strategies, and performance techniques used on real production codebases.",
      category: "software-development",
      instructor: "daniel-osei",
      difficulty: "INTERMEDIATE",
      price: 59,
      isFeatured: true,
      skills: ["React", "JavaScript", "TypeScript"],
      outcomes: ["Structure a scalable React application", "Write component tests that catch real bugs", "Optimize rendering performance"],
      requirements: ["Comfortable with JavaScript fundamentals"],
      sections: [
        {
          title: "Component Architecture",
          lessons: [
            { title: "Composition over configuration", minutes: 15 },
            { title: "Custom hooks", minutes: 18 },
            { title: "State colocation", minutes: 11 },
          ],
        },
        {
          title: "Testing",
          lessons: [
            { title: "Testing philosophy", minutes: 9 },
            { title: "Writing your first test", minutes: 16 },
            { title: "Knowledge check", minutes: 5, type: "QUIZ" },
          ],
        },
        {
          title: "Performance",
          lessons: [
            { title: "Profiling renders", minutes: 13 },
            { title: "Memoization done right", minutes: 12 },
          ],
        },
      ],
    },
    {
      slug: "typescript-in-depth",
      title: "TypeScript in Depth",
      subtitle: "Master the type system that powers modern web apps",
      description: "From basic types to advanced generics and inference — everything you need to write confidently typed TypeScript.",
      category: "software-development",
      instructor: "daniel-osei",
      difficulty: "ADVANCED",
      price: 49,
      skills: ["TypeScript", "JavaScript"],
      outcomes: ["Use generics to write reusable, type-safe code", "Model complex domains with discriminated unions", "Debug type errors quickly"],
      requirements: ["Working knowledge of JavaScript"],
      sections: [
        {
          title: "Core Types",
          lessons: [
            { title: "Structural typing", minutes: 10 },
            { title: "Unions and narrowing", minutes: 14 },
          ],
        },
        {
          title: "Advanced Patterns",
          lessons: [
            { title: "Generics", minutes: 17 },
            { title: "Discriminated unions", minutes: 13 },
            { title: "Utility types", minutes: 11 },
          ],
        },
      ],
    },
    {
      slug: "python-for-data-analysis",
      title: "Python for Data Analysis",
      subtitle: "From spreadsheets to pandas: analyze real datasets with confidence",
      description: "A hands-on introduction to data analysis in Python using pandas, with real datasets and practical exercises throughout.",
      category: "data",
      instructor: "ravi-kapoor",
      difficulty: "BEGINNER",
      price: 0,
      isFeatured: true,
      skills: ["Python", "SQL", "Data Visualization"],
      outcomes: ["Clean and transform messy datasets", "Build visualizations that tell a clear story", "Write reusable analysis scripts"],
      requirements: ["No programming experience required"],
      sections: [
        {
          title: "Python Basics for Data",
          lessons: [
            { title: "Setting up your environment", minutes: 9 },
            { title: "Working with pandas DataFrames", minutes: 16 },
          ],
        },
        {
          title: "Analysis Techniques",
          lessons: [
            { title: "Cleaning messy data", minutes: 14 },
            { title: "Grouping and aggregation", minutes: 12 },
            { title: "Visualizing results", minutes: 15 },
            { title: "Knowledge check", minutes: 5, type: "QUIZ" },
          ],
        },
      ],
    },
    {
      slug: "machine-learning-foundations",
      title: "Machine Learning Foundations",
      subtitle: "Build intuition for how ML models actually work",
      description: "Understand the core concepts behind machine learning — from linear regression to neural networks — with practical Python examples.",
      category: "data",
      instructor: "ravi-kapoor",
      difficulty: "INTERMEDIATE",
      price: 69,
      skills: ["Python", "Machine Learning"],
      outcomes: ["Explain how common ML algorithms work", "Train and evaluate a model in Python", "Avoid common pitfalls like overfitting"],
      requirements: ["Basic Python knowledge", "High-school level statistics helpful"],
      sections: [
        {
          title: "Foundations",
          lessons: [
            { title: "What is machine learning", minutes: 11 },
            { title: "Linear regression", minutes: 17 },
          ],
        },
        {
          title: "Classification",
          lessons: [
            { title: "Logistic regression", minutes: 14 },
            { title: "Decision trees", minutes: 13 },
            { title: "Evaluating models", minutes: 12 },
          ],
        },
      ],
    },
    {
      slug: "growth-marketing-playbook",
      title: "The Growth Marketing Playbook",
      subtitle: "Repeatable tactics for acquiring and retaining customers",
      description: "A practical playbook covering SEO, content, and lifecycle marketing tactics used by fast-growing companies.",
      category: "marketing",
      instructor: "sofia-almeida",
      difficulty: "BEGINNER",
      price: 39,
      skills: ["SEO", "Content Strategy"],
      outcomes: ["Build an SEO content strategy from scratch", "Design a lifecycle email sequence", "Measure what actually drives growth"],
      requirements: ["None"],
      sections: [
        {
          title: "Acquisition",
          lessons: [
            { title: "SEO fundamentals", minutes: 15 },
            { title: "Content that ranks", minutes: 13 },
          ],
        },
        {
          title: "Retention",
          lessons: [
            { title: "Lifecycle email basics", minutes: 12 },
            { title: "Measuring retention", minutes: 10 },
            { title: "Knowledge check", minutes: 5, type: "QUIZ" },
          ],
        },
      ],
    },
    {
      slug: "copywriting-that-converts",
      title: "Copywriting That Converts",
      subtitle: "Write landing pages and emails people actually read",
      description: "Learn the frameworks professional copywriters use to turn readers into customers, with before/after examples throughout.",
      category: "marketing",
      instructor: "sofia-almeida",
      difficulty: "BEGINNER",
      price: 0,
      skills: ["Copywriting", "Content Strategy"],
      outcomes: ["Write headlines that earn attention", "Structure a persuasive landing page", "Edit copy ruthlessly"],
      requirements: ["None"],
      sections: [
        {
          title: "Core Frameworks",
          lessons: [
            { title: "The AIDA framework", minutes: 9 },
            { title: "Writing headlines", minutes: 11 },
          ],
        },
        {
          title: "Applying It",
          lessons: [
            { title: "Landing page copy", minutes: 14 },
            { title: "Editing for clarity", minutes: 10 },
          ],
        },
      ],
    },
    {
      slug: "financial-modeling-essentials",
      title: "Financial Modeling Essentials",
      subtitle: "Build the models real finance teams rely on",
      description: "Learn to build three-statement models, valuation models, and scenario analyses in Excel from the ground up.",
      category: "finance",
      instructor: "elena-petrov",
      difficulty: "INTERMEDIATE",
      price: 79,
      isFeatured: true,
      skills: ["Financial Modeling", "Excel"],
      outcomes: ["Build a three-statement financial model", "Perform scenario and sensitivity analysis", "Present model outputs clearly"],
      requirements: ["Comfortable with Excel basics"],
      sections: [
        {
          title: "Model Structure",
          lessons: [
            { title: "Three-statement modeling basics", minutes: 18 },
            { title: "Linking the statements", minutes: 16 },
          ],
        },
        {
          title: "Analysis",
          lessons: [
            { title: "Scenario analysis", minutes: 14 },
            { title: "Sensitivity tables", minutes: 12 },
            { title: "Knowledge check", minutes: 5, type: "QUIZ" },
          ],
        },
      ],
    },
    {
      slug: "personal-finance-fundamentals",
      title: "Personal Finance Fundamentals",
      subtitle: "Build a budget, pay down debt, and start investing with confidence",
      description: "A no-nonsense introduction to managing your money — budgeting, debt payoff strategies, and the basics of investing.",
      category: "finance",
      instructor: "elena-petrov",
      difficulty: "BEGINNER",
      price: 0,
      skills: ["Excel"],
      outcomes: ["Build a realistic monthly budget", "Create a debt payoff plan", "Understand the basics of index investing"],
      requirements: ["None"],
      sections: [
        {
          title: "Budgeting",
          lessons: [
            { title: "Building your first budget", minutes: 10 },
            { title: "Tracking spending", minutes: 8 },
          ],
        },
        {
          title: "Investing Basics",
          lessons: [
            { title: "Why index funds", minutes: 12 },
            { title: "Getting started", minutes: 9 },
          ],
        },
      ],
    },
    {
      slug: "leading-high-performing-teams",
      title: "Leading High-Performing Teams",
      subtitle: "Practical management skills for new and experienced leaders",
      description: "Learn how to set clear expectations, give effective feedback, and build a team culture people want to be part of.",
      category: "leadership",
      instructor: "marcus-webb",
      difficulty: "ALL_LEVELS",
      price: 59,
      isFeatured: true,
      skills: ["Leadership", "Public Speaking"],
      outcomes: ["Run effective 1:1s", "Give feedback that lands", "Set clear, motivating goals"],
      requirements: ["None"],
      sections: [
        {
          title: "Foundations of Management",
          lessons: [
            { title: "From individual contributor to manager", minutes: 13 },
            { title: "Setting expectations", minutes: 11 },
          ],
        },
        {
          title: "Feedback & Growth",
          lessons: [
            { title: "Giving effective feedback", minutes: 15 },
            { title: "Career conversations", minutes: 12 },
            { title: "Knowledge check", minutes: 5, type: "QUIZ" },
          ],
        },
      ],
    },
    {
      slug: "negotiation-fundamentals",
      title: "Negotiation Fundamentals",
      subtitle: "Get better outcomes in salary talks, deals, and everyday conflicts",
      description: "Learn practical negotiation frameworks you can use in salary conversations, vendor deals, and workplace disagreements.",
      category: "leadership",
      instructor: "marcus-webb",
      difficulty: "BEGINNER",
      price: 0,
      skills: ["Negotiation", "Public Speaking"],
      outcomes: ["Prepare for a negotiation systematically", "Find win-win outcomes", "Handle pushback with confidence"],
      requirements: ["None"],
      sections: [
        {
          title: "Preparing to Negotiate",
          lessons: [
            { title: "Know your BATNA", minutes: 10 },
            { title: "Setting your anchor", minutes: 9 },
          ],
        },
        {
          title: "In the Room",
          lessons: [
            { title: "Active listening tactics", minutes: 11 },
            { title: "Handling objections", minutes: 12 },
          ],
        },
      ],
    },
    {
      slug: "agile-project-management",
      title: "Agile Project Management",
      subtitle: "Run sprints that ship, without the ceremony overload",
      description: "A practical guide to running Scrum and Kanban teams, from backlog grooming to retrospectives that actually improve things.",
      category: "project-management",
      instructor: "daniel-osei",
      difficulty: "BEGINNER",
      price: 29,
      skills: ["Agile", "Leadership"],
      outcomes: ["Run an effective sprint planning session", "Groom a backlog that stays healthy", "Facilitate retrospectives that drive change"],
      requirements: ["None"],
      sections: [
        {
          title: "Scrum Basics",
          lessons: [
            { title: "Roles and ceremonies", minutes: 12 },
            { title: "Writing good user stories", minutes: 14 },
          ],
        },
        {
          title: "Running Sprints",
          lessons: [
            { title: "Sprint planning", minutes: 11 },
            { title: "Retrospectives that work", minutes: 10 },
          ],
        },
      ],
    },
    {
      slug: "sql-for-everyone",
      title: "SQL for Everyone",
      subtitle: "Query any database with confidence, no coding background needed",
      description: "Learn SQL from the ground up — selecting, filtering, joining, and aggregating data using real business examples.",
      category: "data",
      instructor: "ravi-kapoor",
      difficulty: "BEGINNER",
      price: 0,
      skills: ["SQL"],
      outcomes: ["Write SELECT queries with confidence", "Join data across multiple tables", "Aggregate and summarize data"],
      requirements: ["None"],
      sections: [
        {
          title: "Querying Basics",
          lessons: [
            { title: "SELECT and WHERE", minutes: 10 },
            { title: "Sorting and limiting", minutes: 7 },
          ],
        },
        {
          title: "Combining Data",
          lessons: [
            { title: "JOINs explained", minutes: 15 },
            { title: "GROUP BY and aggregates", minutes: 13 },
            { title: "Knowledge check", minutes: 5, type: "QUIZ" },
          ],
        },
      ],
    },
    {
      slug: "public-speaking-with-confidence",
      title: "Public Speaking with Confidence",
      subtitle: "Structure and deliver talks people remember",
      description: "Overcome stage fright and learn a repeatable structure for presentations, from a five-minute update to a keynote.",
      category: "personal-development",
      instructor: "marcus-webb",
      difficulty: "BEGINNER",
      price: 0,
      isFeatured: true,
      skills: ["Public Speaking"],
      outcomes: ["Structure a talk that keeps attention", "Manage nervousness before speaking", "Handle Q&A with confidence"],
      requirements: ["None"],
      sections: [
        {
          title: "Structuring Your Talk",
          lessons: [
            { title: "The three-part structure", minutes: 10 },
            { title: "Opening strong", minutes: 8 },
          ],
        },
        {
          title: "Delivery",
          lessons: [
            { title: "Managing nerves", minutes: 9 },
            { title: "Handling questions", minutes: 8 },
          ],
        },
      ],
    },
    {
      slug: "time-management-that-works",
      title: "Time Management That Actually Works",
      subtitle: "Practical systems for focus, not just more to-do lists",
      description: "Build a personal system for planning your week, protecting focus time, and saying no without the guilt.",
      category: "personal-development",
      instructor: "elena-petrov",
      difficulty: "BEGINNER",
      price: 0,
      skills: ["Leadership"],
      outcomes: ["Design a weekly planning ritual", "Protect focus time from meetings", "Prioritize with a simple framework"],
      requirements: ["None"],
      sections: [
        {
          title: "Planning Systems",
          lessons: [
            { title: "Weekly planning ritual", minutes: 9 },
            { title: "Prioritization frameworks", minutes: 11 },
          ],
        },
      ],
    },
    {
      slug: "startup-finance-101",
      title: "Startup Finance 101",
      subtitle: "Understand runway, burn rate, and fundraising basics",
      description: "A practical primer on startup finance for founders and early employees — runway, burn, cap tables, and fundraising mechanics.",
      category: "business",
      instructor: "elena-petrov",
      difficulty: "BEGINNER",
      price: 49,
      skills: ["Financial Modeling"],
      outcomes: ["Calculate runway and burn rate", "Understand how cap tables work", "Read a basic term sheet"],
      requirements: ["None"],
      sections: [
        {
          title: "The Basics",
          lessons: [
            { title: "Runway and burn rate", minutes: 10 },
            { title: "Cap tables explained", minutes: 13 },
          ],
        },
        {
          title: "Fundraising",
          lessons: [
            { title: "Reading a term sheet", minutes: 15 },
            { title: "Knowledge check", minutes: 5, type: "QUIZ" },
          ],
        },
      ],
    },
    {
      slug: "product-management-foundations",
      title: "Product Management Foundations",
      subtitle: "From user problems to shipped features",
      description: "Learn the core product management loop — discovering problems, prioritizing, and shipping features that move metrics.",
      category: "business",
      instructor: "maya-chen",
      difficulty: "BEGINNER",
      price: 0,
      isFeatured: true,
      skills: ["UX Research", "Agile"],
      outcomes: ["Write a clear problem statement", "Prioritize a roadmap with confidence", "Define success metrics for a feature"],
      requirements: ["None"],
      sections: [
        {
          title: "Discovery",
          lessons: [
            { title: "Finding real user problems", minutes: 12 },
            { title: "Talking to users", minutes: 14 },
          ],
        },
        {
          title: "Delivery",
          lessons: [
            { title: "Prioritization frameworks", minutes: 11 },
            { title: "Defining success metrics", minutes: 9 },
          ],
        },
      ],
    },
    {
      slug: "data-visualization-storytelling",
      title: "Data Visualization & Storytelling",
      subtitle: "Turn spreadsheets into charts people actually understand",
      description: "Learn the principles of effective data visualization and how to build a narrative around your data for any audience.",
      category: "data",
      instructor: "ravi-kapoor",
      difficulty: "INTERMEDIATE",
      price: 39,
      skills: ["Data Visualization"],
      outcomes: ["Choose the right chart for your data", "Design charts that are easy to read", "Build a narrative around findings"],
      requirements: ["Basic spreadsheet skills"],
      sections: [
        {
          title: "Principles",
          lessons: [
            { title: "Choosing the right chart", minutes: 12 },
            { title: "Common visualization mistakes", minutes: 10 },
          ],
        },
        {
          title: "Storytelling",
          lessons: [
            { title: "Building a narrative", minutes: 13 },
            { title: "Presenting to non-technical audiences", minutes: 11 },
          ],
        },
      ],
    },
    {
      slug: "intro-to-web-accessibility",
      title: "Intro to Web Accessibility",
      subtitle: "Build interfaces that work for everyone",
      description: "A practical introduction to web accessibility — semantic HTML, ARIA, keyboard navigation, and testing with real tools.",
      category: "software-development",
      instructor: "daniel-osei",
      difficulty: "BEGINNER",
      price: 0,
      skills: ["React", "JavaScript"],
      outcomes: ["Write semantic, accessible HTML", "Test with a screen reader", "Fix common accessibility issues"],
      requirements: ["Basic HTML/CSS knowledge"],
      sections: [
        {
          title: "Foundations",
          lessons: [
            { title: "Why accessibility matters", minutes: 8 },
            { title: "Semantic HTML", minutes: 12 },
          ],
        },
        {
          title: "Testing & Fixing",
          lessons: [
            { title: "Testing with a screen reader", minutes: 14 },
            { title: "Common fixes", minutes: 11 },
            { title: "Knowledge check", minutes: 5, type: "QUIZ" },
          ],
        },
      ],
    },
  ];

  const businessDayCounter = { value: 0 };
  const courseRecords: Record<string, { id: string; slug: string }> = {};

  for (const def of courseDefs) {
    const durationMinutes = def.sections.reduce((sum, s) => sum + s.lessons.reduce((s2, l) => s2 + l.minutes, 0), 0);
    const reviewCount = 3 + (businessDayCounter.value % 5);
    const averageRating = (4 + ((businessDayCounter.value % 10) / 10)).toFixed(2);
    businessDayCounter.value++;

    const course = await prisma.course.upsert({
      where: { slug: def.slug },
      update: {},
      create: {
        slug: def.slug,
        title: def.title,
        subtitle: def.subtitle,
        description: def.description,
        thumbnailUrl: thumb(def.slug),
        difficulty: def.difficulty,
        price: def.price,
        isPremium: def.price !== null && def.price > 0,
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
        isFeatured: def.isFeatured ?? false,
        durationMinutes,
        averageRating,
        reviewCount,
        enrollmentCount: 40 + businessDayCounter.value * 17,
        publishedAt: new Date(Date.now() - businessDayCounter.value * 86400000),
        learningOutcomes: def.outcomes,
        requirements: def.requirements,
        instructorId: instructors[def.instructor].id,
        categoryId: categories[def.category].id,
        skills: { create: def.skills.map((s) => ({ skillId: skills[s].id })) },
      },
    });
    courseRecords[def.slug] = course;

    let sectionOrder = 0;
    for (const sectionDef of def.sections) {
      const section = await prisma.courseSection.create({
        data: { courseId: course.id, title: sectionDef.title, order: sectionOrder++ },
      });

      let lessonOrder = 0;
      for (const lessonDef of sectionDef.lessons) {
        const type = lessonDef.type ?? "VIDEO";
        const lesson = await prisma.lesson.create({
          data: {
            sectionId: section.id,
            courseId: course.id,
            title: lessonDef.title,
            type,
            order: lessonOrder,
            durationSeconds: lessonDef.minutes * 60,
            isPreview: sectionOrder === 1 && lessonOrder === 0,
          },
        });
        lessonOrder++;

        if (type === "VIDEO") {
          await prisma.video.create({
            data: {
              lessonId: lesson.id,
              provider: "YOUTUBE",
              externalId: "dQw4w9WgXcQ",
              durationSeconds: lessonDef.minutes * 60,
              status: "READY",
              thumbnailUrl: thumb(`${def.slug}-${lesson.id}`),
            },
          });
        }

        if (type === "QUIZ") {
          const quiz = await prisma.quiz.create({
            data: { lessonId: lesson.id, title: `${sectionDef.title} check`, passingScore: 70 },
          });
          const q1 = await prisma.quizQuestion.create({
            data: { quizId: quiz.id, text: `What is the main takeaway from "${sectionDef.title}"?`, order: 0 },
          });
          await prisma.quizOption.createMany({
            data: [
              { questionId: q1.id, text: "Applying it consistently matters more than getting it perfect", isCorrect: true, order: 0 },
              { questionId: q1.id, text: "It only applies to large teams", isCorrect: false, order: 1 },
              { questionId: q1.id, text: "It's optional in practice", isCorrect: false, order: 2 },
            ],
          });
        }
      }
    }
  }

  // -------------------------------------------------------------------
  // Reviews
  // -------------------------------------------------------------------
  const studentList = Object.values(students);
  const reviewComments = [
    "Clear, practical, and well-paced — exactly what I needed.",
    "The projects made this feel like real work, not just theory.",
    "Instructor explains things simply without dumbing it down.",
    "Would have liked a bit more depth in the later lessons, but overall great.",
    "Best course I've taken on this topic.",
  ];
  let commentIndex = 0;
  for (const slug of Object.keys(courseRecords)) {
    const course = courseRecords[slug];
    for (const student of studentList.slice(0, 2)) {
      await prisma.review.upsert({
        where: { userId_courseId: { userId: student.id, courseId: course.id } },
        update: {},
        create: {
          userId: student.id,
          courseId: course.id,
          rating: 4 + (commentIndex % 2),
          comment: reviewComments[commentIndex % reviewComments.length],
        },
      });
      commentIndex++;
    }
  }

  // -------------------------------------------------------------------
  // Enrollments + progress for demo students
  // -------------------------------------------------------------------
  const demoStudent = students["alex-morgan"];
  const enrolledSlugs = ["ux-research-foundations", "react-for-professionals", "python-for-data-analysis", "sql-for-everyone"];

  for (const [i, slug] of enrolledSlugs.entries()) {
    const course = courseRecords[slug];
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: demoStudent.id, courseId: course.id } },
      update: {},
      create: { userId: demoStudent.id, courseId: course.id, source: "FREE" },
    });

    const lessons = await prisma.lesson.findMany({ where: { courseId: course.id }, orderBy: { order: "asc" } });
    const completeCount = i === 0 ? lessons.length : Math.max(1, Math.floor(lessons.length / 2));

    for (const [li, lesson] of lessons.entries()) {
      const isDone = li < completeCount;
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: demoStudent.id, lessonId: lesson.id } },
        update: {},
        create: {
          userId: demoStudent.id,
          lessonId: lesson.id,
          courseId: course.id,
          status: isDone ? "COMPLETED" : li === completeCount ? "IN_PROGRESS" : "NOT_STARTED",
          completedAt: isDone ? new Date() : null,
          videoPositionSeconds: li === completeCount ? 45 : 0,
        },
      });
    }

    const percent = Math.round((completeCount / lessons.length) * 100);
    await prisma.courseProgress.upsert({
      where: { userId_courseId: { userId: demoStudent.id, courseId: course.id } },
      update: { percentComplete: percent, lastLessonId: lessons[Math.min(completeCount, lessons.length - 1)]?.id },
      create: {
        userId: demoStudent.id,
        courseId: course.id,
        percentComplete: percent,
        lastLessonId: lessons[Math.min(completeCount, lessons.length - 1)]?.id,
        completedAt: percent === 100 ? new Date() : null,
      },
    });

    if (percent === 100) {
      const completion = await prisma.courseCompletion.upsert({
        where: { userId_courseId: { userId: demoStudent.id, courseId: course.id } },
        update: {},
        create: { userId: demoStudent.id, courseId: course.id },
      });
      await prisma.certificate.upsert({
        where: { completionId: completion.id },
        update: {},
        create: {
          certificateCode: `CERT-${course.slug.toUpperCase().slice(0, 8)}-${demoStudent.id.slice(-6)}`,
          userId: demoStudent.id,
          courseId: course.id,
          completionId: completion.id,
        },
      });
    }
  }

  // Bookmarks
  for (const slug of ["design-systems-at-scale", "machine-learning-foundations", "leading-high-performing-teams"]) {
    await prisma.bookmark.upsert({
      where: { userId_courseId: { userId: demoStudent.id, courseId: courseRecords[slug].id } },
      update: {},
      create: { userId: demoStudent.id, courseId: courseRecords[slug].id },
    });
  }

  // -------------------------------------------------------------------
  // Achievements
  // -------------------------------------------------------------------
  const achievementDefs = [
    { key: "FIRST_COURSE_COMPLETED", title: "First Course Complete", description: "Completed your first course." },
    { key: "FIVE_DAY_STREAK", title: "5-Day Streak", description: "Learned five days in a row." },
    { key: "QUIZ_MASTER", title: "Quiz Master", description: "Passed 10 quizzes." },
  ];
  const achievementRecords: Record<string, { id: string }> = {};
  for (const def of achievementDefs) {
    achievementRecords[def.key] = await prisma.achievement.upsert({ where: { key: def.key }, update: {}, create: def });
  }
  await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId: demoStudent.id, achievementId: achievementRecords.FIRST_COURSE_COMPLETED.id } },
    update: {},
    create: { userId: demoStudent.id, achievementId: achievementRecords.FIRST_COURSE_COMPLETED.id },
  });

  // -------------------------------------------------------------------
  // Learning paths
  // -------------------------------------------------------------------
  const pathDefs = [
    {
      slug: "become-a-product-designer",
      title: "Become a Product Designer",
      description: "Go from research fundamentals to shipping a scalable design system.",
      courses: ["ux-research-foundations", "design-systems-at-scale", "product-management-foundations"],
    },
    {
      slug: "modern-frontend-engineer",
      title: "Modern Frontend Engineer",
      description: "Build production-grade React applications with confidence.",
      courses: ["react-for-professionals", "typescript-in-depth", "intro-to-web-accessibility"],
    },
    {
      slug: "data-analyst-starter-kit",
      title: "Data Analyst Starter Kit",
      description: "Everything you need to start analyzing data professionally.",
      courses: ["sql-for-everyone", "python-for-data-analysis", "data-visualization-storytelling"],
    },
  ];
  for (const def of pathDefs) {
    const path = await prisma.learningPath.upsert({
      where: { slug: def.slug },
      update: {},
      create: {
        slug: def.slug,
        title: def.title,
        description: def.description,
        thumbnailUrl: thumb(def.slug),
        difficulty: "ALL_LEVELS",
        estimatedMinutes: def.courses.length * 120,
        status: "PUBLISHED",
        createdById: admin.id,
      },
    });
    for (const [i, slug] of def.courses.entries()) {
      await prisma.learningPathCourse.upsert({
        where: { learningPathId_courseId: { learningPathId: path.id, courseId: courseRecords[slug].id } },
        update: {},
        create: { learningPathId: path.id, courseId: courseRecords[slug].id, order: i },
      });
    }
  }

  console.log(`Seeded ${Object.keys(courseRecords).length} courses across ${categoryDefs.length} categories.`);
  console.log("Demo login: alex-morgan@elearning.dev / Password123 (student)");
  console.log("Demo login: maya-chen@elearning.dev / Password123 (instructor)");
  console.log("Demo login: admin@elearning.dev / Password123 (admin)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
