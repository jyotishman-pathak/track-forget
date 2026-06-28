# 🔴 THE REDIS GAUNTLET — MASTER IT BY BUILDING IT

> **Stack:** Node.js · TypeScript · pnpm
> **Vibe:** Every Redis concept = code you write and break yourself. Zero fluff.

---

## 🗺️ ROADMAP AT A GLANCE

| Phase | What You Build | Redis Concepts |
|---|---|---|
| 1 | Setup + Client | ioredis, connection, ping, key inspection |
| 2 | Strings | SET/GET, EX/NX/XX, INCR, MSET, GETDEL |
| 3 | Lists | LPUSH/RPUSH, LRANGE, LTRIM, BLPOP queue |
| 4 | Hashes | HSET/HGETALL, HINCRBY, HSCAN |
| 5 | Sets | SADD/SMEMBERS, SINTER/SUNION/SDIFF |
| 6 | Sorted Sets | ZADD/ZRANGE, ZRANK, leaderboard, delay queue |
| 7 | Expiry & Eviction | TTL, PERSIST, EXPIREAT, 8 eviction policies |
| 8 | Pub/Sub | PUBLISH/SUBSCRIBE, PSUBSCRIBE, separate clients |
| 9 | Streams | XADD/XREAD, consumer groups, XACK, PEL |
| 10 | Transactions | MULTI/EXEC, WATCH, optimistic locking |
| 11 | Lua Scripting | EVAL, EVALSHA, atomic custom ops |
| 12 | Pipelining | pipeline(), benchmarks, bulk inserts |
| 13 | Caching Patterns | Cache-aside, write-through, stampede prevention |
| 14 | Rate Limiting | Fixed window, sliding window, token bucket |
| 15 | Session Store | Hash sessions, refresh token rotation, logout-all |
| 16 | Job Queue (BullMQ) | Workers, retries, delays, cron, dead letter |
| 17 | Distributed Lock | Redlock pattern, compare-and-delete Lua |
| 18 | HyperLogLog + Bitmaps | PFADD, PFCOUNT, SETBIT, BITOP |
| 19 | Final Boss | Real-time analytics system wiring everything |

---

## 🧠 WHAT IS REDIS — IN 90 SECONDS (then we never look back)

Redis = **Re**mote **Di**ctionary **S**erver. An in-memory data structure store that is NOT just a cache.

Five things it actually is:
- **Cache** — sub-millisecond reads, way faster than your DB
- **Message broker** — Pub/Sub and Streams (lightweight Kafka)
- **Session store** — stateless APIs with stateful sessions
- **Queue** — job processing with retries, priorities, delays
- **Coordination tool** — rate limiting, distributed locks, leaderboards

Everything lives in RAM. Persistence is optional (RDB snapshots or AOF logs). Single-threaded for commands so every operation is atomic — no mutex needed. That's the superpower.

That's it. Let's build.

---

## 🏗️ THE PROJECT: `RedisOS` — A Backend System That Powers Everything With Redis

One project. Every phase adds a real feature. By the end you have a production-grade backend for a collaboration platform that uses Redis for caching, sessions, queues, pub/sub, rate limiting, locks, analytics, and search.

```
redis-os/
├── src/
│   ├── client.ts
│   ├── config.ts
│   ├── phases/
│   │   ├── 01-strings.ts
│   │   ├── 02-lists.ts
│   │   ├── 03-hashes.ts
│   │   ├── 04-sets.ts
│   │   ├── 05-sorted-sets.ts
│   │   ├── 06-expiry.ts
│   │   ├── 07-pubsub.ts
│   │   ├── 08-streams.ts
│   │   ├── 09-transactions.ts
│   │   ├── 10-lua.ts
│   │   ├── 11-pipeline.ts
│   └── features/
│       ├── cache.ts
│       ├── rate-limiter.ts
│       ├── session.ts
│       ├── queue.ts
│       ├── lock.ts
│       └── analytics.ts
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## SETUP — DO THIS FIRST

### Redis via Docker

`docker-compose.yml`:
```yaml
version: '3.9'
services:
  redis:
    image: redis/redis-stack:latest
    ports:
      - '6379:6379'
      - '8001:8001'   # RedisInsight UI
    volumes:
      - redis-data:/data
    command: >
      redis-server
      --requirepass secret
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru

volumes:
  redis-data:
```

```bash
docker compose up -d
```

Open `http://localhost:8001` — this is RedisInsight, your visual debugger. **Keep it open the entire time you're coding.** Every key you write, every TTL, every data structure — visible in real time.

### Project Init

```bash
mkdir redis-os && cd redis-os
pnpm init
pnpm add ioredis bullmq
pnpm add -D typescript tsx @types/node
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`package.json` scripts:
```json
{
  "scripts": {
    "phase": "tsx",
    "dev": "tsx --watch src/index.ts",
    "cli": "docker exec -it redis-os-redis-1 redis-cli -a secret"
  }
}
```

`src/config.ts`:
```typescript
export const config = {
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? 'secret',
    db: Number(process.env.REDIS_DB ?? 0),
  }
} as const;
```

`src/client.ts`:
```typescript
import Redis from 'ioredis';
import { config } from './config.js';

let instance: Redis | null = null;

export function getRedis(): Redis {
  if (!instance) {
    instance = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: false,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        console.log(`Redis reconnect attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    instance.on('connect', () => console.log('✅ Redis connected'));
    instance.on('error', (err) => console.error('❌ Redis error:', err.message));
    instance.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
  }
  return instance;
}

export async function closeRedis() {
  if (instance) {
    await instance.quit();
    instance = null;
  }
}
```

**🔬 CHECKPOINT:** Run `pnpm cli` and type `PING`. You get `PONG`. Then type `INFO server`. Read it. Know your Redis version, OS, uptime. Then `INFO memory` — understand `used_memory_human` vs `maxmemory_human`. Do not skip this step.

---

## PHASE 1 — STRINGS
### 🎯 Concept: Not just text — Redis strings hold text, numbers, JSON, binary, up to 512MB

The most used data type. Every caching pattern starts here.

`src/phases/01-strings.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

async function main() {
  // ─── Basic SET / GET ────────────────────────────────────────────
  await redis.set('greeting', 'hello world');
  const val = await redis.get('greeting');
  console.log('GET greeting:', val); // hello world

  // ─── With expiry ─────────────────────────────────────────────────
  await redis.set('otp:user:42', '482910', 'EX', 300);         // expires in 300 seconds
  await redis.set('otp:user:43', '192837', 'PX', 300_000);     // expires in 300,000 ms
  console.log('OTP TTL (s):', await redis.ttl('otp:user:42')); // ~300
  console.log('OTP TTL (ms):', await redis.pttl('otp:user:43')); // ~300000

  // ─── Conditional SET ─────────────────────────────────────────────
  // NX = set ONLY if key does NOT exist
  const lock1 = await redis.set('lock:resource', 'owner-1', 'EX', 30, 'NX');
  console.log('First lock:', lock1);  // OK — acquired

  const lock2 = await redis.set('lock:resource', 'owner-2', 'EX', 30, 'NX');
  console.log('Second lock:', lock2); // null — already held!

  // XX = set ONLY if key EXISTS
  const xx = await redis.set('does-not-exist', 'value', 'XX');
  console.log('SET XX on missing key:', xx); // null

  // ─── Atomic counters ─────────────────────────────────────────────
  await redis.set('views:home', '0');
  await redis.incr('views:home');
  await redis.incr('views:home');
  await redis.incrby('views:home', 10);
  console.log('Page views:', await redis.get('views:home')); // 12

  await redis.set('price:item:1', '9.99');
  await redis.incrbyfloat('price:item:1', 0.01);
  console.log('Price:', await redis.get('price:item:1')); // 10

  // ─── Decrement ───────────────────────────────────────────────────
  await redis.set('tickets:left', '100');
  await redis.decr('tickets:left');
  await redis.decrby('tickets:left', 10);
  console.log('Tickets left:', await redis.get('tickets:left')); // 89

  // ─── Multi-key ops ───────────────────────────────────────────────
  await redis.mset(
    'user:1:name',  'Alice',
    'user:1:email', 'alice@example.com',
    'user:1:role',  'admin'
  );
  const fields = await redis.mget('user:1:name', 'user:1:email', 'user:1:role');
  console.log('MGET:', fields); // ['Alice', 'alice@example.com', 'admin']

  // ─── Atomic get-then-set / get-then-delete ───────────────────────
  const old = await redis.getset('greeting', 'hi there');
  console.log('Old value:', old); // hello world
  console.log('New value:', await redis.get('greeting')); // hi there

  const deleted = await redis.getdel('greeting');
  console.log('Getdel returned:', deleted); // hi there
  console.log('After getdel:', await redis.get('greeting')); // null

  // ─── String as binary / range ops ────────────────────────────────
  await redis.set('bio', 'I love Redis');
  console.log('Length:', await redis.strlen('bio'));          // 12
  console.log('Range 7-11:', await redis.getrange('bio', 7, 11)); // Redis
  await redis.setrange('bio', 7, 'TypeScript');
  console.log('After setrange:', await redis.get('bio'));     // I love TypeScript

  await redis.quit();
}

main();
```

Run: `pnpm phase src/phases/01-strings.ts`

**🔬 KEY NAMING RULE:** Always use colons: `user:123:sessions`, `rate:limit:ip:1.2.3.4`. RedisInsight renders them as a tree. Pick a convention and never break it.

---

## PHASE 2 — LISTS
### 🎯 Concept: Doubly-linked list — O(1) push/pop from either end. O(N) random access.

Use for: activity feeds, simple job queues, message logs, recent items.

`src/phases/02-lists.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

async function main() {
  await redis.del('feed:activity', 'jobs:queue', 'notifications:user:1');

  // ─── Push ────────────────────────────────────────────────────────
  // RPUSH = push to right (tail) — like enqueue. Natural FIFO queue order.
  // LPUSH = push to left (head) — newest at front. Natural activity feed order.
  await redis.rpush('feed:activity', 'alice joined', 'bob posted', 'carol liked');
  await redis.lpush('feed:activity', 'dave commented'); // now at front

  console.log('List length:', await redis.llen('feed:activity')); // 4

  // ─── Range ───────────────────────────────────────────────────────
  // LRANGE key start stop — 0-indexed, -1 = last element
  const all = await redis.lrange('feed:activity', 0, -1);
  console.log('All items:', all);
  // ['dave commented', 'alice joined', 'bob posted', 'carol liked']

  const latest2 = await redis.lrange('feed:activity', 0, 1);
  console.log('Latest 2:', latest2);

  // ─── Pop ─────────────────────────────────────────────────────────
  console.log('LPOP (head):', await redis.lpop('feed:activity'));  // dave commented
  console.log('RPOP (tail):', await redis.rpop('feed:activity'));  // carol liked

  // Pop multiple (Redis 6.2+)
  await redis.rpush('batch', 'a', 'b', 'c', 'd', 'e');
  const batch = await redis.lpop('batch', 3);
  console.log('Batch pop 3:', batch); // ['a', 'b', 'c']

  // ─── Trim ────────────────────────────────────────────────────────
  // CRITICAL PATTERN: keep only last N items in a feed
  for (let i = 0; i < 120; i++) {
    await redis.lpush('notifications:user:1', `notification ${i}`);
  }
  await redis.ltrim('notifications:user:1', 0, 99); // keep newest 100
  console.log('After trim:', await redis.llen('notifications:user:1')); // 100

  // ─── Index access ─────────────────────────────────────────────────
  console.log('First item:', await redis.lindex('notifications:user:1', 0));
  console.log('Last item:', await redis.lindex('notifications:user:1', -1));

  // ─── BLPOP — blocking pop, THE queue worker pattern ───────────────
  // Worker blocks here until a job appears or timeout
  console.log('\nWaiting for job (2s timeout)...');
  const nothing = await redis.blpop('jobs:queue', 2); // 2 second timeout
  console.log('Nothing in queue:', nothing); // null (timed out)

  // Producer sends a job
  await redis.rpush('jobs:queue', JSON.stringify({
    id: 1,
    type: 'send-email',
    to: 'user@example.com'
  }));

  // Worker gets it instantly
  const job = await redis.blpop('jobs:queue', 1);
  if (job) {
    const [list, payload] = job;
    console.log('Got job from', list, '→', JSON.parse(payload));
  }

  await redis.quit();
}

main();
```

**🔬 UNDERSTAND THIS:** `BLPOP` is how a worker "sleeps" until work arrives. Call `BLPOP jobs:queue 0` (block forever). When a producer does `RPUSH`, ONE sleeping worker wakes up. This is the entire foundation of BullMQ under the hood.

---

## PHASE 3 — HASHES
### 🎯 Concept: Field-value pairs inside one key — a Redis "object" or "row"

More memory-efficient than storing each field as a separate string key. Perfect for user records, product data, configs.

`src/phases/03-hashes.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

async function main() {
  const key = 'user:42';

  // ─── Set fields ──────────────────────────────────────────────────
  await redis.hset(key,
    'name',      'Alice',
    'email',     'alice@example.com',
    'plan',      'pro',
    'credits',   '100',
    'createdAt', Date.now().toString()
  );

  // ─── Get ─────────────────────────────────────────────────────────
  console.log('name:', await redis.hget(key, 'name'));
  const subset = await redis.hmget(key, 'name', 'plan', 'credits');
  console.log('HMGET:', subset); // ['Alice', 'pro', '100']

  const all = await redis.hgetall(key);
  console.log('HGETALL:', all);

  // ─── HSETNX — set only if field doesn't exist ────────────────────
  const didSet = await redis.hsetnx(key, 'name', 'Bob'); // won't overwrite
  console.log('HSETNX result (0 = not set):', didSet);   // 0

  // ─── Numeric ops ─────────────────────────────────────────────────
  await redis.hincrby(key, 'credits', -10);  // deduct
  await redis.hincrby(key, 'credits', 25);   // add
  console.log('Credits now:', await redis.hget(key, 'credits')); // 115
  await redis.hincrbyfloat(key, 'balance', 9.99);

  // ─── Metadata ────────────────────────────────────────────────────
  console.log('Fields:', await redis.hkeys(key));
  console.log('Values:', await redis.hvals(key));
  console.log('Count:', await redis.hlen(key));
  console.log('Has email?', await redis.hexists(key, 'email')); // 1
  console.log('Has age?', await redis.hexists(key, 'age'));     // 0

  // ─── Delete a field ──────────────────────────────────────────────
  await redis.hdel(key, 'createdAt');

  // ─── HSCAN — safe iteration for LARGE hashes ─────────────────────
  // NEVER use HGETALL on a hash with millions of fields — it blocks Redis!
  const bigKey = 'product:catalog';
  for (let i = 0; i < 500; i++) {
    await redis.hset(bigKey, `item:${i}`, JSON.stringify({ price: i * 1.5 }));
  }

  let cursor = '0';
  let scanned = 0;
  do {
    const [next, pairs] = await redis.hscan(bigKey, cursor, 'COUNT', 100);
    cursor = next;
    scanned += pairs.length / 2; // returns [key, val, key, val, ...]
  } while (cursor !== '0');
  console.log('Scanned fields:', scanned); // ~500

  await redis.quit();
}

main();
```

**🔬 TYPED HELPER PATTERN — use this in every project:**
```typescript
interface User { name: string; email: string; credits: number; }

async function saveUser(id: string, user: User) {
  await redis.hset(`user:${id}`, {
    name: user.name,
    email: user.email,
    credits: user.credits.toString() // Redis stores everything as string
  });
}

async function getUser(id: string): Promise<User | null> {
  const data = await redis.hgetall(`user:${id}`);
  if (!data || Object.keys(data).length === 0) return null;
  return { name: data.name, email: data.email, credits: Number(data.credits) };
}
```

---

## PHASE 4 — SETS
### 🎯 Concept: Unordered collection of unique strings — O(1) add, remove, membership check

Use for: followers/following, tags, online users, permissions, unique visitor sets.

`src/phases/04-sets.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

async function main() {
  await redis.del('followers:alice', 'followers:bob');

  // ─── Add / check ─────────────────────────────────────────────────
  await redis.sadd('followers:alice', 'bob', 'carol', 'dave', 'eve');
  await redis.sadd('followers:bob',   'alice', 'carol', 'frank');

  console.log('Alice follower count:', await redis.scard('followers:alice')); // 4
  console.log('Bob follows Alice?',   await redis.sismember('followers:bob', 'alice')); // 1
  console.log('Bob follows Dave?',    await redis.sismember('followers:bob', 'dave'));   // 0

  // Multi-member check (Redis 6.2+)
  const checks = await redis.smismember('followers:alice', 'bob', 'xyz', 'dave');
  console.log('Bulk check [bob, xyz, dave]:', checks); // [1, 0, 1]

  // ─── Set math ─────────────────────────────────────────────────────
  // Who do Alice AND Bob both follow? (intersection)
  const mutual = await redis.sinter('followers:alice', 'followers:bob');
  console.log('Mutual:', mutual); // ['carol']

  // Everyone either follows (union)
  const all = await redis.sunion('followers:alice', 'followers:bob');
  console.log('Union:', all);

  // Who does Alice follow that Bob doesn't? (difference)
  const aliceOnly = await redis.sdiff('followers:alice', 'followers:bob');
  console.log('Alice-exclusive:', aliceOnly); // ['dave', 'eve']

  // Store result in a new key
  await redis.sinterstore('mutual:alice:bob', 'followers:alice', 'followers:bob');

  // ─── Random member ───────────────────────────────────────────────
  const random = await redis.srandmember('followers:alice');
  console.log('Random member:', random);

  const sample = await redis.srandmember('followers:alice', 2);
  console.log('Sample of 2:', sample);

  // SPOP — remove and return (lottery, one-time codes)
  const winner = await redis.spop('followers:alice');
  console.log('Winner (removed):', winner);

  // ─── Move between sets ───────────────────────────────────────────
  // Atomically move 'carol' from alice's followers to bob's
  await redis.smove('followers:alice', 'followers:bob', 'carol');

  // ─── Real pattern: online users ──────────────────────────────────
  const onlineKey = 'users:online';
  await redis.sadd(onlineKey, 'user:1', 'user:2', 'user:3');
  await redis.srem(onlineKey, 'user:2'); // went offline

  console.log('Online:', await redis.smembers(onlineKey)); // ['user:1', 'user:3']

  await redis.quit();
}

main();
```

---

## PHASE 5 — SORTED SETS
### 🎯 Concept: Like a Set but every member has a float score. Always sorted. O(log N) everything.

This is the most powerful Redis data structure. Use for: leaderboards, priority queues, range queries by timestamp, autocomplete.

`src/phases/05-sorted-sets.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

async function main() {
  const board = 'leaderboard:season:1';
  await redis.del(board);

  // ─── Add with scores ─────────────────────────────────────────────
  await redis.zadd(board,
    9500,  'alice',
    8200,  'bob',
    9500,  'carol',   // tied with alice — lexicographic tiebreak
    7800,  'dave',
    10000, 'eve',
    6500,  'frank'
  );

  // ─── Range — low to high ─────────────────────────────────────────
  const asc = await redis.zrange(board, 0, -1, 'WITHSCORES');
  console.log('Low → High:', asc);

  // High to low — add REV
  const top3 = await redis.zrange(board, 0, 2, 'REV', 'WITHSCORES');
  console.log('Top 3:', top3);

  // ─── Rank ─────────────────────────────────────────────────────────
  // ZRANK = rank from lowest (0-indexed). ZREVRANK = rank from highest.
  console.log('Alice rank from top:', await redis.zrevrank(board, 'alice')); // 1 (eve is 0)
  console.log('Frank rank from top:', await redis.zrevrank(board, 'frank')); // 5

  // ─── Score ────────────────────────────────────────────────────────
  console.log('Alice score:', await redis.zscore(board, 'alice')); // '9500'
  console.log('Ghost score:', await redis.zscore(board, 'ghost')); // null

  // ─── Increment ────────────────────────────────────────────────────
  const newScore = await redis.zincrby(board, 500, 'bob');
  console.log('Bob new score:', newScore); // 8700

  // ─── Range by score ───────────────────────────────────────────────
  const highScorers = await redis.zrangebyscore(board, 8000, '+inf', 'WITHSCORES');
  console.log('Score >= 8000:', highScorers);

  const lowScorers = await redis.zrangebyscore(board, '-inf', 7999, 'WITHSCORES');
  console.log('Score < 8000:', lowScorers);

  // ─── Count ────────────────────────────────────────────────────────
  console.log('Total members:', await redis.zcard(board));
  console.log('Members 8000-10000:', await redis.zcount(board, 8000, 10000));

  // ─── Remove ───────────────────────────────────────────────────────
  await redis.zrem(board, 'frank');
  await redis.zremrangebyscore(board, '-inf', 7000); // remove below 7000
  await redis.zremrangebyrank(board, 0, 0);          // remove rank-0 (lowest)

  // ─── DELAYED JOB QUEUE PATTERN ───────────────────────────────────
  // Score = Unix timestamp when job should run
  const queue = 'jobs:scheduled';
  const now = Date.now();
  await redis.zadd(queue,
    now + 5000,  JSON.stringify({ id: 1, task: 'send_email' }),
    now + 10000, JSON.stringify({ id: 2, task: 'report' }),
    now + 1000,  JSON.stringify({ id: 3, task: 'notify' })
  );

  async function processDueJobs() {
    const due = await redis.zrangebyscore(queue, '-inf', Date.now());
    for (const job of due) {
      await redis.zrem(queue, job);
      console.log('Running:', JSON.parse(job));
    }
  }

  await new Promise(r => setTimeout(r, 1500));
  await processDueJobs(); // picks up job 3 (1s delay passed)

  await redis.quit();
}

main();
```

**🔬 EXPERIMENT:** Look at the raw SDS (Simple Dynamic String) encoding. Run `OBJECT ENCODING leaderboard:season:1`. For small sorted sets it's `listpack`. For large ones it's `skiplist`. Redis auto-converts. Know why — it's a memory vs speed tradeoff.

---

## PHASE 6 — EXPIRY & EVICTION
### 🎯 Concept: Keys can auto-delete — and you must know what Redis does when RAM fills up

`src/phases/06-expiry.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

async function main() {
  // ─── Setting expiry on existing key ──────────────────────────────
  await redis.set('token:abc', 'payload');
  await redis.expire('token:abc', 3600);         // seconds
  await redis.pexpire('token:abc', 3_600_000);   // milliseconds

  const tomorrow = Math.floor(Date.now() / 1000) + 86400;
  await redis.expireat('token:abc', tomorrow);   // Unix timestamp

  // ─── Checking TTL ─────────────────────────────────────────────────
  console.log('TTL (s):', await redis.ttl('token:abc'));    // ~86400
  console.log('TTL (ms):', await redis.pttl('token:abc')); // ~86400000
  // Returns: >0 = seconds left | -1 = no expiry | -2 = doesn't exist

  // ─── Remove expiry ────────────────────────────────────────────────
  await redis.persist('token:abc'); // now permanent
  console.log('TTL after PERSIST:', await redis.ttl('token:abc')); // -1

  // ─── SET with options combined ────────────────────────────────────
  // Set + expiry + return old value — all atomic (Redis 6.2+)
  await redis.set('session:xyz', 'old-data');
  const oldVal = await redis.set('session:xyz', 'new-data', 'EX', 3600, 'GET');
  console.log('Previous session value:', oldVal); // old-data

  // ─── Key scanning (never use KEYS * in production) ────────────────
  // KEYS * blocks Redis. SCAN is non-blocking with a cursor.
  await redis.mset('cache:a', '1', 'cache:b', '2', 'cache:c', '3', 'other:x', '4');

  let cursor = '0';
  const found: string[] = [];
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', 'cache:*', 'COUNT', 100);
    cursor = next;
    found.push(...keys);
  } while (cursor !== '0');
  console.log('Found cache keys:', found);

  // ─── Object encoding — how Redis stores internally ────────────────
  await redis.set('small-int', '42');
  await redis.set('big-str', 'x'.repeat(200));
  console.log('int encoding:', await redis.object('ENCODING', 'small-int'));  // int
  console.log('str encoding:', await redis.object('ENCODING', 'big-str'));    // raw

  await redis.quit();
}

main();
```

### Eviction Policies — Know All 8

Set via `--maxmemory-policy` in docker-compose:

| Policy | What Gets Evicted | Best For |
|---|---|---|
| `noeviction` | Nothing — returns error when full | You can't lose any data |
| `allkeys-lru` | Least recently used, any key | General purpose cache |
| `volatile-lru` | LRU, only keys WITH expiry | Mixed persistent + cached data |
| `allkeys-lfu` | Least frequently used, any key | Long-tail access patterns |
| `volatile-lfu` | LFU, only expiring keys | Mixed + frequency matters |
| `allkeys-random` | Random, any key | Uniform access, don't care |
| `volatile-random` | Random, only expiring keys | Uniform + expiring only |
| `volatile-ttl` | Key closest to expiry | Mimic natural expiry order |

**🔬 TEST IT:** Set `maxmemory 2mb` in docker-compose. Fill Redis past the limit. Watch different policies behave differently. This is critical knowledge for production.

---

## PHASE 7 — PUB/SUB
### 🎯 Concept: Fire-and-forget messaging — publishers don't know who's listening

**Critical limitation you must know:** Messages are NOT persisted. Subscriber offline = message gone forever. For durability, use Streams (Phase 8).

`src/phases/07-pubsub.ts`:
```typescript
import Redis from 'ioredis';
import { config } from '../config.js';

// You MUST use separate clients — a subscribed client can't run other commands
function createClient() {
  return new Redis({ host: config.redis.host, port: config.redis.port, password: config.redis.password });
}

async function main() {
  const pub = createClient();
  const sub = createClient();

  // ─── Subscribe to channels ────────────────────────────────────────
  await sub.subscribe('notifications', 'alerts');

  sub.on('message', (channel, message) => {
    console.log(`[${channel}]`, JSON.parse(message));
  });

  // ─── Pattern subscribe ────────────────────────────────────────────
  // Match any channel like: user:1:events, user:42:events, etc.
  await sub.psubscribe('user:*:events');

  sub.on('pmessage', (pattern, channel, message) => {
    console.log(`[Pattern: ${pattern}] [Ch: ${channel}]`, message);
  });

  await new Promise(r => setTimeout(r, 100)); // let sub set up

  // ─── Publish ──────────────────────────────────────────────────────
  // Returns number of subscribers who received it
  const n1 = await pub.publish('notifications', JSON.stringify({
    type: 'message', from: 'alice', text: 'Hey!'
  }));
  const n2 = await pub.publish('alerts', JSON.stringify({
    level: 'warning', msg: 'High CPU usage'
  }));
  const n3 = await pub.publish('user:42:events', JSON.stringify({
    event: 'login', ip: '1.2.3.4'
  }));

  console.log('Received by:', n1, n2, n3, 'subscriber(s)');

  // ─── Inspect pubsub state ─────────────────────────────────────────
  const activeChannels = await pub.pubsub('CHANNELS', '*');
  console.log('Active channels:', activeChannels);

  const numSubs = await pub.pubsub('NUMSUB', 'notifications', 'alerts');
  console.log('Subscriber counts:', numSubs);

  // ─── Unsubscribe ──────────────────────────────────────────────────
  await sub.unsubscribe('alerts');
  await sub.punsubscribe('user:*:events');

  await new Promise(r => setTimeout(r, 300));
  await pub.quit();
  await sub.quit();
}

main();
```

**🔬 BUILD THE REAL PATTERN — pub/sub + inbox fallback:**
```typescript
async function notifyUser(userId: string, event: object) {
  const channel = `user:${userId}:live`;
  const delivered = await publisher.publish(channel, JSON.stringify(event));

  if (delivered === 0) {
    // Nobody listening — store in inbox for next login
    await redis.lpush(`inbox:${userId}`, JSON.stringify(event));
    await redis.ltrim(`inbox:${userId}`, 0, 99); // keep last 100
    await redis.expire(`inbox:${userId}`, 86400 * 30); // 30 days
  }
}
```

---

## PHASE 8 — STREAMS
### 🎯 Concept: Append-only log + consumer groups — Pub/Sub with persistence and replay

Streams fix Pub/Sub's biggest flaw. Messages survive after delivery. Consumer groups let multiple workers share load without duplicates. This is Redis's answer to Kafka.

`src/phases/08-streams.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();
const STREAM = 'events:user-actions';
const GROUP  = 'analytics-workers';

async function main() {
  await redis.del(STREAM);

  // ─── XADD — append entries ────────────────────────────────────────
  // '*' = auto-generate ID (format: milliseconds-sequence, e.g. 1703000000000-0)
  const id1 = await redis.xadd(STREAM, '*',
    'userId', 'user:42', 'action', 'login', 'ip', '1.2.3.4', 'ts', Date.now().toString()
  );
  const id2 = await redis.xadd(STREAM, '*',
    'userId', 'user:7', 'action', 'purchase', 'amount', '49.99'
  );
  const id3 = await redis.xadd(STREAM, '*',
    'userId', 'user:42', 'action', 'logout'
  );
  console.log('Added IDs:', id1, id2, id3);

  console.log('Stream length:', await redis.xlen(STREAM)); // 3

  // ─── XRANGE — read entries ────────────────────────────────────────
  // '-' = oldest, '+' = newest
  const all = await redis.xrange(STREAM, '-', '+');
  console.log('All events:');
  all.forEach(([id, fields]) => console.log(' ', id, fields));

  // XREVRANGE — newest first
  const latest = await redis.xrevrange(STREAM, '+', '-', 'COUNT', 1);
  console.log('Latest event:', latest);

  // ─── XREAD — read from a position ────────────────────────────────
  const after1 = await redis.xread('COUNT', 10, 'STREAMS', STREAM, id1!);
  console.log('Events after id1:', after1);

  // ─── Consumer Groups ─────────────────────────────────────────────
  try {
    await redis.xgroup('CREATE', STREAM, GROUP, '0', 'MKSTREAM');
    console.log('Consumer group created');
  } catch (e: any) {
    if (!e.message.includes('BUSYGROUP')) throw e;
    console.log('Group already exists');
  }

  // ─── XREADGROUP — each worker gets different messages ─────────────
  // '>' means "give me messages not yet assigned to any consumer"
  const worker1got = await redis.xreadgroup(
    'GROUP', GROUP, 'worker-1',
    'COUNT', 10,
    'STREAMS', STREAM, '>'
  ) as any;

  if (worker1got) {
    for (const [, messages] of worker1got) {
      for (const [msgId, fields] of messages) {
        console.log('Worker-1 processing:', msgId, fields);
        // Process the event...
        await redis.xack(STREAM, GROUP, msgId); // MUST ACK or stays in PEL
        console.log('ACKed:', msgId);
      }
    }
  }

  // ─── XPENDING — see unacknowledged messages ───────────────────────
  const pending = await redis.xpending(STREAM, GROUP, '-', '+', 10);
  console.log('Pending (should be empty):', pending);

  // ─── XTRIM — keep stream bounded ─────────────────────────────────
  await redis.xtrim(STREAM, 'MAXLEN', '~', 1000); // keep ~1000 entries
  // '~' = approximate (faster than exact)

  await redis.quit();
}

main();
```

**🔬 BUILD A REAL WORKER:**
```typescript
async function runWorker(id: string) {
  console.log(`Worker ${id} started`);
  while (true) {
    const results = await redis.xreadgroup(
      'GROUP', 'my-group', id,
      'COUNT', 5,
      'BLOCK', 5000,        // block 5s waiting for events
      'STREAMS', STREAM, '>'
    ) as any;

    if (!results) continue; // timeout — loop and wait again

    for (const [, messages] of results) {
      for (const [msgId, fields] of messages) {
        try {
          await processEvent(fields);
          await redis.xack(STREAM, 'my-group', msgId);
        } catch {
          // stays in PEL — claim with XCLAIM after timeout for retry
          console.error('Failed, will retry:', msgId);
        }
      }
    }
  }
}
```

---

## PHASE 9 — TRANSACTIONS
### 🎯 Concept: MULTI/EXEC = atomic batch. WATCH = optimistic lock. They are not the same thing.

No other client can insert commands between MULTI and EXEC. But Redis does NOT roll back on error — remaining commands still run. WATCH gives you "retry if someone else touched this key."

`src/phases/09-transactions.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

async function main() {
  // ─── Basic MULTI/EXEC ─────────────────────────────────────────────
  const tx = redis.multi();
  tx.set('balance:alice', '1000');
  tx.set('balance:bob', '500');
  tx.incr('balance:alice');
  tx.get('balance:alice');

  const results = await tx.exec();
  console.log('Results:', results);
  // Each: [error | null, value]
  // [['OK'], ['OK'], [1001], ['1001']]

  // ─── WATCH + MULTI/EXEC = optimistic locking ──────────────────────
  // Classic: transfer credits atomically — no overdraft possible
  async function transfer(from: string, to: string, amount: number): Promise<boolean> {
    const fromKey = `balance:${from}`;
    const toKey   = `balance:${to}`;

    await redis.watch(fromKey, toKey); // watch both keys

    const fromBal = Number(await redis.get(fromKey));
    if (fromBal < amount) {
      await redis.unwatch();
      throw new Error(`Insufficient balance: ${fromBal} < ${amount}`);
    }

    const tx = redis.multi();
    tx.decrby(fromKey, amount);
    tx.incrby(toKey, amount);

    const result = await tx.exec(); // returns null if watched key changed
    if (result === null) {
      console.log('Conflict — retrying...');
      return transfer(from, to, amount); // retry (add max attempts in prod)
    }

    console.log(`Transferred ${amount}: ${from} → ${to}`);
    console.log('Balances:', {
      [from]: await redis.get(fromKey),
      [to]:   await redis.get(toKey)
    });
    return true;
  }

  await redis.set('balance:carol', '2000');
  await redis.set('balance:dave', '100');
  await transfer('carol', 'dave', 300);

  // ─── DISCARD — cancel queued transaction ─────────────────────────
  const tx2 = redis.multi();
  tx2.set('temp1', 'a');
  tx2.set('temp2', 'b');
  await tx2.discard(); // nothing executes

  console.log('temp1 after discard:', await redis.get('temp1')); // null

  await redis.quit();
}

main();
```

**🔬 UNDERSTAND THE LIMITATION:** Transactions don't roll back. If command 2 operates on the wrong type, commands 1 and 3 still execute. For true all-or-nothing atomic logic, use Lua scripts (next phase).

---

## PHASE 10 — LUA SCRIPTING
### 🎯 Concept: Run arbitrary logic on the Redis server — zero network round trips, truly atomic

Lua scripts run entirely inside Redis. No other command runs while your script is running. This is how you build operations that can't be expressed with a single Redis command.

`src/phases/10-lua.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

async function main() {
  // ─── EVAL — basic ────────────────────────────────────────────────
  // KEYS[1] = first key arg, ARGV[1] = first value arg (1-indexed in Lua)
  await redis.eval(
    `return redis.call('SET', KEYS[1], ARGV[1])`,
    1,            // number of keys
    'lua:test',   // KEYS[1]
    'hello lua'   // ARGV[1]
  );
  console.log('EVAL result:', await redis.get('lua:test'));

  // ─── Conditional get-or-set — can't be done safely with MULTI ────
  const getOrSetScript = `
    local existing = redis.call('GET', KEYS[1])
    if existing then
      return existing
    end
    redis.call('SET', KEYS[1], ARGV[1], 'EX', tonumber(ARGV[2]))
    return ARGV[1]
  `;

  const v1 = await redis.eval(getOrSetScript, 1, 'computed:value', 'expensive-result', '3600');
  const v2 = await redis.eval(getOrSetScript, 1, 'computed:value', 'other-result', '3600');
  console.log('First call (miss):', v1);  // expensive-result
  console.log('Second call (hit):', v2);  // expensive-result (cached)

  // ─── Atomic limited counter — sold tickets example ────────────────
  const limitedIncrScript = `
    local current = tonumber(redis.call('GET', KEYS[1]) or '0')
    local max = tonumber(ARGV[1])
    if current >= max then
      return -1
    end
    return redis.call('INCR', KEYS[1])
  `;

  await redis.set('tickets:sold', '0');
  for (let i = 0; i < 5; i++) {
    const n = await redis.eval(limitedIncrScript, 1, 'tickets:sold', '3') as number;
    console.log(`Purchase attempt ${i + 1}:`, n === -1 ? '❌ SOLD OUT' : `✅ ticket #${n}`);
  }

  // ─── EVALSHA — load once, call by hash (faster) ──────────────────
  const script = `return redis.call('GET', KEYS[1])`;
  const sha = await redis.script('LOAD', script) as string;
  console.log('Script SHA:', sha);

  const val = await redis.evalsha(sha, 1, 'lua:test');
  console.log('EVALSHA result:', val);

  // ─── Rate limit in Lua (atomic — no race condition possible) ──────
  const rlScript = `
    local key    = KEYS[1]
    local limit  = tonumber(ARGV[1])
    local window = tonumber(ARGV[2])
    local now    = tonumber(ARGV[3])

    redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
    local count = redis.call('ZCARD', key)

    if count < limit then
      redis.call('ZADD', key, now, now .. math.random(1000000))
      redis.call('PEXPIRE', key, window + 1000)
      return {1, limit - count - 1}
    else
      return {0, 0}
    end
  `;

  const now = Date.now();
  for (let i = 0; i < 7; i++) {
    const [ok, left] = await redis.eval(rlScript, 1,
      'rl:user:42', '5', '60000', now.toString()
    ) as [number, number];
    console.log(`Request ${i + 1}: ${ok ? '✅ allowed' : '❌ denied'} (${left} left)`);
  }

  await redis.quit();
}

main();
```

---

## PHASE 11 — PIPELINING
### 🎯 Concept: 1000 commands = 1000 round trips. Pipeline collapses them to 1.

`src/phases/11-pipeline.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

async function main() {
  // ─── Baseline: no pipeline ────────────────────────────────────────
  console.time('Sequential 500 ops');
  for (let i = 0; i < 500; i++) {
    await redis.set(`seq:${i}`, `value:${i}`);
  }
  console.timeEnd('Sequential 500 ops');

  await redis.flushdb();

  // ─── With pipeline ────────────────────────────────────────────────
  console.time('Pipeline 500 ops');
  const pipe = redis.pipeline();
  for (let i = 0; i < 500; i++) {
    pipe.set(`pipe:${i}`, `value:${i}`);
  }
  const results = await pipe.exec();
  console.timeEnd('Pipeline 500 ops');

  const errors = results?.filter(([err]) => err !== null) ?? [];
  console.log('Pipeline errors:', errors.length); // 0

  // ─── Mixed reads and writes in one pipeline ───────────────────────
  const pipe2 = redis.pipeline();
  pipe2.set('app:name', 'RedisOS');
  pipe2.incr('app:starts');
  pipe2.get('app:name');
  pipe2.get('app:starts');
  pipe2.ttl('app:name'); // -1 (no expiry)

  const [setRes, incrRes, nameRes, startsRes, ttlRes] = await pipe2.exec() ?? [];
  console.log('SET:', setRes?.[1]);     // OK
  console.log('INCR:', incrRes?.[1]);   // some number
  console.log('GET name:', nameRes?.[1]); // RedisOS
  console.log('TTL:', ttlRes?.[1]);     // -1

  // ─── Bulk insert in chunks (don't send 1M commands in one pipeline) ─
  async function bulkInsert(data: [string, string][]) {
    const CHUNK = 500;
    for (let i = 0; i < data.length; i += CHUNK) {
      const chunk = data.slice(i, i + CHUNK);
      const pipe = redis.pipeline();
      for (const [key, val] of chunk) pipe.set(key, val);
      await pipe.exec();
      process.stdout.write(`\rInserted ${Math.min(i + CHUNK, data.length)} / ${data.length}`);
    }
    console.log();
  }

  const bigData: [string, string][] = Array.from({ length: 2000 }, (_, i) =>
    [`bulk:${i}`, JSON.stringify({ i, data: 'x'.repeat(50) })]
  );

  console.time('Bulk insert 2000 records in chunks');
  await bulkInsert(bigData);
  console.timeEnd('Bulk insert 2000 records in chunks');

  await redis.quit();
}

main();
```

---

## PHASE 12 — CACHING PATTERNS
### 🎯 Three patterns every backend engineer must be able to recite and implement

`src/features/cache.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

// ─── Pattern 1: Cache-Aside (Lazy Loading) ───────────────────────────
// Check cache. Miss → load from DB → store → return.
// Cache contains only what's been requested. Cold start = slow first hit.

export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    console.log(`[HIT] ${key}`);
    return JSON.parse(cached) as T;
  }

  console.log(`[MISS] ${key}`);
  const data = await fetchFn();
  await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  return data;
}

// ─── Pattern 2: Write-Through ───────────────────────────────────────
// Write to cache AND DB at the same time.
// Cache is always warm. Reads are always fast. Writes are slightly slower.

export async function writeThrough<T>(
  key: string,
  data: T,
  ttlSeconds: number,
  saveFn: (data: T) => Promise<void>
): Promise<void> {
  await Promise.all([
    redis.set(key, JSON.stringify(data), 'EX', ttlSeconds),
    saveFn(data)
  ]);
  console.log(`[WRITE-THROUGH] ${key}`);
}

// ─── Pattern 3: Stampede Prevention ─────────────────────────────────
// Problem: 1000 requests hit a cold cache simultaneously.
// All miss. All slam the DB. DB dies. The "thundering herd".
// Solution: in-process mutex — only one request recomputes.

const inFlight = new Map<string, Promise<unknown>>();

export async function withStampedeGuard<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  // If someone else is already fetching, wait for their result
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) {
    console.log(`[WAIT] ${key} — another request is fetching`);
    return existing;
  }

  // We're the fetcher — create and register the promise
  const promise = fetchFn().then(async (data) => {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    inFlight.delete(key);
    return data;
  });

  inFlight.set(key, promise);
  return promise;
}

// ─── Pattern 4: Tag-Based Invalidation ──────────────────────────────
// Group related cache keys under tags so you can invalidate all at once
// when data changes (e.g., user updates profile → clear all user:* cache)

export async function setWithTags(key: string, tags: string[], data: unknown, ttl: number) {
  const pipe = redis.pipeline();
  pipe.set(key, JSON.stringify(data), 'EX', ttl);
  for (const tag of tags) {
    pipe.sadd(`tag:${tag}`, key);
    pipe.expire(`tag:${tag}`, ttl + 60); // tag lives slightly longer than its keys
  }
  await pipe.exec();
}

export async function invalidateTag(tag: string) {
  const keys = await redis.smembers(`tag:${tag}`);
  if (!keys.length) return;

  const pipe = redis.pipeline();
  for (const key of keys) pipe.del(key);
  pipe.del(`tag:${tag}`);
  await pipe.exec();
  console.log(`Invalidated ${keys.length} keys for tag "${tag}"`);
}
```

---

## PHASE 13 — RATE LIMITING
### 🎯 Three algorithms — different tradeoffs, all using Redis atomically

`src/features/rate-limiter.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

// ─── Algorithm 1: Fixed Window ────────────────────────────────────────
// Simple. Fast. Weakness: allows 2x limit at window boundary.
// 5 req/min means someone can do 5 at 11:59:59 + 5 at 12:00:00 = 10 in 2 seconds.

export async function fixedWindow(id: string, limit: number, windowSec: number) {
  const window = Math.floor(Date.now() / (windowSec * 1000));
  const key = `rl:fw:${id}:${window}`;

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSec);

  return { allowed: count <= limit, count, limit };
}

// ─── Algorithm 2: Sliding Window (Lua — atomic, no race condition) ────
// No boundary problem. Slightly more memory. Most accurate.

const slidingWindowScript = `
  local key    = KEYS[1]
  local limit  = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local now    = tonumber(ARGV[3])
  local reqId  = ARGV[4]

  redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
  local count = redis.call('ZCARD', key)

  if count < limit then
    redis.call('ZADD', key, now, reqId)
    redis.call('PEXPIRE', key, window + 1000)
    return {1, count + 1, limit - count - 1}
  else
    return {0, count, 0}
  end
`;

export async function slidingWindow(id: string, limit: number, windowMs: number) {
  const now = Date.now();
  const [ok, count, remaining] = await redis.eval(
    slidingWindowScript,
    1, `rl:sw:${id}`,
    limit.toString(), windowMs.toString(), now.toString(),
    `${now}-${Math.random()}`
  ) as [number, number, number];

  return { allowed: ok === 1, count, remaining };
}

// ─── Algorithm 3: Token Bucket ────────────────────────────────────────
// Allows controlled bursting. Tokens refill at a steady rate.
// Great for: APIs where occasional spikes are acceptable.

const tokenBucketScript = `
  local key      = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local rate     = tonumber(ARGV[2])  -- tokens per ms
  local now      = tonumber(ARGV[3])

  local data = redis.call('HMGET', key, 'tokens', 'last')
  local tokens = tonumber(data[1]) or capacity
  local last   = tonumber(data[2]) or now

  -- Refill based on elapsed time
  tokens = math.min(capacity, tokens + (now - last) * rate)

  if tokens >= 1 then
    tokens = tokens - 1
    redis.call('HMSET', key, 'tokens', tokens, 'last', now)
    redis.call('PEXPIRE', key, 60000)
    return {1, math.floor(tokens)}
  else
    redis.call('HMSET', key, 'tokens', tokens, 'last', now)
    redis.call('PEXPIRE', key, 60000)
    return {0, 0}
  end
`;

export async function tokenBucket(id: string, capacity: number, refillPerSec: number) {
  const [ok, remaining] = await redis.eval(
    tokenBucketScript,
    1, `rl:tb:${id}`,
    capacity.toString(),
    (refillPerSec / 1000).toString(), // convert to per-ms
    Date.now().toString()
  ) as [number, number];

  return { allowed: ok === 1, remainingTokens: remaining };
}

// ─── Demo ─────────────────────────────────────────────────────────────
async function demo() {
  console.log('\n=== Fixed Window (5 req / 10s) ===');
  for (let i = 0; i < 7; i++) {
    const r = await fixedWindow('user:42', 5, 10);
    console.log(`  ${i + 1}: ${r.allowed ? '✅' : '❌'} count=${r.count}`);
  }

  console.log('\n=== Sliding Window (5 req / 10s) ===');
  for (let i = 0; i < 7; i++) {
    const r = await slidingWindow('user:42', 5, 10000);
    console.log(`  ${i + 1}: ${r.allowed ? '✅' : '❌'} remaining=${r.remaining}`);
  }

  console.log('\n=== Token Bucket (cap=5, 1 token/s) ===');
  for (let i = 0; i < 7; i++) {
    const r = await tokenBucket('user:42', 5, 1);
    console.log(`  ${i + 1}: ${r.allowed ? '✅' : '❌'} tokens=${r.remainingTokens}`);
  }

  await redis.quit();
}

demo();
```

---

## PHASE 14 — SESSION STORE
### 🎯 Concept: Stateless API + stateful sessions. Refresh token rotation prevents replay attacks.

`src/features/session.ts`:
```typescript
import { getRedis } from '../client.js';
import { randomBytes } from 'crypto';

const redis = getRedis();
const SESSION_TTL = 60 * 60 * 24 * 7;  // 7 days
const REFRESH_TTL = 60 * 60 * 24 * 30; // 30 days

interface Session {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  lastActive: number;
  ip: string;
  userAgent: string;
}

// ─── Create ───────────────────────────────────────────────────────────
export async function createSession(data: Omit<Session, 'createdAt' | 'lastActive'>) {
  const sessionId    = randomBytes(32).toString('hex');
  const refreshToken = randomBytes(48).toString('hex');
  const now = Date.now();

  const session: Session = { ...data, createdAt: now, lastActive: now };

  const pipe = redis.pipeline();
  pipe.hset(`session:${sessionId}`, session as unknown as Record<string, string | number>);
  pipe.expire(`session:${sessionId}`, SESSION_TTL);
  pipe.set(`refresh:${refreshToken}`, sessionId, 'EX', REFRESH_TTL);
  pipe.sadd(`user:${data.userId}:sessions`, sessionId);
  await pipe.exec();

  return { sessionId, refreshToken };
}

// ─── Get (with sliding expiry) ────────────────────────────────────────
export async function getSession(sessionId: string): Promise<Session | null> {
  const data = await redis.hgetall(`session:${sessionId}`);
  if (!data || !Object.keys(data).length) return null;

  // Extend TTL on every access (sliding expiry)
  const pipe = redis.pipeline();
  pipe.hset(`session:${sessionId}`, 'lastActive', Date.now());
  pipe.expire(`session:${sessionId}`, SESSION_TTL);
  await pipe.exec();

  return {
    userId:     data.userId,
    email:      data.email,
    role:       data.role,
    createdAt:  Number(data.createdAt),
    lastActive: Number(data.lastActive),
    ip:         data.ip,
    userAgent:  data.userAgent
  };
}

// ─── Refresh token rotation ────────────────────────────────────────────
// Old token deleted, new token issued. A stolen token can only be used once.
export async function rotateRefreshToken(oldToken: string) {
  const sessionId = await redis.get(`refresh:${oldToken}`);
  if (!sessionId) return null;

  const newToken = randomBytes(48).toString('hex');

  const pipe = redis.pipeline();
  pipe.del(`refresh:${oldToken}`);
  pipe.set(`refresh:${newToken}`, sessionId, 'EX', REFRESH_TTL);
  await pipe.exec();

  return { sessionId, newToken };
}

// ─── Logout ────────────────────────────────────────────────────────────
export async function logout(sessionId: string) {
  const session = await getSession(sessionId);
  if (!session) return;

  const pipe = redis.pipeline();
  pipe.del(`session:${sessionId}`);
  pipe.srem(`user:${session.userId}:sessions`, sessionId);
  await pipe.exec();
}

// ─── Logout all devices ────────────────────────────────────────────────
export async function logoutAllDevices(userId: string) {
  const sessionIds = await redis.smembers(`user:${userId}:sessions`);
  if (!sessionIds.length) return;

  const pipe = redis.pipeline();
  for (const id of sessionIds) pipe.del(`session:${id}`);
  pipe.del(`user:${userId}:sessions`);
  await pipe.exec();

  console.log(`Logged out ${sessionIds.length} sessions for user:${userId}`);
}

// ─── List all sessions (for "my devices" page) ────────────────────────
export async function getUserSessions(userId: string) {
  const sessionIds = await redis.smembers(`user:${userId}:sessions`);
  const sessions: Array<Session & { id: string }> = [];

  for (const id of sessionIds) {
    const s = await getSession(id);
    if (s) sessions.push({ ...s, id });
  }

  return sessions;
}
```

---

## PHASE 15 — JOB QUEUE WITH BULLMQ
### 🎯 Concept: BullMQ is the production job queue for Node.js — it's built on Redis Streams + Lists

`src/features/queue.ts`:
```typescript
import { Queue, Worker, Job } from 'bullmq';
import { config } from '../config.js';

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password
};

// ─── Define job payloads ──────────────────────────────────────────────
interface EmailPayload   { to: string; subject: string; body: string; }
interface ReportPayload  { userId: string; type: 'weekly' | 'monthly'; }
interface CleanupPayload { olderThanDays: number; }

// ─── Queues ───────────────────────────────────────────────────────────
export const emailQueue   = new Queue<EmailPayload>('emails', { connection });
export const reportQueue  = new Queue<ReportPayload>('reports', { connection });
export const cleanupQueue = new Queue<CleanupPayload>('cleanup', { connection });

// ─── Add jobs ─────────────────────────────────────────────────────────
export async function queueEmail(data: EmailPayload) {
  return emailQueue.add('send', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s
    removeOnComplete: 100,
    removeOnFail: 500
  });
}

export async function queueDelayedEmail(data: EmailPayload, delayMs: number) {
  return emailQueue.add('send', data, { delay: delayMs });
}

export async function scheduleWeeklyReport() {
  return reportQueue.add('generate', { userId: 'all', type: 'weekly' }, {
    repeat: { cron: '0 9 * * 1' }  // every Monday at 9am
  });
}

// ─── Workers ──────────────────────────────────────────────────────────
export function startEmailWorker() {
  const worker = new Worker<EmailPayload>('emails', async (job: Job<EmailPayload>) => {
    console.log(`[email-worker] job:${job.id} → ${job.data.to}`);

    // Update progress
    await job.updateProgress(10);
    await new Promise(r => setTimeout(r, 200)); // simulate work

    await job.updateProgress(50);
    // Simulate occasional failure (will retry automatically)
    if (Math.random() < 0.15) throw new Error('SMTP timeout');

    await job.updateProgress(100);
    console.log(`[email-worker] sent to ${job.data.to}`);
    return { sentAt: new Date().toISOString() };
  }, {
    connection,
    concurrency: 5,          // 5 jobs at once
    limiter: { max: 50, duration: 1000 }  // max 50/sec
  });

  worker.on('completed', (job, result) => {
    console.log(`✅ ${job.id} done:`, result);
  });
  worker.on('failed', (job, err) => {
    console.error(`❌ ${job?.id} failed (try ${job?.attemptsMade}/${job?.opts.attempts}):`, err.message);
  });

  return worker;
}

// ─── Monitoring ───────────────────────────────────────────────────────
export async function getStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount()
  ]);
  return { waiting, active, completed, failed, delayed };
}

// ─── Demo ─────────────────────────────────────────────────────────────
async function demo() {
  const worker = startEmailWorker();

  for (let i = 0; i < 10; i++) {
    await queueEmail({ to: `user${i}@test.com`, subject: 'Hello', body: `Hi ${i}` });
  }
  await queueDelayedEmail({ to: 'vip@test.com', subject: 'Reminder', body: '...' }, 3000);

  await new Promise(r => setTimeout(r, 5000));
  console.log('Stats:', await getStats());

  await worker.close();
  await emailQueue.close();
}

demo();
```

---

## PHASE 16 — DISTRIBUTED LOCK
### 🎯 Concept: Only ONE process runs a critical section — even across multiple servers

`src/features/lock.ts`:
```typescript
import { getRedis } from '../client.js';
import { randomBytes } from 'crypto';

const redis = getRedis();

// Compare-and-delete MUST be in Lua — otherwise another process could
// delete between your GET and DEL
const releaseScript = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  else
    return 0
  end
`;

const extendScript = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[2]))
  else
    return 0
  end
`;

export class DistributedLock {
  private key: string;
  private owner: string;

  constructor(resource: string, private ttlMs = 30_000) {
    this.key   = `lock:${resource}`;
    this.owner = randomBytes(16).toString('hex');
  }

  async acquire(): Promise<boolean> {
    const res = await redis.set(this.key, this.owner, 'PX', this.ttlMs, 'NX');
    return res === 'OK';
  }

  async release(): Promise<boolean> {
    const res = await redis.eval(releaseScript, 1, this.key, this.owner);
    return res === 1;
  }

  async extend(extraMs: number): Promise<boolean> {
    const res = await redis.eval(extendScript, 1, this.key, this.owner, extraMs.toString());
    return res === 1;
  }
}

// ─── withLock — the clean API everyone uses ───────────────────────────
export async function withLock<T>(
  resource: string,
  ttlMs: number,
  fn: () => Promise<T>,
  options = { maxRetries: 3, retryDelayMs: 200 }
): Promise<T> {
  const lock = new DistributedLock(resource, ttlMs);

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    if (await lock.acquire()) {
      try {
        return await fn();
      } finally {
        await lock.release();
      }
    }

    if (attempt < options.maxRetries) {
      const delay = options.retryDelayMs * 2 ** attempt; // exponential backoff
      console.log(`Lock busy on "${resource}", retry in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw new Error(`Could not acquire lock on "${resource}" after ${options.maxRetries} retries`);
}

// ─── Demo ─────────────────────────────────────────────────────────────
async function demo() {
  await redis.set('inventory:item:1', '10');

  // Without lock: both workers read 10, both deduct 3, both write 7. Wrong!
  // With lock: sequential execution. Correct final value: 4.
  async function deduct(worker: string, amount: number) {
    await withLock('inventory:item:1', 5000, async () => {
      const stock = Number(await redis.get('inventory:item:1'));
      console.log(`[${worker}] stock read: ${stock}`);
      await new Promise(r => setTimeout(r, 50)); // simulate DB write
      await redis.set('inventory:item:1', (stock - amount).toString());
      console.log(`[${worker}] new stock: ${stock - amount}`);
    });
  }

  await Promise.all([deduct('A', 3), deduct('B', 3)]);
  console.log('Final stock:', await redis.get('inventory:item:1')); // 4

  await redis.quit();
}

demo();
```

---

## PHASE 17 — HYPERLOGLOG + BITMAPS
### 🎯 Two probabilistic data structures that use almost no memory

`src/phases/12-patterns.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  // ─── HyperLogLog — count unique items with ~0.81% error ──────────
  // 10 million unique users stored in ~12KB. That's the magic.

  const uvKey = `uv:${today}`;
  for (let i = 0; i < 10_000; i++) {
    await redis.pfadd(uvKey, `user:${i}`);
  }
  // Add 1000 duplicates — HLL deduplicates automatically
  for (let i = 0; i < 1000; i++) {
    await redis.pfadd(uvKey, `user:${i}`);
  }

  console.log('Approximate unique visitors:', await redis.pfcount(uvKey)); // ~10000 ±0.81%

  // Merge multiple HLLs
  await redis.pfmerge('uv:week', `uv:2024-01-01`, uvKey);
  console.log('Weekly unique:', await redis.pfcount('uv:week'));

  // ─── Bitmaps — one bit per user — 1 million users = 125KB ────────

  const loginKey = `logins:${today}`;

  // SETBIT: user 42 logged in
  await redis.setbit(loginKey, 42, 1);
  await redis.setbit(loginKey, 100, 1);
  await redis.setbit(loginKey, 9999, 1);
  await redis.setbit(loginKey, 50000, 1);

  console.log('User 42 logged in?',   await redis.getbit(loginKey, 42));  // 1
  console.log('User 43 logged in?',   await redis.getbit(loginKey, 43));  // 0
  console.log('Total logins today:',  await redis.bitcount(loginKey));     // 4

  // BITPOS: find first user who logged in (first 1 bit)
  console.log('First login at bit:', await redis.bitpos(loginKey, 1)); // 42

  // BITPOS: first user who did NOT log in
  console.log('First non-login at bit:', await redis.bitpos(loginKey, 0)); // 0

  // BITOP: logical operations across bitmaps
  const mon = 'logins:monday';
  const tue = 'logins:tuesday';
  await redis.setbit(mon, 1, 1); await redis.setbit(mon, 2, 1); await redis.setbit(mon, 3, 1);
  await redis.setbit(tue, 2, 1); await redis.setbit(tue, 3, 1); await redis.setbit(tue, 4, 1);

  await redis.bitop('AND', 'logins:both-days',    mon, tue); // only Mon AND Tue
  await redis.bitop('OR',  'logins:either-day',   mon, tue); // Mon OR Tue
  await redis.bitop('XOR', 'logins:one-day-only', mon, tue); // only one of them

  console.log('Logged in both days:', await redis.bitcount('logins:both-days'));    // 2 (users 2,3)
  console.log('Logged in either day:', await redis.bitcount('logins:either-day')); // 4 (users 1,2,3,4)
  console.log('Only one day:', await redis.bitcount('logins:one-day-only'));        // 2 (users 1,4)

  await redis.quit();
}

main();
```

---

## PHASE 18 — FINAL BOSS: REAL-TIME ANALYTICS SYSTEM
### Wire every concept into one production-grade module

`src/features/analytics.ts`:
```typescript
import { getRedis } from '../client.js';

const redis = getRedis();

export class Analytics {
  // ─── Track a page view — hits 6 Redis patterns at once ─────────
  async trackPageView(page: string, userId: string, sessionId: string) {
    const date = new Date().toISOString().slice(0, 10);
    const hour = new Date().getHours();

    const pipe = redis.pipeline();

    // String counters
    pipe.incr(`views:day:${date}:${page}`);
    pipe.incr(`views:hour:${date}:${hour}:${page}`);

    // HyperLogLog — unique visitors
    pipe.pfadd(`uv:day:${date}:${page}`, userId);
    pipe.pfadd(`uv:day:${date}:all`, userId);

    // Set — who's online right now
    pipe.setex(`active:${userId}`, 300, '1');   // expires in 5 min
    pipe.sadd('active:users', userId);

    // Sorted Set — activity leaderboard
    pipe.zincrby('leaderboard:activity:weekly', 1, userId);

    // Bitmap — daily login tracking
    pipe.setbit(`logins:${date}`, Number(userId.replace(/\D/g, '').slice(-6)), 1);

    // Stream — for analytics workers
    pipe.xadd('events:pageviews', '*',
      'userId', userId,
      'page', page,
      'session', sessionId,
      'ts', Date.now().toString()
    );

    await pipe.exec();

    // Pub/Sub — push live update to dashboard
    await redis.publish('dashboard:live', JSON.stringify({
      type: 'pageview', page, userId
    }));
  }

  // ─── Get dashboard snapshot ───────────────────────────────────────
  async getDashboard(page: string) {
    const date = new Date().toISOString().slice(0, 10);

    const [totalViews, uniqueVisitors, activeCount, top10] = await Promise.all([
      redis.get(`views:day:${date}:${page}`),
      redis.pfcount(`uv:day:${date}:${page}`),
      redis.scard('active:users'),
      redis.zrange('leaderboard:activity:weekly', 0, 9, 'REV', 'WITHSCORES')
    ]);

    return { totalViews: Number(totalViews ?? 0), uniqueVisitors, activeCount, top10 };
  }

  // ─── Clean up expired "active" users ─────────────────────────────
  async pruneActiveUsers() {
    const members = await redis.smembers('active:users');
    const pipe = redis.pipeline();
    for (const uid of members) {
      const alive = await redis.exists(`active:${uid}`);
      if (!alive) pipe.srem('active:users', uid);
    }
    await pipe.exec();
  }

  // ─── Week-over-week comparison ────────────────────────────────────
  async getWeeklyComparison(page: string) {
    const today = new Date();
    const thisWeek = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d.toISOString().slice(0, 10);
    });

    const pipe = redis.pipeline();
    for (const date of thisWeek) {
      pipe.get(`views:day:${date}:${page}`);
      pipe.pfcount(`uv:day:${date}:${page}`);
    }

    const results = await pipe.exec();
    return thisWeek.map((date, i) => ({
      date,
      views: Number(results?.[i * 2]?.[1] ?? 0),
      uniqueVisitors: Number(results?.[i * 2 + 1]?.[1] ?? 0)
    }));
  }
}
```

---

## 🧪 FINAL CHECKLIST

Test every item — not just read it, WRITE it and OBSERVE it in RedisInsight:

**Data Structures**
- [ ] Strings: SET/GET/EX/NX/XX/INCR/MGET/GETDEL all working
- [ ] Lists: push/pop both ends, LTRIM feed pattern, BLPOP queue
- [ ] Hashes: HSET/HGETALL/HINCRBY/HSCAN on 500+ field hash
- [ ] Sets: SINTER/SUNION/SDIFF, online users pattern
- [ ] Sorted Sets: leaderboard, score range queries, delayed job queue
- [ ] Expiry: TTL/PERSIST/EXPIREAT, all 8 eviction policies UNDERSTOOD
- [ ] HyperLogLog: 10k unique user count, PFMERGE weekly
- [ ] Bitmaps: daily login, BITCOUNT, BITOP AND/OR/XOR

**Patterns**
- [ ] Pub/Sub: publisher + subscriber in separate processes, NUMSUB verified
- [ ] Streams: XADD/XREADGROUP/XACK consumer group, PEL is empty after ACK
- [ ] Transactions: MULTI/EXEC transfer, WATCH retry on conflict
- [ ] Lua: EVAL rate limiter, EVALSHA by hash, limited counter
- [ ] Pipeline: benchmark proves 5-10x speedup over sequential
- [ ] Cache-aside / write-through / stampede guard all implemented

**Features**
- [ ] All 3 rate limiters: fixed window, sliding window, token bucket
- [ ] Session: create/get/rotate-refresh/logout/logout-all-devices
- [ ] BullMQ: queue, worker, retry with backoff, delayed job, cron job
- [ ] Distributed lock: withLock prevents double-inventory-deduction
- [ ] Analytics: trackPageView hits 6 data structures simultaneously
- [ ] Dashboard: getDashboard returns correct aggregated data

---

## 🧠 MISTAKES YOU WILL MAKE (and learn from)

| Mistake | Symptom | Fix |
|---|---|---|
| One client for Pub/Sub AND commands | Error: client is in subscribe mode | Separate clients — always |
| `KEYS *` in production | Redis freezes for ALL clients | `SCAN` with cursor — always |
| `HGETALL` on million-field hash | Redis hangs for seconds | `HSCAN` with COUNT |
| `SMEMBERS` on massive set | Same blocking problem | `SSCAN` |
| Not setting `maxmemory` | Redis eats all RAM, OS kills the process | Always set maxmemory + eviction policy |
| Storing everything as JSON strings | Miss HINCRBY, ZADD, BITOP etc. | Use the right data structure |
| Forget to `XACK` a stream message | PEL grows forever, memory leak | ACK every processed message |
| Not using pipelines for bulk ops | 10x slower than necessary | Pipeline any batch > 10 ops |
| Releasing a lock you don't own | Other process's lock deleted | Lua compare-and-delete |
| Cache keys with no TTL | Memory fills up silently | Every cache key MUST have expiry |
| Using `SET` for counters under concurrency | Race condition — count goes wrong | `INCR`/`INCRBY` are atomic |
| Passing `NaN` to Lua from JS | Lua crashes, confusing error | Always `.toString()` before passing to `eval` |

---

## 🔗 REFERENCES — open these when stuck, not before

| Resource | URL |
|---|---|
| Redis Commands | https://redis.io/commands |
| ioredis docs | https://github.com/redis/ioredis |
| BullMQ docs | https://docs.bullmq.io |
| Redis Patterns | https://redis.io/docs/manual/patterns |
| Redis Lua API | https://redis.io/docs/manual/programmability/lua-api |
| RedisInsight | http://localhost:8001 (your best debugger) |
| Redis University (free) | https://university.redis.com |

---

> **Redis is not a cache. It is a data structure server.**
> **The moment you treat it as just a cache, you are using 10% of what it can do.**
>
> **Now go build.**
