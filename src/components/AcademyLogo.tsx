import React from 'react';

interface AcademyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AcademyLogo({ size = 'md' }: AcademyLogoProps) {
  // Dimensions based on size
  const dims = {
    sm: 'h-10 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-20 w-auto'
  }[size];

  return (
    <div className={`flex items-center shrink-0 ${dims}`} id="academy-brand-emblem">
      <svg 
        viewBox="0 0 460 160" 
        fill="none" 
        xmlns="http://www.w3.org/2500/svg" 
        className="h-full w-auto select-none overflow-visible"
      >
        {/* Background staff lines / music curves in shiny golden color */}
        <g id="gold-staff-lines">
          {/* Top dynamic line */}
          <path 
            d="M 180 65 Q 240 55, 275 60 T 315 65" 
            stroke="url(#artGoldGradient)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none" 
          />
          {/* Middle dynamic line */}
          <path 
            d="M 183 75 Q 243 65, 275 72 T 313 77" 
            stroke="url(#artGoldGradient)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none" 
          />
          {/* Bottom dynamic line */}
          <path 
            d="M 185 85 Q 245 75, 275 84 T 310 89" 
            stroke="url(#artGoldGradient)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none" 
          />
          
          {/* Left elegant golden swoop element from image */}
          <path 
            d="M 178 78 C 170 82, 178 95, 195 95 C 215 95, 235 82, 255 70" 
            stroke="url(#artGoldGradient)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            fill="none" 
          />
          <path 
            d="M 178 78 C 190 70, 210 60, 235 55" 
            stroke="url(#artGoldGradient)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            fill="none" 
          />
        </g>

        {/* Calligraphy 'Y' / Clef symbol - dark body with radiant gold path border for premium high-contrast contrast */}
        <g id="clef-body">
          {/* Background thick stroke for depth */}
          <path 
            d="M 271 45 
               C 275 35, 258 55, 248 70 
               C 238 85, 218 105, 203 125 
               C 185 145, 160 152, 161 133 
               C 162 118, 178 105, 197 105 
               C 220 105, 222 135, 190 142 
               C 172 145, 185 125, 202 110
               C 225 90, 245 65, 250 48" 
            stroke="url(#artGoldGradient)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none" 
          />
          {/* Solid deep slate-950 interior body */}
          <path 
            d="M 271 45 
               C 275 35, 258 55, 248 70 
               C 238 85, 218 105, 203 125 
               C 185 145, 160 152, 161 133 
               C 162 118, 178 105, 197 105 
               C 220 105, 222 135, 190 142 
               C 172 145, 185 125, 202 110
               C 225 90, 245 65, 250 48 Z" 
            fill="#0b0f19" 
          />
          {/* Inner highlights */}
          <path 
            d="M 267 48 C 255 68, 230 92, 205 118" 
            stroke="white" 
            strokeWidth="0.8" 
            strokeLinecap="round" 
            opacity="0.4"
          />
        </g>

        {/* Text layout faithful to the logo in the picture */}
        <g id="logo-typography">
          {/* LEFT OF CLEF TEXTS */}
          {/* "ÖZEL" in small letter spacing */}
          <text 
            x="48" 
            y="72" 
            fill="#94a3b8" 
            fontSize="18" 
            fontWeight="bold" 
            letterSpacing="5" 
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            ÖZEL
          </text>
          {/* "YAĞMUR" in bold display letter spacing */}
          <text 
            x="45" 
            y="105" 
            fill="url(#textGoldGradient)" 
            fontSize="32" 
            fontWeight="900" 
            letterSpacing="1" 
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            YAĞMUR
          </text>
          {/* "SANAT" matching spacing underneath */}
          <text 
            x="85" 
            y="132" 
            fill="#cbd5e1" 
            fontSize="18" 
            fontWeight="800" 
            letterSpacing="6" 
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            SANAT
          </text>

          {/* RIGHT OF CLEF TEXTS */}
          {/* "YÜKSEL" in bold display offset */}
          <text 
            x="265" 
            y="105" 
            fill="url(#textGoldGradient)" 
            fontSize="32" 
            fontWeight="900" 
            letterSpacing="1" 
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            YÜKSEL
          </text>
          {/* "AKADEMİSİ" underneath */}
          <text 
            x="267" 
            y="132" 
            fill="#cbd5e1" 
            fontSize="18" 
            fontWeight="800" 
            letterSpacing="4" 
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            AKADEMİSİ
          </text>
        </g>

        <defs>
          {/* Brilliant gold gradient with warm honey and champagne tones */}
          <linearGradient id="artGoldGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" /> {/* yellow-300 */}
            <stop offset="30%" stopColor="#EAB308" /> {/* yellow-500 */}
            <stop offset="70%" stopColor="#CA8A04" /> {/* yellow-600 */}
            <stop offset="100%" stopColor="#854D0E" /> {/* yellow-800 */}
          </linearGradient>

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
  );
}
