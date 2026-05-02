function storkSVG() {
  return '<img src="./assets/stork.png" width="100" height="100" alt="stork" style="object-fit:contain;">';
}

function girlSVG(size) {
  size = size||52;
  return `<svg width="${size}" height="${size}" viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="46" r="38" fill="#FEF8FB"/>
    <path d="M16 48 Q13 66 24 76 Q40 86 56 76 Q67 66 64 48 Q56 34 40 32 Q24 34 16 48 Z" fill="#FDE8F2" stroke="#D4789A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M23 52 Q40 45 57 52" fill="none" stroke="#F0C0D8" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="40" cy="30" rx="18" ry="16" fill="#FFF0E8" stroke="#D4789A" stroke-width="1.8"/>
    <ellipse cx="30" cy="33" rx="4.5" ry="3" fill="#F5B8CF" opacity="0.55"/>
    <ellipse cx="50" cy="33" rx="4.5" ry="3" fill="#F5B8CF" opacity="0.55"/>
    <path d="M33 23 Q36 27 39 23" fill="none" stroke="#C09090" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M41 23 Q44 27 47 23" fill="none" stroke="#C09090" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M38 28 Q40 30 42 28" fill="none" stroke="#C8A0A0" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M34 35 Q40 39 46 35" fill="none" stroke="#C8A0A0" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M30 15 Q35 20 40 17 Q45 20 50 15 Q45 10 40 14 Q35 10 30 15 Z" fill="#F9C8DF" stroke="#D4789A" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="40" cy="15" r="3" fill="#F0A8C4" stroke="#D4789A" stroke-width="1.1"/>
    <path d="M16 60 Q7 56 9 48 Q13 43 17 50" fill="#FFF0E8" stroke="#D4789A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M64 60 Q73 56 71 48 Q67 43 63 50" fill="#FFF0E8" stroke="#D4789A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function boySVG(size) {
  size = size||52;
  return `<svg width="${size}" height="${size}" viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="46" r="38" fill="#F2FAFD"/>
    <path d="M16 50 Q13 68 24 78 Q40 88 56 78 Q67 68 64 50 Q56 36 40 34 Q24 36 16 50 Z" fill="#E4F3FA" stroke="#5A9DC8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M23 54 Q40 47 57 54" fill="none" stroke="#AADCF0" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M21 66 Q40 60 59 66" fill="none" stroke="#AADCF0" stroke-width="1.1" stroke-linecap="round" opacity="0.7"/>
    <ellipse cx="40" cy="32" rx="18" ry="16" fill="#FFF0E8" stroke="#5A9DC8" stroke-width="1.8"/>
    <ellipse cx="30" cy="35" rx="4.5" ry="3" fill="#8EC4E4" opacity="0.45"/>
    <ellipse cx="50" cy="35" rx="4.5" ry="3" fill="#8EC4E4" opacity="0.45"/>
    <path d="M33 25 Q36 29 39 25" fill="none" stroke="#8AAABB" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M41 25 Q44 29 47 25" fill="none" stroke="#8AAABB" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M38 30 Q40 32 42 30" fill="none" stroke="#9AAABB" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M34 37 Q40 41 46 37" fill="none" stroke="#9AAABB" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M22 18 Q20 8 40 4 Q60 8 58 18 Z" fill="#8EC4E4" stroke="#5A9DC8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 18 Q40 24 60 18" fill="#C0DFF0" stroke="#5A9DC8" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="40" cy="4" r="4.5" fill="#C0DFF0" stroke="#5A9DC8" stroke-width="1.4"/>
    <path d="M16 62 Q7 58 9 50 Q13 45 17 52" fill="#FFF0E8" stroke="#5A9DC8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M64 62 Q73 58 71 50 Q67 45 63 52" fill="#FFF0E8" stroke="#5A9DC8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
