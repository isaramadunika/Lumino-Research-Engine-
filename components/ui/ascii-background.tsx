'use client';

export default function ASCIIBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      <style jsx>{`
        .ascii-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 5%;
          opacity: 0.15;
          font-family: 'Courier New', monospace;
          font-size: clamp(6px, 1.2vw, 12px);
          line-height: 1.1;
          color: rgba(255, 255, 255, 0.4);
          white-space: pre;
          font-weight: bold;
          letter-spacing: -0.05em;
          text-shadow: 0 0 10px rgba(100, 200, 255, 0.3);
          animation: asciiFloat 15s ease-in-out infinite;
        }

        @keyframes asciiFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.12;
          }
          25% {
            transform: translateY(-15px) scale(1.02);
            opacity: 0.15;
          }
          50% {
            transform: translateY(0px) scale(1);
            opacity: 0.18;
          }
          75% {
            transform: translateY(15px) scale(0.98);
            opacity: 0.15;
          }
        }

        .ascii-grid-lines {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(0deg, transparent 24%, rgba(100, 200, 255, 0.08) 25%, rgba(100, 200, 255, 0.08) 26%, transparent 27%, transparent 74%, rgba(100, 200, 255, 0.08) 75%, rgba(100, 200, 255, 0.08) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(100, 200, 255, 0.08) 25%, rgba(100, 200, 255, 0.08) 26%, transparent 27%, transparent 74%, rgba(100, 200, 255, 0.08) 75%, rgba(100, 200, 255, 0.08) 76%, transparent 77%, transparent);
          background-size: 50px 50px;
          animation: gridScroll 8s linear infinite;
        }

        @keyframes gridScroll {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 50px 50px;
          }
        }

        .ascii-scanlines {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.02) 0px,
            rgba(255, 255, 255, 0.02) 1px,
            transparent 1px,
            transparent 2px
          );
          animation: scanlineScroll 0.3s linear infinite;
          pointer-events: none;
        }

        @keyframes scanlineScroll {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(2px);
          }
        }

        .diagonal-box {
          transform: rotate(45deg);
        }
      `}</style>

      {/* Grid background animation */}
      <div className="ascii-grid-lines"></div>

      {/* Scanlines effect */}
      <div className="ascii-scanlines"></div>

      {/* ASCII Vitruvian Man */}
      <div className="ascii-container">
        {`
          
          
                    ◯
                   ╱ ╲
                  ╱   ╲
                 ╱     ╲
                ╱       ╲
               ●─────────●
              ╱│╲       ╱│╲
             ╱ │ ╲     ╱ │ ╲
            ╱  │  ╲   ╱  │  ╲
           ●───┼───●─●───┼───●
          ╱    │    ╱ ╲   │   ╲
         ╱     │   ╱   ╲  │    ╲
        ●───── │ ─●     ●─┤─────●
         ╲     │╱ ╱     ╲ │    ╱
          ╲    │╱ ╱       ╲│   ╱
           ●───●─────────●─┘──●
            ╲  │        ╱  │ ╱
             ╲ │       ╱   │╱
              ╲│      ╱    │
               ●─────●     │
                ╲   ╱      │
                 ╲ ╱       │
                  ◯        │
                          │
                    ∞─────●
        `}
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-12 right-12 w-32 h-32 border border-blue-400/20 rounded-full"></div>
      <div className="absolute bottom-16 right-20 w-24 h-24 border-2 border-blue-300/10 opacity-30 diagonal-box"></div>
    </div>
  );
}
