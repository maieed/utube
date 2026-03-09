import React from "react";
import { Link } from "react-router-dom";

const IconButton = ({ children, label }) => (
  <button className="icon-btn" type="button" aria-label={label}>
    {children}
  </button>
);

const TopBar = ({ query, onQueryChange, onSearchSubmit }) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn" type="button" aria-label="Menu">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z" />
          </svg>
        </button>
        <Link to="/" className="brand">
          <span className="brand-pill">▶</span>
          <span className="brand-text">MmsHub</span>
        </Link>
      </div>

      <form className="search-shell" onSubmit={onSearchSubmit}>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search"
          aria-label="Search videos"
          className="search-input"
        />
        <button type="submit" className="search-btn" aria-label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m21 20.3-5.7-5.7a7 7 0 1 0-.8.8l5.7 5.7 0-.8.8-.8ZM5 10a5 5 0 1 1 10 0A5 5 0 0 1 5 10Z" />
          </svg>
        </button>
      </form>

      <div className="topbar-right">
        <IconButton label="Create">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 12a1 1 0 0 1-1 1h-6v6a1 1 0 0 1-2 0v-6H5a1 1 0 0 1 0-2h6V5a1 1 0 1 1 2 0v6h6a1 1 0 0 1 1 1Z" />
          </svg>
        </IconButton>
        <IconButton label="Notifications">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3a5 5 0 0 1 5 5v3.5c0 .7.2 1.4.6 2L19 15v1H5v-1l1.4-1.5c.4-.6.6-1.3.6-2V8a5 5 0 0 1 5-5Zm0 18a3 3 0 0 0 2.8-2H9.2a3 3 0 0 0 2.8 2Z" />
          </svg>
        </IconButton>
        <div className="avatar">M</div>
      </div>
    </header>
  );
};

export default TopBar;
