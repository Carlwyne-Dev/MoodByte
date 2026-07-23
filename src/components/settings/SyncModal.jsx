import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Cloud, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function SyncModal({ onClose }) {
  const [user, setUser] = useState(null);

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

  return createPortal(
    <div className="settings-overlay fade-in" onClick={onClose}>
      <div className="settings-modal pop-in" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div className="header-title">
            <Cloud size={24} className="header-icon" />
            <h2>Cloud Sync (Beta)</h2>
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
        </div>
      </div>

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
      `}</style>
    </div>,
    document.body
  );
}
