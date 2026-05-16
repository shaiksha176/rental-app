# System Design Notes

A running record of every concept introduced in each phase — the problem it solves, how it works, and where to find it in the code. Use this for learning and revision.

---

## Phase 1: Foundation

**Goal:** Get the app running with the right structure so every future concept has a clean place to live.

---

### 1. Layered Architecture

**Problem:** If every file does everything — handles HTTP, runs SQL, applies business rules — the code becomes impossible to change. Fixing a bug in the database query means touching the same file that handles HTTP headers.

**Solution:** Split responsibilities into distinct layers. Each layer only talks to the layer directly below it.

```
HTTP Request
    ↓
Routes          → just maps URLs to controller functions
    ↓
Controllers     → reads req, calls service, writes res
    ↓
Services        → business logic and validation rules
    ↓
Repositories    → all SQL, nothing else
    ↓
Database (PostgreSQL)
```

**Why it matters:** You can swap PostgreSQL for another database by only touching the repository layer. You can change business rules without touching SQL. You can change HTTP behavior without touching business logic.

**Where it lives:**
- `src/routes/` — URL mapping only
- `src/controllers/` — HTTP in/out only
- `src/services/` — validation, rules, orchestration
- `src/repository/` — raw SQL queries

---

### 2. Connection Pooling

**Problem:** Opening a new database connection for every HTTP request takes ~50–200ms and has a memory cost. At 1000 requests/second, this collapses the database.

**Solution:** Create a pool of connections at startup and reuse them. A request borrows a connection, uses it, and returns it to the pool.

```
App starts → pool creates 2–10 connections → they stay open
Request arrives → borrows connection from pool → runs query → returns it
```

**Key settings:**
- `max: 10` — never open more than 10 simultaneous connections
- `min: 2` — keep at least 2 warm so cold starts don't add latency
- `idleTimeoutMillis: 30000` — close a connection if it sits unused for 30s

**Where it lives:** `src/db/database.js`, `src/db/client.js`

---

### 3. Cache-Aside Pattern

**Problem:** Reading the same listing from PostgreSQL on every request wastes database resources. A listing rarely changes — paying the DB round-trip every time is unnecessary.

**Solution:** Store a copy in Redis (fast, in-memory). On every read:

```
1. Check Redis first
2a. Cache HIT  → return immediately, skip the DB
2b. Cache MISS → read from DB, store in Redis, return
```

On every write (update/delete):
```
3. Update DB
4. Delete the cache entry (so the next read gets fresh data)
```

This pattern is called **cache-aside** because the app manages the cache manually (as opposed to the DB writing to cache automatically).

**Why Redis and not just memory?** In-process memory disappears on restart and isn't shared between server instances. Redis is a separate process that survives restarts and is shared by all servers.

**TTL (Time-to-Live):** Every cache entry expires after 3600 seconds (1 hour). This is a safety net — even if invalidation fails, stale data eventually clears itself.

**Fail-soft behavior:** If Redis is down, cache reads return `null` (treated as a miss) and writes silently fail. The app keeps working against the DB — just slower. Redis outages should degrade performance, not take down the service.

**Where it lives:**
- `src/services/cacheService.js` — `get`, `set`, `del` wrappers with fail-soft
- `src/services/listingService.js` — `getListingById` (read-through), `updateListing`/`deleteListing` (invalidation)

---

### 4. Cache Invalidation

**Problem:** When a listing is updated, the old copy sitting in Redis is now wrong. Anyone who reads it gets stale data.

**Solution:** After every write, delete the cache key. The next read will miss the cache, fetch from DB, and repopulate it with the fresh value.

```
PATCH /listings/:id
  → update DB ✓
  → del listing:{id} from Redis ✓
  → next GET /listings/:id fetches fresh from DB
```

This is **delete-on-write** (also called **invalidation**), not **update-on-write**. Deleting is simpler and safer — you don't risk writing a partially-updated value to cache in a race condition.

**Cache invalidation is notoriously hard** because in distributed systems you can have multiple servers, delayed writes, and failed deletes. Phase 3 addresses the harder version of this problem.

**Where it lives:** `src/services/listingService.js` — `updateListing`, `deleteListing`

---

### 5. Background Job Queue

**Problem:** After a booking is created, you want to automatically cancel it if the guest doesn't pay within 15 minutes. But you can't `sleep(15 minutes)` inside an HTTP handler — it would tie up the request and all its resources.

**Solution:** Hand the work to a queue. The HTTP handler records "check this booking in 15 minutes" and returns immediately. A separate worker process picks up the job later and does the work.

```
POST /bookings
  → create booking in DB
  → add job to Redis queue: { bookingId, delay: 15min }
  → return 201 to client immediately

--- 15 minutes later ---

Worker picks up job
  → fetch booking from DB
  → if still "pending" → set status = "cancelled"
```

**Why BullMQ?** BullMQ stores jobs in Redis, which persists them across restarts. If the server crashes, the jobs survive and get processed when it comes back up. A simple `setTimeout` would lose all pending work on crash.

**Producer/Consumer pattern:** The queue and worker are separated by design. The producer (HTTP handler) only adds jobs. The consumer (worker) only processes them. They're decoupled — you can run multiple workers without changing the producer code.

**Retry with exponential backoff:** If a job fails (e.g., DB is temporarily unavailable), BullMQ retries it — waiting 1s, then 2s, then 4s. This avoids hammering a struggling dependency.

**Fire-and-forget:** `addBookingExpiryJob` is called without `await`. The HTTP response doesn't wait for the Redis enqueue to complete — it's best-effort. If enqueueing fails, the error is logged but the booking was already created successfully.

**`removeOnFail: { count: 100 }`:** Permanently-failed jobs are kept (up to 100) for debugging, then discarded. Without this, failed jobs accumulate in Redis forever.

**Where it lives:**
- `src/queues/bookingQueue.js` — producer, `addBookingExpiryJob`
- `src/workers/bookingWorker.js` — consumer, `handleBookingExpiry`
- `src/index.js` — worker initialized at startup, closed on shutdown

---

### 6. Graceful Shutdown

**Problem:** When the server receives a shutdown signal (e.g., `Ctrl+C`, or a deploy restarting the process), in-flight requests get cut off mid-response. Database connections are abandoned, leaving the pool in a bad state.

**Solution:** Catch the shutdown signal, stop accepting new requests, wait for in-flight work to finish, then close connections cleanly.

```
SIGINT/SIGTERM received
  → server.close()   — stop accepting new connections, wait for existing to finish
  → worker.close()   — wait for any in-progress job to complete
  → pool.end()       — return all DB connections
  → redisClient.quit() — close cache connection
  → process.exit(0)
```

**Why close the worker?** The BullMQ worker holds its own Redis connection. If you skip `worker.close()`, the process hangs (open connection keeps the event loop alive) and any job being processed gets abandoned mid-flight.

**Where it lives:** `src/index.js` — `shutdown()` function

---

### Key Takeaways from Phase 1

| Concept | One-line summary |
|---|---|
| Layered architecture | Each layer has one job; changes are isolated |
| Connection pooling | Reuse DB connections instead of opening one per request |
| Cache-aside | Check cache first; populate on miss; invalidate on write |
| TTL | Stale cache entries expire automatically as a safety net |
| Fail-soft | Infrastructure failures degrade performance, not correctness |
| Background jobs | Defer delayed/heavy work so HTTP handlers return fast |
| Producer/consumer | Decouple who creates work from who does it |
| Exponential backoff | Retry failures with increasing delays to avoid hammering |
| Fire-and-forget | Best-effort side effects don't block the main response |
| Graceful shutdown | Finish in-flight work before closing; never abandon connections |

---

## Phase 2: Distributed Booking

**Goal:** Prevent double-booking when multiple guests try to book the same listing at the same time.

---

### 1. The Race Condition

**Problem:** Two guests search for the same listing. Both see it's available. Both click "Book" within milliseconds of each other. Both requests hit the server simultaneously. Without protection, both `INSERT` statements succeed — the host now has two guests for the same dates.

This is a **race condition**: a bug that only appears when two operations interleave in an unlucky order. It's invisible in development (you're the only user) but inevitable in production.

The broken sequence without locking:
```
Request A: check availability → available ✓
Request B: check availability → available ✓   (A hasn't booked yet)
Request A: INSERT booking → success
Request B: INSERT booking → success            (double-booked!)
```

---

### 2. Pessimistic Locking (`SELECT ... FOR UPDATE`)

**Solution:** Before checking availability, acquire an exclusive lock on the listing row. Only one transaction can hold the lock at a time. Other transactions wanting the same lock must wait.

```sql
SELECT id FROM listings WHERE id = $1 FOR UPDATE;
```

`FOR UPDATE` tells PostgreSQL: "I'm about to write something related to this row — block anyone else from acquiring a lock on it until I commit or rollback."

The fixed sequence:
```
Request A: SELECT ... FOR UPDATE → lock acquired
Request B: SELECT ... FOR UPDATE → waiting (blocked by A)
Request A: check availability → no conflict
Request A: INSERT booking → success → COMMIT → lock released
Request B: lock acquired → check availability → conflict found → ROLLBACK → error
```

**Why "pessimistic"?** It assumes a conflict *will* happen and locks upfront. The alternative — **optimistic locking** — assumes no conflict, tries the write, and retries if it lost a race (using a version column). Pessimistic locking is simpler and the right choice when conflicts are frequent and the cost of retrying is high.

**Where it lives:** `src/repository/bookingRepository.js` — `createBookingAtomic`

---

### 3. ACID Transactions

**Problem:** The check and the insert are two separate operations. Between them, the world can change. We need them to be one atomic unit: either both happen, or neither does.

**Solution:** Wrap everything in a database transaction.

```
BEGIN
  → lock the listing row
  → check for overlapping bookings
  → INSERT the new booking
COMMIT
```

If anything fails (overlap found, DB error, server crash), the entire transaction rolls back — as if none of it happened. This is the **A** in ACID:

| Letter | Property | Meaning |
|---|---|---|
| **A** | Atomicity | All-or-nothing. No partial state. |
| **C** | Consistency | DB moves from one valid state to another. Constraints always hold. |
| **I** | Isolation | Concurrent transactions don't see each other's in-progress work. |
| **D** | Durability | Once committed, data survives crashes. |

**Important: transactions need one connection.** `pool.query()` picks any free connection for each call. If two calls land on different connections, they're in different transactions. For a transaction, you must borrow one specific connection and run all queries through it:

```js
const client = await pool.connect();  // borrow one connection
await client.query("BEGIN");
// ... all queries on `client`, not `pool`
await client.query("COMMIT");
client.release();                     // return it to the pool
```

**Where it lives:** `src/repository/bookingRepository.js` — `createBookingAtomic`

---

### 4. The Overlap Check

**Problem:** How do you detect if two date ranges overlap?

**Solution:** Two ranges `[A, B]` and `[C, D]` overlap when `A < D AND C < B`.

Think of it the other way: they do *not* overlap when one ends before the other starts (`B ≤ C` or `D ≤ A`). Flip that with De Morgan's law: `NOT (B ≤ C OR D ≤ A)` = `B > C AND D > A` = overlap.

In SQL (existing booking vs. new request):
```sql
WHERE listing_id = $listingId
  AND booking_status != 'cancelled'
  AND check_in  < $newCheckOut   -- existing starts before new ends
  AND check_out > $newCheckIn    -- existing ends after new starts
```

**Where it lives:** `src/repository/bookingRepository.js` — the `SELECT id FROM bookings` query inside `createBookingAtomic`

---

### 5. Integration Testing Concurrency

**Problem:** How do you prove the locking works? You can't test a race condition by making one request at a time.

**Solution:** Fire N requests simultaneously with `Promise.allSettled` and assert the outcome counts.

```js
const results = await Promise.allSettled(
  Array.from({ length: 10 }, () =>
    createBookingAtomic(listingId, guestId, checkIn, checkOut, 600)
  )
);

expect(successes).toHaveLength(1);    // exactly one got through
expect(conflicts).toHaveLength(9);   // nine were rejected
```

`Promise.allSettled` (not `Promise.all`) is important here — it waits for all promises to settle without short-circuiting on the first rejection. You want to collect all results, not stop at the first error.

**Where it lives:** `tests/integration/booking.test.js`

---

### Key Takeaways from Phase 2

| Concept | One-line summary |
|---|---|
| Race condition | A bug that only appears when two operations interleave unluckily |
| Pessimistic locking | Lock first, check second — prevents any interleaving |
| `SELECT ... FOR UPDATE` | The SQL primitive that acquires a row-level exclusive lock |
| ACID transaction | All-or-nothing execution; partial state is impossible |
| One connection per transaction | `pool.connect()` + `client.release()`, not `pool.query()` |
| Date range overlap formula | `existing.check_in < newCheckOut AND existing.check_out > newCheckIn` |
| `Promise.allSettled` | Fire N concurrent requests and collect all outcomes |

---

## Phase 3: Real-Time Availability Sync

> Coming soon — Event-Driven Architecture, Cache Invalidation at Scale, Dead Letter Queues

---

## Phase 4: Payment Processing

> Coming soon — Idempotency, Saga Pattern, Exactly-Once Semantics, Exponential Backoff

---

## Phase 5: Monitoring & Observability

> Coming soon — Structured Logging, Distributed Tracing, Metrics, Alerting
