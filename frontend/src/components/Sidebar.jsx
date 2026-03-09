import React from "react";

const items = [
  { label: "Home", icon: "⌂", active: true },
  { label: "Shorts", icon: "▶" },
  { label: "Subscriptions", icon: "▦" },
  { label: "Library", icon: "☰" },
  { label: "History", icon: "⏱" },
  { label: "Watch later", icon: "🕒" }
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {items.map((item) => (
        <button key={item.label} type="button" className={`sidebar-item${item.active ? " is-active" : ""}`}>
          <span className="sidebar-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </aside>
  );
};

export default Sidebar;
