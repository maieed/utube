const formatNumberShort = (value) => {
  const num = Number(value) || 0;
  if (num < 1000) return String(num);
  if (num < 1_000_000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  if (num < 1_000_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
};

const formatDuration = (seconds) => {
  const value = Number(seconds) || 0;
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = Math.floor(value % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
};

const formatTimeAgo = (isoDate) => {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < hour) return `${Math.max(1, Math.round(diffMs / minute))} minutes ago`;
  if (diffMs < day) return `${Math.round(diffMs / hour)} hours ago`;
  if (diffMs < month) return `${Math.round(diffMs / day)} days ago`;
  if (diffMs < year) return `${Math.round(diffMs / month)} months ago`;
  return `${Math.round(diffMs / year)} years ago`;
};

module.exports = {
  formatNumberShort,
  formatDuration,
  formatTimeAgo
};
