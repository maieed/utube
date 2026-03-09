import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryChips from "../components/CategoryChips";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import VideoCard from "../components/VideoCard";
import { request } from "../lib/api";

const SkeletonCard = () => (
  <article className="video-card is-loading">
    <div className="skeleton skeleton-thumb" />
    <div className="video-meta">
      <div className="skeleton skeleton-avatar" />
      <div className="video-text">
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
    </div>
  </article>
);

const HomePage = () => {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeChip, setActiveChip] = useState("All");
  const [videos, setVideos] = useState([]);
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const effectiveSearch = useMemo(() => {
    if (activeChip === "All") return query.trim();
    return `${query} ${activeChip}`.trim();
  }, [query, activeChip]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      request(`/api/videos?search=${encodeURIComponent(effectiveSearch)}&limit=36`)
        .then((data) => {
          if (cancelled) return;
          setVideos(data.items || []);
          setWarning(data.warning || "");
          setError("");
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err.message || "Failed to load videos");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [effectiveSearch]);

  const submitSearch = (event) => {
    event.preventDefault();
    setParams(query ? { q: query } : {});
  };

  return (
    <div className="page-root">
      <TopBar query={query} onQueryChange={setQuery} onSearchSubmit={submitSearch} />

      <div className="layout">
        <Sidebar />
        <main className="feed">
          <CategoryChips active={activeChip} onChange={setActiveChip} />

          {warning && <p className="banner banner-warn">{warning}</p>}
          {error && <p className="banner banner-error">{error}</p>}

          <section className="video-grid">
            {loading && Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={`skeleton-${index}`} />)}
            {!loading && !videos.length && <p className="empty-state">No videos found. Upload videos in Telegram and refresh.</p>}
            {!loading && videos.map((video) => <VideoCard key={video.id} video={video} />)}
          </section>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
