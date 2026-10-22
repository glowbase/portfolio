const bgPings = [
  { top: "96px", left: "240px", delay: "0s" },
  { top: "336px", left: "672px", delay: "1.3s" },
  { top: "528px", left: "144px", delay: "2.6s" },
  { top: "192px", left: "1104px", delay: "3.1s" },
  { top: "624px", left: "960px", delay: "4.2s" },
  { top: "432px", left: "1296px", delay: "0.7s" },
  { top: "768px", left: "528px", delay: "5.1s" },
  { top: "288px", left: "432px", delay: "3.8s" },
  { top: "96px", left: "816px", delay: "2.0s" },
  { top: "672px", left: "1200px", delay: "1.0s" },
];

export default function SiteBackground() {
  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        body { background: #02060a; }
        .bg-grid {
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: grid-drift 24s linear infinite;
        }
        @keyframes grid-drift {
          from { background-position: 0 0, 0 0; }
          to   { background-position: 48px 48px, 48px 48px; }
        }
        @keyframes glow-breathe {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        .bg-glow { animation: glow-breathe 7s ease-in-out infinite; }
        @keyframes ping-dot {
          0%, 100% { opacity: 0; transform: scale(0.4); }
          8%       { opacity: 1; transform: scale(1); }
          40%      { opacity: 0; transform: scale(1.1); }
        }
        .ping-dot {
          position: absolute;
          height: 6px; width: 6px;
          border-radius: 9999px;
          background: #ff8a00;
          box-shadow: 0 0 10px 2px rgba(255, 138, 0, 0.7);
          opacity: 0;
          animation: ping-dot 7s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .bg-grid, .bg-glow, .ping-dot { animation: none; }
          .bg-glow { opacity: 0.9; }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#02060a]" />
      <div className="bg-grid pointer-events-none fixed inset-0 -z-10" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {bgPings.map((p, i) => (
          <span
            key={i}
            className="ping-dot"
            style={{ top: p.top, left: p.left, animationDelay: p.delay }}
          />
        ))}
      </div>
      <div className="bg-glow pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(70%_55%_at_50%_-5%,_rgba(255,138,0,0.18),_transparent_70%)]" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-64 bg-[linear-gradient(to_top,_#02060a,_transparent)]" />
    </>
  );
}
