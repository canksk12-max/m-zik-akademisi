import React from 'react';

interface AcademyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AcademyLogo({ size = 'md' }: AcademyLogoProps) {
  // Image and text dimensions based on size selection
  const imgSize = {
    sm: 'w-9 h-9 rounded-lg',
    md: 'w-11 h-11 rounded-xl',
    lg: 'w-18 h-18 rounded-2xl'
  }[size];

  const svgHeight = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-16'
  }[size];

  return (
    <div className="flex items-center gap-3 shrink-0 select-none" id="academy-brand-emblem">
      {/* Luxury gold brand image circular bubble */}
      <div className={`${imgSize} overflow-hidden border-2 border-amber-400/30 shadow-md shadow-amber-400/10 antialiased shrink-0 bg-slate-950 flex items-center justify-center relative group`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/10 to-transparent opacity-0 group-hover:opacity-15 transition-opacity" />
        <img 
          src="/academy_logo.jpg" 
          alt="Yağmur Yüksel Sanat Akademisi Premium Gold Logo" 
          className="w-full h-full object-cover scale-102 group-hover:scale-105 transition-transform duration-500" 
          referrerPolicy="no-referrer"
        />
      </div>

      <div className={`${svgHeight} w-auto`} id="brand-typography-wrapper">
        <svg 
          viewBox="40 30 380 110" 
          fill="none" 
          xmlns="http://www.w3.org/2050/svg" 
          className="h-full w-auto select-none overflow-visible"
        >
          {/* Text layout faithful to the logo in the picture */}
          <g id="logo-typography">
            {/* LEFT OF LOGO TEXTS */}
            {/* "ÖZEL" in small letter spacing */}
            <text 
              x="48" 
              y="62" 
              fill="#94a3b8" 
              fontSize="19" 
              fontWeight="bold" 
              letterSpacing="5" 
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              ÖZEL
            </text>
            {/* "YAĞMUR" in bold display letter spacing */}
            <text 
              x="45" 
              y="97" 
              fill="url(#textGoldGradient)" 
              fontSize="34" 
              fontWeight="900" 
              letterSpacing="1" 
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              YAĞMUR
            </text>
            {/* "SANAT" matching spacing underneath */}
            <text 
              x="85" 
              y="126" 
              fill="#cbd5e1" 
              fontSize="19" 
              fontWeight="800" 
              letterSpacing="6" 
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              SANAT
            </text>

            {/* RIGHT OF LOGO TEXTS */}
            {/* "YÜKSEL" in bold display offset */}
            <text 
              x="225" 
              y="97" 
              fill="url(#textGoldGradient)" 
              fontSize="34" 
              fontWeight="900" 
              letterSpacing="1" 
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              YÜKSEL
            </text>
            {/* "AKADEMİSİ" underneath */}
            <text 
              x="227" 
              y="126" 
              fill="#cbd5e1" 
              fontSize="19" 
              fontWeight="800" 
              letterSpacing="4" 
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              AKADEMİSİ
            </text>
          </g>

          <defs>
            {/* Smooth metallic text gold gradient */}
            <linearGradient id="textGoldGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="15%" stopColor="#FCD34D" /> {/* amber-300 */}
              <stop offset="50%" stopColor="#F59E0B" /> {/* amber-500 */}
              <stop offset="85%" stopColor="#D97706" /> {/* amber-600 */}
              <stop offset="100%" stopColor="#FFFBEB" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
