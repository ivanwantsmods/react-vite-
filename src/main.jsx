import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { CalendarDays, LayoutDashboard, CalendarPlus, Building2, Boxes, Settings2, Bell, Search, Pencil, Trash2, CheckCircle2, XCircle, Database, ShieldCheck, RotateCcw } from "lucide-react";
import "./styles.css";

const KEY = "universal-reservation-data-v1";
const today = () => new Date().toISOString().slice(0, 10);
const uid = p => `${p}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

const seed = {
  businesses: [
    {id:"b1",name:"Urban Beauty Studio",type:"Салон / кабинет",description:"Козметични и фризьорски услуги"},
    {id:"b2",name:"Arena Sport",type:"Зала / игрище",description:"Футбол, тенис и многофункционални игрища"},
    {id:"b3",name:"Creative Hub",type:"Студио",description:"Творчески и фото студиа"}
  ],
  resources: [
    {id:"r1",businessId:"b1",name:"Кабинет 1",capacity:1,from:"09:00",to:"18:00"},
    {id:"r2",businessId:"b1",name:"Фризьорски стол 1",capacity:1,from:"09:00",to:"19:00"},
    {id:"r3",businessId:"b2",name:"Тенис корт 1",capacity:4,from:"08:00",to:"22:00"},
    {id:"r4",businessId:"b2",name:"Футболно игрище",capacity:12,from:"10:00",to:"23:00"},
    {id:"r5",businessId:"b3",name:"Фото студио",capacity:6,from:"10:00",to:"20:00"}
  ],
  reservations: [
    {id:"res1",businessId:"b1",resourceId:"r1",customer:"Мария Иванова",phone:"0888123456",date:"2026-11-26",start:"10:00",end:"11:00",status:"confirmed",note:"Първо посещение"},
    {id:"res2",businessId:"b1",resourceId:"r2",customer:"Анна Петрова",phone:"0899555444",date:"2026-11-26",start:"11:00",end:"12:00",status:"pending",note:""},
    {id:"res3",businessId:"b2",resourceId:"r3",customer:"Георги Георгиев",phone:"0877000111",date:"2026-11-27",start:"17:00",end:"18:00",status:"confirmed",note:"Тенис тренировка"},
    {id:"res4",businessId:"b2",resourceId:"r4",customer:"Team Alpha",phone:"0888111222",date:"2026-11-27",start:"19:00",end:"20:30",status:"confirmed",note:""},
    {id:"res5",businessId:"b3",resourceId:"r5",customer:"Studio Project",phone:"0888333444",date:"2026-11-28",start:"13:00",end:"15:00",status:"pending",note:"Снимки за кампания"}
  ]
};

const clone = x => structuredClone(x);
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || clone(seed); }
  catch { return clone(seed); }
};
const save = d => localStorage.setItem(KEY, JSON.stringify(d));
const mins = t => { const [h,m] = t.split(":").map(Number); return h*60+m; };
const overlap = (a,b,c,d) => mins(a) < mins(d) && mins(c) < mins(b);
const fmtDate = d => new Intl.DateTimeFormat("bg-BG",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(d+"T00:00:00"));

function availability(data, form, editId) {
  const r = data.resources.find(x => x.id === form.resourceId);
  if (!r) return "Изберете ресурс.";
  if (!form.customer.trim()) return "Въведете име на клиент.";
  if (mins(form.start) >= mins(form.end)) return "Крайният час трябва да е след началния.";
  if (mins(form.start) < mins(r.from) || mins(form.end) > mins(r.to))
    return `Ресурсът работи от ${r.from} до ${r.to}.`;
  const c = data.reservations.find(x =>
    x.id !== editId && x.resourceId === r.id && x.date === form.date &&
    x.status !== "cancelled" && overlap(form.start,form.end,x.start,x.end)
  );
  return c ? `Конфликт с ${c.customer} (${c.start}–${c.end}).` : "";
}

function App() {
  const [data,setData] = useState(load);
  const [page,setPage] = useState("dashboard");
  const [q,setQ] = useState("");
  const [modal,setModal] = useState(null);
  const [filter,setFilter] = useState("all");

  useEffect(() => save(data), [data]);

  const actions = {
    create: form => setData(d => ({...d,reservations:[...d.reservations,{...form,id:uid("res")}]})),
    update: (id,form) => setData(d => ({...d,reservations:d.reservations.map(r=>r.id===id?{...r,...form}:r)})),
    status: (id,status) => setData(d => ({...d,reservations:d.reservations.map(r=>r.id===id?{...r,status}:r)})),
    remove: id => { if(confirm("Изтрий тази резервация?")) setData(d=>({...d,reservations:d.reservations.filter(r=>r.id!==id)})); },
    reset: () => { if(confirm("Върни началните демо данни?")) setData(clone(seed)); }
  };

  const meta = {
    dashboard:["Табло","Общ преглед на системата за резервации"],
    reservations:["Резервации","Създаване, редактиране и управление на заявки"],
    resources:["Ресурси","Работно време, капацитет и наличности"],
    businesses:["Бизнеси","Конфигурирани бизнеси и техните ресурси"],
    settings:["Настройки","Конфигурация и данни"]
  }[page];

  const filtered = data.reservations
    .filter(r => filter==="all" || r.status===filter)
    .filter(r => {
      const b=data.businesses.find(x=>x.id===r.businessId)?.name||"";
      const res=data.resources.find(x=>x.id===r.resourceId)?.name||"";
      return `${r.customer} ${r.phone} ${b} ${res} ${r.date}`.toLowerCase().includes(q.toLowerCase());
    });

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="logo">UR</div><div><b>Universal</b><span>Reservations</span></div></div>
      {[
        ["dashboard","Табло",LayoutDashboard],
        ["reservations","Резервации",CalendarDays],
        ["resources","Ресурси",Boxes],
        ["businesses","Бизнеси",Building2],
        ["settings","Настройки",Settings2]
      ].map(([id,label,Icon]) => <button className={`nav ${page===id?"active":""}`} onClick={()=>setPage(id)} key={id}><Icon size={18}/>{label}</button>)}
      <div className="side-status"><i/>Системата работи<small>Демо режим</small></div>
    </aside>

    <main>
      <header className="top">
        <div><h1>{meta[0]}</h1><p>{meta[1]}</p></div>
        <div className="top-actions">
          <div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Търси..."/></div>
          <button className="icon"><Bell size={18}/></button><div className="avatar">AD</div>
        </div>
      </header>

      <section className="content">
        {page==="dashboard" && <Dashboard data={data} setPage={setPage}/>}
        {page==="reservations" && <Reservations data={data} rows={filtered} filter={filter} setFilter={setFilter} setModal={setModal} actions={actions}/>}
        {page==="resources" && <Resources data={data} q={q}/>}
        {page==="businesses" && <Businesses data={data} q={q}/>}
        {page==="settings" && <Settings reset={actions.reset}/>}
      </section>
      <footer><span><CalendarDays size={13}/> Universal Reservations</span><span>React + Vite · simulated data</span></footer>
    </main>

    {modal && <ReservationModal data={data} item={modal==="new"?null:modal} close={()=>setModal(null)} save={form=>{
      if(availability(data,form,modal==="new"?undefined:modal.id)) return;
      modal==="new"?actions.create(form):actions.update(modal.id,form);
      setModal(null);
    }}/>}
  </div>;
}

function Dashboard({data,setPage}) {
  const active=data.reservations.filter(r=>r.status!=="cancelled");
  const todayRows=active.filter(r=>r.date===today());
  const pending=active.filter(r=>r.status==="pending");
  const upcoming=[...active].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).slice(0,5);
  const bn=id=>data.businesses.find(x=>x.id===id)?.name||"—";
  const rn=id=>data.resources.find(x=>x.id===id)?.name||"—";
  return <div className="page">
    <div className="stats">
      <Stat icon={<CalendarDays/>} label="Всички резервации" value={active.length} hint="активни"/>
      <Stat icon={<CalendarDays/>} tone="green" label="Днес" value={todayRows.length} hint="за текущия ден"/>
      <Stat icon={<CalendarDays/>} tone="orange" label="Чакащи" value={pending.length} hint="нуждаят се от действие"/>
      <Stat icon={<Building2/>} tone="purple" label="Бизнеси" value={data.businesses.length} hint="активни обекти"/>
    </div>
    <div className="two">
      <Panel title="Предстоящи резервации" subtitle="Следващите събития в системата" action={<button className="link" onClick={()=>setPage("reservations")}>Всички →</button>}>
        <Table rows={upcoming} data={data}/>
      </Panel>
      <Panel title="Архитектурен преглед" subtitle="Основните слоеве на приложението">
        <div className="architecture"><div><b>UI</b><strong>React + Vite</strong><small>Компоненти и страници</small></div><em>→</em><div><b>Logic</b><strong>Availability engine</strong><small>Конфликти и правила</small></div><em>→</em><div><b>Data</b><strong>localStorage / REST</strong><small>Лесно заменяем слой</small></div></div>
        <div className="notice"><b>Важно:</b> проверката за конфликт е във фронтенда за демо целите. При реална база същото правило трябва да се валидира и на сървъра.</div>
      </Panel>
    </div>
  </div>;
}

function Stat({icon,label,value,hint,tone=""}) {
  return <div className="stat"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><b>{value}</b><small>{hint}</small></div></div>;
}

function Panel({title,subtitle,action,children}) {
  return <section className="panel"><div className="panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>{children}</section>;
}

function Table({rows,data,actions}) {
  const bn=id=>data.businesses.find(x=>x.id===id)?.name||"—";
  const rn=id=>data.resources.find(x=>x.id===id)?.name||"—";
  return <div className="table-wrap"><table><thead><tr><th>Клиент</th><th>Бизнес</th><th>Ресурс</th><th>Дата</th><th>Час</th><th>Статус</th>{actions&&<th/>}</tr></thead><tbody>
    {rows.map(r=><tr key={r.id}><td><b>{r.customer}</b><small>{r.phone}</small></td><td>{bn(r.businessId)}</td><td>{rn(r.resourceId)}</td><td>{fmtDate(r.date)}</td><td><b>{r.start}–{r.end}</b></td><td><span className={`badge ${r.status}`}>{r.status==="confirmed"?"Потвърдена":r.status==="pending"?"Чакаща":"Отказана"}</span></td>
    {actions&&<td><div className="row-actions">
      {r.status!=="confirmed"&&<button className="mini" onClick={()=>actions.status(r.id,"confirmed")} title="Потвърди"><CheckCircle2 size={15}/></button>}
      {r.status!=="cancelled"&&<button className="mini danger" onClick={()=>actions.status(r.id,"cancelled")} title="Откажи"><XCircle size={15}/></button>}
      <button className="mini" onClick={()=>actions.edit(r)} title="Редактирай"><Pencil size={15}/></button>
      <button className="mini danger" onClick={()=>actions.remove(r.id)} title="Изтрий"><Trash2 size={15}/></button>
    </div></td>}</tr>)}
    {!rows.length&&<tr><td className="empty" colSpan={actions?7:6}>Няма намерени записи.</td></tr>}
  </tbody></table></div>;
}

function Reservations({data,rows,filter,setFilter,setModal,actions}) {
  return <div className="page">
    <div className="toolbar"><div className="filters">{[["all","Всички"],["confirmed","Потвърдени"],["pending","Чакащи"],["cancelled","Отказани"]].map(([x,l])=><button className={filter===x?"filter active":"filter"} onClick={()=>setFilter(x)} key={x}>{l}</button>)}</div><button className="primary" onClick={()=>setModal("new")}><CalendarPlus size={17}/> Нова резервация</button></div>
    <Panel title="Резервации" subtitle={`${rows.length} записа`} action={<span className="chip">Проверка за конфликти</span>}>
      <Table rows={rows} data={data} actions={{...actions,edit:setModal}}/>
    </Panel>
  </div>;
}

function Resources({data,q}) {
  const rows=data.resources.filter(r=>`${r.name} ${data.businesses.find(b=>b.id===r.businessId)?.name||""}`.toLowerCase().includes(q.toLowerCase()));
  return <div className="cards">{rows.map(r=>{const b=data.businesses.find(x=>x.id===r.businessId);const n=data.reservations.filter(x=>x.resourceId===r.id&&x.status!=="cancelled").length;return <article className="card" key={r.id}><div className="card-top"><div className="resource-icon">◈</div><span className="chip">{b?.name}</span></div><h3>{r.name}</h3><p>Капацитет: <b>{r.capacity}</b> души</p><hr/><div className="meta"><span>Работно време</span><b>{r.from} – {r.to}</b></div><div className="meta"><span>Активни резервации</span><b>{n}</b></div><div className="available">● Активен</div></article>})}</div>;
}

function Businesses({data,q}) {
  return <div className="cards">{data.businesses.filter(b=>`${b.name} ${b.description}`.toLowerCase().includes(q.toLowerCase())).map(b=>{const r=data.resources.filter(x=>x.businessId===b.id);const n=data.reservations.filter(x=>x.businessId===b.id&&x.status!=="cancelled").length;return <article className="card business" key={b.id}><div className="emoji">{b.type==="Салон / кабинет"?"✂️":b.type==="Зала / игрище"?"🏟️":"🎨"}</div><span className="type">{b.type}</span><h3>{b.name}</h3><p>{b.description}</p><hr/><div className="business-stats"><div><b>{r.length}</b><small>ресурса</small></div><div><b>{n}</b><small>резервации</small></div></div></article>})}</div>;
}

function Settings({reset}) {
  return <div className="page"><Panel title="Настройки" subtitle="Конфигурация и данни"><div className="settings">
    <div><Database/><section><b>Източник на данни</b><p>Демо режим с localStorage. При наличие на backend можеш да го свържеш през API слой.</p></section><span className="status">LOCAL</span></div>
    <div><ShieldCheck/><section><b>Валидация</b><p>Часовете се проверяват спрямо работното време и съществуващи резервации.</p></section><span className="status ok">АКТИВНА</span></div>
    <div><RotateCcw/><section><b>Нулиране на демо данните</b><p>Връща приложението към началния примерен набор.</p></section><button className="secondary" onClick={reset}>Нулирай</button></div>
  </div></Panel></div>;
}

function ReservationModal({data,item,close,save}) {
  const initial=item?{...item}:{businessId:data.businesses[0]?.id||"",resourceId:data.resources.find(r=>r.businessId===data.businesses[0]?.id)?.id||"",customer:"",phone:"",date:today(),start:"09:00",end:"10:00",status:"confirmed",note:""};
  const [form,setForm]=useState(initial);
  const [error,setError]=useState("");
  const resources=data.resources.filter(r=>r.businessId===form.businessId);
  const submit=e=>{e.preventDefault();const err=availability(data,form,item?.id);if(err){setError(err);return;}save(form);};
  return <div className="overlay" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}>
    <div className="modal-head"><h2>{item?"Редактиране на резервация":"Нова резервация"}</h2><button className="icon" onClick={close}>×</button></div>
    <form onSubmit={submit}><div className="form-grid">
      <label>Бизнес<select value={form.businessId} onChange={e=>setForm({...form,businessId:e.target.value,resourceId:""})}>{data.businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
      <label>Ресурс<select value={form.resourceId} onChange={e=>setForm({...form,resourceId:e.target.value})}><option value="">Избери ресурс</option>{resources.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
      <label>Клиент<input value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} placeholder="Име и фамилия"/></label>
      <label>Телефон<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="08..."/></label>
      <label>Дата<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
      <label>Статус<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="confirmed">Потвърдена</option><option value="pending">Чакаща</option><option value="cancelled">Отказана</option></select></label>
      <label>Начало<input type="time" value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/></label>
      <label>Край<input type="time" value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/></label>
      <label className="full">Бележка<textarea rows="3" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label>
      {error&&<div className="error full">{error}</div>}
    </div><div className="modal-foot"><button type="button" className="secondary" onClick={close}>Отказ</button><button className="primary" type="submit">{item?"Запази":"Създай резервация"}</button></div></form>
  </div></div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);