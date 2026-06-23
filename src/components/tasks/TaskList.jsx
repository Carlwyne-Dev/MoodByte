import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Check, Trash2, ClipboardList, Sparkles, History, X } from 'lucide-react';

export default function TaskList() {
  const [tasks, setTasks] = useLocalStorage('tasks', []);
  const [taskHistory, setTaskHistory] = useLocalStorage('taskHistory', []);
  const [newTaskText, setNewTaskText] = useState('');
  const [filter, setFilter] = useState('all');
  const [focused, setFocused] = useState(false);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [closingHistory, setClosingHistory] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const popupRef = useRef(null);

  const closeHistory = () => {
    setClosingHistory(true);
    setTimeout(() => {
      setShowHistory(false);
      setClosingHistory(false);
    }, 180);
  };

  // Active position sync
  useEffect(() => {
    if (!showHistory) return;
    const sidebarContent = document.querySelector('.sidebar-content');
    const sidebar = document.querySelector('.sidebar');
    if (!sidebarContent || !sidebar || !containerRef.current) return;

    const updatePosition = () => {
      const taskRect = containerRef.current.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const contentRect = sidebarContent.getBoundingClientRect();
      
      if (taskRect.bottom < contentRect.top || taskRect.top > contentRect.bottom) {
        closeHistory();
        return;
      }

      setPopupPos({
        top: taskRect.top + (taskRect.height / 2),
        left: sidebarRect ? sidebarRect.left - 260 : taskRect.left - 280
      });
    };

    sidebarContent.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    updatePosition(); 

    return () => {
      sidebarContent.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showHistory]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showHistory && !closingHistory && popupRef.current && !popupRef.current.contains(e.target) && containerRef.current && !containerRef.current.contains(e.target)) {
        closeHistory();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistory, closingHistory]);

  const toggleHistory = (e) => {
    e.stopPropagation();
    if (showHistory) closeHistory();
    else setShowHistory(true);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTasks([newTask, ...tasks]);
    setNewTaskText('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setRemovingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setTasks(tasks.filter(t => t.id !== id));
      setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 280);
  };

  const clearCompleted = () => {
    const completedTasks = tasks.filter(t => t.completed);
    const completedIds = completedTasks.map(t => t.id);
    
    // Move to history
    const archived = completedTasks.map(t => ({...t, archivedAt: new Date().toISOString()}));
    setTaskHistory(prev => [...archived, ...prev].slice(0, 100));

    setRemovingIds(prev => new Set([...prev, ...completedIds]));
    setTimeout(() => {
      setTasks(tasks.filter(t => !t.completed));
      setRemovingIds(new Set());
    }, 280);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPct = tasks.length ? (completedCount / tasks.length) * 100 : 0;
  const allDone = tasks.length > 0 && completedCount === tasks.length;

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  return (
    <div className="task-container" ref={containerRef}>

      {/* Progress header */}
      <div className="task-header">
        <div className="task-stat-label">
          {allDone
            ? <span className="all-done-text"><Sparkles size={13} /> All done!</span>
            : <span>{tasks.length - completedCount} remaining</span>
          }
          <div className="task-header-right">
            <span className="task-count-secondary">{completedCount}/{tasks.length}</span>
            <button className={`history-icon-btn ${showHistory ? 'active' : ''}`} onClick={toggleHistory} title="Task History">
              <History size={14} />
            </button>
          </div>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${allDone ? 'complete' : ''}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={addTask} className={`task-input-form ${focused ? 'focused' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a task..."
          value={newTaskText}
          onChange={e => setNewTaskText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="task-input"
        />
        {newTaskText.trim() && (
          <button
            type="submit"
            className="add-btn"
            title="Add task"
          >
            Add
          </button>
        )}
      </form>

      {/* Filter tabs */}
      {tasks.length > 0 && (
        <div className="filter-tabs">
          {['all', 'active', 'done'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'done' && completedCount > 0 && (
                <span className="filter-badge">{completedCount}</span>
              )}
              {f === 'active' && tasks.length - completedCount > 0 && (
                <span className="filter-badge active-badge">{tasks.length - completedCount}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Task list */}
      <ul className="task-list" key={filter}>
        {filteredTasks.length === 0 && (
          <li className="empty-state">
            <ClipboardList size={28} strokeWidth={1.2} />
            <span>
              {filter === 'done' ? 'Nothing completed yet' :
               filter === 'active' ? 'All caught up!' :
               'No tasks yet. Enjoy the quiet.'}
            </span>
          </li>
        )}
        {filteredTasks.map(task => (
          <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''} ${removingIds.has(task.id) ? 'removing' : ''}`}>
            <button
              className="checkbox"
              onClick={() => toggleTask(task.id)}
              aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              <span className="checkbox-inner">
                {task.completed && <Check size={11} strokeWidth={3} />}
              </span>
            </button>
            <span className="task-text">{task.text}</span>
            <button
              className="delete-btn"
              onClick={() => deleteTask(task.id)}
              aria-label="Delete task"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>

      {/* Clear completed */}
      {completedCount > 0 && (
        <button className="clear-btn" onClick={clearCompleted}>
          Archive {completedCount} completed
        </button>
      )}

      {/* History Portal Popup */}
      {(showHistory || closingHistory) && createPortal(
        <div ref={popupRef} className={`task-portal-popup ${closingHistory ? 'closing' : ''}`} style={{ top: `${popupPos.top}px`, left: `${popupPos.left}px` }}>
          <div className="task-popup-content">
            <div className="popup-header">
              <span className="popup-label">Task History</span>
            </div>
            
            <div className="history-scroll-area">
              {taskHistory.length === 0 ? (
                <div className="empty-history text-muted">No completed tasks archived yet.</div>
              ) : (
                <ul className="history-list">
                  {taskHistory.map(task => (
                    <li key={task.id + task.archivedAt} className="history-item">
                      <Check size={12} className="history-check" strokeWidth={3} />
                      <div className="history-item-info">
                        <span className="history-text">{task.text}</span>
                        <span className="history-date">
                          {new Date(task.archivedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="task-popup-tail" />
        </div>,
        document.body
      )}

      <style jsx="true">{`
        .task-container {
          display: flex; flex-direction: column; gap: 0.85rem;
        }

        /* Header */
        .task-header { display: flex; flex-direction: column; gap: 0.5rem; }
        .task-stat-label {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.78rem; color: var(--text-muted);
        }
        .all-done-text {
          display: flex; align-items: center; gap: 0.3rem;
          color: #a3e635; font-weight: 600;
        }
        .task-count-secondary { font-size: 0.72rem; opacity: 0.6; }

        /* Progress bar */
        .progress-track {
          width: 100%; height: 4px;
          background: rgba(255,255,255,0.07);
          border-radius: 4px; overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-hover), var(--primary));
          border-radius: 4px;
          transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 0 8px rgba(168,85,247,0.4);
        }
        .progress-fill.complete {
          background: linear-gradient(90deg, #4ade80, #a3e635);
          box-shadow: 0 0 8px rgba(163,230,53,0.4);
        }

        /* Input form */
        .task-input-form {
          display: flex; align-items: center;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 6px 6px 6px 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          gap: 0;
        }
        .task-input-form.focused {
          border-color: rgba(168,85,247,0.4);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.08);
        }
        .task-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text-color); font-size: 0.85rem;
          font-family: 'Outfit', sans-serif; min-width: 0;
        }
        .task-input::placeholder { color: rgba(255,255,255,0.3); }

        /* Add button */
        .add-btn {
          flex-shrink: 0;
          padding: 0.25rem 0.7rem;
          border-radius: 8px;
          background: var(--primary);
          border: none;
          color: white;
          font-size: 0.75rem; font-weight: 600;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
          white-space: nowrap;
          animation: fadeInBtn 0.15s ease;
        }
        @keyframes fadeInBtn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .add-btn:hover { opacity: 0.88; transform: scale(1.04); }

        /* Filter tabs */
        .filter-tabs {
          display: flex; gap: 0.4rem;
        }
        .filter-tab {
          flex: 1; padding: 0.3rem 0.5rem; border-radius: 8px;
          font-size: 0.72rem; font-weight: 500;
          color: var(--text-muted);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s; display: flex; align-items: center;
          justify-content: center; gap: 0.3rem;
          font-family: 'Outfit', sans-serif; cursor: pointer;
        }
        .filter-tab.active {
          background: rgba(168,85,247,0.12);
          border-color: rgba(168,85,247,0.3);
          color: var(--primary-hover);
        }
        .filter-tab:hover:not(.active) {
          background: rgba(255,255,255,0.06);
          color: var(--text-color);
        }
        .filter-badge {
          background: rgba(255,255,255,0.12);
          color: var(--text-muted);
          border-radius: 10px; padding: 0 5px;
          font-size: 0.65rem; font-weight: 700; line-height: 1.6;
        }
        .active-badge {
          background: rgba(168,85,247,0.2);
          color: var(--primary-hover);
        }

        /* Task list scroll wrapper */
        .task-list-wrap {
          position: relative;
        }
        .task-list-wrap::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 40px;
          background: linear-gradient(to bottom, transparent, rgba(15,15,25,0.7));
          pointer-events: none; border-radius: 0 0 8px 8px;
          opacity: 0; transition: opacity 0.2s;
        }
        .task-list-wrap.overflowing::after { opacity: 1; }

        .task-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column;
          max-height: 242px; /* ~5 items × 44px + 4 gaps × 7px */
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(168,85,247,0.3) transparent;
        }
        .task-list::-webkit-scrollbar { width: 3px; }
        .task-list::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 2px; }


        /* Empty state */
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.5rem; padding: 1.5rem 1rem;
          color: var(--text-muted); font-size: 0.8rem;
          opacity: 0.7;
        }

        /* Task item */
        .task-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.65rem 0.75rem; border-radius: 12px;
          margin-bottom: 0.45rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          animation: slideIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
          transform-origin: top;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .task-item.removing {
          animation: slideOut 0.22s ease-in forwards;
          pointer-events: none;
          overflow: hidden;
        }
        @keyframes slideOut {
          0% { 
            opacity: 1; transform: translateY(0) scale(1); 
            max-height: 60px; padding-top: 0.65rem; padding-bottom: 0.65rem;
            margin-bottom: 0.45rem; border-width: 1px;
          }
          100% { 
            opacity: 0; transform: translateY(-8px) scale(0.97); 
            max-height: 0; padding-top: 0; padding-bottom: 0;
            margin-bottom: 0; border-width: 0;
          }
        }
        .task-item:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }
        .task-item.completed {
          background: rgba(0,0,0,0.1);
          border-color: rgba(255,255,255,0.04);
        }

        /* Checkbox */
        .checkbox {
          width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
          border: 1.5px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
          background: transparent;
        }
        .checkbox:hover { border-color: var(--primary); }
        .task-item.completed .checkbox {
          background: linear-gradient(135deg, #4ade80, #22c55e);
          border-color: transparent;
          box-shadow: 0 0 8px rgba(74,222,128,0.3);
        }
        .checkbox-inner { display: flex; align-items: center; justify-content: center; color: white; }

        /* Task text */
        .task-text {
          flex: 1; font-size: 0.83rem; color: var(--text-color);
          word-break: break-word; line-height: 1.4;
          transition: all 0.3s;
        }
        .task-item.completed .task-text {
          text-decoration: line-through;
          opacity: 0.4;
        }

        /* Delete button */
        .delete-btn {
          color: var(--text-muted); opacity: 0;
          transition: all 0.15s; flex-shrink: 0;
          display: flex; align-items: center;
          padding: 2px; border-radius: 5px;
          cursor: pointer; background: transparent; border: none;
        }
        .task-item:hover .delete-btn { opacity: 1; }
        .delete-btn:hover { color: #f87171; background: rgba(248,113,113,0.1); }

        /* Clear completed */
        .clear-btn {
          width: 100%; padding: 0.4rem; border-radius: 10px;
          font-size: 0.72rem; font-weight: 500; cursor: pointer;
          color: var(--text-muted);
          background: transparent;
          border: 1px dashed rgba(255,255,255,0.1);
          transition: all 0.2s; font-family: 'Outfit', sans-serif;
        }
        .clear-btn:hover {
          border-color: rgba(248,113,113,0.4);
          color: #f87171;
          background: rgba(248,113,113,0.05);
        }
        .task-header-right {
          display: flex; align-items: center; gap: 0.5rem;
        }
        .history-icon-btn {
          background: transparent; border: none; padding: 0.2rem;
          color: var(--text-muted); cursor: pointer; border-radius: 4px;
          display: flex; align-items: center; transition: all 0.2s;
        }
        .history-icon-btn:hover, .history-icon-btn.active {
          color: var(--text-color); background: rgba(255,255,255,0.1);
        }

        /* Portal Popups */
        .task-portal-popup {
          position: fixed;
          transform: translateY(-50%);
          width: 260px;
          background: rgba(30, 30, 35, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 1.2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          animation: popInLeft 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 99999;
        }
        .task-popup-content {
          display: flex; flex-direction: column; gap: 1rem;
        }
        .popup-header { margin-bottom: -0.5rem; }
        .popup-label {
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px;
          color: var(--text-muted); text-transform: uppercase;
        }
        .task-popup-tail {
          position: absolute; right: -6px; top: 50%; margin-top: -6px;
          width: 12px; height: 12px;
          background: rgba(45, 45, 55, 0.65);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-right: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(16px);
          transform: rotate(45deg); border-radius: 2px; z-index: -1;
        }

        /* History Scroll Area */
        .history-scroll-area {
          max-height: 300px; overflow-y: auto;
          padding-right: 0.4rem; margin-right: -0.4rem;
        }
        .history-scroll-area::-webkit-scrollbar { width: 4px; }
        .history-scroll-area::-webkit-scrollbar-track { background: transparent; }
        .history-scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }

        .empty-history {
          font-size: 0.8rem; text-align: center; padding: 2rem 0;
        }
        .history-list {
          list-style: none; margin: 0; padding: 0;
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        .history-item {
          display: flex; gap: 0.6rem; padding: 0.6rem 0.7rem;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; transition: background 0.2s;
        }
        .history-item:hover { background: rgba(255,255,255,0.06); }
        .history-check {
          color: #4ade80; flex-shrink: 0; margin-top: 2px;
        }
        .history-item-info {
          display: flex; flex-direction: column; gap: 0.2rem;
        }
        .history-text {
          font-size: 0.8rem; color: var(--text-color); font-weight: 500;
          line-height: 1.3;
        }
        .history-date {
          font-size: 0.65rem; color: var(--text-muted); opacity: 0.8;
        }
        
        @keyframes popInLeft {
          from { opacity: 0; transform: translate(10px, -50%) scale(0.95); }
          to { opacity: 1; transform: translate(0, -50%) scale(1); }
        }
        @keyframes popOutLeft {
          from { opacity: 1; transform: translate(0, -50%) scale(1); }
          to { opacity: 0; transform: translate(10px, -50%) scale(0.95); }
        }
        .task-portal-popup.closing {
          animation: popOutLeft 0.18s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
      `}</style>
    </div>
  );
}
