import React from 'react';

interface MasinaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  lightText?: boolean;
  className?: string;
}

export default function MasinaLogo({
  size = 'md',
  showText = true,
  lightText = false,
  className = '',
}: MasinaLogoProps) {
  // Determine dimensions based on size prop and whether text is shown
  const logoDimensions = {
    sm: showText ? 'h-10 w-[148px]' : 'h-10 w-10',
    md: showText ? 'h-14 w-[208px]' : 'h-14 w-14',
    lg: showText ? 'h-20 w-[298px]' : 'h-20 w-20',
    xl: showText ? 'h-28 w-[418px]' : 'h-28 w-28',
  }[size];

  // If lightText is true, override the fill for classes in the SVG style
  const styleOverrides = lightText
    ? `
      .cls-21 { fill: #E2E8F0 !important; }
      .cls-25 { fill: #F8FAFC !important; }
      .cls-18 { fill: #F8FAFC !important; }
      .cls-13 { fill: #F8FAFC !important; }
      .cls-20 { fill: #F8FAFC !important; }
      .cls-10 { fill: #F8FAFC !important; }
      .cls-24 { fill: #F8FAFC !important; }
    `
    : '';

  const svgStyle = `
    .cls-1 { fill: url(#linear-gradient-15); }
    .cls-2 { fill: url(#linear-gradient-13); }
    .cls-3 { fill: url(#linear-gradient-2); }
    .cls-4 { fill: url(#linear-gradient-10); }
    .cls-5 { fill: url(#linear-gradient-12); }
    .cls-6 { fill: #2374bb; }
    .cls-7 { fill: url(#linear-gradient-4); }
    .cls-8 { fill: url(#linear-gradient-3); }
    .cls-9 { fill: url(#linear-gradient-5); }
    .cls-10 { fill: url(#linear-gradient-22); }
    .cls-11 { fill: url(#linear-gradient-8); }
    .cls-12 { fill: url(#linear-gradient-14); }
    .cls-13 { fill: url(#linear-gradient-20); }
    .cls-14 { fill: url(#linear-gradient-17); }
    .cls-15 { fill: url(#linear-gradient-7); }
    .cls-16 { fill: url(#linear-gradient-9); }
    .cls-17 { fill: url(#linear-gradient-11); }
    .cls-18 { fill: url(#linear-gradient-19); }
    .cls-19 { fill: url(#linear-gradient-6); }
    .cls-20 { fill: url(#linear-gradient-21); }
    .cls-21 { fill: #5b7248; }
    .cls-22 { fill: url(#linear-gradient-16); }
    .cls-23 { fill: url(#linear-gradient); }
    .cls-24 { fill: url(#linear-gradient-23); }
    .cls-25 { fill: url(#linear-gradient-18); }
    ${styleOverrides}
  `;

  return (
    <div className={`flex items-center ${className}`} id={`masina-logo-${size}`}>
      <svg
        id="Layer_1"
        data-name="Layer 1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={showText ? "0 0 781.19 210.73" : "0 0 195 210.73"}
        className={`${logoDimensions} shrink-0`}
      >
        <defs>
          <style dangerouslySetInnerHTML={{ __html: svgStyle }} />
          <linearGradient id="linear-gradient" x1="145.97" y1="12.41" x2="183.76" y2="12.41" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#597938"/>
            <stop offset="1" stopColor="#3d5728"/>
          </linearGradient>
          <linearGradient id="linear-gradient-2" x1="186.7" y1="151.66" x2="186.7" y2="21.67" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2a311d"/>
            <stop offset="1" stopColor="#3b4f29"/>
          </linearGradient>
          <linearGradient id="linear-gradient-3" x1="145.97" y1="16.78" x2="182.92" y2="16.78" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff"/>
            <stop offset="1" stopColor="#000"/>
          </linearGradient>
          <linearGradient id="linear-gradient-4" x1="56.82" y1="62.34" x2="189.71" y2="148.64" gradientUnits="userSpaceOnUse">
            <stop offset=".32" stopColor="#587839"/>
            <stop offset="1" stopColor="#262d1d"/>
          </linearGradient>
          <linearGradient id="linear-gradient-5" x1="108.16" y1="74.38" x2="182.92" y2="74.38" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#597938"/>
            <stop offset="1" stopColor="#567939"/>
          </linearGradient>
          <linearGradient id="linear-gradient-6" x1="62.95" y1="98.8" x2="182.92" y2="98.8" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#537d33"/>
            <stop offset="1" stopColor="#57763b"/>
          </linearGradient>
          <linearGradient id="linear-gradient-7" x1=".08" y1="11.82" x2="45.76" y2="11.82" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#527d35"/>
            <stop offset="1" stopColor="#518032"/>
          </linearGradient>
          <linearGradient id="linear-gradient-8" x1="43.62" y1="37.8" x2="121.68" y2="37.8" xlinkHref="#linear-gradient-5"/>
          <linearGradient id="linear-gradient-9" x1="96.62" y1="208.29" x2="1.75" y2="146.68" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#527531"/>
            <stop offset="1" stopColor="#517e2d"/>
          </linearGradient>
          <linearGradient id="linear-gradient-10" x1="3.27" y1="149.38" x2="3.27" y2="8.35" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5a7643"/>
            <stop offset="1" stopColor="#5b833d"/>
          </linearGradient>
          <linearGradient id="linear-gradient-11" x1="95.07" y1="183.45" x2="174.26" y2="183.45" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#587b39"/>
            <stop offset="1" stopColor="#557b32"/>
          </linearGradient>
          <linearGradient id="linear-gradient-12" x1="6.53" y1="18.88" x2="43.62" y2="18.88" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#577738"/>
            <stop offset="1" stopColor="#557a2d"/>
          </linearGradient>
          <linearGradient id="linear-gradient-13" x1="41.38" y1="45.07" x2="121.61" y2="45.07" xlinkHref="#linear-gradient-5"/>
          <linearGradient id="linear-gradient-14" x1="96.93" y1="200.39" x2="8.32" y2="142.85" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3f5c26"/>
            <stop offset="1" stopColor="#2c401a"/>
          </linearGradient>
          <linearGradient id="linear-gradient-15" x1="9.78" y1="145.8" x2="9.78" y2="15.29" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2c401a"/>
            <stop offset="1" stopColor="#4b6f2f"/>
          </linearGradient>
          <linearGradient id="linear-gradient-16" x1="94.07" y1="201.82" x2="165.25" y2="151.98" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3e6121"/>
            <stop offset=".87" stopColor="#547a33"/>
          </linearGradient>
          <linearGradient id="linear-gradient-17" x1="190.48" y1="7.97" x2="191.28" y2="7.97" xlinkHref="#linear-gradient-3"/>
          <linearGradient id="linear-gradient-18" x1="244.94" y1="111.86" x2="355.97" y2="34.11" xlinkHref="#linear-gradient-16"/>
          <linearGradient id="linear-gradient-19" x1="390.93" y1="98.14" x2="461.13" y2="48.99" xlinkHref="#linear-gradient-16"/>
          <linearGradient id="linear-gradient-20" x1="697.33" y1="98.14" x2="767.53" y2="48.99" xlinkHref="#linear-gradient-16"/>
          <linearGradient id="linear-gradient-21" x1="547.2" y1="71.98" x2="596.84" y2="37.22" xlinkHref="#linear-gradient-16"/>
          <linearGradient id="linear-gradient-22" x1="599.7" y1="86.66" x2="691.18" y2="22.61" xlinkHref="#linear-gradient-16"/>
          <linearGradient id="linear-gradient-23" x1="480.76" y1="77.05" x2="543.74" y2="32.95" xlinkHref="#linear-gradient-16"/>
        </defs>
        <line className="cls-6" x1="63.9" y1="61.32" x2="62.65" y2="60.48"/>
        <line className="cls-6" x1="123.54" y1="68.47" x2="122.53" y2="67.8"/>
        <g>
          <polygon className="cls-23" points="190.48 8.35 190.48 8.4 182.92 16.46 182.92 16.28 145.97 16.28 145.97 8.35 190.48 8.35"/>
          <path className="cls-3" d="M190.48,8.4v139.79c0,1.76-1.23,3.1-2.73,3.47l-4.83-11.25V16.46l7.56-8.06Z"/>
          <rect className="cls-8" x="145.97" y="16.28" width="36.95" height="1"/>
          <path className="cls-7" d="M187.76,151.66c-.9.22-1.9.1-2.8-.48L54.25,66.3l8.69-5.6,119.98,79.98v-.27l4.83,11.25Z"/>
          <polygon className="cls-9" points="182.92 16.28 182.92 140.41 177.18 127.05 177.3 127.13 177.3 22.48 149.6 22.48 121.97 39.67 108.16 31.61 145.54 8.35 145.97 8.35 145.97 16.28 182.92 16.28"/>
          <polygon className="cls-19" points="182.92 140.41 182.92 140.68 62.95 60.7 68.8 56.93 177.18 127.05 182.92 140.41"/>
          <polygon className="cls-15" points="45.76 8.44 43.62 15.29 6.53 15.29 .08 8.35 45.62 8.35 45.76 8.44"/>
          <polygon className="cls-11" points="121.68 57.68 121.61 67.15 43.91 15.29 43.62 15.29 45.76 8.44 121.68 57.68"/>
          <polygon className="cls-16" points="95.07 203.25 95.07 210.68 0 149.57 0 149.38 6.4 145.8 94.87 203.38 95.07 203.25"/>
          <polygon className="cls-4" points="6.29 15.29 6.29 145.73 6.4 145.8 0 149.38 0 8.35 .08 8.35 6.53 15.29 6.29 15.29"/>
          <polygon className="cls-17" points="174.26 160.14 95.15 210.73 95.07 210.68 95.07 203.25 168.19 156.18 174.26 160.14"/>
          <polygon className="cls-5" points="43.62 15.29 41.38 22.48 13.24 22.48 6.53 15.29 43.62 15.29"/>
          <polygon className="cls-2" points="121.61 67.15 121.56 74.86 41.41 22.48 41.38 22.48 43.62 15.29 43.91 15.29 121.61 67.15"/>
          <polygon className="cls-12" points="95.07 194.86 95.07 203.25 94.87 203.38 6.4 145.8 13.27 141.94 13.28 141.94 95.07 194.86"/>
          <polygon className="cls-1" points="13.19 141.88 13.27 141.94 6.4 145.8 6.29 145.73 6.29 15.29 6.53 15.29 13.24 22.48 13.19 22.48 13.19 141.88"/>
          <polygon className="cls-22" points="168.19 156.18 95.07 203.25 95.07 194.86 95.13 194.9 161.12 151.57 168.19 156.18"/>
          <line className="cls-14" x1="191.28" y1="7.54" x2="190.48" y2="8.4"/>
        </g>
        {showText && (
          <g>
            <polygon className="cls-25" points="378.4 100.27 369.02 100.27 337.82 29.74 307.58 99.09 276.82 29.96 246.09 100.27 236.82 100.27 276.35 8 307.42 77.8 337.37 7.54 378.4 100.27"/>
            <polygon className="cls-18" points="423.01 90.67 459.29 90.67 433.37 29.34 402.03 100.67 392.7 100.67 432.61 8.27 474.2 100.52 423.01 100.52 423.01 90.67"/>
            <polygon className="cls-13" points="729.41 90.67 765.69 90.67 739.77 29.34 708.43 100.67 699.1 100.67 739.01 8.27 780.6 100.52 729.41 100.52 729.41 90.67"/>
            <rect className="cls-20" x="567.28" y="8.54" width="9.47" height="92.13"/>
            <polygon className="cls-10" points="681.14 102.11 617.93 29.96 617.87 100.47 609.37 100.47 609.44 7.38 672.63 79.5 672.63 8.27 681.14 8.27 681.14 102.11"/>
            <path className="cls-24" d="M537.08,23.47s-9.07-14.37-24.67-14.6c-17.8-.27-21.93,14.6-21.93,14.6,0,0-4,13.73,8.6,23.33s29.77,19.02,29.87,30.47c.07,8-6.33,14.73-17.07,14.6-11.8-.15-19.8-14.4-19.8-14.4l-7.72,4.71s11.92,18.09,26.52,18.09,26.62-7.98,28.4-22.2c1.87-14.93-21.4-29-24.2-30.8s-18.07-9.6-14.64-21.7c3-10.6,21.04-10.56,28.64,2.7l8-4.8Z"/>
            <g>
              <path className="cls-21" d="M255.82,144.35h-12.77l-3.6,8.58h-3.69l13.81-31.91,13.45,31.91h-3.69l-3.51-8.58ZM254.52,141.16l-5.04-12.19-5.13,12.19h10.16Z"/>
              <path className="cls-21" d="M271.18,135.64v17.3h-3.75v-17.3h-2.29v-3.27h2.29v-7.43h3.75v7.43h3.75v3.27h-3.75Z"/>
              <path className="cls-21" d="M284.73,135.64v17.3h-3.75v-17.3h-2.29v-3.27h2.29v-7.43h3.75v7.43h3.75v3.27h-3.75Z"/>
              <path className="cls-21" d="M291.68,142.43c0-6.07,4.51-10.56,10.67-10.56s10.67,4.48,10.67,10.56-4.56,10.51-10.67,10.51-10.67-4.44-10.67-10.51ZM295.27,142.43c0,4.92,3.49,7.42,7.08,7.42s7.08-2.55,7.08-7.42-3.4-7.47-7.08-7.47-7.08,2.6-7.08,7.47Z"/>
              <path className="cls-21" d="M316.23,132.35h3.32v2.17c.32-.53,1.75-2.65,4.33-2.65,1.01,0,2.12.38,2.95.82l-1.57,3.13c-.74-.53-1.43-.67-1.94-.67-1.34,0-2.17.58-2.67,1.25-.55.77-1.11,2.12-1.11,5.4v10.55h-3.32v-20Z"/>
              <path className="cls-21" d="M329.42,132.37h3.9v2.38c.7-.84,2.71-2.87,6.45-2.87,2.66,0,5.1.99,6.45,2.83,1.14,1.54,1.3,3.22,1.3,5.5v12.74h-3.9v-12.64c0-1.24-.11-2.68-1.03-3.77-.76-.89-1.95-1.49-3.69-1.49-1.36,0-2.82.35-3.96,1.59-1.52,1.64-1.63,4.06-1.63,5.55v10.76h-3.9v-20.57Z"/>
              <path className="cls-21" d="M372.85,147.83c-.63,1.15-1.57,2.4-2.67,3.35-1.99,1.7-4.46,2.55-7.23,2.55-5.24,0-10.75-3.15-10.75-10.86,0-6.21,3.98-11.01,10.54-11.01,4.25,0,6.92,2,8.23,3.8,1.36,1.85,2.15,5.05,2.04,7.81h-16.93c.05,4.3,3.14,7.06,6.92,7.06,1.78,0,3.2-.5,4.46-1.5,1-.8,1.78-1.85,2.25-2.85l3.14,1.65ZM369.13,140.48c-.63-3.25-3.2-5.4-6.39-5.4s-5.82,2.3-6.39,5.4h12.79Z"/>
              <path className="cls-21" d="M384.83,149.92l-8.3-16.82h3.56l6.38,13.29,5.86-13.29h3.47l-13.25,28.85h-3.47l5.73-12.03Z"/>
              <path className="cls-21" d="M406.36,137.11c-.46-1.19-1.43-2.08-2.67-2.08s-2.3.74-2.3,2.32c0,1.48.92,1.93,3.09,2.92,2.77,1.24,4.06,2.18,4.79,3.16.83,1.09,1.01,2.18,1.01,3.31,0,4.3-2.9,6.72-6.59,6.72-.78,0-5.07-.1-6.68-5.24l2.86-1.29c.37,1.09,1.47,3.36,3.87,3.36,2.17,0,3.13-1.73,3.13-3.26,0-1.93-1.29-2.57-3.09-3.41-2.3-1.09-3.78-1.88-4.66-3.02-.74-.99-.88-1.98-.88-3.02,0-3.61,2.35-5.73,5.58-5.73,1.01,0,3.73.2,5.26,3.71l-2.72,1.53Z"/>
              <path className="cls-21" d="M441.58,132.37h3.71v11.95s-.05,9.85-10.8,9.85c-5.41,0-10.62-4.14-10.62-11.44s4.94-10.86,10.4-10.86c4.12,0,6.33,2.2,7.31,3.45v-2.95ZM427.68,142.73c0,4.45,2.57,7.81,7,7.81s7.11-3.65,7.11-7.76c0-5.35-3.81-7.71-7.11-7.71-3.66,0-7,2.6-7,7.66Z"/>
              <path className="cls-21" d="M676.18,132.37h3.71v11.95s-.05,9.85-10.8,9.85c-5.41,0-10.62-4.14-10.62-11.44s4.94-10.86,10.4-10.86c4.12,0,6.33,2.2,7.31,3.45v-2.95ZM662.28,142.73c0,4.45,2.57,7.81,7,7.81s7.11-3.65,7.11-7.76c0-5.35-3.81-7.71-7.11-7.71-3.66,0-7,2.6-7,7.66Z"/>
              <path className="cls-21" d="M450.05,132.49h4.17v2.35c.75-.83,2.9-2.84,6.9-2.84,2.84,0,5.45.98,6.9,2.79,1.22,1.52,1.39,3.18,1.39,5.43v12.56h-4.18v-12.47c0-1.22-.12-2.64-1.1-3.72-.81-.88-2.09-1.47-3.94-1.47-1.45,0-3.02.34-4.23,1.56-1.62,1.61-1.74,4.01-1.74,5.48v10.61h-4.17v-20.29Z"/>
              <path className="cls-21" d="M491.61,119.71h3.95v33.09h-3.95v-2.63c-1.31,1.41-3.78,3.18-7.78,3.18-5.76,0-11.07-3.36-11.07-9.98s5.26-9.85,11.07-9.85c4.38,0,6.74,2,7.78,3.13v-16.93ZM476.81,143.35c0,4.04,2.74,7.08,7.45,7.08s7.56-3.31,7.56-7.03c0-4.86-4.06-6.99-7.56-6.99-3.89,0-7.45,2.36-7.45,6.94Z"/>
              <path className="cls-21" d="M536.34,130.61c-.99-.91-2.5-2-4.1-2.7-1.65-.69-3.58-1.13-5.42-1.13-7.26,0-12.63,5.39-12.63,12.09,0,7.87,6.92,11.83,12.67,11.83,2.12,0,4.19-.57,5.84-1.35,1.79-.83,3.06-1.91,3.63-2.43v4c-3.49,2.3-7.11,2.83-9.47,2.83-9.33,0-16.25-6.52-16.25-14.91s7.02-15.09,16.44-15.09c1.88,0,5.51.22,9.28,2.87v4Z"/>
              <path className="cls-21" d="M542.1,142.49c0-6.27,4.36-10.89,10.33-10.89s10.33,4.63,10.33,10.89-4.41,10.84-10.33,10.84-10.33-4.58-10.33-10.84ZM545.57,142.49c0,5.07,3.38,7.66,6.85,7.66s6.85-2.64,6.85-7.66-3.29-7.71-6.85-7.71-6.85,2.68-6.85,7.71Z"/>
              <path className="cls-21" d="M568.09,132.09h3.85v2.34c.7-.83,2.68-2.83,6.37-2.83,2.62,0,5.03.98,6.37,2.78,1.12,1.51,1.28,3.17,1.28,5.42v12.55h-3.85v-12.45c0-1.22-.11-2.64-1.02-3.71-.75-.88-1.93-1.46-3.64-1.46-1.34,0-2.78.34-3.9,1.56-1.5,1.61-1.61,4-1.61,5.47v10.59h-3.85v-20.26Z"/>
              <path className="cls-21" d="M594.25,133.54l5.72,12.33,5.72-12.33h3.69l-9.4,19.47-9.4-19.47h3.69Z"/>
              <path className="cls-21" d="M633.11,147.47c-.64,1.14-1.61,2.39-2.74,3.33-2.04,1.69-4.56,2.54-7.4,2.54-5.37,0-11-3.13-11-10.79,0-6.17,4.08-10.94,10.78-10.94,4.35,0,7.08,1.99,8.42,3.78,1.4,1.84,2.2,5.02,2.09,7.76h-17.33c.05,4.28,3.22,7.01,7.08,7.01,1.82,0,3.27-.5,4.56-1.49,1.02-.8,1.82-1.84,2.31-2.83l3.22,1.64ZM629.3,140.16c-.64-3.23-3.27-5.37-6.55-5.37s-5.96,2.29-6.54,5.37h13.09Z"/>
              <path className="cls-21" d="M644.7,150.1l-8.8-16.56h3.78l6.78,13.08,6.22-13.08h3.69l-14.06,28.41h-3.69l6.08-11.85Z"/>
              <path className="cls-21" d="M685.44,132.99h3.82v2.18c.69-.77,2.65-2.63,6.31-2.63,2.6,0,4.98.91,6.31,2.59,1.11,1.41,1.27,2.95,1.27,5.04v11.66h-3.82v-11.57c0-1.13-.11-2.45-1.01-3.45-.74-.82-1.91-1.36-3.61-1.36-1.33,0-2.76.32-3.87,1.45-1.49,1.5-1.59,3.72-1.59,5.08v9.85h-3.82v-18.83Z"/>
              <path className="cls-21" d="M727.52,137.87c-2.1-2.39-5.14-3.08-7.19-3.08-4.26,0-8.13,2.68-8.13,7.71s3.98,7.66,8.08,7.66c2.38,0,5.31-.94,7.41-3.23v4.28c-2.49,1.64-5.14,2.14-7.3,2.14-7.14,0-12.28-4.58-12.28-10.79s5.2-10.94,12.28-10.94c3.65,0,6.03,1.29,7.14,1.99v4.28Z"/>
              <path className="cls-21" d="M753.16,147.47c-.64,1.14-1.6,2.39-2.71,3.33-2.02,1.69-4.52,2.54-7.34,2.54-5.32,0-10.9-3.13-10.9-10.79,0-6.17,4.04-10.94,10.68-10.94,4.31,0,7.02,1.99,8.35,3.78,1.38,1.84,2.18,5.02,2.07,7.76h-17.17c.05,4.28,3.19,7.01,7.02,7.01,1.81,0,3.24-.5,4.52-1.49,1.01-.8,1.81-1.84,2.29-2.83l3.19,1.64ZM749.39,140.16c-.64-3.23-3.24-5.37-6.49-5.37s-5.9,2.29-6.48,5.37h12.97Z"/>
              <path className="cls-21" d="M757.32,132.99h3.32v2.04c.32-.5,1.75-2.5,4.33-2.5,1.01,0,2.12.36,2.95.77l-1.57,2.95c-.74-.5-1.43-.63-1.94-.63-1.34,0-2.17.54-2.67,1.18-.55.73-1.11,2-1.11,5.08v9.94h-3.32v-18.83Z"/>
              <path className="cls-21" d="M777.28,137.38c-.46-1.16-1.43-2.02-2.67-2.02s-2.3.72-2.3,2.27c0,1.45.92,1.88,3.09,2.84,2.77,1.21,4.06,2.12,4.79,3.09.83,1.06,1.01,2.12,1.01,3.23,0,4.19-2.9,6.56-6.59,6.56-.78,0-5.07-.1-6.68-5.11l2.86-1.25c.37,1.06,1.47,3.28,3.87,3.28,2.17,0,3.13-1.69,3.13-3.18,0-1.88-1.29-2.51-3.09-3.33-2.3-1.06-3.78-1.83-4.66-2.94-.74-.96-.88-1.93-.88-2.94,0-3.52,2.35-5.59,5.58-5.59,1.01,0,3.73.19,5.26,3.62l-2.72,1.49Z"/>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
