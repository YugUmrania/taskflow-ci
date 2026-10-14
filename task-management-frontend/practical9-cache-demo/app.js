const BASE_URL = "http://localhost:3000";

const els = {
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  baseUrl: document.getElementById("baseUrl"),
  btnPing: document.getElementById("btnPing"),

  btnClearCache: document.getElementById("btnClearCache"),
  btnCacheStats: document.getElementById("btnCacheStats"),
  btnUncached3: document.getElementById("btnUncached3"),
  btnCached3: document.getElementById("btnCached3"),
  btnGetOnce: document.getElementById("btnGetOnce"),
  btnClearResults: document.getElementById("btnClearResults"),

  uncachedAvg: document.getElementById("uncachedAvg"),
  uncachedMinMax: document.getElementById("uncachedMinMax"),
  cachedAvg: document.getElementById("cachedAvg"),
  cachedMinMax: document.getElementById("cachedMinMax"),
  speedup: document.getElementById("speedup"),
  speedupNote: document.getElementById("speedupNote"),
  lastTime: document.getElementById("lastTime"),
  lastStatus: document.getElementById("lastStatus"),

  uCount: document.getElementById("uCount"),
  cCount: document.getElementById("cCount"),
  tbody: document.getElementById("tbody"),
  emptyTable: document.getElementById("emptyTable"),

  formCreate: document.getElementById("formCreate"),
  title: document.getElementById("title"),
  description: document.getElementById("description"),
  btnTestInvalidation: document.getElementById("btnTestInvalidation"),

  taskId: document.getElementById("taskId"),
  utitle: document.getElementById("utitle"),
  udesc: document.getElementById("udesc"),
  btnUpdate: document.getElementById("btnUpdate"),
  btnDelete: document.getElementById("btnDelete"),
  btnFetchTasks: document.getElementById("btnFetchTasks"),
  taskPreview: document.getElementById("taskPreview"),

  log: document.getElementById("log"),
  btnClearLogs: document.getElementById("btnClearLogs"),

  jsonPreview: document.getElementById("jsonPreview"),
  btnCopyJson: document.getElementById("btnCopyJson"),
};

let uncached = [];
let cached = [];
let readingId = 0;

function now() {
  return new Date().toLocaleTimeString();
}

function fmtMs(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toFixed(2);
}

function fmtSec(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return (n / 1000).toFixed(4);
}

function avg(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function minMax(arr) {
  if (arr.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...arr),
    max: Math.max(...arr),
  };
}

function updateStats() {
  const uAvg = avg(uncached);
  const uMM = minMax(uncached);
  els.uncachedAvg.textContent = uncached.length ? `${uAvg.toFixed(2)} ms` : "—";
  els.uncachedMinMax.textContent = uncached.length
    ? `Min: ${uMM.min.toFixed(2)} ms | Max: ${uMM.max.toFixed(2)} ms`
    : "Min: — | Max: —";
  els.uCount.textContent = uncached.length.toString();

  const cAvg = avg(cached);
  const cMM = minMax(cached);
  els.cachedAvg.textContent = cached.length ? `${cAvg.toFixed(2)} ms` : "—";
  els.cachedMinMax.textContent = cached.length
    ? `Min: ${cMM.min.toFixed(2)} ms | Max: ${cMM.max.toFixed(2)} ms`
    : "Min: — | Max: —";
  els.cCount.textContent = cached.length.toString();

  if (uncached.length > 0 && cached.length > 0) {
    const s = uAvg / (cAvg === 0 ? 0.0001 : cAvg);
    els.speedup.textContent = s.toFixed(2) + "x";
    els.speedupNote.textContent = `~${s.toFixed(0)}x faster (cached vs uncached avg)`;
  } else if (uncached.length > 0) {
    els.speedup.textContent = "—";
    els.speedupNote.textContent = "Run 3 Cached Readings to compare";
  } else if (cached.length > 0) {
    els.speedup.textContent = "—";
    els.speedupNote.textContent = "Run 3 Uncached Readings to compare";
  } else {
    els.speedup.textContent = "—";
    els.speedupNote.textContent = "Cached vs Uncached";
  }

  els.emptyTable.style.display = readingId === 0 ? "block" : "none";
}

function logLine(msg) {
  const placeholder = els.log.querySelector(".log-empty");
  if (placeholder) placeholder.remove();

  const div = document.createElement("div");
  div.className = "log-line";
  div.innerHTML = `<span class="log-time">${now()}</span>${msg}`;
  els.log.appendChild(div);
  els.log.scrollTop = els.log.scrollHeight;
}

function setStatus(connected, text) {
  els.statusDot.classList.toggle("connected", connected);
  els.statusText.textContent = text || (connected ? "Connected" : "Not Reachable");
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.classList.toggle("loading", loading);
}

async function ping() {
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/tasks`, { cache: "no-store" });
    const t1 = performance.now();
    setStatus(true, `OK (${res.status}) - ${fmtMs(t1 - t0)}ms`);
    return true;
  } catch (e) {
    setStatus(false, "Error connecting to backend");
    logLine(`<span style="color:var(--danger)">PING failed: ${e.message}</span>`);
    return false;
  }
}

async function getTasks({ silent = false } = {}) {
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE_URL}/tasks`);
    const data = await res.json();
    const t1 = performance.now();
    const ms = t1 - t0;

    els.jsonPreview.textContent = JSON.stringify(data, null, 2);

    if (!silent) {
      logLine(`GET /tasks -> ${res.status} | <strong class="mono">${fmtMs(ms)}ms</strong>`);
    }
    return { ok: true, status: res.status, ms, data };
  } catch (e) {
    if (!silent) {
      logLine(`<span style="color:var(--danger)">GET /tasks failed: ${e.message}</span>`);
    }
    return { ok: false, error: e.message, ms: 0 };
  }
}

async function clearCache() {
  try {
    const res = await fetch(`${BASE_URL}/tasks/cache`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    logLine(`DELETE /tasks/cache -> ${res.status} | ${data.message || ""}`);
    return true;
  } catch (e) {
    logLine(`<span style="color:var(--danger)">Clear cache failed: ${e.message}</span>`);
    return false;
  }
}

async function cacheStats() {
  try {
    const res = await fetch(`${BASE_URL}/tasks/cache/stats`);
    const data = await res.json();
    logLine(`GET /tasks/cache/stats -> ${res.status}`);
    logLine(`<pre style="margin-top:.4rem">${JSON.stringify(data, null, 2)}</pre>`);
    return data;
  } catch (e) {
    logLine(`<span style="color:var(--danger)">Cache stats failed: ${e.message}</span>`);
    return null;
  }
}

function recordReading(type, ms, status) {
  readingId++;
  const isUncached = type === "UNCACHED";
  const badge = isUncached ? "badge-miss" : "badge-hit";
  const cacheLabel = isUncached ? "MISS (Cold)" : "HIT (Warm)";

  if (isUncached) uncached.push(ms);
  else cached.push(ms);

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="mono">${readingId}</td>
    <td><strong>${type}</strong></td>
    <td><span class="badge ${badge}">${cacheLabel}</span></td>
    <td class="mono">${status}</td>
    <td class="mono"><strong>${fmtMs(ms)}</strong></td>
    <td class="mono">${fmtSec(ms)}</td>
    <td class="mono">${now()}</td>
  `;
  els.tbody.prepend(tr);

  els.lastTime.textContent = `${fmtMs(ms)} ms`;
  els.lastStatus.innerHTML = `<span class="badge ${badge}">${cacheLabel}</span>`;

  updateStats();
}

async function runUncached3() {
  const btn = els.btnUncached3;
  setLoading(btn, true);
  logLine(`<strong style="color:var(--warning)">Running 3 UNCACHED readings...</strong> (Clear Cache then GET x3)`);

  for (let i = 1; i <= 3; i++) {
    await clearCache();
    const r = await getTasks({ silent: true });
    if (r.ok) {
      recordReading("UNCACHED", r.ms, r.status);
      logLine(`  #${i} Uncached -> <strong class="mono">${fmtMs(r.ms)}ms</strong> (MISS)`);
    } else {
      logLine(`  #${i} Uncached -> <span style="color:var(--danger)">FAILED</span>`);
    }
    await new Promise((x) => setTimeout(x, 250));
  }

  logLine(`<strong>Uncached readings complete.</strong>`);
  setLoading(btn, false);
}

async function runCached3() {
  const btn = els.btnCached3;
  setLoading(btn, true);
  logLine(`<strong style="color:var(--success)">Running 3 CACHED readings...</strong> (Warm cache then GET x3)`);

  const warm = await getTasks({ silent: true });
  if (warm.ok) {
    logLine(`  Warm-up GET -> <strong class="mono">${fmtMs(warm.ms)}ms</strong> (populates cache)`);
  }

  await new Promise((x) => setTimeout(x, 150));

  for (let i = 1; i <= 3; i++) {
    const r = await getTasks({ silent: true });
    if (r.ok) {
      recordReading("CACHED", r.ms, r.status);
      logLine(`  #${i} Cached (HIT) -> <strong class="mono">${fmtMs(r.ms)}ms</strong>`);
    } else {
      logLine(`  #${i} Cached -> <span style="color:var(--danger)">FAILED</span>`);
    }
    await new Promise((x) => setTimeout(x, 150));
  }

  logLine(`<strong>Cached readings complete.</strong>`);
  setLoading(btn, false);
}

async function getOnce() {
  const btn = els.btnGetOnce;
  setLoading(btn, true);
  const r = await getTasks();
  if (r.ok) {
    els.lastTime.textContent = `${fmtMs(r.ms)} ms`;
    els.lastStatus.innerHTML = `<span class="badge badge-neutral">Single GET &middot; HTTP ${r.status}</span>`;
  }
  setLoading(btn, false);
}

async function createTask(e) {
  e.preventDefault();
  const title = els.title.value.trim();
  const description = els.description.value.trim();
  if (!title) return;

  const payload = { title };
  if (description) payload.description = description;

  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const t1 = performance.now();
    logLine(`POST /tasks -> ${res.status} | <strong class="mono">${fmtMs(t1 - t0)}ms</strong> (cache invalidated)`);
    els.taskPreview.textContent = JSON.stringify(data, null, 2);
    if (data && data._id) els.taskId.value = data._id;
    els.title.value = "";
    els.description.value = "";
    await getTasks({ silent: true });
  } catch (err) {
    logLine(`<span style="color:var(--danger)">POST /tasks failed: ${err.message}</span>`);
  }
}

async function testInvalidation() {
  const btn = els.btnTestInvalidation;
  setLoading(btn, true);
  logLine(`<strong>Testing Cache Invalidation...</strong> (Warm then POST then GET)`);

  const w = await getTasks({ silent: true });
  if (w.ok) logLine(`1. Warm cache (GET) -> <strong class="mono">${fmtMs(w.ms)}ms</strong>`);

  await new Promise((r) => setTimeout(r, 200));

  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Invalidation Test ${Date.now()}`, description: "temp" }),
    });
    const d = await res.json();
    const t1 = performance.now();
    logLine(`2. POST /tasks -> ${res.status} | <strong class="mono">${fmtMs(t1 - t0)}ms</strong> <span style="color:var(--warning)">[CACHE INVALIDATED]</span>`);
    if (d && d._id) els.taskId.value = d._id;

    await new Promise((r) => setTimeout(r, 200));

    const g = await getTasks({ silent: true });
    logLine(`3. GET /tasks after invalidation -> <strong class="mono">${fmtMs(g.ms)}ms</strong> | should be <span class="badge miss">MISS</span> (fresh DB read)`);
    els.lastTime.textContent = `${fmtMs(g.ms)} ms`;
    els.lastStatus.innerHTML = `<span class="badge badge-miss">MISS (after invalidation)</span>`;
  } catch (err) {
    logLine(`<span style="color:var(--danger)">Invalidation test failed: ${err.message}</span>`);
  }

  setLoading(btn, false);
}

async function updateTask() {
  const id = els.taskId.value.trim();
  if (!id) {
    logLine(`<span style="color:var(--danger)">Enter Task ID to update</span>`);
    return;
  }
  const body = {};
  if (els.utitle.value.trim()) body.title = els.utitle.value.trim();
  if (els.udesc.value.trim()) body.description = els.udesc.value.trim();
  if (Object.keys(body).length === 0) {
    logLine(`<span style="color:var(--danger)">Enter at least Title or Description to update</span>`);
    return;
  }

  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const t1 = performance.now();
    logLine(`PUT /tasks/${id} -> ${res.status} | <strong class="mono">${fmtMs(t1 - t0)}ms</strong> (cache invalidated)`);
    els.taskPreview.textContent = JSON.stringify(data, null, 2);
    await getTasks({ silent: true });
  } catch (err) {
    logLine(`<span style="color:var(--danger)">PUT failed: ${err.message}</span>`);
  }
}

async function deleteTask() {
  const id = els.taskId.value.trim();
  if (!id) {
    logLine(`<span style="color:var(--danger)">Enter Task ID to delete</span>`);
    return;
  }
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/tasks/${id}`, { method: "DELETE" });
    const data = await res.json();
    const t1 = performance.now();
    logLine(`DELETE /tasks/${id} -> ${res.status} | <strong class="mono">${fmtMs(t1 - t0)}ms</strong> (cache invalidated)`);
    els.taskPreview.textContent = JSON.stringify(data, null, 2);
    els.taskId.value = "";
    await getTasks({ silent: true });
  } catch (err) {
    logLine(`<span style="color:var(--danger)">DELETE failed: ${err.message}</span>`);
  }
}

async function fetchTasksShow() {
  const r = await getTasks();
  if (r.ok && Array.isArray(r.data)) {
    const preview = r.data.map((t) => ({
      _id: t._id,
      title: t.title,
      completed: t.completed,
    }));
    els.taskPreview.textContent = JSON.stringify(preview, null, 2);
    logLine(`Fetched ${r.data.length} tasks. IDs shown below.`);
  }
}

function clearResults() {
  uncached = [];
  cached = [];
  readingId = 0;
  els.tbody.innerHTML = "";
  updateStats();
  els.lastTime.textContent = "—";
  els.lastStatus.innerHTML = "—";
  els.jsonPreview.textContent = "[]";
  logLine("Results and table cleared.");
}

function clearLogs() {
  els.log.innerHTML = '<div class="log-empty">Log cleared.</div>';
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(els.jsonPreview.textContent);
    logLine("JSON copied to clipboard.");
  } catch (err) {
    logLine(`<span style="color:var(--danger)">Copy failed: ${err.message}</span>`);
  }
}

els.btnPing.addEventListener("click", ping);
els.btnClearCache.addEventListener("click", clearCache);
els.btnCacheStats.addEventListener("click", cacheStats);
els.btnUncached3.addEventListener("click", runUncached3);
els.btnCached3.addEventListener("click", runCached3);
els.btnGetOnce.addEventListener("click", getOnce);
els.btnClearResults.addEventListener("click", clearResults);

els.formCreate.addEventListener("submit", createTask);
els.btnTestInvalidation.addEventListener("click", testInvalidation);
els.btnUpdate.addEventListener("click", updateTask);
els.btnDelete.addEventListener("click", deleteTask);
els.btnFetchTasks.addEventListener("click", fetchTasksShow);

els.btnClearLogs.addEventListener("click", clearLogs);
els.btnCopyJson.addEventListener("click", copyJson);

els.baseUrl.textContent = BASE_URL;
updateStats();
ping();
setInterval(ping, 10000);