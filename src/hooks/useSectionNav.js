import { useState, useRef, useEffect } from 'react';

// Tracks which sidebar section is closest to the top of the scroll container,
// and provides a smooth-scroll helper to jump to a given section.
export function useSectionNav(sections) {
  const sidebarScrollRef = useRef(null);
  const [activeSection, setActiveSection] = useState(sections[0]?.id);

  const scrollToSection = (id) => {
    const el = document.getElementById('sec-' + id);
    const container = sidebarScrollRef.current;
    if (!el || !container) return;
    const elTop = el.offsetTop;
    container.scrollTo({ top: elTop - 24, behavior: 'smooth' });
  };

  useEffect(() => {
    const container = sidebarScrollRef.current;
    if (!container) return;
    const onScroll = () => {
      let closest = sections[0].id;
      let minDist = Infinity;
      sections.forEach(({ id }) => {
        const el = document.getElementById('sec-' + id);
        if (!el) return;
        const dist = Math.abs(el.offsetTop - container.scrollTop - 24);
        if (dist < minDist) { minDist = dist; closest = id; }
      });
      setActiveSection(closest);
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { sidebarScrollRef, activeSection, scrollToSection };
}
