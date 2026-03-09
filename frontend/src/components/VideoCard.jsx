import React from "react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../lib/api";

const VideoCard = ({ video }) => {
  return (
    <article className="video-card">
      <Link to={`/watch/${video.id}`} className="thumb-link">
        <img
          src={resolveMediaUrl(video.thumbnailUrl) || "https://picsum.photos/640/360?blur=2"}
          alt={video.title}
          className="thumb-image"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <span className="thumb-duration">{video.durationLabel || "0:00"}</span>
      </Link>

      <div className="video-meta">
        <div className="channel-avatar">{(video.channelTitle || "M").slice(0, 1).toUpperCase()}</div>
        <div className="video-text">
          <Link to={`/watch/${video.id}`} className="video-title">
            {video.title}
          </Link>
          <p className="video-channel">{video.channelTitle}</p>
          <p className="video-stats">
            {video.viewsLabel} · {video.timeAgoLabel}
          </p>
        </div>
      </div>
    </article>
  );
};

export default VideoCard;
