// KfcLoader.jsx

import "./KfcLoader.css";

const KfcLoader = () => {
  return (
    <div className="kfc-loading-overlay">
      <div className="kfc-loading-content">
        <img
          src="/kfc-2.svg" alt="KFC Logo" className="logo"
        />
        <div className="kfc-spinner"></div>
        <p>Loading, please wait...</p>
      </div>
    </div>
  );
};

export default KfcLoader;
