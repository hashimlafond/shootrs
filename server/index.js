const allowedTypes = new Set([
  "reports",
  "incidents",
  "supportCases",
  "blocks",
  "moderationEvents",
  "moderationActions",
  "removedContent",
  "suspensions",
  "termsAcceptances",
]);

const publicStateTypes = new Set(["blocks", "removedContent", "suspensions", "termsAcceptances"]);
const globalStateTypes = new Set(["removedContent", "suspensions"]);

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...corsHeaders(),
      ...(init.headers || {}),
    },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-shootr-admin-key",
  };
}

function forbidden() {
  return json({ error: "Admin access required." }, { status: 403 });
}

function isAdmin(request, env) {
  const expected = env.SHOOTR_ADMIN_KEY;
  if (!expected) return false;
  return request.headers.get("x-shootr-admin-key") === expected;
}

function safeRecordId(type, record) {
  return String(record?.id || `${type}-${Date.now()}-${crypto.randomUUID()}`);
}

function recordMeta(type, record) {
  const now = new Date().toISOString();
  const createdAt = String(record?.createdAt || record?.acceptedAt || record?.removedAt || record?.suspendedAt || now);
  return {
    id: safeRecordId(type, record),
    type,
    actorUserId: String(record?.actor || record?.userId || record?.blockerUserId || ""),
    reporterUserId: String(record?.reporterUserId || ""),
    reportedUserId: String(record?.reportedUserId || record?.blockedUserId || record?.userId || ""),
    contentId: String(record?.contentId || ""),
    contentType: String(record?.contentType || ""),
    category: String(record?.category || record?.action || record?.type || ""),
    status: String(record?.status || "new"),
    reviewDueAt: String(record?.reviewDueAt || ""),
    createdAt,
    updatedAt: now,
    recordJson: JSON.stringify({ ...record, id: safeRecordId(type, record) }),
  };
}

async function ensureSchema(db) {
  if (!db) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS safety_records (
      id TEXT NOT NULL,
      type TEXT NOT NULL,
      actor_user_id TEXT,
      reporter_user_id TEXT,
      reported_user_id TEXT,
      content_id TEXT,
      content_type TEXT,
      category TEXT,
      status TEXT,
      review_due_at TEXT,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (id, type)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS safety_records_type_idx ON safety_records (type, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS safety_records_reported_user_idx ON safety_records (reported_user_id, type)"),
    db.prepare("CREATE INDEX IF NOT EXISTS safety_records_actor_idx ON safety_records (actor_user_id, type)"),
    db.prepare("CREATE INDEX IF NOT EXISTS safety_records_content_idx ON safety_records (content_id, type)"),
    db.prepare("CREATE INDEX IF NOT EXISTS safety_records_status_idx ON safety_records (status, type)"),
  ]);
}

async function putRecord(env, type, record) {
  if (!allowedTypes.has(type)) throw new Error(`Unsupported safety record type: ${type}`);
  const db = env.DB;
  const meta = recordMeta(type, record);
  if (!db) {
    const memory = (globalThis.__shootrSafetyMemory ||= {});
    memory[type] ||= [];
    const existingIndex = memory[type].findIndex((item) => item.id === meta.id);
    const parsed = JSON.parse(meta.recordJson);
    if (existingIndex >= 0) memory[type][existingIndex] = parsed;
    else memory[type].push(parsed);
    return parsed;
  }
  await ensureSchema(db);
  await db.prepare(`INSERT INTO safety_records (
    id, type, actor_user_id, reporter_user_id, reported_user_id, content_id, content_type,
    category, status, review_due_at, record_json, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id, type) DO UPDATE SET
    actor_user_id = excluded.actor_user_id,
    reporter_user_id = excluded.reporter_user_id,
    reported_user_id = excluded.reported_user_id,
    content_id = excluded.content_id,
    content_type = excluded.content_type,
    category = excluded.category,
    status = excluded.status,
    review_due_at = excluded.review_due_at,
    record_json = excluded.record_json,
    updated_at = excluded.updated_at`).bind(
    meta.id,
    meta.type,
    meta.actorUserId,
    meta.reporterUserId,
    meta.reportedUserId,
    meta.contentId,
    meta.contentType,
    meta.category,
    meta.status,
    meta.reviewDueAt,
    meta.recordJson,
    meta.createdAt,
    meta.updatedAt,
  ).run();
  return JSON.parse(meta.recordJson);
}

async function updateRecord(env, type, id, updater) {
  const current = await getRecord(env, type, id);
  if (!current) return null;
  return putRecord(env, type, updater(current));
}

async function getRecord(env, type, id) {
  const db = env.DB;
  if (!db) return (globalThis.__shootrSafetyMemory?.[type] || []).find((item) => item.id === id) || null;
  await ensureSchema(db);
  const result = await db.prepare("SELECT record_json FROM safety_records WHERE type = ? AND id = ?").bind(type, id).first();
  return result?.record_json ? JSON.parse(result.record_json) : null;
}

async function listRecords(env, request, admin) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "local-review-user";
  const db = env.DB;
  const state = {};
  for (const type of allowedTypes) state[type] = [];

  if (!db) {
    const memory = globalThis.__shootrSafetyMemory || {};
    for (const type of allowedTypes) state[type] = [...(memory[type] || [])];
    return filterStateForAccess(state, userId, admin);
  }

  await ensureSchema(db);
  const query = admin
    ? db.prepare("SELECT type, record_json FROM safety_records ORDER BY created_at DESC LIMIT 500")
    : db.prepare(`SELECT type, record_json FROM safety_records
        WHERE type IN ('blocks', 'removedContent', 'suspensions', 'termsAcceptances')
        AND (actor_user_id = ? OR reported_user_id = ? OR type IN ('removedContent', 'suspensions'))
        ORDER BY created_at DESC LIMIT 500`).bind(userId, userId);
  const result = await query.all();
  for (const row of result.results || []) {
    if (allowedTypes.has(row.type)) state[row.type].push(JSON.parse(row.record_json));
  }
  return filterStateForAccess(state, userId, admin);
}

function filterStateForAccess(state, userId, admin) {
  if (admin) return state;
  const filtered = {};
  for (const type of allowedTypes) filtered[type] = [];
  for (const type of publicStateTypes) {
    const records = state[type] || [];
    filtered[type] = globalStateTypes.has(type)
      ? records
      : records.filter((record) => [record.userId, record.blockerUserId, record.actorUserId].includes(userId));
  }
  return filtered;
}

async function createModerationAction(env, actionRecord) {
  const saved = await putRecord(env, "moderationActions", actionRecord);
  const now = saved.createdAt || new Date().toISOString();
  if (saved.reportId) {
    await updateRecord(env, "reports", saved.reportId, (report) => ({
      ...report,
      status: saved.action === "dismiss_report" ? "dismissed" : "actioned",
      actionTaken: saved.action,
      reviewedAt: now,
    }));
    const incidentId = `incident-${saved.reportId.replace(/^report-/, "")}`;
    await updateRecord(env, "incidents", incidentId, (incident) => ({
      ...incident,
      status: saved.action === "dismiss_report" ? "dismissed" : "actioned",
      actionTaken: saved.action,
      reviewedAt: now,
    }));
  }
  if (saved.action === "remove_content" && saved.contentId) {
    await putRecord(env, "removedContent", {
      id: `removed-${saved.contentId}`,
      contentId: saved.contentId,
      status: "removed",
      reportId: saved.reportId,
      removedAt: now,
      reason: "Admin moderation action",
    });
  }
  if (saved.action === "suspend_user" && saved.userId) {
    await putRecord(env, "suspensions", {
      id: `suspension-${saved.userId}`,
      userId: saved.userId,
      status: "active",
      reportId: saved.reportId,
      suspendedAt: now,
      reason: "Admin moderation action",
    });
  }
  if (saved.action === "restore_content" && saved.contentId) {
    await putRecord(env, "removedContent", {
      id: `removed-${saved.contentId}`,
      contentId: saved.contentId,
      status: "restored",
      reportId: saved.reportId,
      restoredAt: now,
      reason: "Admin moderation action",
    });
  }
  return saved;
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  if (url.pathname === "/api/health") return json({ ok: true, db: Boolean(env.DB) });
  if (url.pathname === "/api/safety/state" && request.method === "GET") {
    return json(await listRecords(env, request, isAdmin(request, env)));
  }
  if (url.pathname === "/api/safety/records" && request.method === "POST") {
    const body = await request.json();
    const type = String(body.type || "");
    if (!allowedTypes.has(type)) return json({ error: "Unsupported record type." }, { status: 400 });
    if (["moderationActions", "removedContent", "suspensions"].includes(type) && !isAdmin(request, env)) return forbidden();
    return json({ record: await putRecord(env, type, body.record || {}) }, { status: 201 });
  }
  if (url.pathname === "/api/safety/moderation-actions" && request.method === "POST") {
    if (!isAdmin(request, env)) return forbidden();
    const body = await request.json();
    return json({ record: await createModerationAction(env, body.record || {}) }, { status: 201 });
  }
  return json({ error: "Not found." }, { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  },
};
