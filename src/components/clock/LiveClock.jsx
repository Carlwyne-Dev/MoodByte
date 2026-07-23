import React, { useState, useEffect } from 'react';

function getTimeParts() {
  const now = new Date();
  const raw = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const [hhmm, ampm] = raw.split(' ');
  return { hhmm, ampm };
}

function AnimChar({ value, isColon }) {
  return (
    <span className={isColon ? 'clock-colon' : 'anim-digit'}>
      {value}
    </span>
  );
}

export default function LiveClock() {
  const [parts, setParts] = useState(getTimeParts());

  useEffect(() => {
    const interval = setInterval(() => setParts(getTimeParts()), 1000);
    return () => clearInterval(interval);
  }, []);

  const chars = parts.hhmm.split('');

  return (
    <div className="live-clock-wrap">
      <div className="live-clock-digits">
        {chars.map((ch, i) => (
          <React.Fragment key={i}>
            <AnimChar value={ch} isColon={ch === ':'} />
          </React.Fragment>
        ))}
      </div>

      {/* AM/PM: hidden by default, slides out on hover */}
      <span className="live-clock-ampm">{parts.ampm}</span>

      <style>{`
        .live-clock-wrap {
          display: flex;
          align-items: baseline;
          gap: 0;
          user-select: none;
          pointer-events: auto;
          cursor: default;
        }
        .live-clock-digits {
          display: flex;
          align-items: center;
          line-height: 1;
        }
        .anim-digit {
          display: inline-block;
          font-family: 'Outfit', sans-serif;
          font-size: 2.8rem;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 2px 16px rgba(0,0,0,0.5);
          line-height: 1;
          letter-spacing: -0.02em;
          animation: digitSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .clock-colon {
          display: inline-block;
          font-family: 'Outfit', sans-serif;
          font-size: 2.8rem;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 2px 16px rgba(0,0,0,0.5);
          line-height: 1;
          margin: 0 1px;
        }

        /* AM/PM: hidden, slides out on hover */
        .live-clock-ampm {
          font-family: 'Outfit', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 5px;
          margin-left: 0;
          max-width: 0;
          overflow: hidden;
          opacity: 0;
          white-space: nowrap;
          transition: max-width 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 0.25s ease,
                      margin-left 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .live-clock-wrap:hover .live-clock-ampm {
          max-width: 3rem;
          opacity: 1;
          margin-left: 8px;
        }

        @keyframes digitSlideUp {
          from {
            opacity: 0;
            transform: translateY(30%);
          }
          to {
            opacity: 1;
            transform: translateY(0%);
          }
        }

        @media (max-width: 768px) {
          .anim-digit, .clock-colon { font-size: 2rem; }
          .live-clock-ampm { font-size: 0.75rem; }
        }
      `}</style>
    </div>
  );
}
