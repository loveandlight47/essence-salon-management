import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, ReceiptText, Users, Download, Plus, Trash2, Scissors, CalendarDays, TrendingUp, Wallet, Percent, Search, FileSpreadsheet } from 'lucide-react';
import './styles.css';

const VAT_RATE = 0.075;
const COMMISSION_RATE = 0.30;
const STORE_KEY = 'essence-salon-sales-v1';
const STAFF_KEY = 'essence-salon-staff-v1';
const money = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(Number(n || 0));
const today = () => new Date().toISOString().slice(0, 10);
const readJson = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };

function App() {
  const [sales, setSales] = useState(() => readJson(STORE_KEY, []));
  const [staff, setStaff] = useState(() => readJson(STAFF_KEY, ['Staff member 1', 'Staff member 2']));
  const [page, setPage] = useState('Dashboard');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ date: today(), staff: 'Staff member 1', customer: '', service: '', amount: '', notes: '' });
  const [newStaff, setNewStaff] = useState('');

  const saveSales = (next) => { setSales(next); localStorage.setItem(STORE_KEY, JSON.stringify(next)); };
  const saveStaff = (next) => { setStaff(next); localStorage.setItem(STAFF_KEY, JSON.stringify(next)); };
  const monthSales = useMemo(() => sales.filter(s => s.date?.startsWith(month)), [sales, month]);
  const totalSales = monthSales.reduce((sum, s) => sum + Number(s.amount), 0);
  const totalVat = totalSales * VAT_RATE;
  const totalCommission = totalSales * COMMISSION_RATE;
  const filteredSales = monthSales.filter(s => `${s.staff} ${s.customer} ${s.service}`.toLowerCase().includes(search.toLowerCase()));
  const staffStats = staff.map(name => {
    const rows = monthSales.filter(s => s.staff === name);
    const salesTotal = rows.reduce((sum, s) => sum + Number(s.amount), 0);
    return { name, count: rows.length, sales: salesTotal, commission: salesTotal * COMMISSION_RATE };
  }).sort((a,b) => b.sales-a.sales);

  const addSale = (e) => {
    e.preventDefault();
    if (!form.staff || !form.service.trim() || !(Number(form.amount) > 0) || !form.date) { setNotice('Please enter the date, staff member, service and a valid amount.'); return; }
    const row = { ...form, id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), amount: Number(form.amount), createdAt: new Date().toISOString() };
    saveSales([row, ...sales]);
    setForm(f => ({ ...f, customer: '', service: '', amount: '', notes: '' }));
    setNotice('Sale saved successfully. VAT and commission have been calculated.');
    setPage('Sales');
  };
  const deleteSale = (id) => { if (window.confirm('Delete this sale? This cannot be undone.')) saveSales(sales.filter(s => s.id !== id)); };
  const addStaff = (e) => { e.preventDefault(); const name = newStaff.trim(); if (!name) return; if (staff.some(s => s.toLowerCase() === name.toLowerCase())) { setNotice('That staff name already exists.'); return; } saveStaff([...staff, name]); setNewStaff(''); setNotice('Staff member added.'); };
  const removeStaff = (name) => { if (sales.some(s => s.staff === name)) { setNotice('This staff member has sales records. Keep the name to preserve your reports.'); return; } if (window.confirm(`Remove ${name}?`)) saveStaff(staff.filter(s => s !== name)); };
  const exportCsv = () => {
    const headers = ['Date','Staff','Customer','Service','Sales (NGN)','VAT 7.5% (NGN)','Commission 30% (NGN)','Notes'];
    const rows = filteredSales.map(s => [s.date,s.staff,s.customer,s.service,s.amount,(s.amount*VAT_RATE).toFixed(2),(s.amount*COMMISSION_RATE).toFixed(2),s.notes]);
    const csv = [headers,...rows].map(row => row.map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\ufeff'+csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `essence-sales-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const exportSummary = () => {
    const rows = [['Essence Unisex Salon & Spa — Monthly Report', month], ['Total sales', totalSales], ['VAT at 7.5%', totalVat], ['Commission at 30%', totalCommission], ['Sales after VAT and commission (indicative)', totalSales-totalVat-totalCommission], [], ['Staff','Transactions','Sales (NGN)','Commission (NGN)'], ...staffStats.map(s=>[s.name,s.count,s.sales,s.commission])];
    const csv = rows.map(row=>row.map(v=>`"${String(v ?? '').replaceAll('"','""')}"`).join(',')).join('\r\n'); const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`essence-monthly-report-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Scissors size={22}/></div><div><div className="brand-name">ESSENCE</div><div className="brand-sub">UNISEX SALON & SPA</div></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{[['Dashboard',LayoutDashboard],['Sales Records',ReceiptText],['Staff & KPIs',Users]].map(([label,Icon]) => <button key={label} className={`nav-item ${page === (label==='Sales Records'?'Sales':label==='Staff & KPIs'?'Staff':label)?'active':''}`} onClick={()=>setPage(label==='Sales Records'?'Sales':label==='Staff & KPIs'?'Staff':label)}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="online-dot"/> Local workspace <span className="version">v1.0</span></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><div className="eyebrow">SALON MANAGEMENT</div><h1>{page === 'Dashboard' ? 'Overview' : page === 'Sales' ? 'Sales records' : 'Staff & performance'}</h1></div><label className="month-select"><CalendarDays size={17}/><span>Reporting month</span><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label></header>
      {notice && <div className="notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notice">×</button></div>}
      {page === 'Dashboard' && <>
        <section className="welcome"><div><div className="welcome-kicker">MONTHLY PERFORMANCE</div><h2>Good business starts with clear numbers.</h2><p>Track sales, staff commission and VAT for {new Date(`${month}-02T12:00:00`).toLocaleDateString('en-GB',{month:'long',year:'numeric'})}.</p></div><div className="welcome-icon"><Scissors size={34}/></div></section>
        <section className="metrics-grid">
          <Metric icon={Wallet} label="Total sales" value={money(totalSales)} hint={`${monthSales.length} transactions this month`} />
          <Metric icon={Percent} label="VAT · 7.5%" value={money(totalVat)} hint="Calculated on recorded sales" />
          <Metric icon={TrendingUp} label="Staff commission · 30%" value={money(totalCommission)} hint="Based on recorded sales" />
          <Metric icon={FileSpreadsheet} label="After VAT & commission" value={money(totalSales-totalVat-totalCommission)} hint="Indicative balance before other costs" />
        </section>
        <section className="content-grid"><div className="panel"><div className="panel-heading"><div><h3>Recent sales</h3><p>Latest transactions in selected month</p></div><button className="text-button" onClick={()=>setPage('Sales')}>View all →</button></div><SalesTable rows={monthSales.slice(0,5)} onDelete={deleteSale} compact/></div><div className="panel"><div className="panel-heading"><div><h3>Staff leaderboard</h3><p>Ranked by monthly sales</p></div></div>{staffStats.length ? <div className="leader-list">{staffStats.slice(0,5).map((s,i)=><div className="leader" key={s.name}><div className="avatar">{s.name.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()}</div><div className="leader-info"><strong>{s.name}</strong><span>{s.count} sale{s.count===1?'':'s'}</span></div><div className="leader-total">{money(s.sales)}</div></div>)}</div>:<Empty text="Add staff and record sales to see performance."/>}<button className="secondary full-width" onClick={()=>setPage('Staff')}>Manage staff</button></div></section>
        <section className="panel formula-note"><div className="formula-icon"><Percent size={20}/></div><div><h3>How the calculations work</h3><p>VAT = recorded sale amount × 7.5%. Commission = recorded sale amount × 30%. These are configurable assumptions, not a tax determination. Confirm whether your entered prices include VAT and whether commission is based on gross or VAT-exclusive sales before using this for official accounting.</p></div></section>
      </>}
      {page === 'Sales' && <div className="sales-layout"><section className="panel add-sale-panel"><div className="panel-heading"><div><h3>Record a sale</h3><p>VAT and commission calculate automatically</p></div><div className="panel-icon"><Plus size={19}/></div></div><form onSubmit={addSale} className="sale-form"><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label><label>Staff member<select value={form.staff} onChange={e=>setForm({...form,staff:e.target.value})} required>{staff.map(s=><option key={s}>{s}</option>)}</select></label><label>Customer name <span className="optional">(optional)</span><input value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} placeholder="Customer name"/></label><label>Service / product<input value={form.service} onChange={e=>setForm({...form,service:e.target.value})} placeholder="e.g. Hair treatment" required/></label><label>Sale amount (₦)<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00" required/></label><div className="calculation-box"><div><span>VAT · 7.5%</span><strong>{money(Number(form.amount||0)*VAT_RATE)}</strong></div><div><span>Staff commission · 30%</span><strong>{money(Number(form.amount||0)*COMMISSION_RATE)}</strong></div><div className="calc-total"><span>After VAT & commission</span><strong>{money(Number(form.amount||0)*(1-VAT_RATE-COMMISSION_RATE))}</strong></div></div><label>Notes <span className="optional">(optional)</span><textarea rows="2" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Payment method or details"/></label><button className="primary full-width" type="submit"><Plus size={17}/> Save sale</button></form></section><section className="panel records-panel"><div className="panel-heading"><div><h3>Sales records</h3><p>{monthSales.length} entries · {month}</p></div><button className="secondary" onClick={exportCsv}><Download size={16}/> Export CSV</button></div><div className="search-wrap"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search staff, customer or service"/></div><SalesTable rows={filteredSales} onDelete={deleteSale}/></section></div>}
      {page === 'Staff' && <div className="staff-page"><section className="panel"><div className="panel-heading"><div><h3>Staff directory</h3><p>Add names used when recording sales</p></div></div><form className="add-staff-form" onSubmit={addStaff}><input value={newStaff} onChange={e=>setNewStaff(e.target.value)} placeholder="Enter staff member's name"/><button className="primary" type="submit"><Plus size={17}/> Add staff</button></form><div className="staff-directory">{staff.map(name=><div className="staff-chip" key={name}><div className="avatar">{name.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()}</div><span>{name}</span><button className="icon-button" title="Remove staff" onClick={()=>removeStaff(name)}><Trash2 size={16}/></button></div>)}</div></section><section className="panel"><div className="panel-heading"><div><h3>Monthly staff performance</h3><p>Sales and commission for {month}</p></div><button className="secondary" onClick={exportSummary}><Download size={16}/> Export report</button></div><div className="table-scroll"><table><thead><tr><th>Staff member</th><th>Transactions</th><th>Sales</th><th>Commission · 30%</th></tr></thead><tbody>{staffStats.map(s=><tr key={s.name}><td><strong>{s.name}</strong></td><td>{s.count}</td><td>{money(s.sales)}</td><td className="money-cell">{money(s.commission)}</td></tr>)}</tbody><tfoot><tr><td>Total</td><td>{monthSales.length}</td><td>{money(totalSales)}</td><td>{money(totalCommission)}</td></tr></tfoot></table></div></section><section className="panel formula-note"><div className="formula-icon"><Users size={20}/></div><div><h3>Performance guidance</h3><p>This first version reports sales and commission. You can later add attendance, rebooking rate, customer feedback, retail sales, service targets and monthly KPI scores.</p></div></section></div>}
      <footer>© {new Date().getFullYear()} Essence Unisex Salon & Spa <span>First version · Data stored in this browser</span></footer>
    </main>
  </div>;
}
function Metric({icon:Icon,label,value,hint}) { return <div className="metric-card"><div className="metric-top"><span>{label}</span><div className="metric-icon"><Icon size={18}/></div></div><div className="metric-value">{value}</div><div className="metric-hint">{hint}</div></div>; }
function Empty({text}) { return <div className="empty-state">{text}</div>; }
function SalesTable({rows,onDelete,compact=false}) { if (!rows.length) return <Empty text="No sales recorded for this month yet. Add your first sale to get started."/>; return <div className="table-scroll"><table><thead><tr><th>Date</th><th>Staff / service</th><th>Sale amount</th>{!compact&&<><th>VAT</th><th>Commission</th></>}<th></th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td className="date-cell">{s.date}</td><td><strong>{s.staff}</strong><div className="sub-cell">{s.service}{s.customer?` · ${s.customer}`:''}</div></td><td className="money-cell">{money(s.amount)}</td>{!compact&&<><td>{money(s.amount*VAT_RATE)}</td><td>{money(s.amount*COMMISSION_RATE)}</td></>}<td><button className="icon-button danger" title="Delete sale" onClick={()=>onDelete(s.id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div>; }

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
