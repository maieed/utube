import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RecommendedVideo from "../components/RecommendedVideo";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import VideoPlayer from "../components/VideoPlayer";
import { request } from "../lib/api";

const WatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    request(`/api/videos/${encodeURIComponent(id)}`)
      .then((data) => {
        if (cancelled) return;
        setPayload(data);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Could not load the video");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const onSearch = (event) => {
    event.preventDefault();
    navigate(query ? `/?q=${encodeURIComponent(query)}` : "/");
  };

  const video = payload?.video;
  const recommended = payload?.recommended || [];

  return (
    <div className="page-root">
      <TopBar query={query} onQueryChange={setQuery} onSearchSubmit={onSearch} />

      <div className="layout">
        <Sidebar />
        <main className="watch-main">
          {loading && <div className="banner">Loading video...</div>}
          {error && <div className="banner banner-error">{error}</div>}

          {!loading && !error && video && (
            <div className="watch-layout">
              <section className="watch-primary">
                <VideoPlayer title={video.title} streamUrl={video.streamUrl} thumbnailUrl={video.thumbnailUrl} />
                <h1 className="watch-title">{video.title}</h1>

                <div className="watch-actions">
                  <div className="watch-channel">
                    <div className="channel-avatar">{(video.channelTitle || "M").slice(0, 1).toUpperCase()}</div>
                    <div>
                      <p className="channel-name">{video.channelTitle}</p>
                      <p className="channel-stats">
                        {video.viewsLabel} · {video.timeAgoLabel}
                      </p>
                    </div>
                  </div>
                  <div className="watch-buttons">
                    <button type="button">Like</button>
                    <button type="button">Share</button>
                    <button type="button">Save</button>
                  </div>
                </div>

                <article className="desc-card">
                  <p className="desc-meta">
                    {video.viewsLabel} · {video.timeAgoLabel}
                  </p>
                  <p>{video.description || "Uploaded via Telegram group for MmsHub."}</p>
                  {video.tags?.length > 0 && (
                    <p className="tags-row">
                      {video.tags.map((tag) => `#${tag}`).join(" ")}
                    </p>
                  )}
                </article>
              </section>

              <aside className="watch-side">
                {recommended.map((item) => (
                  <RecommendedVideo key={item.id} video={item} />
                ))}
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default WatchPage;
