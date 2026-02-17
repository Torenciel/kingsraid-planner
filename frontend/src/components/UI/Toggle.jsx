import React from "react";
import "./Toggle.css";

const Toggle = ({ label, checked, onChange }) => {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="toggle-input"
      />

      <span className="toggle-switch" />

      <span className="toggle-label">{label}</span>
    </label>
  );
};

export default Toggle;
