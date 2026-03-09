import React from "react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../lib/api";

const RecommendedVideo = ({ video }) => {
  return (
    <Link className="recommended-card" to={`/watch/${video.id}`}>
      <img
        className="recommended-thumb"
        src={resolveMediaUrl(video.thumbnailUrl) || "https://picsum.photos/320/180?blur=2"}
        alt={video.title}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="recommended-info">
        <h3>{video.title}</h3>
        <p>{video.channelTitle}</p>
        <p>
          {video.viewsLabel} · {video.timeAgoLabel}
        </p>
      </div>
    </Link>
  );
};

export default RecommendedVideo;
