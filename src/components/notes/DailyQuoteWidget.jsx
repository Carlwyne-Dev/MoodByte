import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Quote } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const MOTIVATIONAL_QUOTES = [
  { text: "You have survived 100% of your bad days. Keep going, you're doing great.", author: "Reminder" },
  { text: "It's okay to rest. You are not a machine. Take a breath and start again when you're ready.", author: "Self-Care" },
  { text: "Small steps are still progress. Don't be too hard on yourself for not having it all figured out today.", author: "Encouragement" },
  { text: "You don't have to be perfect to be amazing. Give yourself permission to just be you today.", author: "Acceptance" },
  { text: "Your productivity does not determine your worth. You are allowed to just exist and be happy.", author: "Mental Health" },
  { text: "Every day is a fresh start. Leave yesterday's worries behind and focus on the step right in front of you.", author: "Mindfulness" },
  { text: "Be kind to yourself. You are doing the best you can with what you have right now.", author: "Compassion" },
  { text: "Focus on how far you've come, not just how far you have left to go. Be proud of your journey.", author: "Perspective" },
  { text: "You are allowed to protect your peace. Trust your own path and take things one day at a time.", author: "Boundaries" },
  { text: "Doubt kills more dreams than failure ever will. Believe in yourself just a little bit more today.", author: "Motivation" },
  { text: "Storms don't last forever. Whatever you're going through, trust that brighter days are ahead.", author: "Hope" },
  { text: "It is not the load that breaks you down, it's the way you carry it. Be gentle with your mind.", author: "Wisdom" },
  { text: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
  { text: "Breathe in peace, exhale stress. You control the energy you let into your life.", author: "Calm" },
  { text: "Growth is rarely a straight line. Celebrate the messy, nonlinear journey you are on.", author: "Growth" },
  { text: "Sometimes the most productive thing you can do is relax.", author: "Mark Black" },
  { text: "You are allowed to say 'no' without explaining yourself. Your energy is precious.", author: "Boundaries" },
  { text: "A flower does not think of competing with the flower next to it. It just blooms.", author: "Zen Proverb" },
  { text: "You are stronger than your anxious thoughts. You are more than your hardest days.", author: "Affirmation" },
  { text: "Don't rush the process. Good things take time, and so does healing.", author: "Patience" },
  { text: "Your best is going to look different every day. And that is perfectly okay.", author: "Grace" },
  { text: "If you get tired, learn to rest, not to quit.", author: "Banksy" },
  { text: "You are entirely up to you. Make choices today that your future self will thank you for.", author: "Empowerment" },
  { text: "There is no timeline for your life. You are exactly where you need to be right now.", author: "Trust" },
  { text: "Nothing in nature blooms all year. Be patient with yourself when you are in your winter.", author: "Patience" },
  { text: "Celebrate the small victories. Getting out of bed is a win. Drinking water is a win.", author: "Perspective" },
  { text: "Let go of who you think you're supposed to be; embrace who you are.", author: "Brené Brown" },
  { text: "You are a work in progress, and that is a beautiful thing.", author: "Acceptance" },
  { text: "Give yourself the same grace you so freely give to others.", author: "Self-Love" },
  { text: "Everything will be okay in the end. If it's not okay, it's not the end.", author: "John Lennon" },
  { text: "Today is a good day to have a good day. Start with a smile.", author: "Positivity" }
];

export default function DailyQuoteWidget() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const widgetRef = useRef(null);
  const [dailyQuote, setDailyQuote] = useLocalStorage('moodbyte_dailyQuote', {
    date: '',
    text: '',
    author: '',
    isRead: false
  });

  // Auto-dismiss tooltip after 3 seconds
  useEffect(() => {
    if (isTooltipOpen) {
      const timer = setTimeout(() => {
        setIsTooltipOpen(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isTooltipOpen]);

  // Dismiss tooltip on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsTooltipOpen(false);
      }
    };
    
    if (isTooltipOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTooltipOpen]);

  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    if (dailyQuote.date !== dateStr) {
      // Attempt to fetch a fresh motivational quote from the API
      fetch('https://api.quotable.io/quotes/random?tags=inspirational|motivational')
        .then(res => {
          if (!res.ok) throw new Error("API Network response was not ok");
          return res.json();
        })
        .then(data => {
          if (data && data.length > 0) {
            setDailyQuote({
              date: dateStr,
              text: data[0].content,
              author: data[0].author,
              isRead: false
            });
          } else {
            throw new Error("Empty quote data");
          }
        })
        .catch(err => {
          console.log("Quote API blocked or failed, falling back to local curated list.", err);
          
          // Fallback logic - pick a random quote instead of dayOfYear
          // so that testing or clearing cache gives a fresh one
          const quoteIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
          const selectedQuote = MOTIVATIONAL_QUOTES[quoteIndex];

          setDailyQuote({
            date: dateStr,
            text: selectedQuote.text,
            author: selectedQuote.author,
            isRead: false
          });
        });
    }
  }, [dailyQuote.date, setDailyQuote]);

  const handleCenterClick = () => {
    setIsModalOpen(true);
    if (!dailyQuote.isRead) {
      setDailyQuote(prev => ({ ...prev, isRead: true }));
    }
  };

  const handleOrbClick = () => {
    setIsTooltipOpen(prev => !prev);
  };

  const displayQuote = dailyQuote.text || "Your mind is a garden. Your thoughts are the seeds. You can grow flowers or you can grow weeds.";
  const displayAuthor = dailyQuote.author || "Osho";

  return (
    <>
      {!dailyQuote.isRead ? (
        <div className="quote-note-center pop-in" onClick={handleCenterClick} title="Open your daily quote">
          <div className="quote-note-body">
            <Sparkles size={28} className="quote-note-sparkle" />
            <span>Daily Quote</span>
            <div className="quote-note-hint">Click to open</div>
          </div>
        </div>
      ) : (
        <div ref={widgetRef}>
          <button 
            className="quote-orb pop-in"
            onClick={handleOrbClick}
            title="Daily Quote"
          >
            <Sparkles size={22} className="orb-icon" />
          </button>
          
          <div className={`quote-speech-bubble ${isTooltipOpen ? 'open' : ''}`}>
            <Quote size={18} className="bubble-quote-mark" />
            <div className="bubble-text">"{displayQuote}"</div>
            <div className="bubble-author">- {displayAuthor}</div>
          </div>
        </div>
      )}

      {isModalOpen && createPortal(
        <div className="quote-modal-overlay fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="quote-modal-card pop-in" onClick={e => e.stopPropagation()}>
            <button className="quote-close-btn" onClick={() => setIsModalOpen(false)}>
              <X size={20} />
            </button>
            
            <div className="quote-content-wrapper">
              <Quote size={40} className="quote-mark" />
              <h2 className="quote-text">"{displayQuote}"</h2>
              <p className="quote-author">- {displayAuthor}</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        /* Centered Quote Note */
        .quote-note-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 160px;
          height: 160px;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 4px; /* Note-like corners */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.9);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.05);
          transition: all 0.3s ease;
          z-index: 50;
          pointer-events: auto;
        }

        /* Rainbow edge and glow */
        .quote-note-center::before, .quote-note-center::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 6px;
          padding: 2px; /* Border thickness */
          background: conic-gradient(from var(--border-angle), #00d4ff, #8a2be2, #00d4ff);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          animation: spin-border 3s linear infinite;
        }

        .quote-note-center::after {
          filter: blur(8px);
          opacity: 0.8;
        }

        .quote-note-center:hover {
          transform: translate(-50%, -50%) scale(1.05);
        }

        .quote-note-center:hover::before, .quote-note-center:hover::after {
          animation-duration: 1.5s;
        }

        .quote-note-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .quote-note-body span {
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .quote-note-hint {
          font-family: 'Outfit', sans-serif;
          font-size: 0.7rem;
          opacity: 0.6;
          margin-top: -4px;
        }

        .quote-note-sparkle {
          color: var(--primary);
          opacity: 0.9;
        }

        @property --border-angle {
          syntax: "<angle>";
          inherits: true;
          initial-value: 0turn;
        }

        @keyframes spin-border {
          0% { --border-angle: 0turn; }
          100% { --border-angle: 1turn; }
        }

        /* Bottom Left Orb */
        .quote-orb {
          position: absolute;
          bottom: 1.5rem;
          left: 1.5rem;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.8);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2), inset 0 2px 10px rgba(255,255,255,0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 40;
          pointer-events: auto;
        }

        .quote-orb:hover {
          transform: scale(1.1);
          color: white;
          border-color: rgba(255,255,255,0.4);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3), inset 0 2px 15px rgba(255,255,255,0.1);
        }

        /* Speech Bubble */
        .quote-speech-bubble {
          position: absolute;
          bottom: 84px; /* 12px above orb */
          left: 1rem;
          background: linear-gradient(135deg, rgba(20,20,30,0.85), rgba(10,10,15,0.95));
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(12px);
          padding: 1.2rem;
          border-radius: 16px;
          width: 280px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.05);
          z-index: 45;
          color: white;
          
          /* Animation */
          transform-origin: 32px calc(100% + 10px); /* Origin exactly at tail tip */
          opacity: 0;
          transform: scale(0.8) translateY(10px);
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .quote-speech-bubble.open {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }

        /* Speech Bubble Tail Border */
        .quote-speech-bubble::before {
          content: "";
          position: absolute;
          bottom: -10px;
          left: 32px; /* points exactly to center of orb (16px left + 32px = 48px) */
          border-width: 10px 10px 0 0;
          border-style: solid;
          border-color: rgba(255,255,255,0.15) transparent transparent transparent;
        }

        /* Speech Bubble Tail Body */
        .quote-speech-bubble::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 33px;
          border-width: 8px 8px 0 0;
          border-style: solid;
          border-color: rgba(12,12,18,0.95) transparent transparent transparent; 
        }

        .bubble-quote-mark {
          color: var(--primary);
          opacity: 0.8;
          margin-bottom: 4px;
        }

        .bubble-text {
          font-family: 'Caveat', cursive;
          font-size: 1.3rem;
          line-height: 1.3;
          color: rgba(255,255,255,0.95);
          margin-bottom: 0.5rem;
        }

        .bubble-author {
          font-family: 'Outfit', sans-serif;
          font-size: 0.75rem;
          color: var(--primary);
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }

        .quote-orb.unread {
          animation: orb-pulse 2s infinite;
        }

        .orb-icon {
          transition: transform 0.4s ease;
        }
        .quote-orb:hover .orb-icon {
          transform: rotate(15deg);
        }

        .orb-badge {
          position: absolute;
          top: 0px;
          right: 2px;
          width: 10px;
          height: 10px;
          background: var(--primary);
          border-radius: 50%;
          border: 2px solid var(--bg-color);
        }

        @keyframes orb-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3); }
          70% { box-shadow: 0 0 0 12px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }

        .quote-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }

        .quote-modal-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 4px; /* Note-like corners */
          padding: 3rem 2.5rem;
          max-width: 500px;
          width: 100%;
          position: relative;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 25px rgba(255,255,255,0.2), inset 0 0 30px rgba(255,255,255,0.05);
          text-align: center;
          color: rgba(255,255,255,0.95);
        }

        .quote-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.6);
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .quote-close-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
          transform: rotate(90deg);
        }

        .quote-content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .quote-mark {
          color: var(--primary);
          opacity: 0.8;
          margin-bottom: -10px;
        }

        .quote-text {
          font-family: 'Caveat', cursive;
          font-size: 2.2rem;
          line-height: 1.4;
          color: white;
          font-weight: 400;
          text-shadow: 0 2px 10px rgba(0,0,0,0.4);
          margin: 0;
          letter-spacing: 0.02em;
        }

        .quote-author {
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          color: var(--primary);
          opacity: 0.9;
          letter-spacing: 0.05em;
          margin: 0;
          font-weight: 500;
          text-transform: uppercase;
        }
      `}</style>
    </>
  );
}
