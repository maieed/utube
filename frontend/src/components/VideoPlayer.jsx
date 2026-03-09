import React, { useEffect, useMemo, useRef, useState } from "react";
import { resolveMediaUrl } from "../lib/api";

const toClock = (seconds) => {
  const value = Number(seconds) || 0;
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = Math.floor(value % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const rates = [0.75, 1, 1.25, 1.5, 2];

const VideoPlayer = ({ title, streamUrl, thumbnailUrl }) => {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);

  const src = useMemo(() => resolveMediaUrl(streamUrl), [streamUrl]);
  const poster = useMemo(() => resolveMediaUrl(thumbnailUrl), [thumbnailUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setTime(video.currentTime || 0);
    const onLoaded = () => setDuration(video.duration || 0);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onLoaded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onLoaded);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
  }, [rate]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const onSeek = (value) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Number(value);
    video.currentTime = next;
    setTime(next);
  };

  const onVolume = (value) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Number(value);
    video.volume = next;
    video.muted = next === 0;
    setVolume(next);
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(() => {});
      return;
    }
    document.exitFullscreen().catch(() => {});
  };

  return (
    <section className="player-shell" ref={wrapperRef}>
      <video
        ref={videoRef}
        className="player-video"
        src={src}
        poster={poster}
        preload="metadata"
        onClick={togglePlayback}
        controls={false}
      />

      <button className={`center-play${playing ? " is-hidden" : ""}`} onClick={togglePlayback} type="button">
        Play
      </button>

      <div className="player-controls">
        <input
          className="seekbar"
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(time, duration || 0)}
          onChange={(event) => onSeek(event.target.value)}
        />

        <div className="controls-row">
          <button className="control-btn" type="button" onClick={togglePlayback}>
            {playing ? "Pause" : "Play"}
          </button>
          <span className="time-label">
            {toClock(time)} / {toClock(duration)}
          </span>

          <label className="volume-shell">
            Vol
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(event) => onVolume(event.target.value)} />
          </label>

          <label className="rate-shell">
            Speed
            <select value={rate} onChange={(event) => setRate(Number(event.target.value))}>
              {rates.map((item) => (
                <option key={item} value={item}>
                  {item}x
                </option>
              ))}
            </select>
          </label>

          <button className="control-btn" type="button" onClick={toggleFullscreen}>
            Fullscreen
          </button>
        </div>
      </div>

      <h1 className="sr-only">{title}</h1>
    </section>
  );
};

export default VideoPlayer;
