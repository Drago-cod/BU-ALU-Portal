const fallbackStats = {
  alumniMembers: 389000,
  jobsThisYear: 2500,
  activeChapters: 72,
  mentorshipConnections: 18000
};

function getSeedStats() {
  return window.BU_STATS_DB || fallbackStats;
}

function normalizeStats(payload) {
  return {
    alumniMembers: Number(payload?.alumniMembers ?? fallbackStats.alumniMembers),
    jobsThisYear: Number(payload?.jobsThisYear ?? fallbackStats.jobsThisYear),
    activeChapters: Number(payload?.activeChapters ?? fallbackStats.activeChapters),
    mentorshipConnections: Number(payload?.mentorshipConnections ?? fallbackStats.mentorshipConnections)
  };
}

function applyStats(stats) {
  const normalized = normalizeStats(stats);
  Object.entries(normalized).forEach(([key, value]) => {
    const el = document.querySelector(`.stat-bar-num[data-stat="${key}"]`);
    if (!el) return;
    el.dataset.target = String(value);
    el.textContent = Math.floor(value).toLocaleString();
  });
}

async function fetchStatsFromApi() {
  const response = await fetch(`/api/stats?t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`stats fetch failed: ${response.status}`);
  return response.json();
}

async function refreshHomeStats() {
  if (!document.querySelector('.stat-bar-num[data-stat]')) return;

  applyStats(getSeedStats());

  // file:// preview cannot call /api. Use the local data file in that mode.
  if (window.location.protocol === 'file:') return;

  try {
    const liveStats = await fetchStatsFromApi();
    applyStats(liveStats);
    if (typeof window.BUAnimateCounters === 'function') {
      window.BUAnimateCounters();
    }
  } catch (_) {
    // Quiet fallback to seeded stats when API is unavailable.
  }
}

refreshHomeStats();
setInterval(refreshHomeStats, 60000);
