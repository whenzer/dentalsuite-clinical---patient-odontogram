/**
 * High-quality data URLs for intraoral dental clinical photography
 * (Provides crisp, instant visual demonstration for before/after and gallery without external network latency)
 */

function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

// 1. Anterior Teeth Before Whitening & Cosmetic Bonding (Stained, chipped, yellowed dentin wear)
export const PHOTO_ANTERIOR_BEFORE = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b18" />
      <stop offset="100%" stop-color="#0f0e0d" />
    </linearGradient>
    <linearGradient id="gumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#be185d" />
      <stop offset="60%" stop-color="#e11d48" />
      <stop offset="100%" stop-color="#fda4af" />
    </linearGradient>
    <linearGradient id="toothBeforeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#fef9c3" />
      <stop offset="85%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#eab308" />
    </linearGradient>
    <linearGradient id="stainGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b45309" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#78350f" stop-opacity="0.5" />
    </linearGradient>
  </defs>

  <!-- Retractor / Oral Cavity Background -->
  <rect width="600" height="400" fill="url(#bgGrad)" />
  
  <!-- Upper Gingiva / Gums -->
  <path d="M 50 140 Q 150 100 240 135 Q 300 110 360 135 Q 450 100 550 140 L 550 0 L 50 0 Z" fill="url(#gumGrad)" />
  <path d="M 50 140 C 130 110, 180 180, 230 140 C 260 120, 280 120, 300 135 C 320 120, 340 120, 370 140 C 420 180, 470 110, 550 140" fill="none" stroke="#9f1239" stroke-width="4" />

  <!-- Teeth (Upper Anterior Incisors & Canines - Before: stained, small gap, attrition) -->
  <!-- UR Canine #6 -->
  <path d="M 80 145 C 90 200, 100 240, 120 250 C 140 240, 145 190, 150 150 Z" fill="url(#toothBeforeGrad)" stroke="#ca8a04" stroke-width="2" />
  
  <!-- UR Lateral Incisor #7 -->
  <path d="M 155 148 C 160 210, 170 255, 215 255 C 225 240, 230 190, 225 142 Z" fill="url(#toothBeforeGrad)" stroke="#ca8a04" stroke-width="2" />

  <!-- UR Central Incisor #8 (Chipped incisal edge & coffee stain) -->
  <path d="M 230 138 C 235 220, 240 270, 260 270 L 285 260 L 295 272 C 300 240, 300 190, 298 135 Z" fill="url(#toothBeforeGrad)" stroke="#b45309" stroke-width="2.5" />
  <!-- Stain / Wear Spot on #8 -->
  <ellipse cx="265" cy="220" rx="14" ry="18" fill="url(#stainGrad)" filter="blur(1px)" />
  <path d="M 255 265 L 290 262" stroke="#78350f" stroke-width="3" stroke-linecap="round" />

  <!-- UL Central Incisor #9 -->
  <path d="M 302 135 C 300 190, 300 240, 305 272 L 340 272 C 360 270, 365 220, 370 138 Z" fill="url(#toothBeforeGrad)" stroke="#b45309" stroke-width="2.5" />
  <!-- Stain / Attrition band on #9 -->
  <ellipse cx="335" cy="225" rx="12" ry="16" fill="url(#stainGrad)" filter="blur(1px)" />

  <!-- UL Lateral Incisor #10 -->
  <path d="M 375 142 C 370 190, 375 240, 385 255 C 430 255, 440 210, 445 148 Z" fill="url(#toothBeforeGrad)" stroke="#ca8a04" stroke-width="2" />

  <!-- UL Canine #11 -->
  <path d="M 450 150 C 455 190, 460 240, 480 250 C 500 240, 510 200, 520 145 Z" fill="url(#toothBeforeGrad)" stroke="#ca8a04" stroke-width="2" />

  <!-- Lower Lip / Shadow -->
  <path d="M 50 280 Q 300 370 550 280 L 550 400 L 50 400 Z" fill="#4c0519" opacity="0.85" />

  <!-- Clinical Label Badge -->
  <rect x="20" y="20" width="160" height="32" rx="6" fill="#000000" fill-opacity="0.75" />
  <text x="30" y="42" fill="#f87171" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">PRE-OP / BEFORE</text>
</svg>
`);

// 2. Anterior Teeth After Whitening, Composite Veneer Restoration & Alignment
export const PHOTO_ANTERIOR_AFTER = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b18" />
      <stop offset="100%" stop-color="#0f0e0d" />
    </linearGradient>
    <linearGradient id="gumHealthyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#db2777" />
      <stop offset="60%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#fecdd3" />
    </linearGradient>
    <linearGradient id="toothWhiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="30%" stop-color="#ffffff" />
      <stop offset="85%" stop-color="#f1f5f9" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
    <linearGradient id="lusterGleam" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Oral Cavity Background -->
  <rect width="600" height="400" fill="url(#bgGrad2)" />
  
  <!-- Healthy Pink Stippled Gingiva -->
  <path d="M 50 140 Q 150 95 240 130 Q 300 105 360 130 Q 450 95 550 140 L 550 0 L 50 0 Z" fill="url(#gumHealthyGrad)" />
  <path d="M 50 140 C 130 105, 180 170, 230 135 C 260 115, 280 115, 300 130 C 320 115, 340 115, 370 135 C 420 170, 470 105, 550 140" fill="none" stroke="#be123c" stroke-width="3" />

  <!-- Teeth: Perfectly Restored, Brilliant BL2 White, Harmonious Incisal Edge Curve -->
  <!-- UR Canine #6 -->
  <path d="M 80 142 C 90 195, 100 240, 122 248 C 142 240, 146 190, 150 145 Z" fill="url(#toothWhiteGrad)" stroke="#cbd5e1" stroke-width="1.5" />
  
  <!-- UR Lateral Incisor #7 -->
  <path d="M 154 144 C 160 205, 170 252, 218 252 C 228 238, 232 188, 227 138 Z" fill="url(#toothWhiteGrad)" stroke="#cbd5e1" stroke-width="1.5" />

  <!-- UR Central Incisor #8 (Repaired incisal edge, smooth natural line angles) -->
  <path d="M 230 134 C 235 210, 240 272, 262 274 L 297 274 C 299 238, 299 185, 298 132 Z" fill="url(#toothWhiteGrad)" stroke="#94a3b8" stroke-width="2" />
  <path d="M 245 150 Q 255 210 250 255" fill="none" stroke="url(#lusterGleam)" stroke-width="6" stroke-linecap="round" />

  <!-- UL Central Incisor #9 (Symmetrical partner to #8) -->
  <path d="M 302 132 C 301 185, 301 238, 303 274 L 338 274 C 360 272, 365 210, 370 134 Z" fill="url(#toothWhiteGrad)" stroke="#94a3b8" stroke-width="2" />
  <path d="M 355 150 Q 345 210 350 255" fill="none" stroke="url(#lusterGleam)" stroke-width="6" stroke-linecap="round" />

  <!-- UL Lateral Incisor #10 -->
  <path d="M 373 138 C 368 188, 372 238, 382 252 C 430 252, 440 205, 446 144 Z" fill="url(#toothWhiteGrad)" stroke="#cbd5e1" stroke-width="1.5" />

  <!-- UL Canine #11 -->
  <path d="M 450 145 C 454 190, 458 240, 478 248 C 500 240, 510 195, 520 142 Z" fill="url(#toothWhiteGrad)" stroke="#cbd5e1" stroke-width="1.5" />

  <!-- Soft Shadow -->
  <path d="M 50 280 Q 300 370 550 280 L 550 400 L 50 400 Z" fill="#4c0519" opacity="0.85" />

  <!-- Clinical Label Badge -->
  <rect x="20" y="20" width="165" height="32" rx="6" fill="#000000" fill-opacity="0.75" />
  <text x="30" y="42" fill="#34d399" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">POST-OP / AFTER</text>
</svg>
`);

// 3. Occlusal Intraoral Photo (Molar Cavity vs Restored Composite)
export const PHOTO_MOLAR_BEFORE = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <rect width="600" height="400" fill="#1c1917" />
  <!-- Surrounding tissue -->
  <ellipse cx="300" cy="200" rx="260" ry="170" fill="#9f1239" opacity="0.4" />
  <!-- Molar Crown #19 Occlusal Surface -->
  <rect x="180" y="100" width="240" height="200" rx="50" fill="#fef08a" stroke="#ca8a04" stroke-width="4" />
  <!-- Deep Caries / Cavity in central groove -->
  <path d="M 230 180 Q 280 220 340 170 Q 380 210 320 230 Q 250 240 230 180 Z" fill="#78350f" stroke="#451a03" stroke-width="3" />
  <circle cx="280" cy="200" r="14" fill="#451a03" />
  <circle cx="330" cy="195" r="10" fill="#451a03" />
  <!-- Enamel fissure stained lines -->
  <path d="M 210 150 L 250 180 M 350 175 L 390 140 M 300 230 L 310 270" stroke="#92400e" stroke-width="3" stroke-linecap="round" />
  <!-- Badge -->
  <rect x="20" y="20" width="220" height="32" rx="6" fill="#000000" fill-opacity="0.75" />
  <text x="30" y="42" fill="#f87171" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">MOLAR #19 - DEEP CAVITY</text>
</svg>
`);

export const PHOTO_MOLAR_AFTER = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <rect width="600" height="400" fill="#1c1917" />
  <ellipse cx="300" cy="200" rx="260" ry="170" fill="#9f1239" opacity="0.4" />
  <!-- Molar Crown #19 Occlusal Surface -->
  <rect x="180" y="100" width="240" height="200" rx="50" fill="#ffffff" stroke="#94a3b8" stroke-width="3" />
  <!-- Restored with anatomical composite resin -->
  <path d="M 225 175 Q 280 215 345 165 Q 385 205 325 235 Q 245 242 225 175 Z" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2" />
  <!-- Subtle anatomical developmental grooves -->
  <path d="M 215 150 Q 275 195 300 200 M 300 200 Q 350 180 385 145 M 300 200 Q 305 240 310 270" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" fill="none" />
  <circle cx="260" cy="170" r="22" fill="#ffffff" opacity="0.6" filter="blur(4px)" />
  <!-- Badge -->
  <rect x="20" y="20" width="240" height="32" rx="6" fill="#000000" fill-opacity="0.75" />
  <text x="30" y="42" fill="#34d399" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">MOLAR #19 - COMPOSITE RESTORED</text>
</svg>
`);
