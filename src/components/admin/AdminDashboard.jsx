import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Eye, Smile, CheckSquare, Palette, TrendingUp, ShieldAlert, RefreshCw, LogOut, Activity, MonitorSmartphone, Clock } from 'lucide-react';

// ── CONFIG: put your admin email here ─────────────────────────────────────────
const ADMIN_EMAIL = 'magharicarlwyne@gmail.com';
// ─────────────────────────────────────────────────────────────────────────────

const THEME_LABELS = {
  night: '🌙 Night Mode',
  rainy: '🌧️ Rain Vibes',
  chill: '🌅 Sunset Chill',
  productive: '⚡ Deep Focus',
};

function StatCard({ icon: Icon, label, value, sub, color = '#8b5cf6' }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderTop: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '24px',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px',
        background: color, filter: 'blur(60px)', opacity: 0.15, borderRadius: '50%'
      }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: color }}>
        <div style={{ background: `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},0.15)`, padding: '10px', borderRadius: '12px' }}>
          <Icon size={22} />
        </div>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ 
        fontSize: typeof value === 'string' && value.length > 5 ? '1.8rem' : '2.8rem', 
        fontWeight: 700, 
        color: '#fff', 
        fontFamily: "'Outfit', sans-serif", 
        lineHeight: 1.1, 
        marginTop: '8px',
        wordBreak: 'break-word'
      }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchedRef = React.useRef(false);

  useEffect(() => {
    const handleUser = (u) => {
      if (!u) { setUnauthorized(true); setLoading(false); return; }
      if (u.email !== ADMIN_EMAIL) { setUnauthorized(true); setLoading(false); return; }
      setUser(u);
      if (!fetchedRef.current) {
        fetchedRef.current = true;
        fetchStats();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleUser(session.user);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const { data: visits, error: vErr } = await supabase
        .from('page_visits')
        .select('session_id, user_id, theme, visited_at');

      if (vErr) throw vErr;

      const { data: syncRows } = await supabase
        .from('user_sync_data')
        .select('user_id, data, updated_at');

      const now = new Date();
      const day7ago = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const day30ago = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const uniqueSessions = new Set(visits.map(v => v.session_id)).size;
      const registeredVisits = visits.filter(v => v.user_id);
      const uniqueRegistered = new Set(registeredVisits.map(v => v.user_id)).size;
      const dau7 = new Set(visits.filter(v => new Date(v.visited_at) >= day7ago).map(v => v.session_id)).size;
      const dau30 = new Set(visits.filter(v => new Date(v.visited_at) >= day30ago).map(v => v.session_id)).size;

      const themeCounts = {};
      visits.forEach(v => {
        const t = v.theme || 'unknown';
        themeCounts[t] = (themeCounts[t] || 0) + 1;
      });
      const topTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0];

      let totalTasks = 0, totalMoods = 0;
      (syncRows || []).forEach(row => {
        const d = row.data || {};
        totalTasks += (d.taskHistory?.length || 0) + (d.tasks?.filter(t => t.completed)?.length || 0);
        totalMoods += (d.moodHistory?.length || 0);
      });

      const today = new Date().toDateString();
      const todayVisits = visits.filter(v => new Date(v.visited_at).toDateString() === today).length;

      setStats({
        totalVisits: visits.length,
        uniqueVisitors: uniqueSessions,
        registeredUsers: uniqueRegistered,
        anonymousVisitors: uniqueSessions - uniqueRegistered,
        dau7,
        dau30,
        todayVisits,
        topTheme: topTheme ? `${THEME_LABELS[topTheme[0]] || topTheme[0]} (${topTheme[1]})` : '—',
        themeCounts,
        totalTasks,
        totalMoods,
        registeredUserList: syncRows || [],
      });
    } catch (err) {
      console.error('Admin fetch error:', err);
    }
    setRefreshing(false);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin` }
    });
  };

  if (loading) return (
    <div style={{ flex: 1, minHeight: '100vh', width: '100vw', background: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg-loading-indicator fade-in">
        <RefreshCw size={24} className="spin-slow" color="#a855f7" />
      </div>
    </div>
  );

  if (unauthorized) return (
    <div style={{ flex: 1, minHeight: '100vh', width: '100vw', background: '#0b1120', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', color: '#fff', fontFamily: "'Outfit', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }} />
      
      <div style={{ zIndex: 1, background: 'rgba(10, 15, 30, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '48px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: '50%' }}>
          <ShieldAlert size={56} color="#ef4444" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: 700 }}>Restricted Area</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.1rem' }}>Please authenticate as the site administrator.</p>
        </div>
        <button
          onClick={handleLogin}
          style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#fff', border: 'none', borderRadius: '16px', padding: '16px 36px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'all 0.3s', boxShadow: '0 10px 20px -5px rgba(168,85,247,0.4)', marginTop: '8px' }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Verify Identity
        </button>
        <a href="/" style={{ color: '#64748b', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s', marginTop: '8px' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#64748b'}>
          ← Return to MoodByte
        </a>
      </div>
    </div>
  );

  const BG_GIF = 'https://i.pinimg.com/originals/17/ba/8a/17ba8a1c97a2ebc96f86c2ba40251739.gif'; // MoodByte's night theme gif

  return (
    <div style={{ 
      flex: 1, height: '100vh', width: '100vw', 
      backgroundImage: `url(${BG_GIF})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      color: '#fff', fontFamily: "'Outfit', sans-serif", overflowY: 'auto', overflowX: 'hidden' 
    }}>
      
      {/* Overlay to darken background slightly for readability */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 5, 10, 0.4)', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 32px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Activity size={28} color="#fff" />
              </div>
              <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Admin HQ</h1>
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              <ShieldAlert size={16} /> Authenticated as <strong>{user?.email}</strong>
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={fetchStats}
              disabled={refreshing}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '14px', padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
            >
              <RefreshCw size={18} className={refreshing ? 'spin-slow' : ''} />
              {refreshing ? 'Syncing...' : 'Refresh'}
            </button>
            <button
              onClick={handleLogout}
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fff', borderRadius: '14px', padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.4)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
            >
              <LogOut size={18} />
              Exit
            </button>
          </div>
        </div>

        {/* Main stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <StatCard icon={MonitorSmartphone} label="Total Visits" value={stats?.totalVisits} sub="All-time page loads across devices" color="#60a5fa" />
          <StatCard icon={Users} label="Unique Visitors" value={stats?.uniqueVisitors} sub="All-time unique browsers" color="#c084fc" />
          <StatCard icon={TrendingUp} label="Today's Traffic" value={stats?.todayVisits} sub="New sessions logged today" color="#4ade80" />
          <StatCard icon={Activity} label="Active (7 Days)" value={stats?.dau7} sub="Unique sessions, last 7 days" color="#fb923c" />
          <StatCard icon={Clock} label="Active (30 Days)" value={stats?.dau30} sub="Unique sessions, last 30 days" color="#f472b6" />
          <StatCard icon={ShieldAlert} label="Registered" value={stats?.registeredUsers} sub="Users via Google Sign-in" color="#facc15" />
          <StatCard icon={CheckSquare} label="Global Tasks" value={stats?.totalTasks} sub="Tasks created by all users" color="#34d399" />
          <StatCard icon={Smile} label="Global Moods" value={stats?.totalMoods} sub="Moods logged globally" color="#f87171" />
        </div>

        {/* Layout for lower half: Themes + Users */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          
          {/* Theme breakdown */}
          {stats?.themeCounts && (
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.2)', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
                  <Palette color="#fff" size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600 }}>Theme Popularity</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries(stats.themeCounts).sort((a, b) => b[1] - a[1]).map(([theme, count]) => {
                  const pct = Math.round((count / stats.totalVisits) * 100);
                  return (
                    <div key={theme}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '1rem', fontWeight: 500 }}>
                        <span>{THEME_LABELS[theme] || theme}</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}><strong>{count}</strong> visits <span style={{ opacity: 0.5 }}>·</span> {pct}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'rgba(255,255,255,0.8)', borderRadius: '999px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Registered users table */}
          {stats?.registeredUserList?.length > 0 && (
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.2)', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
                  <Users color="#fff" size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600 }}>Active Users ({stats.registeredUserList.length})</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                {stats.registeredUserList.map((row, i) => {
                  const tasks = (row.data?.taskHistory?.length || 0) + (row.data?.tasks?.filter(t => t.completed)?.length || 0);
                  const moods = row.data?.moodHistory?.length || 0;
                  const theme = row.data?.theme || '—';
                  const lastSeen = row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—';
                  return (
                    <div key={row.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>User #{i + 1}</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Last active: {lastSeen}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', fontWeight: 500 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          <span style={{ color: '#86efac' }}>{tasks} tasks</span>
                          <span style={{ color: '#fbcfe8' }}>{moods} moods</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '64px', textAlign: 'center', fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          MoodByte Admin Dashboard · Top Secret Data 👁️
        </p>
      </div>
    </div>
  );
}
