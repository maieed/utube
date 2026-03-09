import React from "react";

const categories = ["All", "Music", "Gaming", "Live", "Coding", "Movies", "Anime", "Sports", "News", "How-to"];

const CategoryChips = ({ active, onChange }) => {
  return (
    <div className="chips-row">
      {categories.map((chip) => (
        <button
          key={chip}
          type="button"
          className={`chip${active === chip ? " is-active" : ""}`}
          onClick={() => onChange(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  );
};

export default CategoryChips;
