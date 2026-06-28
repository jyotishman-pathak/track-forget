# 🔥 THE NODE.JS BACKEND GAUNTLET — MASTER IT BY BUILDING IT

> **Stack:** Node.js · TypeScript · pnpm · Fastify · Prisma · Redis · BullMQ · Zod
> **Vibe:** Zero hand-holding. Code first. Break things. Fix things. Own it.

---

## 🗺️ ROADMAP AT A GLANCE

| Phase | What You Build | Concepts You'll Own |
|---|---|---|
| 1 | Project Scaffold + Config | pnpm workspaces, tsconfig, env validation |
| 2 | HTTP Server + Routing | Fastify, path/query/body params, lifecycle hooks |
| 3 | Middleware Pipeline | CORS, Helmet, rate limiting, request ID, logging |
| 4 | Schema Validation | Zod end-to-end, typed request/response |
| 5 | Database Layer | Prisma ORM, migrations, relations, raw SQL |
| 6 | REST API Design | Pagination, filtering, sorting, versioning |
| 7 | Authentication | JWT, refresh tokens, bcrypt, cookie vs header |
| 8 | Authorization | RBAC, guards, resource ownership |
| 9 | File Uploads | Multipart, S3/local, streaming, signed URLs |
| 10 | Fetch & HTTP Clients | Native fetch, retry, timeout, interceptors |
| 11 | WebSockets + SSE | Real-time notifications, event streaming |
| 12 | Redis Caching | Cache-aside, TTL, invalidation, rate limiting |
| 13 | Background Jobs | BullMQ queues, workers, retries, dead-letter |
| 14 | Error Handling | Custom errors, global handler, never leak stack |
| 15 | Process Management | Graceful shutdown, SIGTERM, drain, signals |
| 16 | Frontend Connection | CORS deep-dive, preflight, credentials, fetch from browser |
| 17 | Testing | Vitest, Supertest, mocks, DB fixtures |
| 18 | Final Boss | API key auth, idempotency, webhook delivery, OpenAPI |

---

## 🧠 WHAT IS A BACKEND — IN 60 SECONDS (then we never look back)

A backend is a process that **listens on a port**, **reads a request** (method + path + headers + body), **does work** (DB, cache, queue, external API), and **writes a response** (status + headers + body). Everything else — middleware, ORMs, auth, queues — is just that loop getting more useful.

Three mental models you need to tattoo on your brain:

- **Request lifecycle** — a request flows through a pipeline of functions, each can short-circuit
- **Never block the event loop** — every DB call, every file read, every network call is `await`ed
- **Fail loudly in dev, fail gracefully in prod** — stack traces to you, clean JSON to the client

That's it. Now let's build.

---

## 🏗️ THE PROJECT: `DevHub` — A Multi-Tenant Developer Platform API

You're building a **production-grade REST + WebSocket API** from scratch. No shortcuts. No skipping phases. Every concept earns its place by being wired into the real project.

By the end, your API will have:
- Full CRUD with typed request/response schemas
- JWT auth + refresh token rotation
- Role-based access control (OWNER / ADMIN / MEMBER / VIEWER)
- Paginated, filtered, sorted list endpoints
- File upload (avatars, attachments) with streaming to disk
- Server-Sent Events for real-time activity feeds
- WebSocket for live collaboration cursors
- Redis caching with smart invalidation
- Background email + webhook delivery jobs via BullMQ
- Global error handling — never a raw stack trace to the client
- Graceful shutdown — in-flight requests finish, DB pool drains
- Full OpenAPI spec auto-generated
- Test suite with real DB fixtures

---

## 📁 REPO STRUCTURE — SET THIS UP FIRST

```
devhub/
├── apps/
│   ├── api/                  # The Fastify backend (TypeScript)
│   └── worker/               # BullMQ job workers
├── packages/
│   └── shared/               # Zod schemas + types shared across apps
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── pnpm-workspace.yaml
└── package.json
```

```bash
mkdir devhub && cd devhub
pnpm init
mkdir -p apps/api/src apps/worker/src packages/shared/src prisma
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Root `package.json`:
```json
{
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel --filter api --filter worker dev",
    "dev:api": "pnpm --filter api dev",
    "dev:worker": "pnpm --filter worker dev",
    "build": "pnpm -r build",
    "type-check": "pnpm -r exec tsc --noEmit",
    "test": "pnpm --filter api test",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

---

## PHASE 1 — PROJECT SCAFFOLD + CONFIG VALIDATION
### 🎯 Concept: If your app boots with a bad env var, it should die immediately with a clear message — not silently break 3 hours later

```bash
cd apps/api
pnpm init
pnpm add fastify @fastify/cors @fastify/helmet @fastify/multipart @fastify/cookie \
  @fastify/jwt @fastify/rate-limit @fastify/swagger @fastify/swagger-ui \
  @prisma/client zod zod-to-json-schema bullmq ioredis pino pino-pretty \
  bcryptjs jsonwebtoken uuid dotenv
pnpm add -D typescript tsx @types/node @types/bcryptjs @types/jsonwebtoken \
  @types/uuid prisma vitest supertest @types/supertest
```

`apps/api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@devhub/shared": ["../../packages/shared/src/index.ts"]
    }
  },
  "include": ["src"]
}
```

### 🔨 Environment validation — NEVER use `process.env.FOO` raw

`apps/api/src/config.ts`:
```typescript
import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 chars'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  BCRYPT_ROUNDS: z.coerce.number().default(12),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB

  CORS_ORIGINS: z.string().transform(s => s.split(',')),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
```

`.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/devhub
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecretjwtsecretmustbeatleast32chars
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
UPLOAD_DIR=./uploads
```

---

## PHASE 2 — HTTP SERVER + ROUTING
### 🎯 Concept: Every HTTP request has a method, a path, headers, and optionally a body. Your job is to match the method+path and handle it.

`apps/api/src/server.ts`:
```typescript
import Fastify from 'fastify';
import { config } from './config.js';

export function buildServer() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: config.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
    genReqId: () => crypto.randomUUID(),  // unique ID on every request
    requestTimeout: 30_000,               // 30s hard limit
  });

  return app;
}
```

### 🔨 Understand ALL the param types — this is what everyone gets confused about

`apps/api/src/routes/demo.ts` — ALL param styles in one file:
```typescript
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

export const demoRoutes: FastifyPluginAsyncZod = async (app) => {

  // ✅ PATH PARAMS — /users/:id  → parts of the URL path
  // GET /users/abc123
  app.get('/path-params/:id/:version', {
    schema: {
      params: z.object({
        id: z.string().uuid(),
        version: z.coerce.number().int().positive(),
      }),
    },
  }, async (req) => {
    // req.params.id → 'abc123'
    // req.params.version → 42 (coerced from string to number)
    return { id: req.params.id, version: req.params.version };
  });

  // ✅ QUERY PARAMS — /search?q=hello&page=2&limit=10&sort=name&order=asc
  // Everything after '?' — always strings from the URL, coerce them
  app.get('/query-params', {
    schema: {
      querystring: z.object({
        q: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sort: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
        order: z.enum(['asc', 'desc']).default('desc'),
        tags: z.union([z.string(), z.array(z.string())]).optional()
          .transform(v => v === undefined ? [] : Array.isArray(v) ? v : [v]),
        // tags=a&tags=b → ['a','b']   tags=a → ['a']
      }),
    },
  }, async (req) => {
    const { q, page, limit, sort, order, tags } = req.query;
    return { q, page, limit, sort, order, tags };
  });

  // ✅ REQUEST BODY — POST/PUT/PATCH with JSON body
  app.post('/body-params', {
    schema: {
      body: z.object({
        name: z.string().min(1).max(100).trim(),
        email: z.string().email().toLowerCase(),
        role: z.enum(['admin', 'member']).default('member'),
        metadata: z.record(z.string(), z.unknown()).optional(),
        tags: z.array(z.string()).max(10).default([]),
      }),
    },
  }, async (req) => {
    // req.body is fully typed and validated
    return { received: req.body };
  });

  // ✅ HEADERS — reading request headers
  app.get('/headers', async (req) => {
    const authorization = req.headers['authorization'];    // 'Bearer token123'
    const contentType = req.headers['content-type'];       // 'application/json'
    const userAgent = req.headers['user-agent'];
    const customHeader = req.headers['x-request-id'];

    // SETTING response headers
    return { authorization, contentType, userAgent, customHeader };
  });

  // ✅ COMBINING all param types in one real endpoint
  // GET /projects/:projectId/tasks?status=open&assignee=me&page=1
  app.get('/projects/:projectId/tasks', {
    schema: {
      params: z.object({ projectId: z.string().uuid() }),
      querystring: z.object({
        status: z.enum(['open', 'in_progress', 'done', 'cancelled']).optional(),
        assigneeId: z.string().uuid().optional(),
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(20),
      }),
    },
  }, async (req) => {
    const { projectId } = req.params;
    const { status, assigneeId, page, limit } = req.query;

    // Use all of them together
    const offset = (page - 1) * limit;
    return { projectId, status, assigneeId, page, limit, offset };
  });
};
```

### 🔨 Plugin registration and route grouping

`apps/api/src/routes/index.ts`:
```typescript
import { FastifyInstance } from 'fastify';
import { projectRoutes } from './projects.js';
import { taskRoutes } from './tasks.js';
import { userRoutes } from './users.js';
import { authRoutes } from './auth.js';

export async function registerRoutes(app: FastifyInstance) {
  // Versioned API — all routes prefixed with /api/v1
  await app.register(async (v1) => {
    await v1.register(authRoutes, { prefix: '/auth' });
    await v1.register(userRoutes, { prefix: '/users' });
    await v1.register(projectRoutes, { prefix: '/projects' });
    await v1.register(taskRoutes, { prefix: '/tasks' });
  }, { prefix: '/api/v1' });

  // Health check — no prefix, no auth
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  app.get('/ready', async (req, reply) => {
    // Check DB and Redis connections
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      await app.redis.ping();
      return { status: 'ready' };
    } catch (err) {
      reply.status(503);
      return { status: 'not ready', error: (err as Error).message };
    }
  });
}
```

---

## PHASE 3 — MIDDLEWARE PIPELINE
### 🎯 Concept: Every request passes through a pipeline of hooks before hitting your route handler. Each hook can read, modify, or reject the request.

Fastify lifecycle order (burn this into memory):
```
onRequest → preParsing → preValidation → preHandler → [handler] → preSerialization → onSend → onResponse
```

`apps/api/src/plugins/security.ts`:
```typescript
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from '../config.js';

export const securityPlugin = fp(async (app) => {
  // CORS — controls which origins can call your API from a browser
  await app.register(cors, {
    origin: config.CORS_ORIGINS,           // ['http://localhost:5173']
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'X-RateLimit-Remaining'],
    credentials: true,          // allow cookies + Authorization header together
    maxAge: 86400,              // browser caches preflight for 24h
  });

  // Helmet — sets security headers (XSS, clickjacking, MIME sniffing, etc.)
  await app.register(helmet, {
    contentSecurityPolicy: false,   // disable if serving no HTML
  });

  // Rate limiting — per IP by default, customizable per route
  await app.register(rateLimit, {
    global: true,
    max: 100,                         // 100 requests
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      // Rate limit by user ID if authenticated, else by IP
      return (req as any).user?.id ?? req.ip;
    },
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.ttl}ms`,
      retryAfter: Math.ceil(context.ttl / 1000),
    }),
  });
});
```

`apps/api/src/plugins/request-context.ts`:
```typescript
import fp from 'fastify-plugin';

// Attach request ID to every response — essential for log correlation
export const requestContextPlugin = fp(async (app) => {
  app.addHook('onRequest', async (req, reply) => {
    // Echo back the request ID so frontend can correlate logs
    reply.header('X-Request-Id', req.id);
  });

  app.addHook('onResponse', async (req, reply) => {
    // Log every request with method, url, status, and duration
    req.log.info({
      method: req.method,
      url: req.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
      ip: req.ip,
      userId: (req as any).user?.id,
    }, 'request completed');
  });
});
```

---

## PHASE 4 — SCHEMA VALIDATION WITH ZOD
### 🎯 Concept: Validation is not optional. Every input from the outside world is untrusted. Zod validates AND transforms AND infers TypeScript types — one schema, three benefits.

`packages/shared/src/schemas/project.ts`:
```typescript
import { z } from 'zod';

export const ProjectStatus = z.enum(['active', 'archived', 'deleted']);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name required').max(100).trim(),
  description: z.string().max(500).optional(),
  status: ProjectStatus.default('active'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be hex color').default('#6366f1'),
  tags: z.array(z.string().max(30)).max(10).default([]),
  settings: z.object({
    isPublic: z.boolean().default(false),
    allowGuestView: z.boolean().default(false),
    defaultAssigneeId: z.string().uuid().optional(),
  }).default({}),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();
//  ^ Every field becomes optional — perfect for PATCH

export const ProjectResponseSchema = CreateProjectSchema.extend({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  _count: z.object({
    tasks: z.number(),
    members: z.number(),
  }).optional(),
});

// Pagination wrapper — reuse this for every list endpoint
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export function paginatedResponse<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  });
}

export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;
```

`apps/api/src/plugins/zod-provider.ts`:
```typescript
import fp from 'fastify-plugin';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

// Wire Zod into Fastify's validation/serialization pipeline
export const zodPlugin = fp(async (app) => {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
});
```

---

## PHASE 5 — DATABASE LAYER WITH PRISMA
### 🎯 Concept: Prisma is your type-safe interface to SQL. Schema = source of truth. Migrations = version control for your DB.

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  name         String
  avatarUrl    String?
  role         GlobalRole @default(MEMBER)
  refreshTokens RefreshToken[]
  ownedProjects Project[] @relation("ProjectOwner")
  projectMemberships ProjectMember[]
  assignedTasks Task[]   @relation("TaskAssignee")
  createdTasks  Task[]   @relation("TaskCreator")
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("refresh_tokens")
}

model Project {
  id          String        @id @default(uuid())
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  color       String        @default("#6366f1")
  tags        String[]
  settings    Json          @default("{}")
  ownerId     String
  owner       User          @relation("ProjectOwner", fields: [ownerId], references: [id])
  members     ProjectMember[]
  tasks       Task[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("projects")
}

model ProjectMember {
  id        String      @id @default(uuid())
  projectId String
  project   Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      ProjectRole @default(MEMBER)
  joinedAt  DateTime    @default(now())

  @@unique([projectId, userId])
  @@map("project_members")
}

model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(OPEN)
  priority    Priority   @default(MEDIUM)
  dueDate     DateTime?
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assigneeId  String?
  assignee    User?      @relation("TaskAssignee", fields: [assigneeId], references: [id])
  creatorId   String
  creator     User       @relation("TaskCreator", fields: [creatorId], references: [id])
  attachments Attachment[]
  tags        String[]
  position    Float      @default(0)  // for drag-and-drop ordering
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([projectId, status])
  @@index([assigneeId])
  @@map("tasks")
}

model Attachment {
  id        String   @id @default(uuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  filename  String
  mimeType  String
  size      Int
  path      String
  uploadedById String
  createdAt DateTime @default(now())

  @@map("attachments")
}

enum GlobalRole { SUPER_ADMIN MEMBER }
enum ProjectRole { OWNER ADMIN MEMBER VIEWER }
enum ProjectStatus { ACTIVE ARCHIVED DELETED }
enum TaskStatus { OPEN IN_PROGRESS IN_REVIEW DONE CANCELLED }
enum Priority { LOW MEDIUM HIGH URGENT }
```

```bash
pnpm prisma migrate dev --name init
```

`apps/api/src/plugins/prisma.ts`:
```typescript
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export const prismaPlugin = fp(async (app) => {
  const prisma = new PrismaClient({
    log: app.config.NODE_ENV === 'development'
      ? [{ emit: 'event', level: 'query' }]
      : ['error'],
  });

  if (app.config.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
      app.log.debug({ query: e.query, params: e.params, duration: e.duration }, 'prisma query');
    });
  }

  await prisma.$connect();
  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
```

### 🔨 Repository pattern — keep DB logic out of route handlers

`apps/api/src/repositories/project.repository.ts`:
```typescript
import { PrismaClient, Prisma } from '@prisma/client';

export interface ListProjectsOptions {
  userId: string;
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
  status?: string;
  search?: string;
}

export class ProjectRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, userId: string) {
    return this.prisma.project.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { tasks: true, members: true } },
      },
    });
  }

  async list(options: ListProjectsOptions) {
    const { userId, page, limit, sort, order, status, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: { _count: { select: { tasks: true, members: true } } },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async create(data: Prisma.ProjectCreateInput) {
    return this.prisma.project.create({ data });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput) {
    return this.prisma.project.update({ where: { id }, data });
  }

  async delete(id: string) {
    // Soft delete — never hard delete in production
    return this.prisma.project.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  // Raw SQL when Prisma's query builder isn't enough
  async taskCountsByStatus(projectId: string) {
    return this.prisma.$queryRaw<{ status: string; count: bigint }[]>`
      SELECT status, COUNT(*) as count
      FROM tasks
      WHERE project_id = ${projectId}
        AND status != 'CANCELLED'
      GROUP BY status
      ORDER BY count DESC
    `;
  }
}
```

---

## PHASE 6 — REST API DESIGN
### 🎯 Concept: Good API design is a contract. Once clients depend on it, breaking changes cost everyone.

```
REST conventions you must internalize:

GET    /projects           → list (paginated, filtered, sorted)
GET    /projects/:id       → get one
POST   /projects           → create
PUT    /projects/:id       → replace (full update)
PATCH  /projects/:id       → partial update (preferred)
DELETE /projects/:id       → delete

Nested resources:
GET    /projects/:id/tasks        → list tasks in project
POST   /projects/:id/tasks        → create task in project
GET    /projects/:id/tasks/:taskId → get specific task in project

Status codes that actually matter:
200 OK             → success, body contains data
201 Created        → resource created, body = new resource
204 No Content     → success, no body (DELETE)
400 Bad Request    → client sent invalid data
401 Unauthorized   → not authenticated (no/bad token)
403 Forbidden      → authenticated but not allowed
404 Not Found      → resource doesn't exist
409 Conflict       → state conflict (duplicate email)
422 Unprocessable  → valid format but fails business rules
429 Too Many Requests → rate limit hit
500 Internal Error → your bug, never expose details
```

`apps/api/src/routes/projects.ts`:
```typescript
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CreateProjectSchema, UpdateProjectSchema,
  ProjectResponseSchema, PaginationSchema, paginatedResponse
} from '@devhub/shared';
import { requireAuth } from '../hooks/auth.hook.js';
import { requireProjectRole } from '../hooks/authz.hook.js';
import { ProjectRepository } from '../repositories/project.repository.js';

export const projectRoutes: FastifyPluginAsyncZod = async (app) => {
  const repo = new ProjectRepository(app.prisma);

  // GET /projects — list with pagination + filtering
  app.get('/', {
    onRequest: [requireAuth],
    schema: {
      querystring: PaginationSchema.extend({
        status: z.enum(['active', 'archived']).optional(),
        search: z.string().optional(),
      }),
      response: { 200: paginatedResponse(ProjectResponseSchema) },
    },
  }, async (req) => {
    return repo.list({ userId: req.user.id, ...req.query });
  });

  // GET /projects/:id
  app.get('/:id', {
    onRequest: [requireAuth],
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: { 200: ProjectResponseSchema },
    },
  }, async (req, reply) => {
    const project = await repo.findById(req.params.id, req.user.id);
    if (!project) return reply.status(404).send({ message: 'Project not found' });
    return project;
  });

  // POST /projects
  app.post('/', {
    onRequest: [requireAuth],
    schema: {
      body: CreateProjectSchema,
      response: { 201: ProjectResponseSchema },
    },
  }, async (req, reply) => {
    const project = await repo.create({
      ...req.body,
      owner: { connect: { id: req.user.id } },
      // Auto-add creator as project OWNER member
      members: {
        create: { userId: req.user.id, role: 'OWNER' },
      },
    });
    reply.status(201);
    return project;
  });

  // PATCH /projects/:id — partial update
  app.patch('/:id', {
    onRequest: [requireAuth, requireProjectRole(['OWNER', 'ADMIN'])],
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: UpdateProjectSchema,
      response: { 200: ProjectResponseSchema },
    },
  }, async (req) => {
    return repo.update(req.params.id, req.body);
  });

  // DELETE /projects/:id — soft delete
  app.delete('/:id', {
    onRequest: [requireAuth, requireProjectRole(['OWNER'])],
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: { 204: z.null() },
    },
  }, async (req, reply) => {
    await repo.delete(req.params.id);
    reply.status(204).send();
  });
};
```

---

## PHASE 7 — AUTHENTICATION
### 🎯 Concept: Auth = "who are you?" — JWT proves identity without hitting the DB on every request. Refresh tokens keep sessions alive without keeping JWTs alive forever.

```
The flow:
1. POST /auth/register → hash password, create user, return tokens
2. POST /auth/login → verify password, return access + refresh token
3. [Every protected request] → verify JWT in Authorization header
4. POST /auth/refresh → swap refresh token for new access + refresh token
5. POST /auth/logout → invalidate refresh token in DB
```

`apps/api/src/services/auth.service.ts`:
```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config.js';
import { AppError } from '../errors/app-error.js';

export interface TokenPayload {
  sub: string;    // user id
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already in use', 409);

    const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, name },
    });

    return this.issueTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401);
    // ↑ Same error for "user not found" and "wrong password" — never leak which

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored) throw new AppError('Invalid refresh token', 401);
    if (stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new AppError('Refresh token expired', 401);
    }

    // Token rotation — delete old, issue new
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(stored.user);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  private async issueTokens(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
      issuer: 'devhub',
      audience: 'devhub-client',
    });

    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return { accessToken, refreshToken, user: { id: user.id, email: user.email } };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET, {
        issuer: 'devhub',
        audience: 'devhub-client',
      }) as TokenPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) throw new AppError('Token expired', 401);
      throw new AppError('Invalid token', 401);
    }
  }
}
```

`apps/api/src/hooks/auth.hook.ts`:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Missing authorization header' });
  }

  const token = auth.slice(7);
  try {
    const payload = req.server.authService.verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
  } catch (err: any) {
    return reply.status(401).send({ message: err.message });
  }
}
```

`apps/api/src/routes/auth.ts`:
```typescript
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  const svc = app.authService;

  const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    name: z.string().min(1).max(100).trim(),
  });

  const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  app.post('/register', { schema: { body: RegisterSchema } }, async (req, reply) => {
    const result = await svc.register(req.body.email, req.body.password, req.body.name);
    reply.status(201);
    return result;
  });

  app.post('/login', { schema: { body: LoginSchema } }, async (req) => {
    return svc.login(req.body.email, req.body.password);
  });

  app.post('/refresh', {
    schema: { body: z.object({ refreshToken: z.string() }) },
  }, async (req) => {
    return svc.refresh(req.body.refreshToken);
  });

  app.post('/logout', {
    schema: { body: z.object({ refreshToken: z.string() }) },
  }, async (req, reply) => {
    await svc.logout(req.body.refreshToken);
    reply.status(204).send();
  });
};
```

---

## PHASE 8 — AUTHORIZATION (RBAC)
### 🎯 Concept: Auth tells you WHO. Authz tells you WHAT THEY CAN DO. Never mix them.

```
Role hierarchy for DevHub:

Global:    SUPER_ADMIN > MEMBER
Project:   OWNER > ADMIN > MEMBER > VIEWER

Rules:
- OWNER can do everything in their project
- ADMIN can manage tasks, members (not remove owner)
- MEMBER can create/edit their own tasks
- VIEWER can only read
```

`apps/api/src/hooks/authz.hook.ts`:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { ProjectRole } from '@prisma/client';

const ROLE_HIERARCHY: Record<ProjectRole, number> = {
  OWNER: 4, ADMIN: 3, MEMBER: 2, VIEWER: 1,
};

export function requireProjectRole(minRoles: ProjectRole[]) {
  return async function (req: FastifyRequest<{ Params: { id?: string; projectId?: string } }>, reply: FastifyReply) {
    const projectId = req.params.id ?? req.params.projectId;
    if (!projectId) return reply.status(400).send({ message: 'Missing project ID' });

    const membership = await req.server.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });

    if (!membership) {
      return reply.status(403).send({ message: 'Not a member of this project' });
    }

    const userLevel = ROLE_HIERARCHY[membership.role];
    const minLevel = Math.min(...minRoles.map(r => ROLE_HIERARCHY[r]));

    if (userLevel < minLevel) {
      return reply.status(403).send({
        message: `Requires at least ${minRoles[0]} role`,
      });
    }

    // Attach role to request for use in handler
    (req as any).projectRole = membership.role;
  };
}

// Resource ownership — user can only touch their own resource
export function requireOwnership(getOwnerId: (req: FastifyRequest) => Promise<string | null>) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const ownerId = await getOwnerId(req);
    if (!ownerId) return reply.status(404).send({ message: 'Resource not found' });
    if (ownerId !== req.user.id && req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ message: 'Not your resource' });
    }
  };
}
```

---

## PHASE 9 — FILE UPLOADS
### 🎯 Concept: Files come in as multipart/form-data — not JSON. You stream them to disk or cloud storage, never buffer the whole thing in memory.

`apps/api/src/plugins/upload.ts`:
```typescript
import fp from 'fastify-plugin';
import multipart from '@fastify/multipart';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

export const uploadPlugin = fp(async (app) => {
  await app.register(multipart, {
    limits: {
      fileSize: config.MAX_FILE_SIZE,
      files: 5,           // max 5 files per request
      fieldSize: 1024,    // max 1KB for non-file fields
    },
  });
});
```

`apps/api/src/routes/attachments.ts`:
```typescript
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { pipeline } from 'stream/promises';
import { createWriteStream, createReadStream } from 'fs';
import { stat, unlink } from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { config } from '../config.js';
import { requireAuth } from '../hooks/auth.hook.js';
import { AppError } from '../errors/app-error.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
  'application/zip', 'application/x-zip-compressed',
]);

export const attachmentRoutes: FastifyPluginAsyncZod = async (app) => {

  // POST /tasks/:taskId/attachments — upload file
  app.post('/:taskId/attachments', {
    onRequest: [requireAuth],
    schema: { params: z.object({ taskId: z.string().uuid() }) },
  }, async (req, reply) => {
    const task = await app.prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return reply.status(404).send({ message: 'Task not found' });

    const parts = req.parts();
    const attachments = [];

    for await (const part of parts) {
      if (part.type !== 'file') continue;

      if (!ALLOWED_MIME_TYPES.has(part.mimetype)) {
        // Must consume the stream even when rejecting, or connection hangs
        await part.toBuffer();
        throw new AppError(`File type ${part.mimetype} not allowed`, 400);
      }

      const fileId = crypto.randomUUID();
      const ext = path.extname(part.filename);
      const savePath = path.join(config.UPLOAD_DIR, `${fileId}${ext}`);

      // STREAM to disk — never buffer large files in memory
      await pipeline(part.file, createWriteStream(savePath));

      const fileStat = await stat(savePath);

      const attachment = await app.prisma.attachment.create({
        data: {
          taskId: req.params.taskId,
          filename: part.filename,
          mimeType: part.mimetype,
          size: fileStat.size,
          path: savePath,
          uploadedById: req.user.id,
        },
      });

      attachments.push(attachment);
    }

    reply.status(201);
    return { attachments };
  });

  // GET /attachments/:id/download — stream file back
  app.get('/:id/download', {
    onRequest: [requireAuth],
    schema: { params: z.object({ id: z.string().uuid() }) },
  }, async (req, reply) => {
    const attachment = await app.prisma.attachment.findUnique({
      where: { id: req.params.id },
    });
    if (!attachment) return reply.status(404).send({ message: 'Not found' });

    reply.header('Content-Type', attachment.mimeType);
    reply.header('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    reply.header('Content-Length', attachment.size);

    return reply.send(createReadStream(attachment.path));
    // ↑ Streaming — doesn't load the entire file into memory
  });
};
```

---

## PHASE 10 — FETCH & HTTP CLIENTS
### 🎯 Concept: Your backend calls OTHER backends constantly. You need to handle timeouts, retries, and errors like a professional.

`apps/api/src/lib/http-client.ts`:
```typescript
// ✅ Native fetch (Node 18+) — with timeout, retry, and error handling

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class HttpClient {
  constructor(
    private baseUrl: string,
    private defaultHeaders: Record<string, string> = {}
  ) {}

  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms: ${url}`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async request<T>(
    path: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const {
      timeout = 10_000,
      retries = 3,
      retryDelay = 1_000,
      headers = {},
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${path}`;
    const mergedHeaders = { ...this.defaultHeaders, ...headers as Record<string, string> };

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          ...fetchOptions,
          headers: mergedHeaders,
        }, timeout);

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`HTTP ${response.status}: ${body}`);
        }

        return response.json() as Promise<T>;
      } catch (err) {
        lastError = err as Error;

        // Don't retry on 4xx client errors
        if (err instanceof Error && err.message.startsWith('HTTP 4')) break;

        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError!;
  }

  get<T>(path: string, options?: FetchOptions) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body: unknown, options?: FetchOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...options?.headers as any },
    });
  }

  put<T>(path: string, body: unknown, options?: FetchOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...options?.headers as any },
    });
  }

  patch<T>(path: string, body: unknown, options?: FetchOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...options?.headers as any },
    });
  }

  delete<T>(path: string, options?: FetchOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

// Usage: call GitHub API from your backend
export const githubClient = new HttpClient('https://api.github.com', {
  'Accept': 'application/vnd.github.v3+json',
  'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
});

// Call internal microservice
export const notificationClient = new HttpClient('http://notifications-service:3001');
```

---

## PHASE 11 — WEBSOCKETS + SERVER-SENT EVENTS
### 🎯 Concept: HTTP is request/response — the client always initiates. WebSocket = full duplex. SSE = server pushes, client reads (great for feeds, one-way live data).

`apps/api/src/plugins/websocket.ts`:
```typescript
import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';

export const websocketPlugin = fp(async (app) => {
  await app.register(websocket);
});
```

`apps/api/src/routes/realtime.ts`:
```typescript
import { FastifyPluginAsync } from 'fastify';
import { WebSocket } from 'ws';

// Track connected clients per project
const projectRooms = new Map<string, Set<{ ws: WebSocket; userId: string }>>();

export const realtimeRoutes: FastifyPluginAsync = async (app) => {

  // ✅ WebSocket — bidirectional, great for live cursors / collaborative features
  // ws://localhost:3000/api/v1/ws/projects/:projectId
  app.get('/ws/projects/:projectId', { websocket: true }, (socket, req) => {
    const { projectId } = req.params as { projectId: string };

    // TODO: verify auth from query param or cookie since WS can't set headers easily
    const userId = (req.query as any).userId ?? 'anon';

    if (!projectRooms.has(projectId)) projectRooms.set(projectId, new Set());
    const room = projectRooms.get(projectId)!;
    const client = { ws: socket, userId };
    room.add(client);

    req.log.info({ projectId, userId, total: room.size }, 'ws client connected');

    socket.on('message', (raw) => {
      let msg: { type: string; payload: unknown };
      try { msg = JSON.parse(raw.toString()); }
      catch { return; }

      // Broadcast cursor position to all OTHER clients in same project
      if (msg.type === 'cursor') {
        const outbound = JSON.stringify({ type: 'cursor', userId, payload: msg.payload });
        for (const c of room) {
          if (c !== client && c.ws.readyState === WebSocket.OPEN) {
            c.ws.send(outbound);
          }
        }
      }

      if (msg.type === 'ping') socket.send(JSON.stringify({ type: 'pong' }));
    });

    socket.on('close', () => {
      room.delete(client);
      if (room.size === 0) projectRooms.delete(projectId);
      req.log.info({ projectId, userId, total: room.size }, 'ws client disconnected');
    });

    socket.on('error', (err) => req.log.error(err, 'ws error'));

    // Send initial room state
    socket.send(JSON.stringify({
      type: 'room-joined',
      payload: {
        projectId,
        onlineUsers: [...room].map(c => c.userId),
      },
    }));
  });

  // ✅ Server-Sent Events — server pushes, client reads. Perfect for activity feeds.
  // GET /events/projects/:projectId → EventSource in browser
  app.get('/events/projects/:projectId', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };

    // SSE headers — must be set before any data
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',   // disable nginx buffering
    });

    const clientId = crypto.randomUUID();
    req.log.info({ projectId, clientId }, 'SSE client connected');

    // Send a comment every 30s to keep connection alive (proxy timeout prevention)
    const heartbeat = setInterval(() => {
      reply.raw.write(': heartbeat\n\n');
    }, 30_000);

    // Helper to push an event
    function sendEvent(event: string, data: unknown) {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n`);
      reply.raw.write(`id: ${Date.now()}\n\n`);
    }

    // Subscribe to Redis pub/sub for this project
    const subscriber = app.redis.duplicate();
    await subscriber.subscribe(`project:${projectId}:events`);
    subscriber.on('message', (_channel, message) => {
      try {
        const { event, data } = JSON.parse(message);
        sendEvent(event, data);
      } catch {}
    });

    // Send initial connected event
    sendEvent('connected', { clientId, projectId });

    req.raw.on('close', () => {
      clearInterval(heartbeat);
      subscriber.unsubscribe().then(() => subscriber.disconnect());
      req.log.info({ projectId, clientId }, 'SSE client disconnected');
    });

    // Don't close the response — keep it open
    return reply;
  });
};

// Call this from other parts of the app to push events to SSE clients
export async function publishProjectEvent(
  redis: import('ioredis').Redis,
  projectId: string,
  event: string,
  data: unknown
) {
  await redis.publish(`project:${projectId}:events`, JSON.stringify({ event, data }));
}
```

---

## PHASE 12 — REDIS CACHING
### 🎯 Concept: Cache = pay once, serve many times. The hard part isn't caching — it's knowing when to INVALIDATE.

`apps/api/src/plugins/redis.ts`:
```typescript
import fp from 'fastify-plugin';
import Redis from 'ioredis';
import { config } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance { redis: Redis; }
}

export const redisPlugin = fp(async (app) => {
  const redis = new Redis(config.REDIS_URL, {
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    maxRetriesPerRequest: 3,
  });

  await redis.connect();
  app.decorate('redis', redis);
  app.addHook('onClose', async () => redis.quit());
});
```

`apps/api/src/lib/cache.ts`:
```typescript
import { Redis } from 'ioredis';

export class Cache {
  constructor(private redis: Redis, private prefix: string) {}

  private key(k: string) { return `${this.prefix}:${k}`; }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(this.key(key));
    return raw ? JSON.parse(raw) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await this.redis.setex(this.key(key), ttlSeconds, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(this.key(key));
  }

  async delPattern(pattern: string): Promise<void> {
    // Delete all keys matching pattern (e.g. 'project:abc123:*')
    const keys = await this.redis.keys(this.key(pattern));
    if (keys.length) await this.redis.del(...keys);
  }

  // Cache-aside pattern — the most common pattern
  async remember<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await fn();
    await this.set(key, fresh, ttl);
    return fresh;
  }
}

// Usage in route handler:
// const cache = new Cache(app.redis, 'projects');
// const project = await cache.remember(
//   `project:${id}`,
//   300, // 5 minutes
//   () => repo.findById(id, userId)
// );
// 
// On update/delete:
// await cache.delPattern(`project:${id}*`);
```

---

## PHASE 13 — BACKGROUND JOBS WITH BULLMQ
### 🎯 Concept: Never make the user wait for side effects. Sending emails, webhooks, file processing — all go into a queue, processed asynchronously by workers.

`packages/shared/src/jobs.ts`:
```typescript
export type JobName =
  | 'send-welcome-email'
  | 'send-task-assigned-email'
  | 'deliver-webhook'
  | 'process-attachment';

export interface SendWelcomeEmailJob {
  userId: string;
  email: string;
  name: string;
}

export interface DeliverWebhookJob {
  url: string;
  secret: string;
  event: string;
  payload: unknown;
  attempt: number;
}
```

`apps/api/src/lib/queues.ts`:
```typescript
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { JobName } from '@devhub/shared';

// Queues are just named channels — workers consume from them
export function createQueues(redis: Redis) {
  const connection = { host: redis.options.host, port: redis.options.port };

  return {
    email: new Queue<any>('email', { connection }),
    webhook: new Queue<any>('webhook', {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
  };
}
```

`apps/worker/src/workers/email.worker.ts`:
```typescript
import { Worker, Job } from 'bullmq';
import { SendWelcomeEmailJob } from '@devhub/shared';

const worker = new Worker<SendWelcomeEmailJob>(
  'email',
  async (job: Job<SendWelcomeEmailJob>) => {
    const { email, name } = job.data;
    job.log(`Sending welcome email to ${email}`);

    // Replace with real email provider (Resend, SendGrid, etc.)
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'noreply@devhub.com',
        to: email,
        subject: `Welcome to DevHub, ${name}!`,
        html: `<h1>Hey ${name}!</h1><p>Welcome aboard.</p>`,
      }),
    });

    await job.updateProgress(100);
  },
  { connection: { host: 'localhost', port: 6379 }, concurrency: 5 }
);

worker.on('completed', job => console.log(`Email job ${job.id} done`));
worker.on('failed', (job, err) => console.error(`Email job ${job?.id} failed: ${err.message}`));
```

`apps/worker/src/workers/webhook.worker.ts`:
```typescript
import { Worker, Job } from 'bullmq';
import { createHmac } from 'crypto';
import { DeliverWebhookJob } from '@devhub/shared';

const worker = new Worker<DeliverWebhookJob>(
  'webhook',
  async (job: Job<DeliverWebhookJob>) => {
    const { url, secret, event, payload } = job.data;
    const body = JSON.stringify({ event, payload, timestamp: Date.now() });

    // Sign the payload so the receiver can verify it came from us
    const signature = createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DevHub-Signature': `sha256=${signature}`,
        'X-DevHub-Event': event,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status}`);
      // BullMQ retries automatically via backoff strategy
    }
  },
  { connection: { host: 'localhost', port: 6379 }, concurrency: 10 }
);
```

---

## PHASE 14 — ERROR HANDLING
### 🎯 Concept: Errors WILL happen. Your job is: log the full details internally, send the client ONLY what they need to know.

`apps/api/src/errors/app-error.ts`:
```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} ${id} not found` : `${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super('Validation failed', 422, 'VALIDATION_ERROR', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(msg = 'Access denied') {
    super(msg, 403, 'FORBIDDEN');
  }
}
```

`apps/api/src/plugins/error-handler.ts`:
```typescript
import fp from 'fastify-plugin';
import { AppError } from '../errors/app-error.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandlerPlugin = fp(async (app) => {
  app.setErrorHandler((error, req, reply) => {
    // Always log the full error internally
    req.log.error({
      err: error,
      method: req.method,
      url: req.url,
      userId: (req as any).user?.id,
    }, 'Request error');

    // AppError — our own controlled errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message,
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      });
    }

    // Zod validation error (from Fastify's schema validation)
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: 'Invalid request data',
        details: error.flatten().fieldErrors,
      });
    }

    // Prisma known errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {  // Unique constraint
        return reply.status(409).send({
          error: 'ConflictError',
          message: 'Resource already exists',
          field: (error.meta?.target as string[])?.join(', '),
        });
      }
      if (error.code === 'P2025') {  // Record not found
        return reply.status(404).send({
          error: 'NotFoundError',
          message: 'Resource not found',
        });
      }
    }

    // Unknown error — NEVER leak stack trace in production
    const isProd = app.config.NODE_ENV === 'production';
    reply.status(500).send({
      error: 'InternalServerError',
      message: isProd ? 'Something went wrong' : error.message,
      ...(isProd ? {} : { stack: error.stack }),
    });
  });

  // Handle 404 — route not found
  app.setNotFoundHandler((req, reply) => {
    reply.status(404).send({
      error: 'NotFound',
      message: `Route ${req.method} ${req.url} not found`,
    });
  });
});
```

---

## PHASE 15 — PROCESS MANAGEMENT + GRACEFUL SHUTDOWN
### 🎯 Concept: When your server gets SIGTERM (deploy, scale-down, crash), in-flight requests deserve to finish. Your DB pool deserves to close cleanly. Abrupt kills corrupt state.

`apps/api/src/shutdown.ts`:
```typescript
import { FastifyInstance } from 'fastify';

export function setupGracefulShutdown(app: FastifyInstance) {
  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    app.log.info({ signal }, 'Shutdown signal received — draining...');

    // Stop accepting new requests immediately
    // Fastify's close() waits for in-flight requests (up to closeGracePeriod)
    await app.close();

    // Prisma and Redis are cleaned up via onClose hooks registered in plugins
    app.log.info('Server shut down cleanly');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));  // Docker, Kubernetes
  process.on('SIGINT', () => shutdown('SIGINT'));    // Ctrl+C in terminal
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart

  process.on('uncaughtException', (err) => {
    app.log.fatal({ err }, 'Uncaught exception — shutting down');
    shutdown('uncaughtException').finally(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason) => {
    app.log.fatal({ reason }, 'Unhandled rejection — shutting down');
    shutdown('unhandledRejection').finally(() => process.exit(1));
  });
}
```

`apps/api/src/main.ts`:
```typescript
import { buildServer } from './server.js';
import { registerRoutes } from './routes/index.js';
import { setupGracefulShutdown } from './shutdown.js';
import { config } from './config.js';

// Register plugins
import { prismaPlugin } from './plugins/prisma.js';
import { redisPlugin } from './plugins/redis.js';
import { zodPlugin } from './plugins/zod-provider.js';
import { securityPlugin } from './plugins/security.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { uploadPlugin } from './plugins/upload.js';
import { websocketPlugin } from './plugins/websocket.js';

async function main() {
  const app = buildServer();

  // Plugin registration ORDER MATTERS
  await app.register(zodPlugin);
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(securityPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(uploadPlugin);
  await app.register(websocketPlugin);

  await registerRoutes(app);
  setupGracefulShutdown(app);

  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(`🚀 DevHub API running on http://${config.HOST}:${config.PORT}`);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
```

---

## PHASE 16 — FRONTEND CONNECTION (THE FULL PICTURE)
### 🎯 Concept: CORS, credentials, preflight, token management, fetch patterns — this is where most fullstack devs have gaps.

```
What happens when your browser hits your API:

1. Browser checks if it's a "simple" request (GET/HEAD/POST + safe headers)
   → If YES: sends request, checks CORS headers on response
   → If NO: sends OPTIONS preflight FIRST, checks CORS, then sends actual request

2. Preflight (OPTIONS) checks:
   - Access-Control-Allow-Origin matches your frontend origin
   - Access-Control-Allow-Methods includes your method
   - Access-Control-Allow-Headers includes your headers
   → Only then the real request goes through

3. credentials: true means:
   - Frontend: fetch(url, { credentials: 'include' })
   - Backend: Access-Control-Allow-Credentials: true AND
              Access-Control-Allow-Origin CANNOT be '*' — must be exact origin
```

`apps/client/src/lib/api-client.ts` — this is what your frontend should look like:
```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// In-memory token store — don't use localStorage for access tokens
let accessToken: string | null = null;

export function setAccessToken(token: string) { accessToken = token; }
export function clearAccessToken() { accessToken = null; }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',   // sends cookies (for refresh token in HttpOnly cookie)
  });

  // Token expired — try refresh
  if (response.status === 401 && accessToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Retry original request with new token
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retry = await fetch(`${BASE_URL}${path}`, { ...options, headers });
      if (!retry.ok) throw await parseError(retry);
      return retry.json() as Promise<T>;
    }
    // Refresh failed — force logout
    clearAccessToken();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  // Refresh token is in HttpOnly cookie — browser sends it automatically
  const resp = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!resp.ok) return false;
  const data = await resp.json();
  setAccessToken(data.accessToken);
  return true;
}

async function parseError(response: Response) {
  try {
    const body = await response.json();
    return new ApiError(body.message ?? 'Request failed', response.status, body);
  } catch {
    return new ApiError(`HTTP ${response.status}`, response.status);
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
  }
}

// Type-safe API functions
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ accessToken: string; user: any }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      request('/api/v1/auth/logout', { method: 'POST', body: JSON.stringify({}) }),
  },
  projects: {
    list: (params?: Record<string, string | number>) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request<any>(`/api/v1/projects${qs}`);
    },
    get: (id: string) => request<any>(`/api/v1/projects/${id}`),
    create: (data: any) =>
      request<any>('/api/v1/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/v1/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/api/v1/projects/${id}`, { method: 'DELETE' }),
  },
  tasks: {
    list: (projectId: string, params?: Record<string, any>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/api/v1/projects/${projectId}/tasks${qs}`);
    },
  },
};

// SSE — activity feed
export function subscribeToProjectEvents(
  projectId: string,
  handlers: Record<string, (data: unknown) => void>
): () => void {
  const url = `${BASE_URL}/api/v1/events/projects/${projectId}`;
  const source = new EventSource(url, { withCredentials: true });

  for (const [event, handler] of Object.entries(handlers)) {
    source.addEventListener(event, (e) => handler(JSON.parse((e as MessageEvent).data)));
  }

  source.onerror = (err) => console.error('SSE error:', err);

  // Return cleanup function
  return () => source.close();
}

// WebSocket for live cursors
export function connectToProjectWS(
  projectId: string,
  userId: string,
  onMessage: (msg: unknown) => void
): WebSocket {
  const ws = new WebSocket(
    `ws://localhost:3000/api/v1/ws/projects/${projectId}?userId=${userId}`
  );
  ws.onmessage = (e) => onMessage(JSON.parse(e.data));
  ws.onerror = (err) => console.error('WS error:', err);
  return ws;
}
```

---

## PHASE 17 — TESTING
### 🎯 Concept: Tests are documentation that runs. Unit tests for business logic. Integration tests against a REAL test database — no mocks for DB calls.

`apps/api/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    globalSetup: ['./src/test/global-setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
```

`apps/api/src/test/global-setup.ts`:
```typescript
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export async function setup() {
  process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/devhub_test';
  process.env.NODE_ENV = 'test';

  // Run migrations on test DB
  execSync('prisma migrate deploy', { env: process.env, stdio: 'inherit' });
  prisma = new PrismaClient();
}

export async function teardown() {
  await prisma.$disconnect();
}
```

`apps/api/src/test/setup.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import { beforeEach } from 'vitest';

const prisma = new PrismaClient();

beforeEach(async () => {
  // Clean all tables in reverse dependency order before each test
  await prisma.$transaction([
    prisma.attachment.deleteMany(),
    prisma.task.deleteMany(),
    prisma.projectMember.deleteMany(),
    prisma.project.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});
```

`apps/api/src/test/helpers/factories.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function createUser(overrides: Partial<{
  email: string;
  password: string;
  name: string;
}> = {}) {
  return prisma.user.create({
    data: {
      email: overrides.email ?? `user-${crypto.randomUUID()}@test.com`,
      passwordHash: await bcrypt.hash(overrides.password ?? 'password123', 4), // low rounds in test
      name: overrides.name ?? 'Test User',
    },
  });
}

export async function createProject(ownerId: string, overrides: Partial<{ name: string }> = {}) {
  return prisma.project.create({
    data: {
      name: overrides.name ?? 'Test Project',
      ownerId,
      members: { create: { userId: ownerId, role: 'OWNER' } },
    },
  });
}
```

`apps/api/src/test/routes/projects.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { buildServer } from '../../server.js';
import { createUser, createProject } from '../helpers/factories.js';
import { AuthService } from '../../services/auth.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Projects API', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = buildServer();
    // Register all plugins...
    await app.ready();
  });

  beforeAll(async () => {
    const user = await createUser({ email: 'test@example.com' });
    userId = user.id;
    const authSvc = new AuthService(prisma);
    const tokens = await authSvc.login('test@example.com', 'password123');
    authToken = tokens.accessToken;
  });

  describe('GET /api/v1/projects', () => {
    it('requires authentication', async () => {
      const res = await supertest(app.server).get('/api/v1/projects');
      expect(res.status).toBe(401);
    });

    it('returns empty list for new user', async () => {
      const res = await supertest(app.server)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('returns user projects with pagination', async () => {
      await createProject(userId, { name: 'Project Alpha' });
      await createProject(userId, { name: 'Project Beta' });

      const res = await supertest(app.server)
        .get('/api/v1/projects?limit=1&page=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.hasNext).toBe(true);
    });
  });

  describe('POST /api/v1/projects', () => {
    it('creates a project and auto-joins as OWNER', async () => {
      const res = await supertest(app.server)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'My New Project', color: '#ff0000' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('My New Project');
      expect(res.body.ownerId).toBe(userId);
    });

    it('rejects invalid color', async () => {
      const res = await supertest(app.server)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Bad Project', color: 'not-a-color' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });
  });
});
```

---

## PHASE 18 — FINAL BOSS
### 💀 Do all five. No looking up solutions first.

**Boss 1: API Key Authentication**
Implement a second auth strategy alongside JWT. API keys are for machine-to-machine calls — no expiry, but instantly revocable.
```typescript
// In DB: create ApiKey model with hashed key, name, userId, lastUsed, expiresAt
// On request: check for 'X-API-Key' header
// Hash the incoming key (SHA-256, no bcrypt — it's too slow for every request)
// Lookup hash in DB, hydrate user, same as JWT auth

async function hashApiKey(key: string): Promise<string> {
  // SHA-256 is fine here — keys are long random strings, not passwords
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Boss 2: Idempotency Keys**
POST requests can be retried by clients (network failure). Same request twice = same result, not two created resources.
```typescript
// Client sends: 'Idempotency-Key: <uuid>' header on POST requests
// Server:
//   1. Hash key + route + userId
//   2. Check Redis — if exists, return cached response
//   3. If not: process request, store response in Redis with 24h TTL
//   4. Return response (same as cached for future dupes)
```

**Boss 3: Webhook Delivery with Signature Verification**
Let users register webhook URLs. When a task is created, deliver a signed POST to their URL. Write the receiver verification logic too.
```typescript
// Delivery: see webhook.worker.ts above
// Verification (what the webhook receiver does):
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  // Timing-safe comparison — prevents timing attacks
  return timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expected}`));
}
```

**Boss 4: Full-Text Search on Tasks**
PostgreSQL's built-in FTS — no Elasticsearch needed for this scale.
```sql
-- Migration: add tsvector column
ALTER TABLE tasks ADD COLUMN search_vector tsvector;
CREATE INDEX tasks_search_idx ON tasks USING gin(search_vector);

-- Trigger to keep it updated
CREATE FUNCTION update_task_search() RETURNS trigger AS $$
BEGIN
  NEW.search_vector = to_tsvector('english',
    coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_search_update
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_task_search();
```
```typescript
// Prisma raw query for search
async function searchTasks(projectId: string, query: string) {
  return prisma.$queryRaw`
    SELECT *, ts_rank(search_vector, plainto_tsquery('english', ${query})) AS rank
    FROM tasks
    WHERE project_id = ${projectId}
      AND search_vector @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT 20
  `;
}
```

**Boss 5: OpenAPI Spec Auto-Generation**
Wire `@fastify/swagger` and `@fastify/swagger-ui`. Every route schema you wrote in Zod auto-generates the OpenAPI docs. Make it live at `/docs`. Export the JSON spec at `/docs/json`.
```typescript
await app.register(swagger, {
  openapi: {
    info: { title: 'DevHub API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      },
    },
  },
});
await app.register(swaggerUi, { routePrefix: '/docs' });
```

---

## 🧪 FINAL CHECKLIST

Test every item with **curl, a real frontend, and your test suite**:

**Core API**
- [ ] All CRUD endpoints return correct status codes
- [ ] Pagination metadata is accurate (total, hasNext, hasPrev)
- [ ] Filtering by status and searching by keyword works
- [ ] Sorting by any allowed field, both asc and desc
- [ ] Partial PATCH only updates provided fields

**Auth**
- [ ] Register rejects duplicate email with 409
- [ ] Login returns both access + refresh token
- [ ] Expired JWT returns 401
- [ ] Refresh token rotation — old token rejected after swap
- [ ] Logout invalidates refresh token
- [ ] Rate limiting on auth routes (5/min)

**Authorization**
- [ ] VIEWER cannot create tasks
- [ ] MEMBER cannot delete the project
- [ ] Non-member gets 403 on any project route
- [ ] User can only see their own projects

**File Uploads**
- [ ] File over MAX_FILE_SIZE rejected with 400
- [ ] Disallowed MIME type rejected with 400
- [ ] 10MB file streams to disk without OOM crash
- [ ] Download streams back correctly

**Real-time**
- [ ] SSE connection stays open, heartbeat fires every 30s
- [ ] Creating a task pushes event to SSE clients in that project
- [ ] WebSocket cursor broadcast reaches all peers except sender
- [ ] WS disconnect cleans up room state

**Jobs**
- [ ] Registration sends welcome email (check BullMQ dashboard)
- [ ] Failed webhook retries 5x with exponential backoff
- [ ] Dead-letter queue captures permanently failed jobs

**Resilience**
- [ ] Kill the DB — server returns 503, not 500 stack trace
- [ ] Kill Redis — graceful degradation (no cache, still functional)
- [ ] SIGTERM — in-flight requests finish, then server exits cleanly
- [ ] Uncaught exception — logs and exits with code 1

**Frontend Connection**
- [ ] Browser preflight OPTIONS resolves correctly for all methods
- [ ] `credentials: 'include'` sends cookies correctly
- [ ] Token refresh happens transparently on 401
- [ ] SSE EventSource reconnects on network drop

---

## 🧠 MISTAKES YOU WILL MAKE (and learn from)

| Mistake | Symptom | Fix |
|---|---|---|
| `process.env.FOO` with no validation | Runtime crash 3h into prod | Validate ALL env at startup with Zod |
| Blocking the event loop | Entire server freezes | Every I/O is `await`'ed — never `fs.readFileSync` |
| Buffering large uploads | OOM crash on big files | Stream with `pipeline()`, never `req.file.toBuffer()` |
| Same error for wrong password and wrong email | "User not found" leaks info | Always return "Invalid credentials" |
| JWT in localStorage | XSS can steal it | Keep access token in memory, refresh in HttpOnly cookie |
| Not rotating refresh tokens | Compromised token valid forever | Delete old on use, issue new |
| Missing `credentials: true` in CORS | Browser drops auth headers silently | Set it AND don't use `origin: '*'` |
| Forgetting to drain queue on shutdown | Jobs silently lost on deploy | `await worker.close()` in shutdown hook |
| Missing `@@index` in Prisma | List queries get slower as data grows | Index every foreign key and filter field |
| Returning raw Prisma errors | Password hashes leak in error body | Catch Prisma errors in global handler, return clean messages |
| No request timeout | Slow external API hangs all your connections | Always set `requestTimeout` and `AbortSignal.timeout()` |
| Hard-deleting records | Data is gone forever | Soft delete with `deletedAt`/`status: DELETED` |

---

## 📦 ROOT PACKAGE.JSON SCRIPTS

```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter api --filter worker dev",
    "dev:api": "pnpm --filter api dev",
    "dev:worker": "pnpm --filter worker dev",
    "build": "pnpm -r build",
    "type-check": "pnpm -r exec tsc --noEmit",
    "test": "pnpm --filter api test",
    "test:watch": "pnpm --filter api test -- --watch",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "pnpm --filter api tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset --force"
  }
}
```

---

## 🔗 REFERENCES — open only when you're stuck

| Resource | URL |
|---|---|
| Fastify docs | https://fastify.dev/docs |
| Prisma docs | https://www.prisma.io/docs |
| BullMQ docs | https://docs.bullmq.io |
| Zod docs | https://zod.dev |
| Redis commands | https://redis.io/commands |
| Node.js streams | https://nodejs.org/api/stream.html |
| JWT debugger | https://jwt.io |
| HTTP status codes | https://developer.mozilla.org/en-US/docs/Web/HTTP/Status |
| CORS explained | https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS |

---

> **You don't learn backend by reading about it.**
> **You learn it by staring at a 500 error with no stack trace at 2am.**
>
> **Now go build.**
