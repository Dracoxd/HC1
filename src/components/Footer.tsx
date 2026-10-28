import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-enter border-t border-white/10 bg-[#0f4d3c] px-5 py-3 text-center text-xs text-white/75 sm:py-3.5">
      <div>© {new Date().getFullYear()} Mayor Moises R. Flores Health Center — All rights reserved</div>
    </footer>
  );
};
