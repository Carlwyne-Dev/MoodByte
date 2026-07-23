import React from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getImageBlob } from '../../hooks/useImageStorage';

const THEMES = [
  { id: 'night', label: 'Night' },
  { id: 'rainy', label: 'Rainy' },
  { id: 'chill', label: 'Chill' },
  { id: 'productive', label: 'Focus' },
];

export default function SettingsModal({ onClose }) {
  const { theme, customBgs, uploadCustomBgForTheme, removeCustomBg } = useTheme();
  const [previewUrls, setPreviewUrls] = React.useState({});
  const [activeThemeId, setActiveThemeId] = React.useState(theme || THEMES[0].id);
  const [activeBgIndex, setActiveBgIndex] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const newUrls = {};

    const loadPreviews = async () => {
      for (const t of THEMES) {
        const list = customBgs[t.id] || [];
        for (const bgId of list) {
          const blob = await getImageBlob(bgId);
          if (blob && active) {
            newUrls[bgId] = URL.createObjectURL(blob);
          }
        }
      }
      if (active) setPreviewUrls(newUrls);
    };

    loadPreviews();

    return () => {
      active = false;
      Object.values(newUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [customBgs]);

  const handleUploadBg = async (e, themeId) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadCustomBgForTheme(themeId, file);
      e.target.value = null; // reset input
    }
  };

  const activeBgs = customBgs[activeThemeId] || [];
  const currentPreviewId = activeBgs[activeBgIndex];
  const currentPreviewUrl = currentPreviewId ? previewUrls[currentPreviewId] : null;
  const activeThemeObj = THEMES.find(t => t.id === activeThemeId) || THEMES[0];

  return createPortal(
    <div className="settings-overlay fade-in" onClick={onClose}>
      <div className="settings-modal pop-in" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div className="header-title">
            <ImageIcon size={24} className="header-icon" />
            <h2>Custom Themes</h2>
          </div>
          <button className="settings-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="settings-layout">
          {/* Sidebar */}
          <div className="settings-sidebar">
            <h3 className="sidebar-title">Themes</h3>
            <div className="theme-tabs">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`theme-tab-btn ${activeThemeId === t.id ? 'active' : ''}`}
                  onClick={() => { setActiveThemeId(t.id); setActiveBgIndex(0); }}
                >
                  <div className="tab-indicator" />
                  <span>{t.label}</span>
                  <span className="tab-count">{(customBgs[t.id] || []).length}/3</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="settings-main">
            <div className="main-header">
              <h3>{activeThemeObj.label} Wallpapers</h3>
              <p>Upload up to 3 custom backgrounds for this theme.</p>
            </div>

            {/* Large Preview */}
            <div className="large-preview-container">
              {currentPreviewUrl ? (
                <img src={currentPreviewUrl} alt="Preview" className="large-preview-img" />
              ) : (
                <div className="large-preview-empty">
                  <ImageIcon size={48} opacity={0.3} />
                  <span>No wallpaper selected</span>
                </div>
              )}
              {/* Faux UI Overlay for Aesthetic */}
              <div className="faux-ui-overlay">
                <div className="faux-overlay-label">UI Preview</div>
                <div className="faux-clock">12:00</div>
                <div className="faux-widget"></div>
              </div>
            </div>
            <p className="preview-caption">↑ This simulates how your wallpaper looks behind MoodByte's floating UI</p>

            {/* Thumbnails Row */}
            <div className="thumbnails-row">
              {[0, 1, 2].map(index => {
                const bgId = activeBgs[index];
                const previewUrl = bgId ? previewUrls[bgId] : null;
                const isActive = index === activeBgIndex;

                return (
                  <div 
                    key={index} 
                    className={`thumbnail-slot ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveBgIndex(index)}
                  >
                    {bgId && previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Thumbnail" className="thumb-img" />
                        <div className="thumb-overlay">
                          <button 
                            className="remove-thumb-btn" 
                            onClick={(e) => { e.stopPropagation(); removeCustomBg(activeThemeId, bgId); }}
                            title="Remove this wallpaper"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="thumb-empty" title="Upload Wallpaper" onClick={e => e.stopPropagation()}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                            setActiveBgIndex(index);
                            handleUploadBg(e, activeThemeId);
                          }} 
                        />
                        <span className="plus-icon">+</span>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .settings-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
        }
        .settings-modal {
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          width: 800px;
          max-width: 95vw;
          box-shadow: 0 30px 60px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05);
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        
        .settings-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
        }
        .header-title {
          display: flex; align-items: center; gap: 14px;
        }
        .header-title h2 {
          margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.6rem; color: #fff; font-weight: 600;
        }
        .header-icon { color: #8b5cf6; }
        .settings-close-btn {
          background: rgba(255,255,255,0.05); border: none; color: #94a3b8; cursor: pointer;
          border-radius: 12px; padding: 8px; transition: all 0.2s;
        }
        .settings-close-btn:hover {
          color: #ef4444; background: rgba(239, 68, 68, 0.15); transform: rotate(90deg);
        }

        .settings-layout {
          display: flex; height: 500px;
        }

        /* Sidebar */
        .settings-sidebar {
          width: 220px;
          background: rgba(0,0,0,0.2);
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column;
        }
        .sidebar-title {
          font-family: 'Outfit', sans-serif; font-size: 0.85rem; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 24px 24px 12px; margin: 0;
        }
        .theme-tabs {
          display: flex; flex-direction: column; padding: 0 12px; gap: 4px;
        }
        .theme-tab-btn {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          background: transparent; border: none; border-radius: 12px;
          color: #94a3b8; font-size: 1rem; font-weight: 500; font-family: 'Outfit', sans-serif;
          cursor: pointer; transition: all 0.2s;
          position: relative; overflow: hidden;
        }
        .theme-tab-btn:hover {
          background: rgba(255,255,255,0.03); color: #e2e8f0;
        }
        .theme-tab-btn.active {
          background: rgba(139, 92, 246, 0.15); color: #fff;
        }
        .tab-indicator {
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: #8b5cf6;
          opacity: 0; transition: opacity 0.2s;
        }
        .theme-tab-btn.active .tab-indicator { opacity: 1; }
        
        .tab-count {
          background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 8px;
          font-size: 0.75rem; color: #64748b;
        }
        .theme-tab-btn.active .tab-count {
          background: rgba(139, 92, 246, 0.3); color: #c4b5fd;
        }

        /* Main Content */
        .settings-main {
          flex: 1;
          padding: 32px;
          display: flex; flex-direction: column; gap: 24px;
          background: rgba(255,255,255,0.01);
          overflow-y: auto;
        }
        .main-header h3 {
          margin: 0 0 6px 0; font-family: 'Outfit', sans-serif; font-size: 1.4rem; color: #f8fafc;
        }
        .main-header p {
          margin: 0; color: #94a3b8; font-size: 0.95rem;
        }

        /* Large Preview */
        .large-preview-container {
          width: 100%; aspect-ratio: 16/9;
          background: #020617;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          position: relative; overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .large-preview-img {
          width: 100%; height: 100%; object-fit: cover;
          animation: fadeIn 0.4s ease;
        }
        .large-preview-empty {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
          color: #475569;
        }
        .faux-ui-overlay {
          position: absolute; inset: 0; pointer-events: none;
          padding: 24px; display: flex; flex-direction: column; justify-content: space-between;
        }
        .faux-overlay-label {
          position: absolute; top: 12px; right: 16px;
          background: rgba(0,0,0,0.4); color: rgba(255,255,255,0.7);
          padding: 4px 8px; border-radius: 6px; font-size: 0.75rem;
          font-family: 'Outfit', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;
          backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.1);
        }
        .faux-clock {
          font-size: 3rem; font-weight: 700; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.5);
          font-family: 'Outfit', sans-serif; align-self: flex-start; margin-top: 10px;
        }
        .faux-widget {
          width: 200px; height: 80px;
          background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2); border-radius: 12px;
          align-self: flex-end;
        }
        .preview-caption {
          margin: 0; color: #64748b; font-size: 0.82rem;
          font-family: 'Outfit', sans-serif; text-align: center;
          font-style: italic;
        }

        /* Thumbnails */
        .thumbnails-row {
          display: flex; gap: 16px;
        }
        .thumbnail-slot {
          flex: 1; aspect-ratio: 16/9;
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          border: 2px dashed rgba(255,255,255,0.1);
          position: relative; overflow: hidden;
          cursor: pointer; transition: all 0.2s;
        }
        .thumbnail-slot:hover {
          border-color: rgba(139, 92, 246, 0.4);
        }
        .thumbnail-slot.active {
          border: 2px solid #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
          transform: translateY(-2px);
        }
        
        .thumb-img {
          width: 100%; height: 100%; object-fit: cover;
        }
        
        .thumb-empty {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .thumb-empty:hover {
          background: rgba(139, 92, 246, 0.1);
        }
        .plus-icon {
          color: #64748b; font-size: 2rem; font-weight: 300; transition: color 0.2s;
        }
        .thumb-empty:hover .plus-icon { color: #8b5cf6; }
        
        .thumb-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
        }
        .thumbnail-slot:hover .thumb-overlay {
          opacity: 1;
        }
        
        .remove-thumb-btn {
          background: rgba(239, 68, 68, 0.8); backdrop-filter: blur(4px);
          color: #fff; border: none;
          padding: 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .remove-thumb-btn:hover {
          background: #ef4444; transform: scale(1.1);
        }

        .fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .pop-in { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @media (max-width: 768px) {
          .settings-overlay { align-items: flex-end; }
          .settings-modal {
            width: 100% !important; max-width: 100% !important;
            border-radius: 24px 24px 0 0;
            max-height: 90dvh;
          }
          .settings-layout { flex-direction: column; height: auto; }
          .settings-sidebar {
            width: 100%; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05);
            padding-bottom: 12px;
          }
          .theme-tabs {
            flex-direction: row; overflow-x: auto; padding: 0 16px; scrollbar-width: none;
          }
          .theme-tab-btn { flex-shrink: 0; padding: 10px 16px; }
          .tab-indicator {
            left: 16px; right: 16px; top: auto; bottom: 0; height: 3px; width: auto;
            border-radius: 3px 3px 0 0;
          }
          .settings-main { padding: 20px; }
          .faux-clock { font-size: 2rem; }
        }
      `}</style>
    </div>,
    document.body
  );
}
