import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const MONTHS_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const PAYMENTS  = ["เงินสด","บัตรเครดิต","โอนเงิน","QR พร้อมเพย์","อื่นๆ"];
const today   = () => new Date().toISOString().split("T")[0];
const uid     = () => Math.random().toString(36).slice(2,10);
const thb     = (n) => Math.abs(n).toLocaleString("th-TH",{minimumFractionDigits:0});
const curYear = () => new Date().getFullYear();

const DEFAULT_IDS = ["food","transport","shopping","health","entertainment","utility","education","other_exp","salary","bonus","invest","other_inc"];

const mkCats = (isDark) => ({
  expense: [
    { id:"food",          emoji:"🍜", label:"อาหาร",       color: isDark?"#f0a878":"#F97316", type:"expense" },
    { id:"transport",     emoji:"🚇", label:"เดินทาง",     color: isDark?"#6eb8d8":"#0EA5E9", type:"expense" },
    { id:"shopping",      emoji:"🛍️", label:"ช้อปปิ้ง",    color: isDark?"#b0a0d8":"#8B5CF6", type:"expense" },
    { id:"health",        emoji:"💊", label:"สุขภาพ",      color: isDark?"#6ec8a8":"#10B981", type:"expense" },
    { id:"entertainment", emoji:"🎮", label:"บันเทิง",     color: isDark?"#e090b0":"#EC4899", type:"expense" },
    { id:"utility",       emoji:"💡", label:"ค่าประจำ",    color: isDark?"#c8b860":"#EAB308", type:"expense" },
    { id:"education",     emoji:"📚", label:"การศึกษา",    color: isDark?"#8890d0":"#6366F1", type:"expense" },
    { id:"other_exp",     emoji:"📦", label:"อื่นๆ",       color: isDark?"#90a0b8":"#64748B", type:"expense" },
  ],
  income: [
    { id:"salary",    emoji:"💼", label:"เงินเดือน",     color: isDark?"#6ec8a8":"#10B981", type:"income" },
    { id:"bonus",     emoji:"🎁", label:"ได้รับ/โบนัส", color: isDark?"#6eb8d8":"#0EA5E9", type:"income" },
    { id:"invest",    emoji:"📈", label:"รายได้ลงทุน",  color: isDark?"#8890d0":"#6366F1", type:"income" },
    { id:"other_inc", emoji:"💰", label:"รายรับอื่นๆ",  color: isDark?"#c8b860":"#EAB308", type:"income" },
  ],
});

const EMOJI_POOL = ["🍜","🍕","🍺","☕","🛒","🚇","🚗","✈️","💊","🏋️","🎮","🎬","🎵","📚","💡","🏠","👕","💄","🎁","📱","💻","🐾","🌿","🏝️","💼","📈","💰","🏦","🪙","💳","📦","⚡","🔧","🎯","🌟","❤️"];
const PALETTE_DARK  = ["#f59e0b","#f43f5e","#10b981","#ef4444","#3b82f6","#8b5cf6","#ec4899","#64748b"];
const PALETTE_LIGHT = ["#6366F1","#8B5CF6","#10B981","#EC4899","#0EA5E9","#F97316","#EAB308","#64748B"];

/* ═══════════════════════════════════════════
   THEME TOKENS
═══════════════════════════════════════════ */
const T = {
  dark: {
    pageBg:"#12100e", heroBg:"linear-gradient(135deg,rgba(234,179,8,0.08),rgba(244,63,94,0.05))",
    card:"rgba(30,27,24,0.6)", cardHover:"rgba(38,34,30,0.75)",
    surface:"rgba(30,27,24,0.4)", inputBg:"rgba(20,18,16,0.5)",
    navBg:"rgba(18,16,14,0.94)", headerBg:"rgba(18,16,14,0.85)",
    border:"rgba(255,255,255,0.06)", borderSub:"rgba(255,255,255,0.03)",
    borderActive:"rgba(234,179,8,0.3)",
    text:"#f4f0ea", textSub:"#a59e94", textMuted:"#6c665e",
    accent:"#f59e0b", accentSoft:"rgba(245,158,11,0.12)", accent2:"#f43f5e",
    incomeColor:"#2dd4bf", expColor:"#f87171",
    green:"#2dd4bf", greenSoft:"rgba(45,212,191,0.12)",
    red:"#f87171",   redSoft:"rgba(248,113,113,0.12)",
    shadow:"0 8px 32px rgba(10,8,6,0.5)",
    shadowSm:"0 2px 8px rgba(10,8,6,0.3)", shadowCard:"0 4px 20px rgba(10,8,6,0.4)",
    barTrack:"rgba(255,255,255,0.04)", backdropFilter:"blur(20px)",
    radius:"16px", radiusSm:"12px", radiusLg:"22px",
    palette:PALETTE_DARK, isNeu:false,
  },
  light: {
    pageBg:"#E8E8EE", heroBg:"#E8E8EE",
    card:"#E8E8EE", cardHover:"#EBEBF1",
    surface:"#E8E8EE", inputBg:"#E8E8EE",
    navBg:"#E8E8EE", headerBg:"#E8E8EE",
    border:"transparent", borderSub:"transparent",
    borderActive:"transparent",
    text:"#3A3A5C", textSub:"#7A7A9A", textMuted:"#AAAAC0",
    accent:"#6366F1", accentSoft:"rgba(99,102,241,0.12)", accent2:"#8B5CF6",
    incomeColor:"#10B981", expColor:"#6366F1",
    green:"#10B981", greenSoft:"rgba(16,185,129,0.1)",
    red:"#EF4444",   redSoft:"rgba(239,68,68,0.1)",
    shadow:"8px 8px 20px #C8C8D4,-8px -8px 20px #FFFFFF",
    shadowSm:"4px 4px 10px #C8C8D4,-4px -4px 10px #FFFFFF",
    shadowCard:"6px 6px 16px #C8C8D4,-6px -6px 16px #FFFFFF",
    shadowInset:"inset 4px 4px 10px #C8C8D4,inset -4px -4px 10px #FFFFFF",
    barTrack:"#D8D8E4", backdropFilter:"none",
    radius:"18px", radiusSm:"14px", radiusLg:"28px",
    palette:PALETTE_LIGHT, isNeu:true,
  },
};

/* ═══════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════ */
const GStyle = ({ t, isDark }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{-webkit-tap-highlight-color:transparent}
    body{min-height:100vh;min-height:100dvh;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;
      background:${isDark?"#12100e":"#E8E8EE"};transition:background .5s ease;overscroll-behavior:none}
    ::-webkit-scrollbar{width:3px}
    ::-webkit-scrollbar-thumb{background:${isDark?"rgba(255,255,255,.1)":"#C8C8D4"};border-radius:99px}
    ::-webkit-scrollbar-track{background:transparent}
    input,select,textarea,button{font-family:'Inter',sans-serif}
    input[type=date]::-webkit-calendar-picker-indicator,
    input[type=month]::-webkit-calendar-picker-indicator{filter:${isDark?"invert(1) opacity(.3)":"opacity(.4)"};cursor:pointer}
    input:focus,select:focus,textarea:focus{
      outline:none;
      border-color:${t.accent}!important;
      box-shadow:${isDark?`0 0 0 3px ${t.accent}25`:`inset 4px 4px 8px #C0C0CC,inset -4px -4px 8px #FFFFFF`}!important;
    }
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes toastIn{from{opacity:0;transform:translateY(-20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes modalUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
    @keyframes overlayIn{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes float1{0%,100%{transform:translate(0,0)}33%{transform:translate(40px,-50px)}66%{transform:translate(-30px,40px)}}
    @keyframes float2{0%,100%{transform:translate(0,0)}33%{transform:translate(-50px,30px)}66%{transform:translate(40px,-40px)}}
    @keyframes float3{0%,100%{transform:translate(0,0)}50%{transform:translate(25px,50px)}}
    @keyframes glow{0%,100%{opacity:.6}50%{opacity:1}}
    .pg{animation:fadeUp .3s cubic-bezier(.22,1,.36,1)}
    .toast-anim{animation:toastIn .3s cubic-bezier(.22,1,.36,1)}
    .modal-anim{animation:modalUp .3s cubic-bezier(.22,1,.36,1)}
    .overlay-anim{animation:overlayIn .2s ease}
    .btn{transition:opacity .12s,transform .1s;cursor:pointer;-webkit-tap-highlight-color:transparent}
    .btn:active{transform:scale(.96)!important;opacity:.85}
    .glass-card{transition:background .2s,border-color .2s,box-shadow .2s,transform .2s}
    .glass-card:hover{background:rgba(255,255,255,.07)!important;border-color:rgba(255,255,255,.14)!important;transform:translateY(-1px)}
    .neu-card{transition:box-shadow .2s,transform .2s}
    .neu-card:hover{transform:translateY(-1px)}
    .neu-card:active{box-shadow:inset 4px 4px 10px #C8C8D4,inset -4px -4px 10px #FFFFFF!important;transform:translateY(0)!important}
    .hide-scroll::-webkit-scrollbar{display:none}
    .hide-scroll{-ms-overflow-style:none;scrollbar-width:none}
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
    input[type=number]{-moz-appearance:textfield}
    input[type=color]{-webkit-appearance:none;border:none;cursor:pointer;border-radius:8px;padding:0}
    input[type=color]::-webkit-color-swatch-wrapper{padding:0}
    input[type=color]::-webkit-color-swatch{border:none;border-radius:8px}
  `}</style>
);

/* ═══════════════════════════════════════════
   ANIMATED BACKGROUND ORBS (dark mode)
═══════════════════════════════════════════ */
function BgOrbs() {
  return (
    <div style={{ position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0 }}>
      <div style={{ position:"absolute",top:"-15%",left:"-10%",width:340,height:340,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)",
        filter:"blur(60px)",animation:"float1 28s ease-in-out infinite" }}/>
      <div style={{ position:"absolute",bottom:"-10%",right:"-12%",width:380,height:380,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(244,63,94,0.06) 0%,transparent 70%)",
        filter:"blur(60px)",animation:"float2 32s ease-in-out infinite" }}/>
      <div style={{ position:"absolute",top:"35%",right:"10%",width:220,height:220,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(249,115,22,0.05) 0%,transparent 70%)",
        filter:"blur(50px)",animation:"float3 22s ease-in-out infinite" }}/>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CARD WRAPPER
═══════════════════════════════════════════ */
function Card({ children, t, style, hover=true, inset=false, glow, onClick }) {
  const cls = t.isNeu ? (hover?"neu-card":"") : (hover?"glass-card":"");
  const base = t.isNeu
    ? { background:t.card, borderRadius:t.radius, boxShadow:inset?t.shadowInset:t.shadowCard, border:"none" }
    : { background:t.card, borderRadius:t.radius, boxShadow:glow?`${t.shadowCard}, ${glow}`:t.shadowCard,
        border:`1px solid ${t.border}`, backdropFilter:t.backdropFilter, WebkitBackdropFilter:t.backdropFilter };
  return <div className={cls} style={{...base,...style}} onClick={onClick}>{children}</div>;
}

/* ═══════════════════════════════════════════
   PRIMITIVES
═══════════════════════════════════════════ */
const Lbl = ({ children, t }) => (
  <div style={{ fontSize:10.5,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted,marginBottom:7,marginTop:18 }}>{children}</div>
);

function Inp({ t, style, ...p }) {
  const isDark = !t.isNeu;
  return (
    <input style={{ width:"100%",background:t.inputBg,border:isDark?`1px solid ${t.border}`:"none",
      borderRadius:t.radiusSm,padding:"12px 14px",color:t.text,fontSize:16,
      boxShadow:isDark?"none":t.shadowInset,transition:"box-shadow .18s,border-color .18s",...style }} {...p} />
  );
}

function Sel({ t, children, style, ...p }) {
  const isDark = !t.isNeu;
  return (
    <select style={{ width:"100%",background:t.inputBg,border:isDark?`1px solid ${t.border}`:"none",
      borderRadius:t.radiusSm,padding:"12px 14px",color:t.text,fontSize:16,
      appearance:"none",cursor:"pointer",boxShadow:isDark?"none":t.shadowInset,...style }} {...p}>{children}</select>
  );
}

function PrimaryBtn({ children, t, style, disabled, loading, ...p }) {
  const isDark = !t.isNeu;
  return (
    <button className="btn" disabled={disabled||loading} style={{
      background:`linear-gradient(135deg,${t.accent},${t.accent2})`,
      border:"none",borderRadius:t.radiusSm,padding:"13px 22px",color:"#fff",
      fontSize:13.5,fontWeight:700,cursor:(disabled||loading)?"not-allowed":"pointer",
      boxShadow:isDark?`0 4px 16px ${t.accent}40`:"4px 4px 10px #C0C0CC,-2px -2px 8px #FFFFFF",
      opacity:(disabled||loading)?.55:1,transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
      ...style }} {...p}>
      {loading && <span style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin .6s linear infinite" }}/>}
      {children}
    </button>
  );
}

function GhostBtn({ children, t, style, ...p }) {
  return (
    <button className="btn" style={{
      background:t.isNeu?t.card:"rgba(255,255,255,.04)",border:t.isNeu?"none":`1px solid ${t.border}`,
      borderRadius:t.radiusSm,padding:"12px 18px",color:t.textSub,fontSize:13.5,fontWeight:600,
      boxShadow:t.isNeu?t.shadowCard:"none",...style }} {...p}>{children}</button>
  );
}

function Seg({ options, value, onChange, t }) {
  const isDark = !t.isNeu;
  return (
    <div style={{ display:"flex",gap:3,
      background:isDark?"rgba(255,255,255,.04)":t.card,borderRadius:t.radius,padding:4,
      boxShadow:t.isNeu?t.shadowInset:`inset 0 1px 3px rgba(0,0,0,.15)`,
      border:isDark?`1px solid ${t.border}`:"none" }}>
      {options.map(([v,label])=>{
        const active = value===v;
        return (
          <button key={v} className="btn" onClick={()=>onChange(v)} style={{
            flex:1,border:"none",borderRadius:parseInt(t.radiusSm)-3+"px",
            padding:"9px 6px",fontSize:12.5,fontWeight:active?700:400,
            color:active?(isDark?"#fff":t.accent):t.textSub,
            background:active?(isDark?`linear-gradient(135deg,${t.accent}aa,${t.accent2}88)`:t.card):"transparent",
            boxShadow:active?(isDark?"0 2px 8px rgba(0,0,0,.25)":t.shadowCard):"none",
            transition:"all .2s" }}>{label}</button>
        );
      })}
    </div>
  );
}

function Toast({ toast, t }) {
  if(!toast) return null;
  const configs = {
    success:{ bg:t.isNeu?"linear-gradient(135deg,#6366F1,#8B5CF6)":`linear-gradient(135deg,${t.accent},${t.accent2})`,icon:"✓" },
    income: { bg:"linear-gradient(135deg,#10B981,#34D399)",icon:"✓" },
    error:  { bg:"linear-gradient(135deg,#D04040,#E06060)",icon:"⚠" },
  };
  const c = configs[toast.type]||configs.success;
  return (
    <div className="toast-anim" style={{ position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9999,
      background:c.bg,color:"#fff",padding:"12px 20px",borderRadius:14,fontWeight:700,fontSize:13,
      boxShadow:"0 8px 32px rgba(0,0,0,.35)",display:"flex",alignItems:"center",gap:8,
      backdropFilter:"blur(12px)",maxWidth:"90vw" }}>
      <span style={{ fontSize:14 }}>{c.icon}</span> {toast.msg}
    </div>
  );
}

/* ─── Entry Card (simplified) ─── */
function EntryCard({ e, onEdit, onDelete, t, allCats }) {
  const cat = allCats.find(c=>c.id===e.category)||allCats[0];
  const inc = e.type==="income";
  const amtColor = inc?t.incomeColor:t.expColor;
  return (
    <Card t={t} style={{ padding:"12px 14px",marginBottom:8 }} glow={!t.isNeu?`0 0 10px ${cat.color}12`:undefined}>
      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ width:40,height:40,borderRadius:12,flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,
          background:t.isNeu?t.card:`${cat.color}14`,
          boxShadow:t.isNeu?t.shadowCard:"none",
          border:t.isNeu?"none":`1px solid ${cat.color}20` }}>{cat.emoji}</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:13.5,fontWeight:600,color:t.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
            {e.note||cat.label}
          </div>
          <div style={{ fontSize:10.5,color:t.textMuted,marginTop:2 }}>{cat.label}</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0 }}>
          <span style={{ fontFamily:"'DM Mono',monospace",fontSize:14.5,fontWeight:700,color:amtColor }}>
            {inc?"+":"−"}฿{thb(e.amount)}
          </span>
          <div style={{ display:"flex",gap:3 }}>
            <button className="btn" onClick={()=>onEdit(e)} style={{
              background:t.isNeu?t.card:"rgba(255,255,255,.04)",border:t.isNeu?"none":`1px solid ${t.border}`,
              borderRadius:8,padding:"3px 8px",fontSize:11,color:t.textSub,
              boxShadow:t.isNeu?t.shadowCard:"none" }}>✏</button>
            <button className="btn" onClick={()=>onDelete(e.id)} style={{
              background:t.isNeu?t.card:"rgba(255,255,255,.04)",border:t.isNeu?"none":`1px solid ${t.border}`,
              borderRadius:8,padding:"3px 8px",fontSize:11,color:t.textSub,
              boxShadow:t.isNeu?t.shadowCard:"none" }}>✕</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Bar Chart ─── */
function BarChart({ bars, t, height=140 }) {
  const maxVal = Math.max(...bars.map(b=>Math.max(b.income||0,b.expense||0)),1);
  return (
    <div style={{ display:"flex",alignItems:"flex-end",gap:5,height,paddingBottom:22 }}>
      {bars.map((b,i)=>{
        const ih=Math.max(((b.income||0)/maxVal)*(height-24),b.income?3:0);
        const eh=Math.max(((b.expense||0)/maxVal)*(height-24),b.expense?3:0);
        return (
          <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative" }}>
            <div style={{ display:"flex",alignItems:"flex-end",gap:2,height:height-24 }}>
              <div title={`+฿${thb(b.income||0)}`} style={{ width:"44%",height:ih,borderRadius:"4px 4px 2px 2px",
                background:`linear-gradient(180deg,${t.incomeColor},${t.incomeColor}4d)`,
                transition:"height .7s cubic-bezier(.22,1,.36,1)" }}/>
              <div title={`−฿${thb(b.expense||0)}`} style={{ width:"44%",height:eh,borderRadius:"4px 4px 2px 2px",
                background:`linear-gradient(180deg,${t.expColor},${t.expColor}4d)`,
                transition:"height .7s cubic-bezier(.22,1,.36,1)" }}/>
            </div>
            <div style={{ fontSize:9,color:t.textMuted,position:"absolute",bottom:0 }}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Donut ─── */
function DonutChart({ slices, size=120, t, centerLabel, centerValue }) {
  let cum=0;
  const r=46,cx=60,cy=60,sw=14,circ=2*Math.PI*r;
  const total=slices.reduce((s,sl)=>s+sl.value,0);
  const vb = "0 0 120 120";
  if(!total) return (
    <div style={{ width:size,height:size,borderRadius:"50%",background:t.isNeu?t.barTrack:"rgba(255,255,255,.04)",display:"flex",alignItems:"center",justifyContent:"center",color:t.textMuted,fontSize:11 }}>ไม่มีข้อมูล</div>
  );
  return (
    <svg width={size} height={size} viewBox={vb}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={t.barTrack} strokeWidth={sw}/>
      {slices.map((sl,i)=>{
        const pct=sl.value/total,dash=circ*pct,gap=circ-dash,offset=circ*(1-cum);
        cum+=pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={sl.color} strokeWidth={sw}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition:"stroke-dasharray .6s" }}
          />
        );
      })}
      <text x={cx} y={cy-2} textAnchor="middle" fill={t.text} fontSize="10" fontFamily="DM Mono" fontWeight="700">{centerValue||"NET"}</text>
      <text x={cx} y={cy+11} textAnchor="middle" fill={t.textMuted} fontSize="8" fontFamily="Inter">{centerLabel||`${slices.length} หมวด`}</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════
   CATEGORY MODAL
═══════════════════════════════════════════ */
function CatModal({ open, onClose, cats, onSave, type, t, saving }) {
  const [list, setList] = useState(cats);
  const [form, setForm] = useState({ emoji:"📦", label:"", color:t.accent });
  const [tab, setTab]   = useState("list");
  if(!open) return null;
  const add = () => {
    if(!form.label.trim()) return;
    setList(p=>[...p,{...form,id:"c_"+uid(),type,label:form.label.trim()}]);
    setForm({ emoji:"📦", label:"", color:t.accent });
    setTab("list");
  };
  const pal = t.isNeu ? PALETTE_LIGHT : PALETTE_DARK;
  return (
    <div className="overlay-anim" style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(6px)" }}>
      <div className="modal-anim" style={{
        width:"100%",maxWidth:500,maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column",
        background:t.isNeu?t.card:"rgba(20,18,16,0.95)",
        borderRadius:`${t.radiusLg} ${t.radiusLg} 0 0`,
        boxShadow:t.isNeu?t.shadow:`0 -8px 40px ${t.accent}30, 0 0 0 1px rgba(255,255,255,.08)`,
        backdropFilter:t.isNeu?"none":"blur(24px)",
        border:t.isNeu?"none":"1px solid rgba(255,255,255,.1)" }}>
        <div style={{ width:36,height:4,borderRadius:99,background:t.isNeu?"#C8C8D4":"rgba(255,255,255,.15)",margin:"12px auto 0" }}/>
        <div style={{ padding:"14px 18px 0",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontSize:16,fontWeight:800,color:t.text }}>จัดการหมวดหมู่</div>
            <div style={{ fontSize:11,color:t.textMuted,marginTop:1 }}>{type==="expense"?"รายจ่าย":"รายรับ"}</div>
          </div>
          <button className="btn" onClick={onClose} style={{ background:t.isNeu?t.card:"rgba(255,255,255,.06)",border:t.isNeu?"none":`1px solid ${t.border}`,borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",color:t.textSub,fontSize:14,boxShadow:t.isNeu?t.shadowCard:"none" }}>✕</button>
        </div>
        <div style={{ padding:"12px 18px 0" }}>
          <Seg options={[["list",`หมวดทั้งหมด (${list.length})`],["add","＋ เพิ่มใหม่"]]} value={tab} onChange={setTab} t={t}/>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"14px 18px 0" }}>
          {tab==="list" && list.map(c=>{
            const isDefault=DEFAULT_IDS.includes(c.id);
            return (
              <div key={c.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:t.isNeu?`1px solid rgba(0,0,0,.05)`:`1px solid ${t.borderSub}` }}>
                <div style={{ width:36,height:36,borderRadius:10,background:t.isNeu?t.card:`${c.color}14`,boxShadow:t.isNeu?t.shadowCard:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,border:t.isNeu?"none":`1px solid ${c.color}20` }}>{c.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5,fontWeight:600,color:t.text }}>{c.label}</div>
                  {isDefault&&<div style={{ fontSize:10,color:t.textMuted }}>หมวดเริ่มต้น</div>}
                </div>
                <div style={{ width:14,height:14,borderRadius:4,background:c.color,flexShrink:0 }}/>
                {!isDefault&&<button className="btn" onClick={()=>setList(p=>p.filter(x=>x.id!==c.id))} style={{ background:t.isNeu?t.card:"rgba(248,113,113,.1)",border:t.isNeu?"none":`1px solid rgba(248,113,113,.2)`,borderRadius:8,padding:"4px 10px",fontSize:11,color:"#F87171",boxShadow:t.isNeu?t.shadowCard:"none" }}>ลบ</button>}
              </div>
            );
          })}
          {tab==="add" && (
            <div>
              <Lbl t={t}>เลือก Emoji</Lbl>
              <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:4 }}>
                {EMOJI_POOL.map(em=>(
                  <button key={em} className="btn" onClick={()=>setForm(p=>({...p,emoji:em}))} style={{ width:38,height:38,fontSize:18,borderRadius:10,background:form.emoji===em?t.accentSoft:t.isNeu?t.card:"rgba(255,255,255,.04)",border:form.emoji===em?`1.5px solid ${t.accent}`:t.isNeu?"none":`1px solid ${t.border}`,boxShadow:form.emoji===em&&!t.isNeu?`0 0 12px ${t.accent}30`:t.isNeu?t.shadowCard:"none" }}>{em}</button>
                ))}
              </div>
              <Lbl t={t}>ชื่อหมวดหมู่</Lbl>
              <Inp t={t} placeholder="เช่น สัตว์เลี้ยง, ท่องเที่ยว..." value={form.label} onChange={e=>setForm(p=>({...p,label:e.target.value}))}/>
              <Lbl t={t}>สี</Lbl>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
                {pal.map(c=>(
                  <button key={c} className="btn" onClick={()=>setForm(p=>({...p,color:c}))} style={{ width:28,height:28,borderRadius:7,background:c,border:`2.5px solid ${form.color===c?t.text:"transparent"}`,transition:"all .15s" }}/>
                ))}
                <div style={{ position:"relative",width:28,height:28,borderRadius:7,overflow:"hidden",border:`1px solid ${t.border}`,background:form.color }}>
                  <input type="color" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} style={{ position:"absolute",width:48,height:48,top:-10,left:-10,opacity:.01,cursor:"pointer" }}/>
                  <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:800,pointerEvents:"none",textShadow:"0 0 4px rgba(0,0,0,.5)" }}>+</div>
                </div>
              </div>
              <div style={{ height:16 }}/>
              <PrimaryBtn t={t} style={{ width:"100%" }} disabled={!form.label.trim()} onClick={add}>＋ เพิ่มหมวดหมู่</PrimaryBtn>
              <div style={{ height:20 }}/>
            </div>
          )}
        </div>
        <div style={{ padding:"14px 18px 24px",borderTop:t.isNeu?"1px solid rgba(0,0,0,.06)":`1px solid ${t.border}` }}>
          <PrimaryBtn t={t} style={{ width:"100%" }} loading={saving} onClick={()=>onSave(list)}>บันทึกการเปลี่ยนแปลง</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
export default function App() {
  const [isDark, setIsDark]   = useState(true);
  const t = isDark ? T.dark : T.light;

  const defaultCats = useMemo(()=>mkCats(isDark),[isDark]);
  const [expCats, setExpCats] = useState(()=>mkCats(true).expense);
  const [incCats, setIncCats] = useState(()=>mkCats(true).income);
  const allCats = useMemo(()=>[...expCats,...incCats],[expCats,incCats]);
  const getCat  = (id) => allCats.find(c=>c.id===id)||expCats[expCats.length-1];
  const isIncome= (id) => incCats.some(c=>c.id===id);

  /* ─── Supabase state ─── */
  const [entries,   setEntries]  = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [syncing,   setSyncing]  = useState(false);
  const [catSaving, setCatSaving]= useState(false);

  const [view,        setView]       = useState("dashboard");
  const [reportTab,   setReportTab]  = useState("monthly");
  const [reportMonth, setReportMonth]= useState(today().slice(0,7));
  const [reportYear,  setReportYear] = useState(curYear());
  const [filterDate,  setFilterDate] = useState(today());
  const [filterCat,   setFilterCat]  = useState("all");
  const [filterType,  setFilterType] = useState("all");
  const [editItem,    setEditItem]   = useState(null);
  const [toast,       setToast]      = useState(null);
  const [entryType,   setEntryType]  = useState("expense");
  const [catModal,    setCatModal]   = useState(null);
  const [showMore,    setShowMore]   = useState(false);
  const [form, setForm] = useState({ date:today(), amount:"", category:"food", note:"", payment:"เงินสด", tags:"" });

  const showToast = useCallback((msg,type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),2600);
  },[]);

  const resetForm = useCallback((tp="expense") => {
    setEntryType(tp);
    const defCat = tp==="income"?incCats[0]?.id||"salary":expCats[0]?.id||"food";
    setForm({ date:today(), amount:"", category:defCat, note:"", payment:"เงินสด", tags:"" });
    setShowMore(false);
  },[incCats,expCats]);

  /* ─── Load data ─── */
  const loadEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("date", { ascending:false })
      .order("created_at", { ascending:false });
    if(error) showToast("โหลดข้อมูลไม่สำเร็จ: "+error.message, "error");
    else setEntries((data||[]).map(e=>({...e, tags:e.tags||[]})));
    setLoading(false);
  },[showToast]);

  const loadCategories = useCallback(async () => {
    const { data } = await supabase
      .from("custom_categories")
      .select("*")
      .order("created_at", { ascending:true });
    if(data && data.length > 0){
      const expCustom = data.filter(c=>c.type==="expense");
      const incCustom = data.filter(c=>c.type==="income");
      if(expCustom.length) setExpCats(p=>{
        const base=mkCats(true).expense;
        const customOnly=expCustom.filter(c=>!DEFAULT_IDS.includes(c.id));
        return [...base,...customOnly];
      });
      if(incCustom.length) setIncCats(p=>{
        const base=mkCats(true).income;
        const customOnly=incCustom.filter(c=>!DEFAULT_IDS.includes(c.id));
        return [...base,...customOnly];
      });
    }
  },[]);

  useEffect(()=>{
    loadEntries();
    loadCategories();
  },[]);

  /* ─── CRUD ─── */
  const saveEntry = async () => {
    if(!form.amount||isNaN(+form.amount)||+form.amount<=0){
      showToast("กรุณากรอกจำนวนเงิน","error"); return;
    }
    setSyncing(true);
    const entry = {
      id:       editItem ? editItem.id : uid(),
      date:     form.date,
      amount:   +form.amount,
      category: form.category,
      note:     form.note,
      payment:  form.payment,
      type:     entryType,
      tags:     form.tags.split(",").map(s=>s.trim()).filter(Boolean),
    };
    const { error } = editItem
      ? await supabase.from("entries").update(entry).eq("id",editItem.id)
      : await supabase.from("entries").insert(entry);
    if(error){
      showToast("บันทึกไม่สำเร็จ: "+error.message,"error");
    } else {
      if(editItem){
        setEntries(p=>p.map(e=>e.id===editItem.id?entry:e));
        showToast("แก้ไขสำเร็จ"); setEditItem(null);
      } else {
        setEntries(p=>[entry,...p]);
        showToast(entryType==="income"?"บันทึกรายรับสำเร็จ":"บันทึกรายจ่ายสำเร็จ", entryType==="income"?"income":"success");
      }
      resetForm(); setView("dashboard");
    }
    setSyncing(false);
  };

  const deleteEntry = async (id) => {
    setSyncing(true);
    const { error } = await supabase.from("entries").delete().eq("id",id);
    if(error) showToast("ลบไม่สำเร็จ: "+error.message,"error");
    else { setEntries(p=>p.filter(e=>e.id!==id)); showToast("ลบรายการแล้ว","error"); }
    setSyncing(false);
  };

  const startEdit = (item) => {
    setEditItem(item);
    setEntryType(item.type||(isIncome(item.category)?"income":"expense"));
    setForm({ date:item.date, amount:String(item.amount), category:item.category, note:item.note, payment:item.payment||"เงินสด", tags:(item.tags||[]).join(", ") });
    setView("add");
  };

  const saveCats = async (newList, type) => {
    setCatSaving(true);
    const customNew = newList.filter(c=>!DEFAULT_IDS.includes(c.id));
    if(customNew.length > 0){
      const { error } = await supabase.from("custom_categories").upsert(
        customNew.map(c=>({ id:c.id, emoji:c.emoji, label:c.label, color:c.color, type }))
      );
      if(error){ showToast("บันทึกหมวดหมู่ไม่สำเร็จ","error"); setCatSaving(false); return; }
    }
    const existingCustomIds = newList.filter(c=>!DEFAULT_IDS.includes(c.id)).map(c=>c.id);
    const currentCustom = (type==="expense"?expCats:incCats).filter(c=>!DEFAULT_IDS.includes(c.id)).map(c=>c.id);
    const toDelete = currentCustom.filter(id=>!existingCustomIds.includes(id));
    if(toDelete.length > 0){
      await supabase.from("custom_categories").delete().in("id", toDelete);
    }
    if(type==="expense") setExpCats(newList);
    else setIncCats(newList);
    setCatModal(null);
    showToast("บันทึกหมวดหมู่สำเร็จ");
    setCatSaving(false);
  };

  /* ─── Stats ─── */
  const curM = today().slice(0,7);
  const todayEnt  = useMemo(()=>entries.filter(e=>e.date===today()),[entries]);
  const todayExp  = useMemo(()=>todayEnt.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0),[todayEnt]);
  const todayInc  = useMemo(()=>todayEnt.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0),[todayEnt]);
  const mAll      = useMemo(()=>entries.filter(e=>e.date.startsWith(curM)),[entries]);
  const mExp      = useMemo(()=>mAll.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0),[mAll]);
  const mInc      = useMemo(()=>mAll.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0),[mAll]);
  const mNet      = mInc - mExp;
  const catTotals = useMemo(()=>{ const m={}; mAll.filter(e=>e.type==="expense").forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount;}); return Object.entries(m).sort((a,b)=>b[1]-a[1]); },[mAll]);
  const mBars     = useMemo(()=>{ const now=new Date(); return Array.from({length:6},(_,i)=>{ const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1); const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; const sl=entries.filter(e=>e.date.startsWith(k)); return { label:MONTHS_TH[d.getMonth()], income:sl.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0), expense:sl.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0), key:k }; }); },[entries]);
  const yBars     = useMemo(()=>MONTHS_TH.map((label,mi)=>{ const k=`${reportYear}-${String(mi+1).padStart(2,"0")}`; const sl=entries.filter(e=>e.date.startsWith(k)); return { label, income:sl.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0), expense:sl.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0), key:k }; }),[entries,reportYear]);
  const rEnt      = useMemo(()=>entries.filter(e=>e.date.startsWith(reportMonth)),[entries,reportMonth]);
  const rExp      = useMemo(()=>rEnt.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0),[rEnt]);
  const rInc      = useMemo(()=>rEnt.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0),[rEnt]);
  const rCats     = useMemo(()=>{ const m={}; rEnt.filter(e=>e.type==="expense").forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount;}); return Object.entries(m).sort((a,b)=>b[1]-a[1]); },[rEnt]);
  const donutSlices = rCats.map(([id,val])=>({color:getCat(id).color,value:val}));
  const filtered  = useMemo(()=>entries.filter(e=>(!filterDate||e.date===filterDate)&&(filterCat==="all"||e.category===filterCat)&&(filterType==="all"||e.type===filterType)).sort((a,b)=>b.date.localeCompare(a.date)),[entries,filterDate,filterCat,filterType]);
  const avYears   = useMemo(()=>{ const ys=new Set(entries.map(e=>+e.date.slice(0,4))); ys.add(curYear()); return Array.from(ys).sort((a,b)=>b-a); },[entries]);
  const activeCats = entryType==="income"?incCats:expCats;
  const mTxnCount = mAll.length;
  const spendPct = mInc>0 ? Math.min(Math.round(mExp/mInc*100),100) : (mExp>0?100:0);

  /* ─── Loading screen ─── */
  if(loading) return (
    <div style={{ minHeight:"100dvh",background:isDark?"#12100e":"#E8E8EE",
      display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14 }}>
      <div style={{ width:36,height:36,border:`3px solid ${isDark?"#f59e0b":"#6366F1"}`,
        borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite" }}/>
      <div style={{ color:isDark?"#a59e94":"#6A6A80",fontSize:13,fontFamily:"'Inter',sans-serif" }}>กำลังโหลดข้อมูล...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ─── Sync indicator ─── */
  const SyncDot = () => syncing ? (
    <div style={{ position:"fixed",top:14,left:"50%",transform:"translateX(-50%)",zIndex:500,
      background:isDark?"rgba(20,18,16,.9)":t.card,
      border:`1px solid ${t.border}`,borderRadius:20,padding:"6px 14px",fontSize:11,
      color:t.textSub,boxShadow:t.shadowSm,display:"flex",alignItems:"center",gap:6,
      backdropFilter:"blur(12px)" }}>
      <span style={{ width:8,height:8,borderRadius:"50%",border:`2px solid ${t.accent}`,
        borderTopColor:"transparent",display:"inline-block",animation:"spin .6s linear infinite" }}/>
      กำลังซิงค์...
    </div>
  ) : null;

  return (
    <div style={{ minHeight:"100dvh",color:t.text,position:"relative",
      background:isDark?"#12100e":T.light.pageBg }}>
      <GStyle t={t} isDark={isDark}/>
      <Toast toast={toast} t={t}/>
      <SyncDot/>
      {isDark && <BgOrbs/>}
      <CatModal open={catModal==="expense"} onClose={()=>setCatModal(null)} cats={expCats} onSave={c=>saveCats(c,"expense")} type="expense" t={t} saving={catSaving}/>
      <CatModal open={catModal==="income"} onClose={()=>setCatModal(null)} cats={incCats} onSave={c=>saveCats(c,"income")} type="income" t={t} saving={catSaving}/>

      {/* ──── HEADER (minimal, scrollable) ──── */}
      <header style={{
        padding:"14px 16px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"relative",zIndex:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:10,
            background:`linear-gradient(135deg,${t.accent},${t.accent2})`,
            boxShadow:`0 4px 14px ${t.accent}45`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"#fff" }}>◈</div>
          <div>
            <div style={{ fontSize:15,fontWeight:800,color:t.text,letterSpacing:"-.02em" }}>MoneySave</div>
            <div style={{ fontSize:9.5,color:t.textMuted,letterSpacing:".06em",textTransform:"uppercase" }}>รายรับ-รายจ่าย</div>
          </div>
        </div>
        <button className="btn" onClick={()=>setIsDark(d=>!d)} style={{
          background:isDark?"rgba(255,255,255,.06)":t.card,
          border:isDark?`1px solid ${t.border}`:"none",
          borderRadius:12,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:18,boxShadow:isDark?"none":t.shadowCard,color:t.textSub }}>{isDark?"☀️":"🌙"}</button>
      </header>

      {/* ──── MAIN ──── */}
      <main style={{ maxWidth:500,margin:"0 auto",padding:"4px 14px calc(80px + env(safe-area-inset-bottom, 8px))",position:"relative",zIndex:1 }}>

        {/* ════ DASHBOARD ════ */}
        {view==="dashboard"&&(
          <div className="pg">
            {/* Hero card */}
            <Card t={t} style={{ padding:"20px 18px",marginBottom:12,
              background:isDark?"linear-gradient(135deg,rgba(234,179,8,0.1),rgba(244,63,94,0.06))":t.card,
              border:isDark?"1px solid rgba(234,179,8,0.15)":"none" }}>
              <div style={{ fontSize:10,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:t.textMuted,marginBottom:4 }}>
                {new Date().toLocaleDateString("th-TH",{weekday:"long",day:"numeric",month:"short"})}
              </div>
              <div style={{ fontSize:11,color:t.textSub,marginBottom:10 }}>ยอดสุทธิเดือนนี้</div>
              <div style={{ fontFamily:"'DM Mono',monospace",fontSize:34,fontWeight:700,
                color:mNet>=0?t.incomeColor:t.expColor,marginBottom:12,lineHeight:1 }}>
                {mNet>=0?"+":"−"}฿{thb(Math.abs(mNet))}
              </div>
              {/* Mini stats row */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                {[
                  ["📥","รายรับ",`฿${thb(mInc)}`,t.incomeColor],
                  ["📤","รายจ่าย",`฿${thb(mExp)}`,t.expColor],
                  ["📋","รายการ",`${mTxnCount}`,t.accent],
                ].map(([icon,label,val,color])=>(
                  <div key={label} style={{ background:isDark?"rgba(255,255,255,.04)":t.card,borderRadius:t.radiusSm,padding:"10px",
                    border:isDark?`1px solid ${t.borderSub}`:"none",boxShadow:t.isNeu?t.shadowSm:"none",textAlign:"center" }}>
                    <div style={{ fontSize:14,marginBottom:4 }}>{icon}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color }}>{val}</div>
                    <div style={{ fontSize:9,color:t.textMuted,marginTop:2 }}>{label}</div>
                  </div>
                ))}
              </div>
              {/* Spending bar */}
              {mInc>0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:9.5,color:t.textMuted,marginBottom:4 }}>
                    <span>ใช้ไป {spendPct}% ของรายรับ</span>
                    <span>฿{thb(mExp)} / ฿{thb(mInc)}</span>
                  </div>
                  <div style={{ height:5,background:t.barTrack,borderRadius:99,overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${spendPct}%`,
                      background:spendPct>80?`linear-gradient(90deg,${t.expColor},#d06060)`:`linear-gradient(90deg,${t.accent},${t.accent2})`,
                      borderRadius:99,transition:"width .8s cubic-bezier(.22,1,.36,1)" }}/>
                  </div>
                </div>
              )}
            </Card>

            {/* Top categories */}
            {catTotals.length>0&&(
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted,marginBottom:8,padding:"0 2px" }}>รายจ่ายสูงสุดเดือนนี้</div>
                <div className="hide-scroll" style={{ display:"flex",gap:7,overflowX:"auto",paddingBottom:4 }}>
                  {catTotals.slice(0,5).map(([id,total])=>{
                    const cat=getCat(id);
                    return (
                      <div key={id} style={{ display:"flex",alignItems:"center",gap:7,flexShrink:0,
                        background:isDark?`${cat.color}12`:`${cat.color}10`,
                        border:isDark?`1px solid ${cat.color}20`:"none",
                        borderRadius:12,padding:"8px 12px",
                        boxShadow:t.isNeu?t.shadowSm:"none" }}>
                        <span style={{ fontSize:16 }}>{cat.emoji}</span>
                        <div>
                          <div style={{ fontSize:10,color:cat.color,fontWeight:700 }}>{cat.label}</div>
                          <div style={{ fontSize:12,fontFamily:"'DM Mono',monospace",color:t.text,fontWeight:600 }}>฿{thb(total)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Today's entries */}
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9,padding:"0 2px" }}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted }}>
                รายการวันนี้{todayEnt.length>0&&` (${todayEnt.length})`}
              </div>
              <button onClick={()=>setView("history")} style={{ fontSize:11.5,color:t.accent,background:"none",border:"none",cursor:"pointer",fontWeight:600 }}>ดูทั้งหมด →</button>
            </div>
            {todayEnt.length===0
              ?<div style={{ textAlign:"center",padding:"36px 0",color:t.textMuted }}><div style={{ fontSize:32,opacity:.25,marginBottom:6 }}>💤</div><div style={{ fontSize:13 }}>ยังไม่มีรายการวันนี้</div></div>
              :todayEnt.map(e=><EntryCard key={e.id} e={e} onEdit={startEdit} onDelete={deleteEntry} t={t} allCats={allCats}/>)
            }
          </div>
        )}

        {/* ════ ADD / EDIT ════ */}
        {view==="add"&&(
          <div className="pg">
            <Card t={t} style={{ padding:"20px 16px" }}>
              {!editItem&&<div style={{ marginBottom:16 }}><Seg options={[["expense","💸 รายจ่าย"],["income","💚 รายรับ"]]} value={entryType} onChange={tp=>{setEntryType(tp);setForm(f=>({...f,category:tp==="income"?incCats[0]?.id:expCats[0]?.id}));}} t={t}/></div>}
              {editItem&&<div style={{ marginBottom:16 }}><div style={{ fontSize:16,fontWeight:800,color:t.text }}>แก้ไขรายการ</div><div style={{ fontSize:11,color:t.textMuted,marginTop:2 }}>{isIncome(editItem.category)?"รายรับ":"รายจ่าย"}</div></div>}

              {/* Amount - Hero style */}
              <div style={{ textAlign:"center",padding:"12px 0 8px" }}>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted,marginBottom:10 }}>จำนวนเงิน</div>
                <div style={{ display:"inline-flex",alignItems:"center",gap:4 }}>
                  <span style={{ color:entryType==="income"?t.incomeColor:t.expColor,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:28 }}>฿</span>
                  <input type="number" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                    style={{ background:"transparent",border:"none",outline:"none",
                      fontSize:40,fontWeight:700,fontFamily:"'DM Mono',monospace",
                      color:entryType==="income"?t.incomeColor:t.expColor,
                      width:Math.max(120,(form.amount.length||1)*28),textAlign:"center",
                      caretColor:t.accent }} />
                </div>
              </div>

              {/* Date */}
              <Lbl t={t}>วันที่</Lbl>
              <Inp t={t} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>

              {/* Category - horizontal scroll */}
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18,marginBottom:7 }}>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted }}>หมวดหมู่</div>
                <button className="btn" onClick={()=>setCatModal(entryType)} style={{ fontSize:11,color:t.accent,background:"none",border:"none" }}>⚙ จัดการ</button>
              </div>
              <div className="hide-scroll" style={{ display:"flex",gap:6,overflowX:"auto",paddingBottom:4 }}>
                {activeCats.map(c=>{
                  const active=form.category===c.id;
                  return (
                    <button key={c.id} className="btn" onClick={()=>setForm(f=>({...f,category:c.id}))} style={{
                      flexShrink:0,display:"flex",alignItems:"center",gap:6,
                      background:active?(isDark?`${c.color}20`:c.color+"12"):t.isNeu?t.card:"rgba(255,255,255,.04)",
                      border:isDark?`1px solid ${active?c.color+"60":t.border}`:"none",
                      borderRadius:t.radiusSm,padding:"8px 14px",
                      boxShadow:t.isNeu?(active?t.shadow:t.shadowCard):(active?`0 0 12px ${c.color}30`:"none"),
                      transition:"all .15s" }}>
                      <span style={{ fontSize:17 }}>{c.emoji}</span>
                      <span style={{ fontSize:11.5,color:active?c.color:t.textSub,fontWeight:active?700:500,whiteSpace:"nowrap" }}>{c.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Note */}
              <Lbl t={t}>รายละเอียด</Lbl>
              <Inp t={t} placeholder={entryType==="income"?"รายได้จากอะไร?":"ซื้ออะไร? ที่ไหน?"} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>

              {/* Payment (expense only) */}
              {entryType==="expense"&&(<>
                <Lbl t={t}>ช่องทางชำระ</Lbl>
                <Sel t={t} value={form.payment} onChange={e=>setForm(f=>({...f,payment:e.target.value}))}>{PAYMENTS.map(p=><option key={p}>{p}</option>)}</Sel>
              </>)}

              {/* Show more toggle */}
              <button className="btn" onClick={()=>setShowMore(s=>!s)} style={{
                background:"none",border:"none",color:t.accent,fontSize:12,fontWeight:600,
                padding:"14px 0 4px",display:"flex",alignItems:"center",gap:4 }}>
                {showMore?"▾ ซ่อนเพิ่มเติม":"▸ เพิ่มเติม (แท็ก)"}
              </button>
              {showMore&&(
                <div style={{ animation:"fadeUp .2s ease" }}>
                  <Lbl t={t}>แท็ก (คั่นด้วย ,)</Lbl>
                  <Inp t={t} placeholder="มื้อเช้า, ที่ทำงาน..." value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))}/>
                </div>
              )}

              <div style={{ height:1,background:isDark?t.border:"rgba(0,0,0,.06)",margin:"20px 0 16px" }}/>
              <div style={{ display:"flex",gap:8 }}>
                <GhostBtn t={t} style={{ flex:1 }} onClick={()=>{setView("dashboard");setEditItem(null);resetForm();}}>ยกเลิก</GhostBtn>
                <PrimaryBtn t={t} style={{ flex:2 }} onClick={saveEntry} loading={syncing}>
                  {editItem?"บันทึกการแก้ไข":entryType==="income"?"💚 บันทึกรายรับ":"✅ บันทึกรายจ่าย"}
                </PrimaryBtn>
              </div>
            </Card>
          </div>
        )}

        {/* ════ HISTORY ════ */}
        {view==="history"&&(
          <div className="pg">
            <Card t={t} style={{ padding:"14px 15px",marginBottom:12 }}>
              <div style={{ display:"flex",gap:7,marginBottom:10 }}>
                <Inp t={t} type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{ flex:1 }}/>
                <button className="btn" onClick={()=>setFilterDate("")} style={{ background:t.isNeu?t.card:"rgba(255,255,255,.04)",border:isDark?`1px solid ${t.border}`:"none",borderRadius:t.radiusSm,padding:"0 14px",fontSize:12,color:t.textSub,boxShadow:t.isNeu?t.shadowCard:"none",whiteSpace:"nowrap" }}>ทั้งหมด</button>
              </div>
              <div style={{ marginBottom:10 }}><Seg options={[["all","ทั้งหมด"],["expense","รายจ่าย"],["income","รายรับ"]]} value={filterType} onChange={setFilterType} t={t}/></div>
              {/* Category dropdown */}
              <Sel t={t} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
                <option value="all">ทุกหมวดหมู่</option>
                {allCats.filter(c=>filterType==="all"||c.type===filterType).map(c=>(
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </Sel>
            </Card>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:9,padding:"0 2px" }}>
              <div style={{ fontSize:11,color:t.textMuted }}>{filtered.length} รายการ</div>
              <div style={{ fontSize:12.5,fontFamily:"'DM Mono',monospace" }}>
                <span style={{ color:t.incomeColor }}>+฿{thb(filtered.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0))}</span>
                <span style={{ color:t.textMuted }}> · </span>
                <span style={{ color:t.expColor }}>−฿{thb(filtered.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0))}</span>
              </div>
            </div>
            {filtered.length===0
              ?<div style={{ textAlign:"center",padding:"44px 0",color:t.textMuted }}><div style={{ fontSize:28,opacity:.25,marginBottom:8 }}>🔍</div><div style={{ fontSize:13 }}>ไม่พบรายการ</div></div>
              :filtered.map(e=><EntryCard key={e.id} e={e} onEdit={startEdit} onDelete={deleteEntry} t={t} allCats={allCats}/>)
            }
          </div>
        )}

        {/* ════ REPORT ════ */}
        {view==="report"&&(
          <div className="pg">
            <div style={{ marginBottom:13 }}><Seg options={[["monthly","รายเดือน"],["yearly","รายปี"]]} value={reportTab} onChange={setReportTab} t={t}/></div>
            {reportTab==="monthly"&&(<>
              <Inp t={t} type="month" value={reportMonth} onChange={e=>setReportMonth(e.target.value)} style={{ marginBottom:12 }}/>
              {/* Income / Expense cards */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10 }}>
                {[
                  ["รายรับ",`฿${thb(rInc)}`,t.incomeColor,rEnt.filter(e=>e.type==="income").length],
                  ["รายจ่าย",`฿${thb(rExp)}`,t.expColor,rEnt.filter(e=>e.type==="expense").length],
                ].map(([label,val,color,cnt])=>(
                  <Card key={label} t={t} style={{ padding:"14px 16px" }}>
                    <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted,marginBottom:6 }}>{label}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color }}>{val}</div>
                    <div style={{ fontSize:10,color:t.textMuted,marginTop:3 }}>{cnt} รายการ</div>
                  </Card>
                ))}
              </div>
              {/* Net balance */}
              {(rInc>0||rExp>0)&&(
                <Card t={t} style={{ padding:"12px 16px",marginBottom:12 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted }}>ยอดสุทธิ</div>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:(rInc-rExp)>=0?t.incomeColor:t.expColor }}>
                      {(rInc-rExp)>=0?"+":"−"}฿{thb(Math.abs(rInc-rExp))}
                    </div>
                  </div>
                </Card>
              )}
              {/* Donut + Top 3 */}
              {rExp>0&&(
                <Card t={t} style={{ padding:"16px",marginBottom:12 }}>
                  <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted,marginBottom:14 }}>🏆 รายจ่ายตามหมวด</div>
                  <div style={{ display:"flex",gap:16,alignItems:"center" }}>
                    <DonutChart slices={donutSlices} size={110} t={t} centerValue={`฿${thb(rExp)}`} centerLabel="รายจ่ายรวม"/>
                    <div style={{ flex:1 }}>
                      {rCats.slice(0,3).map(([id,total],rank)=>{
                        const cat=getCat(id),pct=Math.round(total/rExp*100);
                        return (
                          <div key={id} style={{ marginBottom:rank<2?11:0 }}>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                              <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                                <span style={{ fontSize:14 }}>{cat.emoji}</span>
                                <span style={{ fontSize:12,fontWeight:600,color:t.text }}>{cat.label}</span>
                              </div>
                              <span style={{ fontFamily:"'DM Mono',monospace",fontSize:11.5,color:cat.color,fontWeight:600 }}>{pct}%</span>
                            </div>
                            <div style={{ height:5,background:t.barTrack,borderRadius:99 }}>
                              <div style={{ height:"100%",width:`${pct}%`,background:cat.color,borderRadius:99,transition:"width .7s cubic-bezier(.22,1,.36,1)" }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Additional categories */}
                  {rCats.length>3&&(
                    <div style={{ marginTop:14,borderTop:isDark?`1px solid ${t.border}`:"1px solid rgba(0,0,0,.06)",paddingTop:12 }}>
                      {rCats.slice(3).map(([id,total])=>{
                        const cat=getCat(id),pct=Math.round(total/rExp*100);
                        return (
                          <div key={id} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                            <span style={{ fontSize:14,flexShrink:0 }}>{cat.emoji}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ display:"flex",justifyContent:"space-between",fontSize:11.5,marginBottom:3 }}>
                                <span style={{ color:t.text }}>{cat.label}</span>
                                <span style={{ fontFamily:"'DM Mono',monospace",color:cat.color,fontSize:11 }}>฿{thb(total)} ({pct}%)</span>
                              </div>
                              <div style={{ height:4,background:t.barTrack,borderRadius:99 }}>
                                <div style={{ height:"100%",width:`${Math.round(total/rCats[0][1]*100)}%`,background:cat.color,borderRadius:99 }}/>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}
              {/* 6-month bar chart */}
              <Card t={t} style={{ padding:"16px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13 }}>
                  <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted }}>ย้อนหลัง 6 เดือน</div>
                  <div style={{ display:"flex",gap:10,fontSize:10 }}>
                    {[[t.incomeColor,"รายรับ"],[t.expColor,"รายจ่าย"]].map(([c,l])=>(
                      <span key={l} style={{ display:"flex",alignItems:"center",gap:4,color:t.textMuted }}><span style={{ width:8,height:8,borderRadius:2,background:c,display:"inline-block" }}/>{l}</span>
                    ))}
                  </div>
                </div>
                <BarChart bars={mBars} t={t} height={140}/>
              </Card>
            </>)}
            {reportTab==="yearly"&&(<>
              {/* Year selector */}
              <div className="hide-scroll" style={{ display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:4 }}>
                {avYears.map(y=>(
                  <button key={y} className="btn" onClick={()=>setReportYear(y)} style={{
                    flexShrink:0,
                    background:reportYear===y?(isDark?`linear-gradient(135deg,${t.accent}90,${t.accent2}70)`:"linear-gradient(135deg,#6366F1,#8B5CF6)"):(t.isNeu?t.card:"rgba(255,255,255,.04)"),
                    border:isDark?`1px solid ${reportYear===y?`${t.accent}70`:t.border}`:"none",
                    borderRadius:10,padding:"8px 18px",fontSize:13,
                    color:reportYear===y?"#fff":t.textSub,fontWeight:reportYear===y?700:400,
                    boxShadow:reportYear===y?(isDark?`0 4px 16px ${t.accent}45`:t.shadow):(t.isNeu?t.shadowCard:"none") }}>
                    {y}
                  </button>
                ))}
              </div>
              {/* Year summary */}
              {(()=>{
                const yI=yBars.reduce((s,b)=>s+b.income,0),yE=yBars.reduce((s,b)=>s+b.expense,0);
                return (
                  <Card t={t} style={{ padding:"18px 18px",marginBottom:12,
                    background:isDark?"linear-gradient(135deg,rgba(234,179,8,0.08),rgba(244,63,94,0.05))":t.card }}>
                    <div style={{ fontSize:10,fontWeight:700,color:t.textMuted,letterSpacing:".08em",textTransform:"uppercase",marginBottom:12 }}>สรุปปี {reportYear}</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
                      {[["รายรับรวม",`฿${thb(yI)}`,t.incomeColor],["รายจ่ายรวม",`฿${thb(yE)}`,t.expColor],["ยอดสุทธิ",`${(yI-yE)>=0?"+":"−"}฿${thb(Math.abs(yI-yE))}`,(yI-yE)>=0?t.incomeColor:t.expColor]].map(([l,v,c])=>(
                        <div key={l}><div style={{ fontSize:9,color:t.textMuted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5 }}>{l}</div><div style={{ fontFamily:"'DM Mono',monospace",fontSize:14,color:c,fontWeight:700 }}>{v}</div></div>
                      ))}
                    </div>
                  </Card>
                );
              })()}
              {/* Yearly bar chart */}
              <Card t={t} style={{ padding:"16px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13 }}>
                  <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted }}>รายเดือน {reportYear}</div>
                  <div style={{ display:"flex",gap:10,fontSize:10 }}>
                    {[[t.incomeColor,"รายรับ"],[t.expColor,"รายจ่าย"]].map(([c,l])=>(
                      <span key={l} style={{ display:"flex",alignItems:"center",gap:4,color:t.textMuted }}><span style={{ width:8,height:8,borderRadius:2,background:c,display:"inline-block" }}/>{l}</span>
                    ))}
                  </div>
                </div>
                <BarChart bars={yBars} t={t} height={155}/>
              </Card>
            </>)}
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {view==="settings"&&(
          <div className="pg">
            <div style={{ fontSize:17,fontWeight:800,color:t.text,marginBottom:16 }}>ตั้งค่า</div>
            {/* Theme */}
            <Card t={t} style={{ padding:"16px",marginBottom:10 }}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted,marginBottom:12 }}>ธีม</div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <span style={{ fontSize:22 }}>{isDark?"🌙":"☀️"}</span>
                  <div>
                    <div style={{ fontSize:14,fontWeight:700,color:t.text }}>{isDark?"โหมดสบายตา":"โหมดสว่าง"}</div>
                    <div style={{ fontSize:11,color:t.textMuted,marginTop:1 }}>{isDark?"Glass Modern — ถนอมสายตา":"Neumorphism — สว่างสบาย"}</div>
                  </div>
                </div>
                {/* Toggle switch */}
                <button className="btn" onClick={()=>setIsDark(d=>!d)} style={{
                  width:52,height:28,borderRadius:14,border:"none",padding:2,cursor:"pointer",
                  background:isDark?`linear-gradient(135deg,${t.accent},${t.accent2})`:"#C8C8D4",
                  position:"relative",transition:"background .3s" }}>
                  <div style={{ width:24,height:24,borderRadius:12,background:"#fff",
                    boxShadow:"0 2px 4px rgba(0,0,0,.2)",transition:"transform .3s cubic-bezier(.22,1,.36,1)",
                    transform:isDark?"translateX(24px)":"translateX(0)" }}/>
                </button>
              </div>
            </Card>
            {/* Categories */}
            <Card t={t} style={{ padding:"16px",marginBottom:10 }}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted,marginBottom:12 }}>หมวดหมู่</div>
              {[["expense","หมวดรายจ่าย",expCats],["income","หมวดรายรับ",incCats]].map(([tp,label,cats])=>(
                <div key={tp} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:tp==="expense"?(isDark?`1px solid ${t.borderSub}`:"1px solid rgba(0,0,0,.05)"):undefined }}>
                  <div>
                    <div style={{ fontSize:13.5,fontWeight:600,color:t.text }}>{label}</div>
                    <div style={{ display:"flex",gap:3,marginTop:5 }}>
                      {cats.slice(0,6).map(c=><span key={c.id} style={{ fontSize:16 }}>{c.emoji}</span>)}
                      {cats.length>6&&<span style={{ fontSize:11,color:t.textMuted,alignSelf:"center" }}>+{cats.length-6}</span>}
                    </div>
                  </div>
                  <button className="btn" onClick={()=>setCatModal(tp)} style={{ background:isDark?"rgba(255,255,255,.04)":t.card,border:isDark?`1px solid ${t.border}`:"none",borderRadius:t.radiusSm,padding:"8px 16px",fontSize:12,color:t.accent,fontWeight:600,boxShadow:t.isNeu?t.shadowCard:"none" }}>จัดการ</button>
                </div>
              ))}
            </Card>
            {/* Database */}
            <Card t={t} style={{ padding:"16px" }}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted,marginBottom:12 }}>ฐานข้อมูล</div>
              <div style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 0" }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:t.incomeColor,flexShrink:0,animation:"glow 2s ease-in-out infinite" }}/>
                <span style={{ fontSize:12,color:t.textSub }}>Supabase Cloud</span>
                <span style={{ fontSize:10,color:t.textMuted,marginLeft:"auto" }}>เชื่อมต่อแล้ว ✓</span>
              </div>
              <button className="btn" onClick={loadEntries} style={{ marginTop:10,width:"100%",background:isDark?"rgba(255,255,255,.04)":t.card,border:isDark?`1px solid ${t.border}`:"none",borderRadius:t.radiusSm,padding:"10px",fontSize:12,color:t.textSub,boxShadow:t.isNeu?t.shadowCard:"none" }}>
                🔄 โหลดข้อมูลใหม่
              </button>
            </Card>
          </div>
        )}

      </main>

      {/* ──── BOTTOM NAVIGATION ──── */}
      <nav style={{
        position:"fixed",bottom:0,left:0,right:0,zIndex:300,
        background:isDark?"rgba(18,16,14,0.92)":t.navBg,
        backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
        borderTop:isDark?`1px solid rgba(255,255,255,.06)`:"none",
        boxShadow:isDark?"0 -4px 24px rgba(10,8,6,0.4)":t.shadowSm,
        display:"flex",alignItems:"center",justifyContent:"space-around",
        height:"calc(62px + env(safe-area-inset-bottom, 0px))",
        paddingBottom:"env(safe-area-inset-bottom, 0px)" }}>
        {[
          ["dashboard","ภาพรวม","◉"],
          ["history","ประวัติ","☰"],
          ["_fab_","",""],
          ["report","รายงาน","◈"],
          ["settings","ตั้งค่า","⚙"],
        ].map(([id,label,icon])=>{
          if(id==="_fab_"){
            return (
              <button key="fab" className="btn" onClick={()=>{setEditItem(null);resetForm("expense");setView("add");}}
                style={{
                  width:50,height:50,borderRadius:"50%",border:"none",
                  background:view==="add"?`linear-gradient(135deg,${t.accent2},${t.accent})`:`linear-gradient(135deg,${t.accent},${t.accent2})`,
                  color:"#fff",fontSize:26,fontWeight:300,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:view==="add"?`0 0 24px ${t.accent2}80`:`0 4px 20px ${t.accent}60`,
                  transform:"translateY(-10px)",cursor:"pointer",
                  transition:"all .2s" }}>
                ＋
              </button>
            );
          }
          const active = view===id;
          return (
            <button key={id} className="btn" onClick={()=>setView(id)} style={{
              background:"transparent",border:"none",padding:"6px 14px",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              color:active?t.accent:t.textMuted,cursor:"pointer",transition:"color .2s",
              minWidth:48 }}>
              <span style={{ fontSize:17,transition:"transform .2s",transform:active?"scale(1.15)":"scale(1)" }}>{icon}</span>
              <span style={{ fontSize:9.5,fontWeight:active?700:400,letterSpacing:".02em" }}>{label}</span>
              {active && <div style={{ width:4,height:4,borderRadius:2,background:t.accent,marginTop:-1 }}/>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
