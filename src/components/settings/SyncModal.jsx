import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Cloud, CheckCircle2, Settings as SettingsIcon, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function SyncModal({ onClose }) {
  const [user, setUser] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    sessionStorage.setItem('moodbyte_expecting_login', 'true');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) console.error('Error logging in:', error);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteData = async () => {
    if (user) {
      await supabase.from('user_sync_data').delete().eq('user_id', user.id);
    }
    localStorage.clear();
    window.location.reload();
  };

  return createPortal(
    <div className="settings-overlay fade-in" onClick={onClose}>
      <div className="settings-modal pop-in" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div className="header-title">
            <SettingsIcon size={24} className="header-icon" />
            <h2>Settings</h2>
          </div>
          <button className="settings-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3 className="section-title">
              <Cloud size={18} /> Cross-Platform Sync
            </h3>
            <p className="section-desc">
              Your data is currently saved only on this device. Sign in with Google to enable cross-platform sync across your phone and PC.
            </p>
            <div className="sync-card">
              <div className="sync-status">
                {user ? (
                  <CheckCircle2 size={24} className="sync-icon synced" />
                ) : (
                  <Cloud size={24} className="sync-icon un-synced" />
                )}
                <div className="sync-info">
                  {user ? (
                    <>
                      <h4>Synced to Cloud</h4>
                      <span>{user.email}</span>
                    </>
                  ) : (
                    <>
                      <h4>Local Storage Only</h4>
                      <span>Not synced to cloud</span>
                    </>
                  )}
                </div>
              </div>
              {user ? (
                <button className="google-logout-btn" onClick={handleLogout}>
                  Sign Out
                </button>
              ) : (
                <button className="google-login-btn" onClick={handleGoogleLogin}>
                  Sign in with Google
                </button>
              )}
            </div>
          </div>

          <div className="settings-section danger-zone" style={{ marginTop: '24px' }}>
            <h3 className="section-title text-red">
              <AlertTriangle size={18} /> Danger Zone
            </h3>
            <p className="section-desc">
              Permanently delete all your local and cloud data. This action cannot be reversed.
            </p>
            <button className="delete-data-btn" onClick={() => setShowConfirm(true)}>
              <Trash2 size={16} /> Delete All Data
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="settings-overlay fade-in" style={{ zIndex: 10000 }}>
          <div className="confirm-modal pop-in">
            <div className="confirm-icon-wrap">
              <AlertTriangle size={32} color="#ef4444" />
            </div>
            <h3>Delete All Data?</h3>
            <p>This will permanently erase all your tasks, stats, custom themes, and cloud backups. This action <strong>cannot</strong> be undone.</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="confirm-delete" onClick={handleDeleteData}>Yes, Delete Everything</button>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .settings-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
        }
        .settings-modal {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          width: 500px;
          max-width: 90vw;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .settings-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.2);
        }
        .header-title {
          display: flex; align-items: center; gap: 12px;
        }
        .header-title h2 {
          margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.5rem; color: #fff;
        }
        .header-icon {
          color: #94a3b8;
        }
        .settings-close-btn {
          background: none; border: none; color: #94a3b8; cursor: pointer;
          border-radius: 8px; padding: 6px; transition: all 0.2s;
        }
        .settings-close-btn:hover {
          color: #ef4444; background: rgba(239, 68, 68, 0.1);
        }

        .settings-content {
          padding: 24px;
        }
        .settings-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 20px;
        }
        .section-title {
          display: flex; align-items: center; gap: 8px;
          margin: 0 0 8px 0; color: #e2e8f0; font-size: 1.1rem;
        }
        .section-desc {
          margin: 0 0 20px 0; color: #94a3b8; font-size: 0.9rem; line-height: 1.4;
        }

        .sync-card {
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px; padding: 16px;
        }
        .sync-status {
          display: flex; align-items: center; gap: 12px;
        }
        .sync-icon.un-synced { color: #64748b; }
        .sync-icon.synced { color: #22c55e; }
        .sync-info h4 { margin: 0 0 4px 0; color: #e2e8f0; font-size: 0.95rem; }
        .sync-info span { color: #94a3b8; font-size: 0.8rem; }
        
        .google-login-btn {
          background: #fff; color: #0f172a; border: none;
          padding: 8px 16px; border-radius: 8px; font-weight: 600; font-family: 'Outfit', sans-serif;
          cursor: pointer; transition: all 0.2s;
        }
        .google-login-btn:hover { background: #e2e8f0; }
        
        .google-logout-btn {
          background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2);
          padding: 8px 16px; border-radius: 8px; font-weight: 600; font-family: 'Outfit', sans-serif;
          cursor: pointer; transition: all 0.2s;
        }
        .google-logout-btn:hover { background: rgba(239,68,68,0.2); }

        /* Danger Zone Styles */
        .danger-zone {
          border-color: rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.02);
        }
        .text-red {
          color: #ef4444;
        }
        .delete-data-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);
          padding: 10px 20px; border-radius: 8px; font-weight: 600; font-family: 'Outfit', sans-serif;
          cursor: pointer; transition: all 0.2s; width: 100%;
        }
        .delete-data-btn:hover {
          background: rgba(239,68,68,0.2);
        }

        /* Custom Confirm Modal */
        .confirm-modal {
          background: #1e293b;
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 20px;
          width: 400px;
          max-width: 90vw;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), 0 0 40px rgba(239, 68, 68, 0.1);
          padding: 32px 24px;
          text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        .confirm-icon-wrap {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 8px;
        }
        .confirm-modal h3 {
          margin: 0; color: #fff; font-size: 1.4rem; font-family: 'Outfit', sans-serif;
        }
        .confirm-modal p {
          margin: 0; color: #94a3b8; font-size: 0.95rem; line-height: 1.5;
        }
        .confirm-modal p strong {
          color: #ef4444;
        }
        .confirm-actions {
          display: flex; gap: 12px; width: 100%; margin-top: 12px;
        }
        .confirm-actions button {
          flex: 1; padding: 12px; border-radius: 10px; font-weight: 600; font-family: 'Outfit', sans-serif;
          cursor: pointer; transition: all 0.2s; border: none;
        }
        .confirm-cancel {
          background: rgba(255,255,255,0.05); color: #e2e8f0;
        }
        .confirm-cancel:hover { background: rgba(255,255,255,0.1); }
        .confirm-delete {
          background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .confirm-delete:hover {
          background: #ef4444; color: #fff;
        }

        .fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .pop-in { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
