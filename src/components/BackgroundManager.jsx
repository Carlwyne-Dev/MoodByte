import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function BackgroundManager({ bgImage }) {
  const [layers, setLayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const img = new Image();
    img.onload = () => {
      if (isCancelled) return;
      setIsLoading(false);

      setLayers(prev => {
        if (prev.length > 0 && prev[prev.length - 1].src === bgImage) return prev;
        return [...prev, { id: Date.now(), src: bgImage }];
      });

      // Cleanup old layers after transition (1.5s)
      setTimeout(() => {
        if (!isCancelled) {
          setLayers(prev => prev.slice(-1));
        }
      }, 1500);
    };
    img.src = bgImage;

    return () => { isCancelled = true; };
  }, [bgImage]);

  return (
    <div className="bg-manager">
      {layers.length === 0 && (
        <div className="bg-skeleton-pulse" />
      )}

      {layers.map((layer, i) => (
        <div
          key={layer.id}
          className="bg-layer"
          style={{
            backgroundImage: `url('${layer.src}')`,
            opacity: i === layers.length - 1 ? 1 : 0, // fade out old layers
          }}
        />
      ))}

      {layers.length > 0 && isLoading && (
        <div className="bg-loading-indicator fade-in">
          <Loader2 size={16} className="spin-slow" />
        </div>
      )}
    </div>
  );
}
