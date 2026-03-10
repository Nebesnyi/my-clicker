import { useState, useEffect, useRef, useCallback } from "react";

const THEME = {
  primary:   "#f472b6",
  secondary: "#a78bfa",
  mint:      "#34d399",
  text:      "#5b2d6e",
  textLight: "#c084fc",
  border:    "rgba(244,114,182,0.25)",
  shadow:    "rgba(244,114,182,0.3)",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ОБЛАЧНАЯ ТАБЛИЦА ЛИДЕРОВ (shared storage)
// Fallback на localStorage при запуске вне Claude
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const LEADERBOARD_KEY = "clicker-marshmallow-leaderboard-v3";

// Определяем, доступен ли window.storage (только внутри артефактов Claude)
const isCloudAvailable = () => typeof window !== "undefined" && typeof window.storage?.get === "function";

// Локальное хранилище как fallback
const localStore = {
  get(key) {
    try { const v = localStorage.getItem(key); return v ? { value: v } : null; }
    catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); return { value }; }
    catch { return null; }
  }
};

async function loadLeaderboard() {
  try {
    const r = isCloudAvailable()
      ? await window.storage.get(LEADERBOARD_KEY, true)
      : localStore.get(LEADERBOARD_KEY);
    return r ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}

async function saveToLeaderboard(name, score) {
  const board = await loadLeaderboard();
  const idx = board.findIndex(e => e.name === name);
  if (idx >= 0) {
    if (score > board[idx].score) board[idx].score = score;
  } else {
    board.push({ name, score });
  }
  board.sort((a, b) => b.score - a.score);
  const top = board.slice(0, 10);
  if (isCloudAvailable()) {
    await window.storage.set(LEADERBOARD_KEY, JSON.stringify(top), true);
  } else {
    localStore.set(LEADERBOARD_KEY, JSON.stringify(top));
  }
  return top;
}

const UPGRADES = [
  { id:1, emoji:"🍭", label:"Леденец",   cost:15,  cps:1,  power:0, desc:"+1 зефирка/сек" },
  { id:2, emoji:"🍫", label:"Шоколадка", cost:30,  cps:0,  power:1, desc:"+1 к силе клика" },
  { id:3, emoji:"🧁", label:"Кекс",      cost:100, cps:5,  power:0, desc:"+5 зефирок/сек" },
  { id:4, emoji:"🍰", label:"Торт",      cost:250, cps:0,  power:5, desc:"+5 к силе клика" },
  { id:5, emoji:"🏭", label:"Фабрика",   cost:500, cps:20, power:0, desc:"+20 зефирок/сек" },
];
const MEDAL = ["🥇","🥈","🥉"];

const BG_PAWS = [
  { x:"4%",  y:"6%",  r:15,  s:0.6,  op:0.20, dur:5.2 },
  { x:"91%", y:"11%", r:-20, s:0.5,  op:0.20, dur:6.1 },
  { x:"87%", y:"33%", r:30,  s:0.7,  op:0.20, dur:4.8 },
  { x:"2%",  y:"42%", r:-10, s:0.55, op:0.20, dur:5.7 },
  { x:"14%", y:"63%", r:25,  s:0.6,  op:0.20, dur:6.4 },
  { x:"79%", y:"58%", r:-25, s:0.65, op:0.20, dur:5.0 },
  { x:"49%", y:"4%",  r:10,  s:0.5,  op:0.20, dur:7.0 },
  { x:"94%", y:"79%", r:20,  s:0.6,  op:0.20, dur:4.5 },
  { x:"7%",  y:"87%", r:-15, s:0.7,  op:0.20, dur:5.9 },
  { x:"44%", y:"91%", r:35,  s:0.5,  op:0.20, dur:6.6 },
  { x:"69%", y:"19%", r:-30, s:0.55, op:0.20, dur:5.3 },
  { x:"24%", y:"28%", r:20,  s:0.45, op:0.20, dur:7.2 },
];

const ACCESSORIES = [
  {
    id:"bow", slot:"head", name:"Бантик", emoji:"🎀", cost:50,
    render: () => (
      <g transform="translate(55,30)">
        <ellipse cx="-10" cy="0" rx="9" ry="6" fill="#f472b6" stroke="#be185d" strokeWidth="1.2" transform="rotate(-20 -10 0)"/>
        <ellipse cx="10"  cy="0" rx="9" ry="6" fill="#f472b6" stroke="#be185d" strokeWidth="1.2" transform="rotate(20 10 0)"/>
        <circle cx="0" cy="0" r="4" fill="#fb7185" stroke="#be185d" strokeWidth="1"/>
        <ellipse cx="-2" cy="-1" rx="2" ry="1.2" fill="rgba(255,255,255,0.6)"/>
      </g>
    ),
  },
  {
    id:"crown", slot:"head", name:"Корона", emoji:"👑", cost:300,
    render: () => (
      <g transform="translate(55,24)">
        <rect x="-20" y="2" width="40" height="8" rx="2" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2"/>
        <polygon points="-20,2 -14,-10 -8,2"  fill="#fbbf24" stroke="#d97706" strokeWidth="1.2"/>
        <polygon points="-4,2   0,-14   4,2"   fill="#fbbf24" stroke="#d97706" strokeWidth="1.2"/>
        <polygon points="8,2   14,-10  20,2"   fill="#fbbf24" stroke="#d97706" strokeWidth="1.2"/>
        <circle cx="-14" cy="-4" r="3" fill="#f87171"/>
        <circle cx="0"   cy="-7" r="3.5" fill="#34d399"/>
        <circle cx="14"  cy="-4" r="3" fill="#60a5fa"/>
        <ellipse cx="-14" cy="-5.5" rx="1.2" ry="0.8" fill="rgba(255,255,255,0.7)"/>
        <ellipse cx="0"   cy="-8.5" rx="1.4" ry="0.9" fill="rgba(255,255,255,0.7)"/>
        <ellipse cx="14"  cy="-5.5" rx="1.2" ry="0.8" fill="rgba(255,255,255,0.7)"/>
      </g>
    ),
  },
  {
    id:"chefhat", slot:"head", name:"Колпак повара", emoji:"👨‍🍳", cost:120,
    render: () => (
      <g transform="translate(55,24)">
        <rect x="-18" y="4" width="36" height="8" rx="3" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
        <ellipse cx="0" cy="4" rx="15" ry="18" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
        <rect x="-18" y="4" width="36" height="3" rx="1" fill="#f9a8d4" opacity="0.7"/>
      </g>
    ),
  },
  {
    id:"tophat", slot:"head", name:"Цилиндр", emoji:"🎩", cost:200,
    render: () => (
      <g transform="translate(55,22)">
        <rect x="-22" y="6" width="44" height="5" rx="2" fill="#1e1b4b" stroke="#312e81" strokeWidth="1"/>
        <rect x="-14" y="-14" width="28" height="22" rx="3" fill="#1e1b4b" stroke="#312e81" strokeWidth="1.5"/>
        <rect x="-14" y="-14" width="28" height="5" rx="2" fill="#4f46e5" opacity="0.5"/>
        <line x1="-14" y1="-3" x2="14" y2="-3" stroke="#7c3aed" strokeWidth="1.5" opacity="0.6"/>
      </g>
    ),
  },
  {
    id:"halo", slot:"head", name:"Нимб", emoji:"😇", cost:250,
    render: () => (
      <g transform="translate(55,26)">
        <ellipse cx="0" cy="0" rx="18" ry="5" fill="none" stroke="#fde68a" strokeWidth="3.5" opacity="0.9"/>
        <ellipse cx="0" cy="0" rx="18" ry="5" fill="none" stroke="#fbbf24" strokeWidth="1.5"/>
        <ellipse cx="-4" cy="-1" rx="4" ry="1.5" fill="rgba(253,230,138,0.5)"/>
      </g>
    ),
  },
  {
    id:"flowers", slot:"head", name:"Венок", emoji:"🌸", cost:80,
    render: () => (
      <g transform="translate(55,32)">
        {[-16,-8,0,8,16].map((x,i) => (
          <g key={i} transform={`translate(${x},0)`}>
            {[0,72,144,216,288].map(a=>(
              <ellipse key={a} cx={Math.cos(a*Math.PI/180)*4} cy={-4+Math.sin(a*Math.PI/180)*4}
                rx="2.5" ry="1.8" fill={["#f472b6","#fb923c","#a78bfa","#34d399","#fbbf24"][i]}
                transform={`rotate(${a} ${Math.cos(a*Math.PI/180)*4} ${-4+Math.sin(a*Math.PI/180)*4})`}/>
            ))}
            <circle cx="0" cy="-4" r="2" fill="#fde68a"/>
          </g>
        ))}
      </g>
    ),
  },
  {
    id:"scarf", slot:"body", name:"Шарф", emoji:"🧣", cost:70,
    render: () => (
      <g transform="translate(55,82)">
        <path d="M -22 0 Q 0 6 22 0 Q 0 -4 -22 0Z" fill="#f87171" stroke="#dc2626" strokeWidth="1"/>
        <path d="M 14 -1 Q 18 8 12 18" stroke="#f87171" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <path d="M 14 -1 Q 18 8 12 18" stroke="#dc2626" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {[-10,0,10].map(x=>(
          <line key={x} x1={x} y1="-2" x2={x} y2="3" stroke="#fca5a5" strokeWidth="1.5"/>
        ))}
      </g>
    ),
  },
  {
    id:"tuxedo", slot:"body", name:"Смокинг", emoji:"🤵", cost:350,
    render: () => (
      <g transform="translate(55,95)">
        <path d="M -18 -20 L -18 15 Q 0 20 18 15 L 18 -20 Q 0 -15 -18 -20Z" fill="#1e1b4b" stroke="#312e81" strokeWidth="1"/>
        <path d="M -6 -20 L 0 -5 L 6 -20" fill="white" stroke="#e5e7eb" strokeWidth="0.5"/>
        <circle cx="-2" cy="0" r="2" fill="#fbbf24"/>
        <circle cx="-2" cy="7" r="2" fill="#fbbf24"/>
        <circle cx="-2" cy="14" r="2" fill="#fbbf24"/>
      </g>
    ),
  },
  {
    id:"hoodie", slot:"body", name:"Худи", emoji:"👕", cost:100,
    render: () => (
      <g transform="translate(55,95)">
        <path d="M -22 -22 Q -28 -10 -26 15 Q 0 22 26 15 Q 28 -10 22 -22 Q 10 -15 0 -12 Q -10 -15 -22 -22Z"
          fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.2"/>
        <path d="M -10 -22 Q 0 -10 10 -22" fill="#7c3aed" stroke="#5b21b6" strokeWidth="1"/>
        <ellipse cx="0" cy="5" rx="6" ry="4" fill="#7c3aed" opacity="0.5"/>
      </g>
    ),
  },
  {
    id:"heart", slot:"body", name:"Сердечко", emoji:"💝", cost:60,
    render: () => (
      <g transform="translate(55,97)">
        <path d="M 0 6 C -12 -2 -14 -12 -8 -14 C -4 -15 0 -10 0 -8 C 0 -10 4 -15 8 -14 C 14 -12 12 -2 0 6Z"
          fill="#fb7185" stroke="#f43f5e" strokeWidth="1"/>
        <path d="M -4 -8 C -6 -11 -9 -11 -9 -8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </g>
    ),
  },
  {
    id:"wings", slot:"back", name:"Крылья", emoji:"🪽", cost:400,
    render: (jumping=0) => {
      const flap = jumping * 30;
      return (
        <>
          <g transform={`translate(22,90) rotate(${-flap} 0 0)`}>
            <ellipse cx="-18" cy="0" rx="22" ry="10" fill="#e0e7ff" stroke="#a78bfa" strokeWidth="1.5" transform="rotate(-20 -18 0)"/>
            <ellipse cx="-14" cy="-3" rx="14" ry="6" fill="#c7d2fe" transform="rotate(-25 -14 -3)"/>
            <ellipse cx="-28" cy="4" rx="7" ry="3.5" fill="#e0e7ff" stroke="#a78bfa" strokeWidth="1" transform="rotate(-30 -28 4)"/>
            <ellipse cx="-22" cy="-6" rx="6" ry="3" fill="#e0e7ff" stroke="#a78bfa" strokeWidth="1" transform="rotate(-45 -22 -6)"/>
          </g>
          <g transform={`translate(88,90) rotate(${flap} 0 0)`}>
            <ellipse cx="18" cy="0" rx="22" ry="10" fill="#e0e7ff" stroke="#a78bfa" strokeWidth="1.5" transform="rotate(20 18 0)"/>
            <ellipse cx="14" cy="-3" rx="14" ry="6" fill="#c7d2fe" transform="rotate(25 14 -3)"/>
            <ellipse cx="28" cy="4" rx="7" ry="3.5" fill="#e0e7ff" stroke="#a78bfa" strokeWidth="1" transform="rotate(30 28 4)"/>
            <ellipse cx="22" cy="-6" rx="6" ry="3" fill="#e0e7ff" stroke="#a78bfa" strokeWidth="1" transform="rotate(45 22 -6)"/>
          </g>
        </>
      );
    },
  },
  {
    id:"jetpack", slot:"back", name:"Ранец", emoji:"🚀", cost:500,
    render: (jumping=0) => {
      const flame = jumping > 0.1;
      return (
        <g transform="translate(55,100)">
          <rect x="-24" y="-18" width="16" height="26" rx="5" fill="#6b7280" stroke="#374151" strokeWidth="1.5"/>
          <rect x="8"   y="-18" width="16" height="26" rx="5" fill="#6b7280" stroke="#374151" strokeWidth="1.5"/>
          <rect x="-26" y="-8" width="52" height="12" rx="4" fill="#4b5563" stroke="#374151" strokeWidth="1"/>
          {flame && <>
            <ellipse cx="-16" cy="12" rx="5" ry="8" fill="#f97316" opacity="0.9"/>
            <ellipse cx="-16" cy="14" rx="3" ry="5" fill="#fbbf24"/>
            <ellipse cx="16"  cy="12" rx="5" ry="8" fill="#f97316" opacity="0.9"/>
            <ellipse cx="16"  cy="14" rx="3" ry="5" fill="#fbbf24"/>
          </>}
          <rect x="-4" y="-16" width="8" height="6" rx="2" fill="#60a5fa"/>
        </g>
      );
    },
  },
  {
    id:"cape", slot:"back", name:"Плащ", emoji:"🦸", cost:280,
    render: (jumping=0) => {
      const spread = jumping * 15;
      return (
        <g transform="translate(55,82)">
          <path d={`M -18 0 Q ${-30-spread} ${40+spread*0.5} -10 ${70+spread} Q 0 ${75+spread} 10 ${70+spread} Q ${30+spread} ${40+spread*0.5} 18 0 Q 0 8 -18 0Z`}
            fill="#7c3aed" stroke="#5b21b6" strokeWidth="1.5" opacity="0.9"/>
          <path d={`M -10 0 Q 0 5 10 0`} fill="#a78bfa" opacity="0.4"/>
        </g>
      );
    },
  },
  {
    id:"balloons", slot:"back", name:"Шарики", emoji:"🎈", cost:150,
    render: () => (
      <g transform="translate(55,70)">
        {[[-22,-30,"#f87171"],[-8,-40,"#a78bfa"],[8,-35,"#34d399"],[22,-28,"#fbbf24"]].map(([x,y,c],i)=>(
          <g key={i}>
            <ellipse cx={x} cy={y} rx="10" ry="13" fill={c} opacity="0.9"/>
            <ellipse cx={x-3} cy={y-4} rx="3" ry="4" fill="rgba(255,255,255,0.3)"/>
            <line x1={x} y1={y+13} x2={x+(i-1.5)*2} y2="20" stroke="#9ca3af" strokeWidth="1" strokeDasharray="2,2"/>
          </g>
        ))}
      </g>
    ),
  },
  {
    id:"rainbow", slot:"back", name:"Радуга", emoji:"🌈", cost:350,
    render: () => (
      <g transform="translate(55,60)">
        {["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6"].map((c,i)=>(
          <path key={i} d={`M ${-38+i*2} 0 Q 0 ${-55+i*8} ${38-i*2} 0`}
            fill="none" stroke={c} strokeWidth="4" opacity="0.75"/>
        ))}
      </g>
    ),
  },
];

const SLOT_LABELS = { head:"👆 Голова", body:"👔 Тело", back:"✨ Спина" };

function Rabbit({ jumping, blinking, sleeping, equippedIds }) {
  const earAngle   = jumping * 25;
  const armRaise   = jumping * 22;
  const isBlinking = (blinking || sleeping) && jumping < 0.1;

  const backAcc  = ACCESSORIES.find(a => a.slot==="back"  && equippedIds.back  === a.id);
  const headAcc  = ACCESSORIES.find(a => a.slot==="head"  && equippedIds.head  === a.id);
  const bodyAcc  = ACCESSORIES.find(a => a.slot==="body"  && equippedIds.body  === a.id);

  return (
    <svg width="110" height="140" viewBox="0 0 110 140"
      style={{ overflow:"visible", filter:"drop-shadow(0 6px 12px rgba(244,114,182,0.35))" }}>
      {backAcc && backAcc.render(jumping)}
      <ellipse cx="55" cy="136" rx={22 - jumping*16} ry={3.5 - jumping*2.5} fill="rgba(0,0,0,0.13)"/>
      <g transform={`rotate(${-5 - earAngle * 0.4} 36 46)`}>
        <ellipse cx="36" cy="22" rx="11" ry="28" fill="white" stroke="#2d1b4e" strokeWidth="2.5"/>
        <ellipse cx="36" cy="24" rx="7"  ry="21" fill="#f9a8d4"/>
      </g>
      <g transform={`rotate(${5 + earAngle * 0.4} 74 46)`}>
        <ellipse cx="74" cy="22" rx="11" ry="28" fill="white" stroke="#2d1b4e" strokeWidth="2.5"/>
        <ellipse cx="74" cy="24" rx="7"  ry="21" fill="#f9a8d4"/>
      </g>
      <ellipse cx="55" cy="100" rx="30" ry="32" fill="white" stroke="#2d1b4e" strokeWidth="2.5"/>
      <ellipse cx="55" cy="105" rx="18" ry="20" fill="#fdf4ff"/>
      <circle  cx="55" cy="62"  r="28"  fill="white" stroke="#2d1b4e" strokeWidth="2.5"/>
      <ellipse cx="36" cy="69"  rx="8"  ry="5.5" fill="rgba(249,168,212,0.55)"/>
      <ellipse cx="74" cy="69"  rx="8"  ry="5.5" fill="rgba(249,168,212,0.55)"/>
      {isBlinking || sleeping ? (
        <>
          <path d="M 43 60 Q 47 63 51 60" stroke="#2d1b4e" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M 59 60 Q 63 63 67 60" stroke="#2d1b4e" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </>
      ) : jumping > 0.4 ? (
        <>
          <path d="M 42 59 Q 48 53 54 59" stroke="#2d1b4e" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
          <path d="M 56 59 Q 62 53 68 59" stroke="#2d1b4e" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <circle cx="47" cy="60" r="6" fill="#2d1b4e"/>
          <circle cx="63" cy="60" r="6" fill="#2d1b4e"/>
          <circle cx="49" cy="58" r="2" fill="white"/>
          <circle cx="65" cy="58" r="2" fill="white"/>
        </>
      )}
      <ellipse cx="55" cy="69" rx="4" ry="3" fill="#f472b6"/>
      <path d="M 50 73 Q 55 78 60 73" stroke="#d8b4fe" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <line x1="30" y1="68" x2="46" y2="70" stroke="#e9d5ff" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="30" y1="73" x2="46" y2="73" stroke="#e9d5ff" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="80" y1="68" x2="64" y2="70" stroke="#e9d5ff" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="80" y1="73" x2="64" y2="73" stroke="#e9d5ff" strokeWidth="1.4" strokeLinecap="round"/>
      <g transform={`rotate(${-20 - armRaise} 30 95)`}>
        <ellipse cx="28" cy="95" rx="9" ry="7" fill="white" stroke="#2d1b4e" strokeWidth="2"/>
        <circle cx="20" cy="100" r="7" fill="white" stroke="#2d1b4e" strokeWidth="2"/>
        <circle cx="16" cy="97"  r="4" fill="#fecdd3" stroke="#f9a8d4" strokeWidth="1"/>
        <circle cx="20" cy="94"  r="4" fill="#fecdd3" stroke="#f9a8d4" strokeWidth="1"/>
        <circle cx="24" cy="97"  r="4" fill="#fecdd3" stroke="#f9a8d4" strokeWidth="1"/>
        <ellipse cx="20" cy="101" rx="4.5" ry="3" fill="rgba(249,168,212,0.6)"/>
      </g>
      <g transform={`rotate(${20 + armRaise} 80 95)`}>
        <ellipse cx="82" cy="95" rx="9" ry="7" fill="white" stroke="#2d1b4e" strokeWidth="2"/>
        <circle cx="90" cy="100" r="7" fill="white" stroke="#2d1b4e" strokeWidth="2"/>
        <circle cx="86" cy="97"  r="4" fill="#fecdd3" stroke="#f9a8d4" strokeWidth="1"/>
        <circle cx="90" cy="94"  r="4" fill="#fecdd3" stroke="#f9a8d4" strokeWidth="1"/>
        <circle cx="94" cy="97"  r="4" fill="#fecdd3" stroke="#f9a8d4" strokeWidth="1"/>
        <ellipse cx="90" cy="101" rx="4.5" ry="3" fill="rgba(249,168,212,0.6)"/>
      </g>
      <g transform={`rotate(${jumping * 10} 35 125)`}>
        <ellipse cx="35" cy="122" rx="10" ry="8" fill="white" stroke="#2d1b4e" strokeWidth="2"/>
        <ellipse cx="28" cy="130" rx="13" ry="7" fill="white" stroke="#2d1b4e" strokeWidth="2"/>
        <ellipse cx="28" cy="130" rx="9"  ry="5" fill="#fecdd3"/>
        <circle cx="21" cy="127" r="3.5" fill="white" stroke="#2d1b4e" strokeWidth="1.8"/>
        <circle cx="28" cy="124" r="3.5" fill="white" stroke="#2d1b4e" strokeWidth="1.8"/>
        <circle cx="35" cy="127" r="3.5" fill="white" stroke="#2d1b4e" strokeWidth="1.8"/>
        <circle cx="21" cy="127" r="2" fill="#fecdd3"/>
        <circle cx="28" cy="124" r="2" fill="#fecdd3"/>
        <circle cx="35" cy="127" r="2" fill="#fecdd3"/>
      </g>
      <g transform={`rotate(${-jumping * 10} 75 125)`}>
        <ellipse cx="75" cy="122" rx="10" ry="8" fill="white" stroke="#2d1b4e" strokeWidth="2"/>
        <ellipse cx="82" cy="130" rx="13" ry="7" fill="white" stroke="#2d1b4e" strokeWidth="2"/>
        <ellipse cx="82" cy="130" rx="9"  ry="5" fill="#fecdd3"/>
        <circle cx="75" cy="127" r="3.5" fill="white" stroke="#2d1b4e" strokeWidth="1.8"/>
        <circle cx="82" cy="124" r="3.5" fill="white" stroke="#2d1b4e" strokeWidth="1.8"/>
        <circle cx="89" cy="127" r="3.5" fill="white" stroke="#2d1b4e" strokeWidth="1.8"/>
        <circle cx="75" cy="127" r="2" fill="#fecdd3"/>
        <circle cx="82" cy="124" r="2" fill="#fecdd3"/>
        <circle cx="89" cy="127" r="2" fill="#fecdd3"/>
      </g>
      {bodyAcc && bodyAcc.render(jumping)}
      {headAcc && headAcc.render(jumping)}
    </svg>
  );
}

function ShopPanel({ coins, ownedIds, equippedIds, onBuy, onEquip, onClose }) {
  const [activeSlot, setActiveSlot] = useState("head");
  const items = ACCESSORIES.filter(a => a.slot === activeSlot);

  return (
    <div style={{
      width:200, flexShrink:0,
      background:"white",
      borderRadius:20,
      boxShadow:`0 8px 32px ${THEME.shadow}`,
      border:`1.5px solid ${THEME.border}`,
      display:"flex", flexDirection:"column",
      overflow:"hidden",
      height:340,
      animation:"shopSlideIn 0.22s cubic-bezier(0.34,1.4,0.64,1)",
    }}>
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"10px 12px 8px",
        borderBottom:`1px solid rgba(244,114,182,0.12)`,
        flexShrink:0,
      }}>
        <div style={{ fontSize:13, fontWeight:700, color:THEME.text }}>👗 Гардероб</div>
        <button onClick={onClose} style={{
          border:"none", background:"rgba(244,114,182,0.1)", borderRadius:7,
          width:24, height:24, cursor:"pointer", fontSize:13, color:THEME.textLight,
          display:"flex", alignItems:"center", justifyContent:"center", padding:0,
        }}>✕</button>
      </div>
      <div style={{ display:"flex", gap:4, padding:"8px 8px 6px", flexShrink:0 }}>
        {Object.entries(SLOT_LABELS).map(([slot, label]) => {
          const icon = label.split(" ")[0];
          const name = label.split(" ").slice(1).join(" ");
          const equipped = Object.values(equippedIds).some(
            id => ACCESSORIES.find(a=>a.id===id&&a.slot===slot)
          );
          return (
            <button key={slot} onClick={() => setActiveSlot(slot)} style={{
              flex:1, padding:"5px 2px", borderRadius:8, border:"none", cursor:"pointer",
              fontFamily:"inherit", fontSize:10, fontWeight:600,
              background: activeSlot===slot
                ? `linear-gradient(135deg,${THEME.primary},${THEME.secondary})`
                : "rgba(244,114,182,0.08)",
              color: activeSlot===slot ? "white" : THEME.textLight,
              position:"relative",
            }}>
              <div>{icon}</div>
              <div style={{fontSize:9}}>{name}</div>
              {equipped && activeSlot!==slot && (
                <div style={{position:"absolute",top:2,right:3,width:5,height:5,
                  borderRadius:"50%",background:THEME.primary}}/>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ overflowY:"auto", padding:"0 8px 8px", flex:1 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {items.map(acc => {
            const owned    = ownedIds.has(acc.id);
            const equipped = equippedIds[acc.slot] === acc.id;
            const canBuy   = coins >= acc.cost && !owned;
            const progress = Math.min(coins / acc.cost, 1);
            return (
              <div key={acc.id} style={{
                borderRadius:11,
                border:`1.5px solid ${equipped ? THEME.primary : owned ? "rgba(52,211,153,0.35)" : "rgba(0,0,0,0.05)"}`,
                background: equipped ? "linear-gradient(135deg,#fce7f3,#f5f3ff)"
                  : owned ? "#f0fdf4" : "#fafafa",
                overflow:"hidden", position:"relative",
              }}>
                {!owned && !canBuy && (
                  <div style={{
                    position:"absolute", bottom:0, left:0, height:2,
                    width:`${progress*100}%`,
                    background:`linear-gradient(90deg,${THEME.primary},${THEME.secondary})`,
                  }}/>
                )}
                <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px" }}>
                  <div style={{width:32,height:32,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="32" height="32" viewBox="0 0 110 110" style={{overflow:"visible"}}>
                      <circle cx="55" cy="55" r="26" fill="#fdf4ff" stroke="#f9c8dc" strokeWidth="1.5"/>
                      <g transform="translate(0,-10)">{acc.render(0)}</g>
                    </svg>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{
                      fontSize:11, fontWeight:600, color: equipped ? THEME.primary : owned ? THEME.mint : THEME.text,
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                    }}>
                      {acc.name} {equipped ? "✓" : ""}
                    </div>
                    <div style={{fontSize:9, color:THEME.textLight}}>
                      {owned ? (equipped ? "надет" : "снять/надеть") : `${acc.cost} 🐾`}
                    </div>
                  </div>
                  {owned ? (
                    <button onClick={() => onEquip(acc)} style={{
                      padding:"3px 7px", borderRadius:7, border:"none", cursor:"pointer",
                      fontFamily:"inherit", fontSize:9, fontWeight:700, flexShrink:0,
                      background: equipped ? "rgba(244,114,182,0.15)" : `linear-gradient(135deg,${THEME.primary},${THEME.secondary})`,
                      color: equipped ? THEME.primary : "white",
                    }}>{equipped ? "снять" : "надеть"}</button>
                  ) : (
                    <button onClick={() => canBuy && onBuy(acc)} style={{
                      padding:"3px 7px", borderRadius:7, border:"none",
                      cursor: canBuy ? "pointer" : "not-allowed",
                      fontFamily:"inherit", fontSize:9, fontWeight:700, flexShrink:0,
                      background: canBuy ? `linear-gradient(135deg,${THEME.mint},#059669)` : "#eee",
                      color: canBuy ? "white" : "#bbb",
                    }}>{canBuy ? "купить" : "мало"}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MarshmallowPaw({ x, y, rotation = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${scale})`}>
      <circle cx="-9" cy="-13" r="8"   fill="white" stroke="#f9c8dc" strokeWidth="2"/>
      <circle cx="0"  cy="-17" r="9"   fill="white" stroke="#f9c8dc" strokeWidth="2"/>
      <circle cx="9"  cy="-13" r="8"   fill="white" stroke="#f9c8dc" strokeWidth="2"/>
      <circle cx="-9" cy="-13" r="4.5" fill="rgba(249,168,212,0.65)"/>
      <circle cx="0"  cy="-17" r="5"   fill="rgba(249,168,212,0.65)"/>
      <circle cx="9"  cy="-13" r="4.5" fill="rgba(249,168,212,0.65)"/>
      <rect x="-16" y="-7" width="32" height="24" rx="13" fill="white" stroke="#f9c8dc" strokeWidth="2"/>
      <rect x="-10" y="-1" width="20" height="15" rx="9"  fill="rgba(253,213,230,0.6)"/>
      <ellipse cx="-4" cy="1" rx="6" ry="3.5" fill="rgba(255,255,255,0.8)" transform="rotate(-15 -4 1)"/>
    </g>
  );
}
function PawIcon({ size = 18, s = 0.75 }) {
  return (
    <svg width={size} height={size} viewBox="-20 -25 40 40"
      style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}>
      <MarshmallowPaw x={0} y={0} rotation={0} scale={s}/>
    </svg>
  );
}
function Cloud({ x, y, scale = 1, opacity = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      <ellipse cx="0" cy="0" rx="32" ry="20" fill="white"/>
      <ellipse cx="30" cy="5" rx="24" ry="17" fill="white"/>
      <ellipse cx="-27" cy="5" rx="20" ry="15" fill="white"/>
      <ellipse cx="10" cy="-13" rx="22" ry="17" fill="white"/>
    </g>
  );
}
function Flower({ x, y, color = "#f472b6", size = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${size})`}>
      <line x1="0" y1="0" x2="0" y2="22" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
      {[0,60,120,180,240,300].map(a => (
        <ellipse key={a} cx={Math.sin(a*Math.PI/180)*9} cy={-22+Math.cos(a*Math.PI/180)*9}
          rx="5.5" ry="3.5" fill={color} opacity="0.9"
          transform={`rotate(${a} ${Math.sin(a*Math.PI/180)*9} ${-22+Math.cos(a*Math.PI/180)*9})`}/>
      ))}
      <circle cx="0" cy="-22" r="4.5" fill="#fbbf24"/>
    </g>
  );
}
function InfiniteBackground({ scrollY, rabbitY, dayPhase=0 }) {
  const W=380, H=340;
  const t = Math.min(dayPhase*0.85 + rabbitY*0.15, 1);
  let skyR,skyG,skyB;
  if(t<0.5){const p=t*2;skyR=Math.round(135*(1-p)+255*p);skyG=Math.round(206*(1-p)+160*p);skyB=Math.round(235*(1-p)+80*p);}
  else{const p=(t-0.5)*2;skyR=Math.round(255*(1-p)+15*p);skyG=Math.round(160*(1-p)+25*p);skyB=Math.round(80*(1-p)+80*p);}
  const cloudOpacity=0.92-t*0.5, starOpacity=Math.max(0,t-0.5)*2;
  const cloudRows=[
    {clouds:[{x:60,s:1.1},{x:260,s:0.8},{x:160,s:0.65}],baseY:60},
    {clouds:[{x:40,s:0.7},{x:300,s:1.0},{x:190,s:0.55}],baseY:200},
    {clouds:[{x:100,s:0.9},{x:340,s:0.6}],baseY:340},
  ];
  const STARS=[{x:30,y:20},{x:80,y:10},{x:150,y:35},{x:200,y:8},{x:260,y:25},{x:310,y:15},{x:355,y:40},{x:50,y:55},{x:180,y:50},{x:330,y:55}];
  const PERIOD=500;
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{position:"absolute",top:0,left:0}}>
      <defs>
        <clipPath id="sceneClip"><rect x="0" y="0" width={W} height={H} rx="22"/></clipPath>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgb(${Math.max(0,skyR-15)},${Math.max(0,skyG-10)},${skyB})`}/>
          <stop offset="100%" stopColor={`rgb(${Math.min(255,skyR+10)},${Math.min(255,skyG+10)},${Math.max(0,skyB-5)})`}/>
        </linearGradient>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86efac"/><stop offset="100%" stopColor="#4ade80"/>
        </linearGradient>
      </defs>
      <g clipPath="url(#sceneClip)">
        <rect x="0" y="0" width={W} height={H} fill="url(#skyGrad)"/>
        {starOpacity>0 && STARS.map((s,i)=>(
          <circle key={i} cx={s.x} cy={s.y} r={1.2+(i%3)*0.5} fill="white" opacity={starOpacity*(0.6+(i%4)*0.1)}/>
        ))}
        {cloudRows.map((row,ri)=>row.clouds.map((c,ci)=>{
          const rawY=row.baseY-(scrollY*0.4)%PERIOD;
          const y=((rawY%PERIOD)+PERIOD)%PERIOD-50;
          return <Cloud key={`c${ri}-${ci}`} x={c.x} y={y} scale={c.s} opacity={cloudOpacity}/>;
        }))}
        {rabbitY<0.85&&(
          <g opacity={Math.max(0,1-rabbitY*1.3)}>
            <ellipse cx="190" cy="308" rx="185" ry="32" fill="url(#groundGrad)"/>
            {[25,60,95,130,165,200,235,270,305,340,365].map(x=>(
              <g key={x}>
                <line x1={x} y1="284" x2={x-5} y2="268" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1={x} y1="284" x2={x}   y2="264" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1={x} y1="284" x2={x+5} y2="269" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
              </g>
            ))}
            <Flower x={45} y={280} color="#f472b6" size={0.9}/>
            <Flower x={95} y={275} color="#a78bfa" size={0.7}/>
            <Flower x={155} y={277} color="#fb923c" size={0.8}/>
            <Flower x={215} y={276} color="#f472b6" size={1.0}/>
            <Flower x={270} y={278} color="#fbbf24" size={0.75}/>
            <Flower x={325} y={275} color="#a78bfa" size={0.85}/>
          </g>
        )}
      </g>
    </svg>
  );
}
function GoldenMarshmallow({ progress, onClick }) {
  const x = -30 + progress * 440;
  const y = 180 - Math.sin(progress * Math.PI) * 80;
  return (
    <g transform={`translate(${x},${y})`} onClick={e=>{e.stopPropagation();onClick();}} style={{cursor:"pointer"}}>
      <circle cx="0" cy="0" r="28" fill="rgba(251,191,36,0.25)" className="goldenGlow"/>
      <circle cx="0" cy="0" r="20" fill="rgba(251,191,36,0.15)" className="goldenGlow"/>
      <circle cx="-9" cy="-13" r="8" fill="#fde68a" stroke="#f59e0b" strokeWidth="2"/>
      <circle cx="0"  cy="-17" r="9" fill="#fde68a" stroke="#f59e0b" strokeWidth="2"/>
      <circle cx="9"  cy="-13" r="8" fill="#fde68a" stroke="#f59e0b" strokeWidth="2"/>
      <circle cx="-9" cy="-13" r="4.5" fill="rgba(251,191,36,0.8)"/>
      <circle cx="0"  cy="-17" r="5"   fill="rgba(251,191,36,0.8)"/>
      <circle cx="9"  cy="-13" r="4.5" fill="rgba(251,191,36,0.8)"/>
      <rect x="-16" y="-7" width="32" height="24" rx="13" fill="#fde68a" stroke="#f59e0b" strokeWidth="2"/>
      <ellipse cx="-4" cy="1" rx="6" ry="3.5" fill="rgba(255,255,255,0.7)" transform="rotate(-15 -4 1)"/>
      {[0,60,120,180,240,300].map(a=>(
        <line key={a} x1={Math.cos(a*Math.PI/180)*22} y1={Math.sin(a*Math.PI/180)*22}
          x2={Math.cos(a*Math.PI/180)*28} y2={Math.sin(a*Math.PI/180)*28}
          stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" className="goldenSpark"/>
      ))}
    </g>
  );
}
function FlyingPaw({ startX, startY, rotation, onDone }) {
  const [frame, setFrame] = useState(0);
  useEffect(()=>{
    const start=performance.now(), dur=850; let raf;
    const animate=now=>{
      const p=Math.min((now-start)/dur,1); setFrame(p);
      if(p<1){raf=requestAnimationFrame(animate);}else{onDone();}
    };
    raf=requestAnimationFrame(animate);
    return()=>cancelAnimationFrame(raf);
  },[]);
  const ease=1-Math.pow(1-frame,3), currentY=startY-ease*100, opacity=frame<0.6?1:1-(frame-0.6)/0.4;
  return(<g opacity={opacity}><MarshmallowPaw x={startX} y={currentY} rotation={rotation+frame*120} scale={1-frame*0.7}/></g>);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Компонент таблицы лидеров с авто-обновлением
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Leaderboard({ savedName, onBoardLoaded }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const board = await loadLeaderboard();
      setLeaderboard(board);
      setLastUpdated(new Date());
      onBoardLoaded?.(board);
    } finally {
      setLoading(false);
    }
  }, [onBoardLoaded]);

  // Загружаем при монтировании и каждые 15 секунд
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  const myRank = savedName ? leaderboard.findIndex(e => e.name === savedName) + 1 : null;

  return (
    <div style={{width:"100%",maxWidth:420}}>
      {/* Заголовок с индикатором статуса */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:10,letterSpacing:4,color:THEME.textLight}}>ТАБЛИЦА ЛИДЕРОВ</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {loading
            ? <div style={{width:8,height:8,borderRadius:"50%",background:"#fbbf24",animation:"pulse 1s infinite"}}/>
            : <div style={{width:8,height:8,borderRadius:"50%",background:THEME.mint}}/>
          }
          <span style={{fontSize:10,color:THEME.textLight}}>
            {loading ? "обновление..." : lastUpdated ? `обновлено ${lastUpdated.toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"})}` : ""}
          </span>
        </div>
      </div>

      {/* Подсказка об общей таблице */}
      <div style={{
        background: isCloudAvailable()
          ? "linear-gradient(135deg,rgba(167,139,250,0.1),rgba(244,114,182,0.1))"
          : "linear-gradient(135deg,rgba(251,191,36,0.1),rgba(249,115,22,0.1))",
        border:`1px solid ${isCloudAvailable() ? THEME.border : "rgba(251,191,36,0.4)"}`,
        borderRadius:12, padding:"8px 14px", marginBottom:14,
        fontSize:11, color:THEME.textLight, lineHeight:1.5,
      }}>
        {isCloudAvailable()
          ? "🌐 Таблица общая — друзья увидят результаты, открыв этот же артефакт"
          : "💾 Локальный режим — таблица только на этом устройстве"}
      </div>

      {leaderboard.length === 0 && !loading ? (
        <div style={{color:THEME.textLight,fontSize:13,textAlign:"center",marginTop:40}}>
          Пока никто не сохранил счёт.<br/>Будь первым! 🏆
        </div>
      ) : (
        leaderboard.map((entry, i) => {
          const isMe = entry.name === savedName;
          return (
            <div key={entry.name} style={{
              display:"flex", alignItems:"center", gap:14,
              padding:"12px 16px", marginBottom:8, borderRadius:16,
              background: isMe ? "linear-gradient(135deg,#fce7f3,#f5f3ff)" : "white",
              border:`1px solid ${isMe ? THEME.border : "rgba(0,0,0,0.05)"}`,
              boxShadow: isMe ? `0 2px 12px ${THEME.shadow}` : "none",
              transition:"all 0.3s",
            }}>
              <span style={{fontSize:20,width:28}}>{MEDAL[i] ?? `#${i+1}`}</span>
              <span style={{flex:1,fontSize:14,fontWeight:isMe?700:400,color:THEME.text}}>
                {entry.name}{isMe?" (ты)":""}
              </span>
              <span style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:4,
                background:`linear-gradient(135deg,${THEME.primary},${THEME.secondary})`,
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                {entry.score.toLocaleString()} <PawIcon size={20} s={0.85}/>
              </span>
            </div>
          );
        })
      )}

      <button onClick={refresh} disabled={loading} style={{
        marginTop:8, width:"100%", padding:"10px", borderRadius:12,
        border:`1px solid ${THEME.border}`, background:"white",
        color: loading ? "#ddd" : THEME.textLight,
        cursor: loading ? "default" : "pointer",
        fontFamily:"inherit", fontSize:11, letterSpacing:2,
        transition:"all 0.2s",
      }}>
        {loading ? "⏳ ЗАГРУЗКА..." : "↻ ОБНОВИТЬ"}
      </button>

      {myRank > 0 && (
        <div style={{
          marginTop:12, textAlign:"center", fontSize:12,
          color:THEME.textLight,
        }}>
          Твоё место: <strong style={{color:THEME.primary}}>#{myRank}</strong> из {leaderboard.length}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [coins,setCoins]             = useState(0);
  const [cps,setCps]                 = useState(0);
  const [clickPower,setClickPower]   = useState(1);
  const [tab,setTab]                 = useState("game");
  const [playerName,setPlayerName]   = useState("");
  const [savedName,setSavedName]     = useState("");
  const [saveMsg,setSaveMsg]         = useState("");
  const [rabbitY,setRabbitY]         = useState(0);
  const [scrollY,setScrollY]         = useState(0);
  const [flyPaws,setFlyPaws]         = useState([]);
  const [plusTexts,setPlusTexts]     = useState([]);
  const [upgradedIds,setUpgradedIds] = useState(new Set());

  const [ownedIds,setOwnedIds]       = useState(new Set());
  const [equippedIds,setEquippedIds] = useState({head:null,body:null,back:null});
  const [shopOpen,setShopOpen]       = useState(false);

  const [blinking,setBlinking] = useState(false);
  useEffect(()=>{
    const schedule=()=>{
      const delay=3000+Math.random()*2000;
      return setTimeout(()=>{
        setBlinking(true);setTimeout(()=>setBlinking(false),120);
        timerRef.current=schedule();
      },delay);
    };
    const timerRef={current:schedule()};
    return()=>clearTimeout(timerRef.current);
  },[]);

  const [sleeping,setSleeping] = useState(false);
  const lastInteractTime       = useRef(Date.now());
  useEffect(()=>{
    const id=setInterval(()=>{setSleeping(Date.now()-lastInteractTime.current>30000);},1000);
    return()=>clearInterval(id);
  },[]);
  const [zzzFrame,setZzzFrame] = useState(0);
  useEffect(()=>{const id=setInterval(()=>setZzzFrame(f=>f+1),800);return()=>clearInterval(id);},[]);

  const [coinPulse,setCoinPulse] = useState(false);
  const pulseTimer = useRef(null);
  function triggerSpring(){
    setCoinPulse(false); clearTimeout(pulseTimer.current);
    requestAnimationFrame(()=>{setCoinPulse(true);pulseTimer.current=setTimeout(()=>setCoinPulse(false),400);});
  }

  const [dayPhase,setDayPhase] = useState(0);
  useEffect(()=>{
    const CYCLE=30000, startTime=performance.now(); let raf;
    const tick=now=>{
      const elapsed=(now-startTime)%CYCLE, half=CYCLE/2;
      setDayPhase(elapsed<half ? elapsed/half : 2-elapsed/half);
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(raf);
  },[]);

  const [golden,setGolden]           = useState(null);
  const [goldenBonus,setGoldenBonus] = useState(null);
  const goldenRaf=useRef(null), goldenTimer=useRef(null);
  useEffect(()=>{
    const spawn=()=>{
      goldenTimer.current=setTimeout(()=>{
        const start=performance.now(), dur=3000; let raf;
        const animate=now=>{
          const p=Math.min((now-start)/dur,1);
          setGolden(g=>g?{...g,progress:p}:null);
          if(p<1){raf=requestAnimationFrame(animate);}else{setGolden(null);spawn();}
        };
        setGolden({progress:0}); goldenRaf.current=requestAnimationFrame(animate);
      },15000+Math.random()*30000);
    };
    spawn();
    return()=>{clearTimeout(goldenTimer.current);cancelAnimationFrame(goldenRaf.current);};
  },[]);

  function catchGolden(){
    if(!golden)return;
    cancelAnimationFrame(goldenRaf.current); clearTimeout(goldenTimer.current);
    setGolden(null);
    const bonus=30+Math.floor(Math.random()*71);
    setCoins(c=>c+bonus); triggerSpring();
    setGoldenBonus(bonus); setTimeout(()=>setGoldenBonus(null),1500);
    goldenTimer.current=setTimeout(()=>{
      const s=performance.now(),d=3000;
      const a=now=>{const p=Math.min((now-s)/d,1);setGolden(g=>g?{...g,progress:p}:null);if(p<1){goldenRaf.current=requestAnimationFrame(a);}else{setGolden(null);}};
      setGolden({progress:0}); goldenRaf.current=requestAnimationFrame(a);
    },30000+Math.random()*15000);
  }

  const lastClickTime=useRef(0), rabbitYRef=useRef(0), scrollYRef=useRef(0), animRef=useRef(null);

  useEffect(()=>{
    if(cps===0)return;
    const id=setInterval(()=>{setCoins(c=>c+cps);triggerSpring();},1000);
    return()=>clearInterval(id);
  },[cps]);

  const tick=useCallback(()=>{
    const idle=Date.now()-lastClickTime.current;
    if(idle>350){const speed=0.008+rabbitYRef.current*0.015;rabbitYRef.current=Math.max(0,rabbitYRef.current-speed);}
    if(rabbitYRef.current>0.02)scrollYRef.current+=rabbitYRef.current*2.5;
    setRabbitY(rabbitYRef.current); setScrollY(scrollYRef.current);
    animRef.current=requestAnimationFrame(tick);
  },[]);
  useEffect(()=>{animRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(animRef.current);},[tick]);

  function handleClick(){
    if(shopOpen)return;
    lastInteractTime.current=Date.now(); setSleeping(false);
    setCoins(c=>c+clickPower); triggerSpring();
    lastClickTime.current=Date.now(); rabbitYRef.current=Math.min(1,rabbitYRef.current+0.13);
    const count=Math.random()>0.5?2:1;
    for(let i=0;i<count;i++){
      const id=Math.random(), side=(i%2===0)?1:-1, offsetX=side*(70+Math.random()*70);
      setFlyPaws(p=>[...p,{id,offsetX,rotation:(Math.random()-0.5)*60}]);
    }
    const pid=Math.random();
    setPlusTexts(t=>[...t,{id:pid}]);
    setTimeout(()=>setPlusTexts(t=>t.filter(x=>x.id!==pid)),700);
  }

  function buyUpgrade(u){
    if(coins<u.cost)return;
    lastInteractTime.current=Date.now(); setSleeping(false);
    setCoins(c=>c-u.cost);
    if(u.cps>0)setCps(c=>c+u.cps);
    if(u.power>0)setClickPower(c=>c+u.power);
    setUpgradedIds(prev=>new Set([...prev,u.id]));
  }

  function buyAccessory(acc){
    if(coins<acc.cost||ownedIds.has(acc.id))return;
    setCoins(c=>c-acc.cost);
    setOwnedIds(prev=>new Set([...prev,acc.id]));
    setEquippedIds(prev=>({...prev,[acc.slot]:acc.id}));
  }

  function equipAccessory(acc){
    setEquippedIds(prev=>{
      if(prev[acc.slot]===acc.id) return{...prev,[acc.slot]:null};
      return{...prev,[acc.slot]:acc.id};
    });
  }

  async function handleSave(){
    const name=playerName.trim(); if(!name)return;
    setSavedName(name);
    await saveToLeaderboard(name, coins);
    setSaveMsg("✅ Сохранено!"); setTimeout(()=>setSaveMsg(""),2000);
  }

  const myRank = null; // Берётся из компонента Leaderboard
  const SCENE_H=340, RABBIT_GROUND=230, RABBIT_SKY=145;
  const rabbitSVGY=RABBIT_GROUND-rabbitY*(RABBIT_GROUND-RABBIT_SKY);
  const heightLabel=rabbitY>0.75?"🚀 В небесах!":rabbitY>0.4?"☁️ Высоко!":rabbitY>0.05?"🐇 Прыгает!":"🌱 На земле";
  const zzzBubbles=[{dx:18,dy:-30,size:11},{dx:28,dy:-50,size:14},{dx:14,dy:-70,size:9}];

  const [myRankDisplay, setMyRankDisplay] = useState(null);

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fdf0f8 0%,#f0f4ff 100%)",
      display:"flex",flexDirection:"column",alignItems:"center",
      fontFamily:"'Georgia',serif",color:THEME.text,padding:"20px 16px 40px",position:"relative"}}>

      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        {BG_PAWS.map((p,i)=>(
          <div key={i} style={{position:"absolute",left:p.x,top:p.y,opacity:p.op,
            animation:`bgPawFloat ${p.dur}s ease-in-out infinite`,animationDelay:`${i*0.35}s`,
            filter:"hue-rotate(330deg) saturate(3) brightness(0.85)"}}>
            <svg width="55" height="55" viewBox="-20 -25 40 40"><MarshmallowPaw x={0} y={0} rotation={p.r} scale={p.s}/></svg>
          </div>
        ))}
      </div>

      <div style={{position:"relative",zIndex:1,width:"100%",display:"flex",flexDirection:"column",alignItems:"center"}}>

        <div style={{textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:10,letterSpacing:5,color:THEME.textLight,marginBottom:4,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            <PawIcon size={18} s={0.75}/> ЗЕФИРОК
          </div>
          <div className={coinPulse?"coinPulse":""} style={{
            fontSize:52,fontWeight:900,lineHeight:1,
            background:`linear-gradient(135deg,${THEME.primary},${THEME.secondary})`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",display:"inline-block"
          }}>{coins.toLocaleString()}</div>
          <div style={{fontSize:12,color:THEME.textLight,marginTop:4}}>
            +{clickPower} клик · +{cps}/сек{myRankDisplay?` · 🏆 #${myRankDisplay}`:""}
          </div>
        </div>

        <div style={{display:"flex",marginBottom:18,borderRadius:20,background:"white",padding:4,boxShadow:`0 2px 12px ${THEME.shadow}`}}>
          {[["game","🎮 Игра"],["board","🏆 Рейтинг"]].map(([t,label])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:"7px 22px",borderRadius:16,border:"none",cursor:"pointer",
              fontFamily:"inherit",fontSize:13,fontWeight:600,transition:"all 0.2s",
              background:tab===t?`linear-gradient(135deg,${THEME.primary},${THEME.secondary})`:"transparent",
              color:tab===t?"white":THEME.textLight,
              boxShadow:tab===t?`0 2px 10px ${THEME.shadow}`:"none",
            }}>{label}</button>
          ))}
        </div>

        {tab==="game"&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:620}}>
            <div style={{
              display:"flex", gap:12, alignItems:"flex-start",
              width:"100%", justifyContent:"center",
              transition:"all 0.25s",
            }}>
              <div onClick={handleClick} style={{
                flex: shopOpen ? "0 0 auto" : "0 0 380px",
                width: shopOpen ? "min(260px, calc(100vw - 240px))" : 380,
                minWidth: 200,
                height:SCENE_H, borderRadius:24, overflow:"hidden",
                position:"relative", cursor:"pointer", userSelect:"none",
                boxShadow:`0 8px 40px ${THEME.shadow}`,
                border:`2px solid rgba(244,114,182,0.2)`,
                transition:"width 0.28s cubic-bezier(0.34,1.2,0.64,1), flex 0.28s",
              }}>
                <InfiniteBackground scrollY={scrollY} rabbitY={rabbitY} dayPhase={dayPhase}/>
                <svg width="100%" height="100%" viewBox="0 0 380 340" style={{position:"absolute",top:0,left:0}}>
                  <g transform={`translate(${190-55},${rabbitSVGY-125})`}>
                    <Rabbit jumping={rabbitY} blinking={blinking} sleeping={sleeping} equippedIds={equippedIds}/>
                  </g>
                  {sleeping&&zzzBubbles.map((b,i)=>
                    (zzzFrame%3)>=i?(
                      <text key={i} x={190+b.dx} y={rabbitSVGY-125+b.dy}
                        fontSize={b.size} fontWeight="900" fontFamily="Georgia"
                        fill="#a78bfa" opacity={0.85-i*0.2} className="zzzFloat">z</text>
                    ):null
                  )}
                  {plusTexts.map(p=>(
                    <text key={p.id} x="215" y={rabbitSVGY-130}
                      fontSize="20" fontWeight="900" fontFamily="Georgia"
                      fill={THEME.primary} textAnchor="middle"
                      style={{animation:"svgPlus 0.7s ease-out forwards"}}>+{clickPower}</text>
                  ))}
                  {golden&&<GoldenMarshmallow progress={golden.progress} onClick={catchGolden}/>}
                  {goldenBonus!==null&&(
                    <text x="190" y="100" fontSize="24" fontWeight="900" fontFamily="Georgia"
                      fill="#fbbf24" textAnchor="middle"
                      style={{animation:"goldenBonus 1.5s ease-out forwards"}}>+{goldenBonus} ✨</text>
                  )}
                </svg>
                <div style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}}>
                  {flyPaws.map(p=>{
                    const startX=190+p.offsetX, startY=rabbitSVGY-40;
                    return(
                      <div key={p.id} style={{position:"absolute",
                        left:`${(startX/380)*100}%`,top:`${(startY/340)*100}%`,transform:"translate(-50%,-50%)"}}>
                        <svg width="60" height="60" viewBox="-30 -30 60 60" style={{overflow:"visible"}}>
                          <FlyingPaw startX={0} startY={0} rotation={p.rotation}
                            onDone={()=>setFlyPaws(prev=>prev.filter(x=>x.id!==p.id))}/>
                        </svg>
                      </div>
                    );
                  })}
                </div>
                <button onClick={e=>{e.stopPropagation();setShopOpen(s=>!s);}} style={{
                  position:"absolute", bottom:10, right:10,
                  width:36, height:36, borderRadius:11, border:"none",
                  background: shopOpen
                    ? `linear-gradient(135deg,${THEME.primary},${THEME.secondary})`
                    : "rgba(255,255,255,0.92)",
                  backdropFilter:"blur(4px)",
                  boxShadow:"0 2px 8px rgba(244,114,182,0.3)",
                  cursor:"pointer", fontSize:17,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"background 0.2s",
                }}>👗</button>
                {golden&&(
                  <div style={{position:"absolute",top:8,right:10,
                    background:"rgba(251,191,36,0.9)",color:"#78350f",
                    fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:10,
                    animation:"goldenHint 0.5s ease-out",pointerEvents:"none"}}>
                    ✨ Поймай!
                  </div>
                )}
              </div>

              {shopOpen && (
                <ShopPanel
                  coins={coins}
                  ownedIds={ownedIds}
                  equippedIds={equippedIds}
                  onBuy={buyAccessory}
                  onEquip={equipAccessory}
                  onClose={()=>setShopOpen(false)}
                />
              )}
            </div>

            <div style={{width:"100%",maxWidth: shopOpen ? "100%" : 380,height:6,borderRadius:3,
              background:"rgba(244,114,182,0.15)",marginTop:8,overflow:"hidden",transition:"max-width 0.28s"}}>
              <div style={{height:"100%",borderRadius:3,width:`${rabbitY*100}%`,
                background:`linear-gradient(90deg,${THEME.primary},${THEME.secondary})`,transition:"width 0.08s"}}/>
            </div>
            <div style={{fontSize:10,color:THEME.textLight,marginTop:4,letterSpacing:1}}>
              {heightLabel}{sleeping&&<span style={{marginLeft:8,color:"#a78bfa"}}>💤 Спит...</span>}
            </div>

            <div style={{width:"100%",marginTop:20}}>
              <div style={{fontSize:10,letterSpacing:4,color:THEME.textLight,marginBottom:10}}>УЛУЧШЕНИЯ</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {UPGRADES.map(u=>{
                  const can=coins>=u.cost, bought=upgradedIds.has(u.id), progress=Math.min(coins/u.cost,1);
                  return(
                    <button key={u.id} onClick={()=>buyUpgrade(u)}
                      onMouseEnter={e=>can&&!bought&&(e.currentTarget.style.transform="translateY(-2px)")}
                      onMouseLeave={e=>(e.currentTarget.style.transform="translateY(0)")}
                      style={{display:"flex",flexDirection:"column",padding:"0",borderRadius:16,overflow:"hidden",
                        border:`1px solid ${bought?"rgba(52,211,153,0.4)":can?THEME.border:"rgba(0,0,0,0.05)"}`,
                        background:bought?"linear-gradient(135deg,#f0fdf4,#ecfdf5)":can?"white":"rgba(255,255,255,0.5)",
                        cursor:can&&!bought?"pointer":"default",fontFamily:"inherit",transition:"all 0.2s",
                        boxShadow:bought?"0 2px 12px rgba(52,211,153,0.2)":can?`0 2px 12px ${THEME.shadow}`:"none",
                        position:"relative"}}>
                      {!can&&!bought&&(
                        <div style={{position:"absolute",bottom:0,left:0,height:3,width:`${progress*100}%`,
                          background:`linear-gradient(90deg,${THEME.primary},${THEME.secondary})`,
                          borderRadius:"0 0 0 16px",transition:"width 0.3s ease"}}/>
                      )}
                      <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px"}}>
                        <span style={{fontSize:22}}>{u.emoji}</span>
                        <span style={{flex:1,textAlign:"left"}}>
                          <div style={{fontSize:13,fontWeight:600,color:bought?THEME.mint:can?THEME.text:"#ccc"}}>
                            {u.label}{bought?" ✓":""}
                          </div>
                          <div style={{fontSize:11,color:THEME.textLight}}>{u.desc}</div>
                        </span>
                        <span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:10,
                          display:"flex",alignItems:"center",gap:3,
                          background:bought?`linear-gradient(135deg,${THEME.mint},#059669)`:can?`linear-gradient(135deg,${THEME.primary},${THEME.secondary})`:"#eee",
                          color:can||bought?"white":"#bbb"}}>
                          {bought?"куплено":<>{u.cost}<PawIcon size={16} s={0.7}/></>}
                        </span>
                      </div>
                      {!can&&!bought&&(
                        <div style={{fontSize:10,color:THEME.textLight,letterSpacing:1,padding:"0 16px 6px",textAlign:"right"}}>
                          {coins} / {u.cost}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{marginTop:24,width:"100%",borderTop:`1px solid ${THEME.border}`,paddingTop:20}}>
              <div style={{fontSize:10,letterSpacing:4,color:THEME.textLight,marginBottom:10}}>СОХРАНИТЬ В РЕЙТИНГ</div>
              <div style={{display:"flex",gap:8}}>
                <input value={playerName} onChange={e=>setPlayerName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleSave()} placeholder="Твоё имя..." maxLength={16}
                  style={{flex:1,padding:"10px 16px",borderRadius:12,border:`1px solid ${THEME.border}`,
                    background:"white",color:THEME.text,fontFamily:"inherit",fontSize:13,outline:"none"}}/>
                <button onClick={handleSave} style={{padding:"10px 18px",borderRadius:12,border:"none",
                  background:`linear-gradient(135deg,${THEME.mint},#059669)`,
                  color:"white",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Сохранить</button>
              </div>
              {saveMsg&&<div style={{marginTop:8,fontSize:12,color:THEME.mint}}>{saveMsg}</div>}
            </div>
          </div>
        )}

        {tab==="board"&&(
          <Leaderboard
            savedName={savedName}
            onBoardLoaded={(board) => {
              const rank = savedName ? board.findIndex(e => e.name === savedName) + 1 : null;
              setMyRankDisplay(rank > 0 ? rank : null);
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes svgPlus{0%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(-40px);}}
        @keyframes coinPulse{0%{transform:scale(1);}30%{transform:scale(1.15);}60%{transform:scale(0.97);}100%{transform:scale(1);}}
        .coinPulse{animation:coinPulse 0.4s cubic-bezier(0.34,1.56,0.64,1);}
        @keyframes bgPawFloat{0%,100%{transform:translateY(0px) rotate(0deg);}33%{transform:translateY(-10px) rotate(3deg);}66%{transform:translateY(-5px) rotate(-2deg);}}
        @keyframes zzzFloat{0%{opacity:0.9;transform:translateY(0) scale(1);}100%{opacity:0;transform:translateY(-18px) scale(1.3);}}
        .zzzFloat{animation:zzzFloat 1.6s ease-out infinite;}
        @keyframes goldenBonus{0%{opacity:1;transform:translateY(0) scale(1);}60%{opacity:1;transform:translateY(-30px) scale(1.2);}100%{opacity:0;transform:translateY(-60px) scale(0.8);}}
        @keyframes goldenGlow{0%,100%{opacity:0.4;}50%{opacity:0.9;}}
        .goldenGlow{animation:goldenGlow 0.6s ease-in-out infinite;}
        @keyframes goldenSpark{0%,100%{opacity:1;}50%{opacity:0.4;}}
        .goldenSpark{animation:goldenSpark 0.4s ease-in-out infinite;}
        @keyframes goldenHint{0%{opacity:0;transform:scale(0.8);}100%{opacity:1;transform:scale(1);}}
        @keyframes shopSlideIn{0%{opacity:0;transform:translateX(18px) scale(0.96);}100%{opacity:1;transform:translateX(0) scale(1);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
        input::placeholder{color:#d8b4cf;}
        button{outline:none;}
      `}</style>
    </div>
  );
}