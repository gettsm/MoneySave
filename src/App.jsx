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
const mkDate  = (d) => { const dt=new Date(); dt.setDate(dt.getDate()+d); return dt.toISOString().split("T")[0]; };

const PALETTE_DARK  = ["#7C83C8","#9D8EC4","#5BA58C","#C47A9D","#5E9EC4","#C4895E","#B8A84A","#7A8FA8"];
const PALETTE_LIGHT = ["#6366F1","#8B5CF6","#10B981","#EC4899","#0EA5E9","#F97316","#EAB308","#64748B"];

const DEFAULT_IDS = ["food","transport","shopping","health","entertainment","utility","education","other_exp","salary","bonus","invest","other_inc"];

const mkCats = (isDark) => ({
  expense: [
    { id:"food",          emoji:"🍜", label:"อาหาร",       color: isDark?"#C4895E":"#F97316", type:"expense" },
    { id:"transport",     emoji:"🚇", label:"เดินทาง",     color: isDark?"#5E9EC4":"#0EA5E9", type:"expense" },
    { id:"shopping",      emoji:"🛍️", label:"ช้อปปิ้ง",    color: isDark?"#9D8EC4":"#8B5CF6", type:"expense" },
    { id:"health",        emoji:"💊", label:"สุขภาพ",      color: isDark?"#5BA58C":"#10B981", type:"expense" },
    { id:"entertainment", emoji:"🎮", label:"บันเทิง",     color: isDark?"#C47A9D":"#EC4899", type:"expense" },
    { id:"utility",       emoji:"💡", label:"ค่าประจำ",    color: isDark?"#B8A84A":"#EAB308", type:"expense" },
    { id:"education",     emoji:"📚", label:"การศึกษา",    color: isDark?"#7C83C8":"#6366F1", type:"expense" },
    { id:"other_exp",     emoji:"📦", label:"อื่นๆ",       color: isDark?"#7A8FA8":"#64748B", type:"expense" },
  ],
  income: [
    { id:"salary",    emoji:"💼", label:"เงินเดือน",     color: isDark?"#5BA58C":"#10B981", type:"income" },
    { id:"bonus",     emoji:"🎁", label:"ได้รับ/โบนัส", color: isDark?"#5E9EC4":"#0EA5E9", type:"income" },
    { id:"invest",    emoji:"📈", label:"รายได้ลงทุน",  color: isDark?"#7C83C8":"#6366F1", type:"income" },
    { id:"other_inc", emoji:"💰", label:"รายรับอื่นๆ",  color: isDark?"#B8A84A":"#EAB308", type:"income" },
  ],
});

/* ═══════════════════════════════════════════
   THEME TOKENS
═══════════════════════════════════════════ */
const T = {
  dark: {
    pageBg:"#0E0E12", heroBg:"#0E0E12", card:"#18181E", cardHover:"#1E1E26",
    surface:"#18181E", inputBg:"#111116", navBg:"#0E0E12", headerBg:"#0E0E12",
    border:"rgba(255,255,255,0.08)", borderSub:"rgba(255,255,255,0.04)",
    text:"#E4E4EE", textSub:"#7E7E96", textMuted:"#48485E",
    accent:"#7C83C8", accentSoft:"rgba(124,131,200,0.14)", accent2:"#9D8EC4",
    incomeColor:"#5BA58C", expColor:"#C47A9D",
    green:"#5BA58C", greenSoft:"rgba(91,165,140,0.12)",
    red:"#C47A7A",   redSoft:"rgba(196,122,122,0.12)",
    shadow:"0 8px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04)",
    shadowSm:"0 2px 8px rgba(0,0,0,0.4)", shadowCard:"0 4px 16px rgba(0,0,0,0.45)",
    glowIncome:"0 2px 8px rgba(0,0,0,0.3)", glowExp:"0 2px 8px rgba(0,0,0,0.3)", glowAccent:"0 2px 8px rgba(0,0,0,0.3)",
    barTrack:"#1C1C24", backdropFilter:"blur(8px)",
    radius:"14px", radiusSm:"10px", radiusLg:"20px",
    palette:["#7C83C8","#9D8EC4","#5BA58C","#C47A9D","#5E9EC4","#C4895E","#B8A84A","#7A8FA8"],
    isNeu:false,
  },
  light: {
    pageBg:"#E8E8EE", heroBg:"#E8E8EE", card:"#E8E8EE", cardHover:"#EBEBF1",
    surface:"#E8E8EE", inputBg:"#E8E8EE", navBg:"#E8E8EE", headerBg:"#E8E8EE",
    border:"transparent", borderSub:"transparent",
    text:"#3A3A5C", textSub:"#7A7A9A", textMuted:"#AAAAC0",
    accent:"#6366F1", accentSoft:"rgba(99,102,241,0.12)", accent2:"#8B5CF6",
    incomeColor:"#10B981", expColor:"#6366F1",
    green:"#10B981", greenSoft:"rgba(16,185,129,0.1)",
    red:"#EF4444",   redSoft:"rgba(239,68,68,0.1)",
    shadow:"8px 8px 20px #C8C8D4,-8px -8px 20px #FFFFFF",
    shadowSm:"4px 4px 10px #C8C8D4,-4px -4px 10px #FFFFFF",
    shadowCard:"6px 6px 16px #C8C8D4,-6px -6px 16px #FFFFFF",
    shadowInset:"inset 4px 4px 10px #C8C8D4,inset -4px -4px 10px #FFFFFF",
    glowIncome:"4px 4px 10px #C8C8D4,-4px -4px 10px #FFFFFF",
    glowExp:"4px 4px 10px #C8C8D4,-4px -4px 10px #FFFFFF",
    glowAccent:"4px 4px 12px #C8C8D4,-4px -4px 12px #FFFFFF",
    barTrack:"#D8D8E4", backdropFilter:"none",
    radius:"18px", radiusSm:"14px", radiusLg:"28px",
    palette:["#6366F1","#8B5CF6","#10B981","#EC4899","#0EA5E9","#F97316","#EAB308","#64748B"],
    isNeu:true,
  },
};

/* ═══════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════ */
const GStyle = ({ t, isDark }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;transition:background .4s}
    ::-webkit-scrollbar{width:3px}
    ::-webkit-scrollbar-thumb{background:${isDark?"rgba(255,255,255,.12)":"#C8C8D4"};border-radius:99px}
    ::-webkit-scrollbar-track{background:transparent}
    input,select,textarea,button{font-family:'Plus Jakarta Sans',sans-serif}
    input[type=date]::-webkit-calendar-picker-indicator,
    input[type=month]::-webkit-calendar-picker-indicator{filter:${isDark?"invert(1) opacity(.35)":"opacity(.4)"};cursor:pointer}
    input:focus,select:focus,textarea:focus{
      outline:none;
      border-color:${t.accent}!important;
      box-shadow:${isDark?`0 0 0 2px rgba(124,131,200,.2)`:`inset 4px 4px 8px #C0C0CC,inset -4px -4px 8px #FFFFFF`}!important;
    }
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes toastIn{from{opacity:0;transform:translateX(50px)}to{opacity:1;transform:translateX(0)}}
    @keyframes modalUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
    @keyframes overlayIn{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .pg{animation:fadeUp .25s cubic-bezier(.16,1,.3,1)}
    .toast-anim{animation:toastIn .25s cubic-bezier(.16,1,.3,1)}
    .modal-anim{animation:modalUp .25s cubic-bezier(.16,1,.3,1)}
    .overlay-anim{animation:overlayIn .18s ease}
    .btn{transition:opacity .12s,transform .1s;cursor:pointer}
    .btn:active{transform:scale(.96)!important;opacity:.85}
    .glass-card{transition:background .15s,box-shadow .15s,transform .15s;}
    .glass-card:hover{transform:translateY(-1px);background:${isDark?"#1E1E26":"rgba(255,255,255,.08)"}!important;}
    .neu-card{transition:box-shadow .2s,transform .2s;}
    .neu-card:hover{transform:translateY(-1px);}
    .neu-card:active{box-shadow:inset 4px 4px 10px #C8C8D4,inset -4px -4px 10px #FFFFFF!important;transform:translateY(0)!important;}
    .nav-item{transition:all .15s ease}
    input[type=color]{-webkit-appearance:none;border:none;cursor:pointer;border-radius:8px;padding:0}
    input[type=color]::-webkit-color-swatch-wrapper{padding:0}
    input[type=color]::-webkit-color-swatch{border:none;border-radius:8px}
  `}</style>
);

/* ═══════════════════════════════════════════
   CARD WRAPPER
═══════════════════════════════════════════ */
function Card({ children, t, style, hover=true, inset=false, glow, onClick }) {
  const cls = t.isNeu ? (hover?"neu-card":"") : (hover?"glass-card":"");
  const base = t.isNeu
    ? { background:t.card, borderRadius:t.radius, boxShadow:inset?t.shadowInset:t.shadowCard, border:"none" }
    : { background:t.card, borderRadius:t.radius, boxShadow:glow?`${t.shadowCard}, ${glow}`:t.shadowCard, border:`1px solid ${t.border}`, backdropFilter:t.backdropFilter, WebkitBackdropFilter:t.backdropFilter };
  return <div className={cls} style={{...base,...style}} onClick={onClick}>{children}</div>;
}

/* ═══════════════════════════════════════════
   PRIMITIVES
═══════════════════════════════════════════ */
const Lbl = ({ children, t }) => (
  <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:t.textMuted, marginBottom:6, marginTop:18 }}>{children}</div>
);

function Inp({ t, style, ...p }) {
  const isDark = !t.isNeu;
  return (
    <input style={{ width:"100%", background:t.inputBg, border:isDark?`1px solid ${t.border}`:"none",
      borderRadius:t.radiusSm, padding:"11px 14px", color:t.text, fontSize:14,
      boxShadow:isDark?"none":t.shadowInset, transition:"box-shadow .18s,border-color .18s", ...style }} {...p} />
  );
}

function Sel({ t, children, ...p }) {
  const isDark = !t.isNeu;
  return (
    <select style={{ width:"100%", background:t.inputBg, border:isDark?`1px solid ${t.border}`:"none",
      borderRadius:t.radiusSm, padding:"11px 14px", color:t.text, fontSize:14,
      appearance:"none", cursor:"pointer", boxShadow:isDark?"none":t.shadowInset }} {...p}>{children}</select>
  );
}

function PrimaryBtn({ children, t, style, disabled, loading, ...p }) {
  const isDark = !t.isNeu;
  return (
    <button className="btn" disabled={disabled||loading} style={{
      background:"linear-gradient(135deg,#6366F1,#8B5CF6)",
      border:"none", borderRadius:t.radiusSm, padding:"12px 20px", color:"#fff",
      fontSize:13.5, fontWeight:700, cursor:(disabled||loading)?"not-allowed":"pointer",
      boxShadow:isDark?"0 2px 8px rgba(0,0,0,.4)":"4px 4px 10px #C0C0CC,-2px -2px 8px #FFFFFF",
      opacity:(disabled||loading)?.65:1, transition:"all .18s", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      ...style }} {...p}>
      {loading && <span style={{ width:13, height:13, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin .6s linear infinite" }}/>}
      {children}
    </button>
  );
}

function GhostBtn({ children, t, style, ...p }) {
  return (
    <button className="btn" style={{
      background:t.isNeu?t.card:"transparent", border:t.isNeu?"none":`1px solid ${t.border}`,
      borderRadius:t.radiusSm, padding:"11px 18px", color:t.textSub, fontSize:13.5, fontWeight:600,
      boxShadow:t.isNeu?t.shadowCard:"none", ...style }} {...p}>{children}</button>
  );
}

function Seg({ options, value, onChange, t }) {
  const isDark = !t.isNeu;
  return (
    <div style={{ display:"flex", gap:t.isNeu?4:3,
      background:isDark?"rgba(255,255,255,.04)":t.card, borderRadius:t.radius, padding:4,
      boxShadow:t.isNeu?t.shadowInset:`inset 0 1px 3px rgba(0,0,0,.2)`,
      border:isDark?`1px solid ${t.border}`:"none" }}>
      {options.map(([v,label])=>{
        const active = value===v;
        return (
          <button key={v} className="btn" onClick={()=>onChange(v)} style={{
            flex:1, border:"none", borderRadius:parseInt(t.radiusSm)-4+"px",
            padding:"8px 6px", fontSize:12.5, fontWeight:active?700:400,
            color:active?(isDark?"#fff":t.accent):t.textSub,
            background:active?(isDark?"linear-gradient(135deg,rgba(99,102,241,.7),rgba(139,92,246,.6))":t.card):"transparent",
            boxShadow:active?(isDark?"0 1px 4px rgba(0,0,0,.3)":t.shadowCard):"none",
            transition:"all .18s" }}>{label}</button>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon, t }) {
  return (
    <Card t={t} style={{ padding:"16px 18px" }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:t.textMuted, marginBottom:8, display:"flex", justifyContent:"space-between" }}>
        {label} {icon&&<span style={{ fontSize:14 }}>{icon}</span>}
      </div>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:600, color:color||t.accent }}>{value}</div>
      {sub&&<div style={{ fontSize:11, color:t.textMuted, marginTop:4 }}>{sub}</div>}
    </Card>
  );
}

function Toast({ toast }) {
  if(!toast) return null;
  const configs = {
    success:{ bg:"linear-gradient(135deg,#5C5FA8,#7C7FC8)" },
    income: { bg:"linear-gradient(135deg,#4A8A72,#5BA58C)" },
    error:  { bg:"linear-gradient(135deg,#8A4A4A,#A86060)" },
  };
  const c = configs[toast.type]||configs.success;
  return (
    <div className="toast-anim" style={{ position:"fixed", top:16, right:16, zIndex:9999, background:c.bg, color:"#fff", padding:"11px 18px", borderRadius:12, fontWeight:700, fontSize:13, boxShadow:"0 4px 16px rgba(0,0,0,.4)", display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(12px)" }}>
      <span style={{ fontSize:16 }}>{toast.type==="error"?"⚠":"✓"}</span> {toast.msg}
    </div>
  );
}

/* ─── Entry Card ─── */
function EntryCard({ e, onEdit, onDelete, t, allCats }) {
  const cat = allCats.find(c=>c.id===e.category)||allCats[0];
  const inc = e.type==="income";
  const amtColor = inc?t.incomeColor:t.expColor;
  return (
    <Card t={t} style={{ padding:"13px 15px", marginBottom:8 }} glow={!t.isNeu?`0 0 12px ${cat.color}18`:undefined}>
      <div style={{ display:"flex", alignItems:"center", gap:11 }}>
        <div style={{ width:42, height:42, borderRadius:t.radiusSm, flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
          background:t.isNeu?t.card:`${cat.color}18`,
          boxShadow:t.isNeu?t.shadowCard:"none",
          border:t.isNeu?"none":`1px solid ${cat.color}30` }}>{cat.emoji}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:t.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e.note||cat.label}</div>
          <div style={{ display:"flex", gap:5, marginTop:5, flexWrap:"wrap" }}>
            <span style={{ fontSize:10.5, borderRadius:6, padding:"2px 8px",
              background:t.isNeu?t.card:`${cat.color}14`,
              boxShadow:t.isNeu?t.shadowCard:"none",
              color:t.isNeu?t.textSub:cat.color,
              border:t.isNeu?"none":`1px solid ${cat.color}25` }}>{cat.label}</span>
            {!inc&&<span style={{ fontSize:10.5, borderRadius:6, padding:"2px 8px", background:t.isNeu?t.card:t.inputBg, boxShadow:t.isNeu?t.shadowCard:"none", color:t.textSub, border:t.isNeu?"none":`1px solid ${t.border}` }}>{e.payment}</span>}
            {(e.tags||[]).map(tag=>(
              <span key={tag} style={{ fontSize:10.5, borderRadius:6, padding:"2px 8px", background:`${cat.color}15`, color:cat.color, border:`1px solid ${cat.color}25` }}>{tag}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:14.5, fontWeight:700, color:amtColor,
            textShadow:!t.isNeu?`0 0 12px ${amtColor}60`:"none" }}>{inc?"+":"−"}฿{thb(e.amount)}</span>
          <div style={{ display:"flex", gap:4 }}>
            {[["✏",()=>onEdit(e)],["✕",()=>onDelete(e.id)]].map(([icon,fn])=>(
              <button key={icon} className="btn" onClick={fn} style={{
                background:t.isNeu?t.card:t.inputBg, border:t.isNeu?"none":`1px solid ${t.border}`,
                borderRadius:7, padding:"4px 8px", fontSize:11, color:t.textSub,
                boxShadow:t.isNeu?t.shadowCard:"none" }}>{icon}</button>
            ))}
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
    <div style={{ display:"flex", alignItems:"flex-end", gap:5, height, paddingBottom:22 }}>
      {bars.map((b,i)=>{
        const ih=Math.max(((b.income||0)/maxVal)*(height-24),b.income?3:0);
        const eh=Math.max(((b.expense||0)/maxVal)*(height-24),b.expense?3:0);
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
            <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:height-24 }}>
              <div title={`+฿${thb(b.income||0)}`} style={{ width:"44%", height:ih, borderRadius:"4px 4px 2px 2px",
                background:!t.isNeu?"linear-gradient(180deg,#34D399,rgba(52,211,153,.4))":"linear-gradient(180deg,#10B981,rgba(16,185,129,.5))",
                transition:"height .7s cubic-bezier(.16,1,.3,1)" }}/>
              <div title={`−฿${thb(b.expense||0)}`} style={{ width:"44%", height:eh, borderRadius:"4px 4px 2px 2px",
                background:!t.isNeu?"linear-gradient(180deg,#818CF8,rgba(129,140,248,.4))":"linear-gradient(180deg,#6366F1,rgba(99,102,241,.5))",
                transition:"height .7s cubic-bezier(.16,1,.3,1)" }}/>
            </div>
            <div style={{ fontSize:9, color:t.textMuted, position:"absolute", bottom:0 }}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Donut ─── */
function DonutChart({ slices, size=110, t }) {
  let cum=0;
  const r=42,cx=55,cy=55,sw=13,circ=2*Math.PI*r;
  const total=slices.reduce((s,sl)=>s+sl.value,0);
  if(!total) return (
    <div style={{ width:size,height:size,borderRadius:"50%",background:t.isNeu?t.barTrack:"rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"center",color:t.textMuted,fontSize:10 }}>ไม่มีข้อมูล</div>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 110 110">
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
      <text x={cx} y={cy-3} textAnchor="middle" fill={t.textSub} fontSize="9" fontFamily="DM Mono" fontWeight="600">NET</text>
      <text x={cx} y={cy+9} textAnchor="middle" fill={t.textMuted} fontSize="7.5" fontFamily="DM Mono">{slices.length} หมวด</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════
   CATEGORY MODAL
═══════════════════════════════════════════ */
const EMOJI_POOL = ["🍜","🍕","🍺","☕","🛒","🚇","🚗","✈️","💊","🏋️","🎮","🎬","🎵","📚","💡","🏠","👕","💄","🎁","📱","💻","🐾","🌿","🏝️","💼","📈","💰","🏦","🪙","💳","📦","⚡","🔧","🎯","🌟","❤️"];

function CatModal({ open, onClose, cats, onSave, type, t, saving }) {
  const [list, setList] = useState(cats);
  const [form, setForm] = useState({ emoji:"📦", label:"", color:t.isNeu?"#6366F1":"#818CF8" });
  const [tab, setTab]   = useState("list");
  if(!open) return null;
  const add = () => {
    if(!form.label.trim()) return;
    setList(p=>[...p,{...form,id:"c_"+uid(),type,label:form.label.trim()}]);
    setForm({ emoji:"📦", label:"", color:t.isNeu?"#6366F1":"#818CF8" });
    setTab("list");
  };
  const pal = t.isNeu ? PALETTE_LIGHT : PALETTE_DARK;
  return (
    <div className="overlay-anim" style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)" }}>
      <div className="modal-anim" style={{
        width:"100%", maxWidth:500, maxHeight:"88vh", overflow:"hidden", display:"flex", flexDirection:"column",
        background:t.isNeu?t.card:"rgba(15,12,41,0.95)",
        borderRadius:`${t.radiusLg} ${t.radiusLg} 0 0`,
        boxShadow:t.isNeu?t.shadow:"0 -8px 40px rgba(99,102,241,.3), 0 0 0 1px rgba(255,255,255,.08)",
        backdropFilter:t.isNeu?"none":t.backdropFilter,
        border:t.isNeu?"none":"1px solid rgba(255,255,255,.1)" }}>
        <div style={{ width:36,height:4,borderRadius:99,background:t.isNeu?"#C8C8D4":"rgba(255,255,255,.2)",margin:"12px auto 0" }}/>
        <div style={{ padding:"14px 18px 0",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontSize:16,fontWeight:800,color:t.text }}>จัดการหมวดหมู่</div>
            <div style={{ fontSize:11,color:t.textMuted,marginTop:1 }}>{type==="expense"?"รายจ่าย":"รายรับ"}</div>
          </div>
          <button className="btn" onClick={onClose} style={{ background:t.isNeu?t.card:"rgba(255,255,255,.06)",border:t.isNeu?"none":`1px solid ${t.border}`,borderRadius:9,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:t.textSub,fontSize:14,boxShadow:t.isNeu?t.shadowCard:"none" }}>✕</button>
        </div>
        <div style={{ padding:"12px 18px 0" }}>
          <Seg options={[["list",`หมวดทั้งหมด (${list.length})`],["add","＋ เพิ่มใหม่"]]} value={tab} onChange={setTab} t={t}/>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"14px 18px 0" }}>
          {tab==="list" && list.map(c=>{
            const isDefault=DEFAULT_IDS.includes(c.id);
            return (
              <div key={c.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:t.isNeu?`1px solid rgba(0,0,0,.05)`:`1px solid ${t.borderSub}` }}>
                <div style={{ width:36,height:36,borderRadius:10,background:t.isNeu?t.card:`${c.color}18`,boxShadow:t.isNeu?t.shadowCard:`0 0 8px ${c.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,border:t.isNeu?"none":`1px solid ${c.color}25` }}>{c.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5,fontWeight:600,color:t.text }}>{c.label}</div>
                  {isDefault&&<div style={{ fontSize:10,color:t.textMuted }}>หมวดเริ่มต้น</div>}
                </div>
                <div style={{ width:16,height:16,borderRadius:4,background:c.color,flexShrink:0 }}/>
                {!isDefault&&<button className="btn" onClick={()=>setList(p=>p.filter(x=>x.id!==c.id))} style={{ background:t.isNeu?t.card:"rgba(248,113,113,.12)",border:t.isNeu?"none":`1px solid rgba(248,113,113,.25)`,borderRadius:7,padding:"4px 10px",fontSize:11,color:"#F87171",boxShadow:t.isNeu?t.shadowCard:"none" }}>ลบ</button>}
              </div>
            );
          })}
          {tab==="add" && (
            <div>
              <Lbl t={t}>เลือก Emoji</Lbl>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:4 }}>
                {EMOJI_POOL.map(em=>(
                  <button key={em} className="btn" onClick={()=>setForm(p=>({...p,emoji:em}))} style={{ width:36,height:36,fontSize:18,borderRadius:9,background:form.emoji===em?t.accentSoft:t.isNeu?t.card:"rgba(255,255,255,.04)",border:form.emoji===em?`1px solid ${t.accent}`:t.isNeu?"none":`1px solid ${t.border}`,boxShadow:form.emoji===em&&!t.isNeu?`0 0 10px ${t.accent}40`:t.isNeu?t.shadowCard:"none" }}>{em}</button>
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
  const [form, setForm] = useState({ date:today(), amount:"", category:"food", note:"", payment:"เงินสด", tags:"" });

  const showToast = useCallback((msg,type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),2600);
  },[]);

  const resetForm = useCallback((tp="expense") => {
    setEntryType(tp);
    const defCat = tp==="income"?incCats[0]?.id||"salary":expCats[0]?.id||"food";
    setForm({ date:today(), amount:"", category:defCat, note:"", payment:"เงินสด", tags:"" });
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
    // ลบ custom ที่ถูกลบออก
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

  /* ─── Loading screen ─── */
  if(loading) return (
    <div style={{ minHeight:"100vh", background:isDark?"#0E0E12":"#E8E8EE",
      display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <div style={{ width:32, height:32, border:`3px solid ${isDark?"#7C83C8":"#6366F1"}`,
        borderTopColor:"transparent", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
      <div style={{ color:isDark?"#7E7E96":"#6A6A80", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>กำลังโหลดข้อมูล...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const pageStyle = isDark
    ? { background:T.dark.pageBg, minHeight:"100vh", color:t.text, position:"relative" }
    : { background:T.light.pageBg, minHeight:"100vh", color:t.text };

  /* ─── Sync indicator ─── */
  const SyncDot = () => syncing ? (
    <div style={{ position:"fixed", bottom:72, right:14, zIndex:500, background:t.card,
      border:`1px solid ${t.border}`, borderRadius:20, padding:"5px 10px", fontSize:10.5,
      color:t.textSub, boxShadow:t.shadowSm, display:"flex", alignItems:"center", gap:5 }}>
      <span style={{ width:7, height:7, borderRadius:"50%", border:`1.5px solid ${t.accent}`,
        borderTopColor:"transparent", display:"inline-block", animation:"spin .6s linear infinite" }}/>
      กำลังซิงค์...
    </div>
  ) : null;

  return (
    <div style={pageStyle}>
      <GStyle t={t} isDark={isDark}/>
      <Toast toast={toast}/>
      <SyncDot/>
      <CatModal open={catModal==="expense"} onClose={()=>setCatModal(null)} cats={expCats} onSave={c=>saveCats(c,"expense")} type="expense" t={t} saving={catSaving}/>
      <CatModal open={catModal==="income"} onClose={()=>setCatModal(null)} cats={incCats} onSave={c=>saveCats(c,"income")} type="income" t={t} saving={catSaving}/>

      {/* ──── HEADER ──── */}
      <header style={{ position:"sticky",top:0,zIndex:200,
        background:isDark?t.headerBg:t.headerBg,
        borderBottom:isDark?`1px solid ${t.border}`:"none",
        boxShadow:isDark?"0 1px 20px rgba(0,0,0,.3)":t.shadowSm,
        padding:"0 16px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:30,height:30,borderRadius:9,
            background:"linear-gradient(135deg,#6366F1,#8B5CF6)",
            boxShadow:isDark?"none":t.shadowCard,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>◈</div>
          <div>
            <div style={{ fontSize:14,fontWeight:800,color:t.text,letterSpacing:"-.02em" }}>Finance Tracker</div>
            <div style={{ fontSize:9,color:t.textMuted,letterSpacing:".08em",textTransform:"uppercase" }}>รายรับ-รายจ่าย</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
          <button className="btn" onClick={()=>setIsDark(d=>!d)} style={{
            background:isDark?"rgba(255,255,255,.06)":t.card,
            border:isDark?`1px solid ${t.border}`:"none",
            borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:16,boxShadow:isDark?"none":t.shadowCard,color:t.textSub }}>{isDark?"☀️":"🌙"}</button>
          <div style={{ display:"flex",borderRadius:t.radiusSm,overflow:"hidden",boxShadow:isDark?"0 0 16px rgba(99,102,241,.3)":t.shadowCard }}>
            <button className="btn" onClick={()=>{setEditItem(null);resetForm("expense");setView("add");}} style={{ background:isDark?t.inputBg:"linear-gradient(135deg,#f3f0ff,#ede8ff)", border:isDark?`1px solid ${t.border}`:"none", borderRight:isDark?`1px solid ${t.border}`:"none", padding:"0 12px",height:34,color:isDark?"#F472B6":"#6366F1",fontSize:12,fontWeight:700 }}>− รายจ่าย</button>
            <button className="btn" onClick={()=>{setEditItem(null);resetForm("income");setView("add");}} style={{ background:isDark?t.inputBg:"linear-gradient(135deg,#f0fff8,#e8fff4)", border:isDark?`1px solid ${t.border}`:"none", padding:"0 12px",height:34,color:isDark?"#34D399":"#10B981",fontSize:12,fontWeight:700 }}>+ รายรับ</button>
          </div>
        </div>
      </header>

      {/* ──── NAV ──── */}
      <nav style={{ position:"sticky",top:56,zIndex:190,
        background:isDark?t.navBg:t.navBg,
        borderBottom:isDark?`1px solid ${t.border}`:"none",
        boxShadow:isDark?"none":t.shadowSm,
        padding:"0 12px",display:"flex" }}>
        {[["dashboard","ภาพรวม","◉"],["history","ประวัติ","≡"],["report","รายงาน","◈"],["settings","ตั้งค่า","⊙"]].map(([id,label,icon])=>{
          const active=view===id;
          return (
            <button key={id} className="nav-item btn" onClick={()=>setView(id)} style={{ flex:1,background:"transparent",border:"none",padding:"10px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              color:active?t.accent:t.textMuted,
              borderBottom:active?`2px solid ${t.accent}`:"2px solid transparent",
              transition:"all .18s" }}>
              <span style={{ fontSize:14 }}>{icon}</span>
              <span style={{ fontSize:10,fontWeight:active?700:400,letterSpacing:".03em" }}>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ──── MAIN ──── */}
      <main style={{ maxWidth:500,margin:"0 auto",padding:"16px 13px 52px",position:"relative",zIndex:1 }}>

        {/* ════ DASHBOARD ════ */}
        {view==="dashboard"&&(
          <div className="pg">
            <div style={{ borderRadius:t.radiusLg, padding:"22px 20px", marginBottom:12,
              background:isDark?t.card:"#E8E8EE",
              boxShadow:isDark?t.shadowCard:t.shadow,
              border:isDark?`1px solid ${t.border}`:"none",
              position:"relative",overflow:"hidden" }}>
              <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:isDark?"rgba(255,255,255,.4)":t.textMuted,marginBottom:5 }}>
                {new Date().toLocaleDateString("th-TH",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace",fontSize:38,fontWeight:600,color:isDark?t.text:t.expColor,marginBottom:3 }}>
                ฿{thb(todayExp)}
              </div>
              <div style={{ fontSize:12,color:isDark?"rgba(255,255,255,.5)":t.textMuted }}>รายจ่ายวันนี้ · {todayEnt.filter(e=>e.type==="expense").length} รายการ</div>
              {todayInc>0&&(
                <div style={{ marginTop:10,display:"inline-flex",alignItems:"center",gap:7,background:isDark?"rgba(52,211,153,.12)":"rgba(16,185,129,.08)",border:isDark?"1px solid rgba(52,211,153,.25)":"none",borderRadius:9,padding:"5px 12px",boxShadow:isDark?"0 0 12px rgba(52,211,153,.2)":t.shadowSm }}>
                  <span style={{ fontSize:11,color:t.incomeColor,fontFamily:"'DM Mono',monospace" }}>+฿{thb(todayInc)}</span>
                  <span style={{ fontSize:10,color:isDark?"rgba(255,255,255,.4)":t.textMuted }}>รายรับวันนี้</span>
                </div>
              )}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
              <StatCard label="รายจ่ายเดือนนี้" value={`฿${thb(mExp)}`} sub={`${mAll.filter(e=>e.type==="expense").length} รายการ`} color={t.expColor} icon="📤" t={t}/>
              <StatCard label="รายรับเดือนนี้"  value={`฿${thb(mInc)}`} sub={`${mAll.filter(e=>e.type==="income").length} รายการ`} color={t.incomeColor} icon="📥" t={t}/>
            </div>
            <Card t={t} style={{ padding:"14px 17px",marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted,marginBottom:5 }}>ยอดสุทธิเดือนนี้</div>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:700,color:mNet>=0?t.incomeColor:t.expColor }}>
                    {mNet>=0?"+":"−"}฿{thb(Math.abs(mNet))}
                  </div>
                  <div style={{ fontSize:10.5,color:t.textMuted,marginTop:3 }}>{mNet>=0?"รายรับมากกว่ารายจ่าย":"รายจ่ายเกินรายรับ"}</div>
                </div>
                <div style={{ fontSize:32,opacity:.6 }}>{mNet>=0?"📈":"📉"}</div>
              </div>
            </Card>
            {catTotals.length>0&&(
              <Card t={t} style={{ padding:"14px 16px",marginBottom:14 }}>
                <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted,marginBottom:11 }}>รายจ่ายสูงสุดเดือนนี้</div>
                <div style={{ display:"flex",gap:7,flexWrap:"wrap" }}>
                  {catTotals.slice(0,4).map(([id,total])=>{
                    const cat=getCat(id);
                    return (
                      <div key={id} style={{ display:"flex",alignItems:"center",gap:7,background:isDark?`${cat.color}15`:`${cat.color}10`,border:isDark?`1px solid ${cat.color}25`:"none",borderRadius:11,padding:"7px 12px",boxShadow:t.isNeu?t.shadowSm:"none" }}>
                        <span style={{ fontSize:15 }}>{cat.emoji}</span>
                        <div>
                          <div style={{ fontSize:9.5,color:cat.color,fontWeight:700 }}>{cat.label}</div>
                          <div style={{ fontSize:12,fontFamily:"'DM Mono',monospace",color:t.text }}>฿{thb(total)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9 }}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:t.textMuted }}>รายการวันนี้</div>
              <button onClick={()=>setView("history")} style={{ fontSize:11.5,color:t.accent,background:"none",border:"none",cursor:"pointer",fontWeight:600 }}>ดูทั้งหมด →</button>
            </div>
            {todayEnt.length===0
              ?<div style={{ textAlign:"center",padding:"36px 0",color:t.textMuted }}><div style={{ fontSize:28,opacity:.3,marginBottom:6 }}>◻</div><div style={{ fontSize:13 }}>ยังไม่มีรายการวันนี้</div></div>
              :todayEnt.map(e=><EntryCard key={e.id} e={e} onEdit={startEdit} onDelete={deleteEntry} t={t} allCats={allCats}/>)
            }
          </div>
        )}

        {/* ════ ADD / EDIT ════ */}
        {view==="add"&&(
          <div className="pg">
            <Card t={t} style={{ padding:"20px 16px" }}>
              {!editItem&&<div style={{ marginBottom:18 }}><Seg options={[["expense","💸 รายจ่าย"],["income","💚 รายรับ"]]} value={entryType} onChange={tp=>{setEntryType(tp);setForm(f=>({...f,category:tp==="income"?incCats[0]?.id:expCats[0]?.id}));}} t={t}/></div>}
              {editItem&&<div style={{ marginBottom:16 }}><div style={{ fontSize:16,fontWeight:800,color:t.text }}>แก้ไขรายการ</div><div style={{ fontSize:11,color:t.textMuted,marginTop:2 }}>{isIncome(editItem.category)?"รายรับ":"รายจ่าย"}</div></div>}
              <Lbl t={t}>วันที่</Lbl>
              <Inp t={t} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
              <Lbl t={t}>จำนวนเงิน *</Lbl>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:entryType==="income"?t.incomeColor:t.expColor,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:18 }}>฿</span>
                <Inp t={t} type="number" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={{ paddingLeft:34,fontSize:26,fontWeight:700,fontFamily:"'DM Mono',monospace",color:entryType==="income"?t.incomeColor:t.expColor }}/>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18,marginBottom:5 }}>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted }}>หมวดหมู่</div>
                <button className="btn" onClick={()=>setCatModal(entryType)} style={{ fontSize:11,color:t.accent,background:"none",border:"none" }}>⚙ จัดการ</button>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6 }}>
                {activeCats.map(c=>{
                  const active=form.category===c.id;
                  return (
                    <button key={c.id} className="btn" onClick={()=>setForm(f=>({...f,category:c.id}))} style={{
                      background:active?(isDark?`${c.color}22`:c.color+"15"):t.isNeu?t.card:"rgba(255,255,255,.03)",
                      border:isDark?`1px solid ${active?c.color:t.border}`:"none",
                      borderRadius:t.radiusSm,padding:"9px 3px",textAlign:"center",
                      boxShadow:t.isNeu?t.shadowCard:(active?`0 0 12px ${c.color}40`:"none"),
                      transition:"all .15s" }}>
                      <div style={{ fontSize:19,marginBottom:2 }}>{c.emoji}</div>
                      <div style={{ fontSize:9,color:active?c.color:t.textMuted,fontWeight:active?700:400 }}>{c.label}</div>
                    </button>
                  );
                })}
              </div>
              <Lbl t={t}>รายละเอียด</Lbl>
              <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder={entryType==="income"?"รายได้จากอะไร?":"ซื้ออะไร? ที่ไหน?"}
                style={{ width:"100%",background:t.inputBg,border:isDark?`1px solid ${t.border}`:"none",borderRadius:t.radiusSm,padding:"11px 14px",color:t.text,fontSize:13.5,minHeight:68,resize:"vertical",fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:t.isNeu?t.shadowInset:"none" }}/>
              {entryType==="expense"&&(<>
                <Lbl t={t}>ช่องทางชำระ</Lbl>
                <Sel t={t} value={form.payment} onChange={e=>setForm(f=>({...f,payment:e.target.value}))}>{PAYMENTS.map(p=><option key={p}>{p}</option>)}</Sel>
              </>)}
              <Lbl t={t}>แท็ก (คั่นด้วย ,)</Lbl>
              <Inp t={t} placeholder="มื้อเช้า, ที่ทำงาน..." value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))}/>
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
              <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted,marginBottom:10 }}>ตัวกรอง</div>
              <div style={{ display:"flex",gap:7,marginBottom:10 }}>
                <Inp t={t} type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{ flex:1 }}/>
                <button className="btn" onClick={()=>setFilterDate("")} style={{ background:t.isNeu?t.card:t.inputBg,border:isDark?`1px solid ${t.border}`:"none",borderRadius:t.radiusSm,padding:"0 13px",fontSize:12,color:t.textSub,boxShadow:t.isNeu?t.shadowCard:"none" }}>ทั้งหมด</button>
              </div>
              <div style={{ marginBottom:9 }}><Seg options={[["all","ทั้งหมด"],["expense","รายจ่าย"],["income","รายรับ"]]} value={filterType} onChange={setFilterType} t={t}/></div>
              <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
                {[{id:"all",emoji:"◻",label:"ทั้งหมด",color:t.accent},...allCats.filter(c=>filterType==="all"||c.type===filterType)].map(c=>{
                  const active=filterCat===c.id;
                  return <button key={c.id} className="btn" onClick={()=>setFilterCat(c.id)} style={{ background:active?(isDark?`${c.color}20`:c.color+"12"):t.isNeu?t.card:"rgba(255,255,255,.04)",border:isDark?`1px solid ${active?c.color:t.border}`:"none",borderRadius:8,padding:"3px 9px",fontSize:10.5,color:active?c.color:t.textSub,fontWeight:active?700:400,boxShadow:t.isNeu?t.shadowCard:"none" }}>{c.emoji} {c.label}</button>;
                })}
              </div>
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
              ?<div style={{ textAlign:"center",padding:"44px 0",color:t.textMuted }}><div style={{ fontSize:24,opacity:.3,marginBottom:8 }}>◻</div><div style={{ fontSize:13 }}>ไม่พบรายการ</div></div>
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
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10 }}>
                <StatCard label="รายรับ"  value={`฿${thb(rInc)}`} sub={`${rEnt.filter(e=>e.type==="income").length} รายการ`} color={t.incomeColor} t={t}/>
                <StatCard label="รายจ่าย" value={`฿${thb(rExp)}`} sub={`${rEnt.filter(e=>e.type==="expense").length} รายการ`} color={t.expColor} t={t}/>
              </div>
              {(rInc>0||rExp>0)&&(
                <Card t={t} style={{ padding:"12px 16px",marginBottom:12 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted }}>ยอดสุทธิ</div>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:(rInc-rExp)>=0?t.incomeColor:t.expColor }}>
                      {(rInc-rExp)>=0?"+":"−"}฿{thb(Math.abs(rInc-rExp))}
                    </div>
                  </div>
                </Card>
              )}
              {rExp>0&&(
                <Card t={t} style={{ padding:"16px",marginBottom:12 }}>
                  <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted,marginBottom:14 }}>🏆 รายจ่ายสูงสุด 3 อันดับ</div>
                  <div style={{ display:"flex",gap:14,alignItems:"center" }}>
                    <DonutChart slices={donutSlices} size={100} t={t}/>
                    <div style={{ flex:1 }}>
                      {rCats.slice(0,3).map(([id,total],rank)=>{
                        const cat=getCat(id),pct=Math.round(total/rExp*100);
                        return (
                          <div key={id} style={{ marginBottom:rank<2?11:0 }}>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                              <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                                <span style={{ fontSize:10,color:t.textMuted }}>{rank+1}.</span>
                                <span style={{ fontSize:13 }}>{cat.emoji}</span>
                                <span style={{ fontSize:12,fontWeight:600,color:t.text }}>{cat.label}</span>
                              </div>
                              <span style={{ fontFamily:"'DM Mono',monospace",fontSize:12,color:cat.color }}>฿{thb(total)}</span>
                            </div>
                            <div style={{ height:5,background:t.barTrack,borderRadius:99 }}>
                              <div style={{ height:"100%",width:`${pct}%`,background:cat.color,borderRadius:99,transition:"width .7s cubic-bezier(.16,1,.3,1)" }}/>
                            </div>
                            <div style={{ fontSize:9.5,color:t.textMuted,marginTop:2 }}>{pct}% ของรายจ่ายทั้งหมด</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {rCats.length>3&&(<>
                    <div style={{ height:1,background:isDark?t.border:"rgba(0,0,0,.06)",margin:"14px 0" }}/>
                    {rCats.map(([id,total])=>{
                      const cat=getCat(id),pct=Math.round(total/rCats[0][1]*100);
                      return (
                        <div key={id} style={{ display:"flex",alignItems:"center",gap:9,marginBottom:9 }}>
                          <span style={{ fontSize:14,flexShrink:0 }}>{cat.emoji}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex",justifyContent:"space-between",fontSize:11.5,marginBottom:3 }}>
                              <span style={{ color:t.text }}>{cat.label}</span>
                              <span style={{ fontFamily:"'DM Mono',monospace",color:cat.color,fontSize:11 }}>฿{thb(total)} <span style={{ color:t.textMuted }}>({Math.round(total/rExp*100)}%)</span></span>
                            </div>
                            <div style={{ height:4,background:t.barTrack,borderRadius:99 }}>
                              <div style={{ height:"100%",width:`${pct}%`,background:cat.color,borderRadius:99 }}/>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>)}
                </Card>
              )}
              <Card t={t} style={{ padding:"16px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13 }}>
                  <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted }}>ย้อนหลัง 6 เดือน</div>
                  <div style={{ display:"flex",gap:10,fontSize:10 }}>
                    {[[t.incomeColor,"รายรับ"],[t.expColor,"รายจ่าย"]].map(([c,l])=>(
                      <span key={l} style={{ display:"flex",alignItems:"center",gap:4,color:t.textMuted }}><span style={{ width:8,height:8,borderRadius:2,background:c,display:"inline-block" }}/>{l}</span>
                    ))}
                  </div>
                </div>
                <BarChart bars={mBars} t={t} height={140}/>
                <div style={{ borderTop:isDark?`1px solid ${t.border}`:"1px solid rgba(0,0,0,.06)",paddingTop:10,marginTop:6 }}>
                  {mBars.filter(b=>b.income||b.expense).map(b=>(
                    <div key={b.key} style={{ display:"flex",justifyContent:"space-between",fontSize:11,padding:"5px 0",borderBottom:isDark?`1px solid ${t.borderSub}`:"1px solid rgba(0,0,0,.04)" }}>
                      <span style={{ color:t.textSub,fontWeight:500,minWidth:30 }}>{b.label}</span>
                      <span style={{ color:t.incomeColor,fontFamily:"'DM Mono',monospace" }}>+฿{thb(b.income)}</span>
                      <span style={{ color:t.expColor,fontFamily:"'DM Mono',monospace" }}>−฿{thb(b.expense)}</span>
                      <span style={{ color:(b.income-b.expense)>=0?t.incomeColor:t.expColor,fontFamily:"'DM Mono',monospace",fontWeight:700 }}>{(b.income-b.expense)>=0?"+":"−"}฿{thb(Math.abs(b.income-b.expense))}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>)}
            {reportTab==="yearly"&&(<>
              <div style={{ display:"flex",gap:5,marginBottom:12,flexWrap:"wrap" }}>
                {avYears.map(y=>(
                  <button key={y} className="btn" onClick={()=>setReportYear(y)} style={{ background:reportYear===y?(isDark?"linear-gradient(135deg,rgba(99,102,241,.5),rgba(139,92,246,.4))":"linear-gradient(135deg,#6366F1,#8B5CF6)"):t.isNeu?t.card:"rgba(255,255,255,.04)",border:isDark?`1px solid ${reportYear===y?t.accent:t.border}`:"none",borderRadius:9,padding:"7px 16px",fontSize:13,color:reportYear===y?"#fff":t.textSub,fontWeight:reportYear===y?700:400,boxShadow:reportYear===y?(t.isNeu?t.shadow:"0 2px 6px rgba(0,0,0,.35)"):(t.isNeu?t.shadowCard:"none") }}>{y}</button>
                ))}
              </div>
              {(()=>{
                const yI=yBars.reduce((s,b)=>s+b.income,0),yE=yBars.reduce((s,b)=>s+b.expense,0);
                return (
                  <div style={{ background:isDark?t.card:"#E8E8EE",border:isDark?`1px solid ${t.border}`:"none",borderRadius:t.radiusLg,padding:"18px 20px",marginBottom:12,boxShadow:isDark?t.shadowCard:t.shadow }}>
                    <div style={{ fontSize:9.5,fontWeight:700,color:t.textMuted,letterSpacing:".1em",textTransform:"uppercase",marginBottom:12 }}>สรุปปี {reportYear}</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14 }}>
                      {[["รายรับรวม",`฿${thb(yI)}`,t.incomeColor],["รายจ่ายรวม",`฿${thb(yE)}`,t.expColor],["ยอดสุทธิ",`${(yI-yE)>=0?"+":"−"}฿${thb(Math.abs(yI-yE))}`,(yI-yE)>=0?t.incomeColor:t.expColor]].map(([l,v,c])=>(
                        <div key={l}><div style={{ fontSize:9,color:t.textMuted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5 }}>{l}</div><div style={{ fontFamily:"'DM Mono',monospace",fontSize:15,color:c,fontWeight:700 }}>{v}</div></div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <Card t={t} style={{ padding:"16px",marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13 }}>
                  <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted }}>รายเดือน {reportYear}</div>
                  <div style={{ display:"flex",gap:10,fontSize:10 }}>
                    {[[t.incomeColor,"รายรับ"],[t.expColor,"รายจ่าย"]].map(([c,l])=>(
                      <span key={l} style={{ display:"flex",alignItems:"center",gap:4,color:t.textMuted }}><span style={{ width:8,height:8,borderRadius:2,background:c,display:"inline-block" }}/>{l}</span>
                    ))}
                  </div>
                </div>
                <BarChart bars={yBars} t={t} height={155}/>
              </Card>
              <Card t={t} style={{ padding:"16px" }}>
                <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted,marginBottom:12 }}>ตารางรายเดือน</div>
                {yBars.map((b,i)=>{
                  const net=b.income-b.expense,has=b.income>0||b.expense>0;
                  return (
                    <div key={b.key} style={{ display:"flex",alignItems:"center",gap:9,padding:"8px 0",borderBottom:i<11?(isDark?`1px solid ${t.borderSub}`:"1px solid rgba(0,0,0,.05)"):undefined,opacity:has?1:.3 }}>
                      <div style={{ width:28,fontSize:11.5,fontWeight:600,color:t.textSub,flexShrink:0 }}>{b.label}</div>
                      <div style={{ flex:1 }}>
                        {has&&<><div style={{ height:3,background:t.barTrack,borderRadius:99,marginBottom:2 }}><div style={{ height:"100%",width:`${Math.min(b.income/Math.max(...yBars.map(x=>x.income),1)*100,100)}%`,background:t.incomeColor,borderRadius:99 }}/></div><div style={{ height:3,background:t.barTrack,borderRadius:99 }}><div style={{ height:"100%",width:`${Math.min(b.expense/Math.max(...yBars.map(x=>x.expense),1)*100,100)}%`,background:t.expColor,borderRadius:99 }}/></div></>}
                      </div>
                      <div style={{ textAlign:"right",minWidth:80 }}>
                        {has?<><div style={{ fontFamily:"'DM Mono',monospace",fontSize:11,color:net>=0?t.incomeColor:t.expColor,fontWeight:700 }}>{net>=0?"+":"−"}฿{thb(Math.abs(net))}</div><div style={{ fontSize:9.5,color:t.textMuted }}>−฿{thb(b.expense)}</div></>:<div style={{ fontSize:10,color:t.textMuted }}>ไม่มีข้อมูล</div>}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </>)}
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {view==="settings"&&(
          <div className="pg">
            <div style={{ fontSize:16,fontWeight:800,color:t.text,marginBottom:16 }}>ตั้งค่า</div>
            <Card t={t} style={{ padding:"16px",marginBottom:10 }}>
              <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted,marginBottom:12 }}>ธีม</div>
              <Seg options={[["dark","🌙 Dark — Glassmorphism"],["light","☀️ Light — Neumorphism"]]} value={isDark?"dark":"light"} onChange={v=>setIsDark(v==="dark")} t={t}/>
              <div style={{ marginTop:12,padding:"10px 12px",background:isDark?t.inputBg:"rgba(0,0,0,.03)",borderRadius:t.radiusSm,border:isDark?`1px solid ${t.border}`:"none" }}>
                <div style={{ fontSize:11,color:t.textMuted,lineHeight:1.6 }}>
                  {isDark?"🌌 Dark: พื้นหลังสีม่วงเข้ม backdrop blur glassmorphism":"🪨 Light: พื้นหลังสีขาวนวล ปุ่มนูน soft shadow neumorphism"}
                </div>
              </div>
            </Card>
            <Card t={t} style={{ padding:"16px",marginBottom:10 }}>
              <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted,marginBottom:12 }}>หมวดหมู่</div>
              {[["expense","หมวดรายจ่าย",expCats],["income","หมวดรายรับ",incCats]].map(([tp,label,cats])=>(
                <div key={tp} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:tp==="expense"?(isDark?`1px solid ${t.borderSub}`:"1px solid rgba(0,0,0,.05)"):undefined }}>
                  <div>
                    <div style={{ fontSize:13.5,fontWeight:600,color:t.text }}>{label}</div>
                    <div style={{ display:"flex",gap:4,marginTop:5 }}>
                      {cats.slice(0,6).map(c=><span key={c.id} style={{ fontSize:16 }}>{c.emoji}</span>)}
                      {cats.length>6&&<span style={{ fontSize:11,color:t.textMuted,alignSelf:"center" }}>+{cats.length-6}</span>}
                    </div>
                  </div>
                  <button className="btn" onClick={()=>setCatModal(tp)} style={{ background:isDark?t.inputBg:t.card,border:isDark?`1px solid ${t.border}`:"none",borderRadius:t.radiusSm,padding:"7px 14px",fontSize:12,color:t.accent,fontWeight:600,boxShadow:t.isNeu?t.shadowCard:"none" }}>จัดการ</button>
                </div>
              ))}
            </Card>
            <Card t={t} style={{ padding:"16px",marginBottom:10 }}>
              <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted,marginBottom:12 }}>ฐานข้อมูล</div>
              <div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 0" }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:t.incomeColor,flexShrink:0 }}/>
                <span style={{ fontSize:12,color:t.textSub }}>Supabase Cloud</span>
                <span style={{ fontSize:10,color:t.textMuted,marginLeft:"auto" }}>เชื่อมต่อแล้ว ✓</span>
              </div>
              <button className="btn" onClick={loadEntries} style={{ marginTop:8,width:"100%",background:isDark?t.inputBg:t.card,border:isDark?`1px solid ${t.border}`:"none",borderRadius:t.radiusSm,padding:"9px",fontSize:12,color:t.textSub,boxShadow:t.isNeu?t.shadowCard:"none" }}>
                🔄 โหลดข้อมูลใหม่
              </button>
            </Card>
            <Card t={t} style={{ padding:"16px" }}>
              <div style={{ fontSize:9.5,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:t.textMuted,marginBottom:12 }}>ข้อมูลทั้งหมด</div>
              {[["รายการทั้งหมด",`${entries.length} รายการ`],["รายจ่ายรวม",`฿${thb(entries.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0))}`],["รายรับรวม",`฿${thb(entries.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0))}`],["หมวดหมู่",`${allCats.length} หมวด`]].map(([label,value])=>(
                <div key={label} style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:isDark?`1px solid ${t.borderSub}`:"1px solid rgba(0,0,0,.04)",alignItems:"center" }}>
                  <span style={{ fontSize:13,color:t.textSub }}>{label}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace",fontSize:13,color:t.text,fontWeight:600 }}>{value}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
