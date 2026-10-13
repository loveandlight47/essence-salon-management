import React, { useMemo, useState } from 'react';

import { createRoot } from 'react-dom/client';

import { LayoutDashboard, ReceiptText, Users, Download, Plus, Trash2, Scissors, CalendarDays, TrendingUp, Wallet, Percent, Search, FileSpreadsheet, Package, Pencil, X, Check } from 'lucide-react';

import './styles.css';

const VAT_RATE = 0.075;

const DEFAULT_COMMISSION = 30;

const SALES_KEY = 'essence-salon-sales-v1';

const STAFF_KEY = 'essence-salon-staff-v1';

const SERVICES_KEY = 'essence-salon-services-v1';

const money = n => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(Number(n || 0));

const today = () => new Date().toISOString().slice(0, 10);

const readJson = (key, fallback) => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };

const uid = () => globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initials = name => String(name || '').split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();

const rate = value => Math.max(0, Math.min(100, Number(value) || 0));

const exportCsv = (rows, filename) => {

  const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);

};

const oldStaffToNew = items => (Array.isArray(items) ? items : []).map(item => typeof item === 'string'

  ? { id: item, name: item, commissionRate: DEFAULT_COMMISSION }

  : { id: item.id || item.name || uid(), name: String(item.name || '').trim(), commissionRate: rate(item.commissionRate ?? DEFAULT_COMMISSION) }

).filter(item => item.name);

function App() {

  const [sales, setSales] = useState(() => readJson(SALES_KEY, []));

  const [staff, setStaff] = useState(() => oldStaffToNew(readJson(STAFF_KEY, ['Staff member 1', 'Staff member 2'])));

  const [services, setServices] = useState(() => readJson(SERVICES_KEY, []));

  const [page, setPage] = useState('Dashboard');

  const [month, setMonth] = useState(today().slice(0, 7));

  const [search, setSearch] = useState('');

  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({ date: today(), staffId: '', serviceId: '', customer: '', amount: '', notes: '' });

  const [staffDraft, setStaffDraft] = useState({ id: '', name: '', commissionRate: String(DEFAULT_COMMISSION) });

  const [serviceDraft, setServiceDraft] = useState({ id: '', name: '', price: '' });

  const saveSales = next => { setSales(next); localStorage.setItem(SALES_KEY, JSON.stringify(next)); };

  const saveStaff = next => { setStaff(next); localStorage.setItem(STAFF_KEY, JSON.stringify(next)); };

  const saveServices = next => { setServices(next); localStorage.setItem(SERVICES_KEY, JSON.stringify(next)); };

  React.useEffect(() => { localStorage.setItem(STAFF_KEY, JSON.stringify(staff)); }, []);

  const selectedStaff = staff.find(p => p.id === form.staffId);

  const selectedService = services.find(s => s.id === form.serviceId);

  const amount = Number(form.amount || 0);

  const monthSales = useMemo(() => sales.filter(s => s.date?.startsWith(month)), [sales, month]);

  const totalSales = monthSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

  const totalVat = monthSales.reduce((sum, s) => sum + Number(s.vatAmount ?? Number(s.amount || 0) * Number(s.vatRate ?? VAT_RATE)), 0);

  const totalCommission = monthSales.reduce((sum, s) => sum + Number(s.commissionAmount ?? Number(s.amount || 0) * Number(s.commissionRate ?? DEFAULT_COMMISSION) / 100), 0);

  const filteredSales = monthSales.filter(s => `${s.staff} ${s.customer} ${s.service}`.toLowerCase().includes(search.toLowerCase()));

  const staffStats = staff.map(p => {

    const rows = monthSales.filter(s => s.staffId === p.id || (!s.staffId && s.staff === p.name));

    return { ...p, count: rows.length, sales: rows.reduce((n, s) => n + Number(s.amount || 0), 0), commission: rows.reduce((n, s) => n + Number(s.commissionAmount ?? Number(s.amount || 0) * Number(s.commissionRate ?? DEFAULT_COMMISSION) / 100), 0) };

  }).sort((a, b) => b.sales - a.sales);

  const addSale = e => {

    e.preventDefault();

    if (!form.date || !selectedStaff || !selectedService || !(amount > 0)) { setNotice('Select a date, staff member and service, and confirm a valid amount.'); return; }

    const commissionRate = rate(selectedStaff.commissionRate);

    const row = { ...form, id: uid(), staff: selectedStaff.name, staffId: selectedStaff.id, service: selectedService.name, serviceId: selectedService.id, customer: form.customer.trim(), notes: form.notes.trim(), amount, vatRate: VAT_RATE, vatAmount: amount * VAT_RATE, commissionRate, commissionAmount: amount * commissionRate / 100, createdAt: new Date().toISOString() };

    saveSales([row, ...sales]);

    setForm(f => ({ ...f, customer: '', serviceId: '', amount: '', notes: '' }));

    setNotice(`Sale saved. ${selectedStaff.name}'s commission is ${commissionRate}%.`);

    setPage('Sales');

  };

  const deleteSale = id => { if (window.confirm('Delete this sale? This cannot be undone.')) saveSales(sales.filter(s => s.id !== id)); };
  const saveStaffDraft = e => {

    e.preventDefault();

    const name = staffDraft.name.trim(), commissionRate = Number(staffDraft.commissionRate);

    if (!name || !Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) { setNotice('Enter a name and a commission percentage from 0 to 100.'); return; }

    if (staff.some(p => p.name.toLowerCase() === name.toLowerCase() && p.id !== staffDraft.id)) { setNotice('That staff name already exists.'); return; }

    if (staffDraft.id) {

      const previous = staff.find(p => p.id === staffDraft.id);

      saveStaff(staff.map(p => p.id === staffDraft.id ? { ...p, name, commissionRate } : p));

      if (previous && previous.name !== name) saveSales(sales.map(s => s.staffId === previous.id ? { ...s, staff: name } : s));

      setNotice('Staff details updated. Historical commission amounts are unchanged.');

    } else {

      saveStaff([...staff, { id: uid(), name, commissionRate }]);

      setNotice('Staff member added.');

    }

    setStaffDraft({ id: '', name: '', commissionRate: String(DEFAULT_COMMISSION) });

  };

  const removeStaff = p => {

    if (sales.some(s => s.staffId === p.id || s.staff === p.name)) { setNotice('This staff member has sales records. Keep them to preserve reports; you can edit their name instead.'); return; }

    if (window.confirm(`Remove ${p.name}?`)) { saveStaff(staff.filter(x => x.id !== p.id)); setNotice('Staff member removed.'); }

  };

  const saveServiceDraft = e => {

    e.preventDefault();

    const name = serviceDraft.name.trim(), price = Number(serviceDraft.price);

    if (!name || !Number.isFinite(price) || price <= 0) { setNotice('Enter a service name and a price greater than zero.'); return; }

    if (services.some(s => s.name.toLowerCase() === name.toLowerCase() && s.id !== serviceDraft.id)) { setNotice('That service name already exists.'); return; }

    if (serviceDraft.id) {

      saveServices(services.map(s => s.id === serviceDraft.id ? { ...s, name, price } : s));

      setNotice('Service updated. Existing sales keep their recorded prices.');

    } else {

      saveServices([...services, { id: uid(), name, price }].sort((a, b) => a.name.localeCompare(b.name)));

      setNotice('Service added.');

    }

    setServiceDraft({ id: '', name: '', price: '' });

  };

  const removeService = service => {

    if (window.confirm(`Remove ${service.name} from the service list? Existing sales will remain.`)) {

      saveServices(services.filter(s => s.id !== service.id)); setNotice('Service removed; existing sales are unchanged.');

    }

  };

  const downloadSales = () => exportCsv([

    ['Date', 'Staff', 'Commission rate %', 'Customer', 'Service', 'Sales NGN', 'VAT NGN', 'Commission NGN', 'Notes'],

    ...filteredSales.map(s => [s.date, s.staff, s.commissionRate ?? DEFAULT_COMMISSION, s.customer, s.service, s.amount, s.vatAmount ?? Number(s.amount || 0) * Number(s.vatRate ?? VAT_RATE), s.commissionAmount ?? Number(s.amount || 0) * Number(s.commissionRate ?? DEFAULT_COMMISSION) / 100, s.notes])

  ], `essence-sales-${month}.csv`);

  const downloadSummary = () => exportCsv([

    ['Essence Unisex Salon & Spa — Monthly Report', month], ['Total sales', totalSales], ['VAT', totalVat], ['Commission', totalCommission], ['After VAT & commission (indicative)', totalSales - totalVat - totalCommission], [],

    ['Staff', 'Current commission %', 'Transactions', 'Sales NGN', 'Commission on recorded sales NGN'],

    ...staffStats.map(s => [s.name, s.commissionRate, s.count, s.sales, s.commission])

  ], `essence-monthly-report-${month}.csv`);

  return <div className="app-shell">

    <aside className="sidebar">

      <div className="brand"><div className="brand-mark"><Scissors size={22}/></div><div><div className="brand-name">ESSENCE</div><div className="brand-sub">UNISEX SALON & SPA</div></div></div>

      <div className="nav-label">WORKSPACE</div>

      <nav>{[['Dashboard', LayoutDashboard], ['Sales Records', ReceiptText], ['Services', Package], ['Staff & KPIs', Users]].map(([label, Icon]) => {

        const target = label === 'Sales Records' ? 'Sales' : label === 'Staff & KPIs' ? 'Staff' : label;

        return <button key={label} className={`nav-item ${page === target ? 'active' : ''}`} onClick={() => setPage(target)}><Icon size={18}/><span>{label}</span></button>;

      })}</nav>

      <div className="sidebar-bottom"><div className="online-dot"/> Local workspace <span className="version">v1.1</span></div>

    </aside>

    <main className="main-content">

      <header className="topbar"><div><div className="eyebrow">SALON MANAGEMENT</div><h1>{page === 'Dashboard' ? 'Overview' : page === 'Sales' ? 'Sales records' : page === 'Services' ? 'Services & prices' : 'Staff & performance'}</h1></div><label className="month-select"><CalendarDays size={17}/><span>Reporting month</span><input type="month" value={month} onChange={e => setMonth(e.target.value)}/></label></header>

      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></div>}

      {page === 'Dashboard' && <>

        <section className="welcome"><div><div className="welcome-kicker">MONTHLY PERFORMANCE</div><h2>Good business starts with clear numbers.</h2><p>Track sales, staff commission and VAT for {new Date(`${month}-02T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.</p></div><div className="welcome-icon"><Scissors size={34}/></div></section>

        <section className="metrics-grid">

          <Metric icon={Wallet} label="Total sales" value={money(totalSales)} hint={`${monthSales.length} transactions this month`}/>

          <Metric icon={Percent} label="VAT · 7.5%" value={money(totalVat)} hint="Calculated per sale"/>

          <Metric icon={TrendingUp} label="Staff commission" value={money(totalCommission)} hint="Individual saved commission rates"/>

          <Metric icon={FileSpreadsheet} label="After VAT & commission" value={money(totalSales - totalVat - totalCommission)} hint="Indicative balance before other costs"/>

        </section>

        <section className="content-grid"><div className="panel"><div className="panel-heading"><div><h3>Recent sales</h3><p>Latest transactions in selected month</p></div><button className="text-button" onClick={() => setPage('Sales')}>View all →</button></div><SalesTable rows={monthSales.slice(0, 5)} onDelete={deleteSale} compact/></div>

          <div className="panel"><div className="panel-heading"><div><h3>Staff leaderboard</h3><p>Ranked by monthly sales</p></div></div>{staffStats.length ? <div className="leader-list">{staffStats.slice(0, 5).map(s => <div className="leader" key={s.id}><div className="avatar">{initials(s.name)}</div><div className="leader-info"><strong>{s.name}</strong><span>{s.count} sale{s.count === 1 ? '' : 's'} · {s.commissionRate}% commission</span></div><div className="leader-total">{money(s.sales)}</div></div>)}</div> : <Empty text="Add staff and record sales to see performance."/>}<button className="secondary full-width" onClick={() => setPage('Staff')}>Manage staff</button></div></section>

        <section className="panel formula-note"><div className="formula-icon"><Percent size={20}/></div><div><h3>How the calculations work</h3><p>VAT = recorded sale amount × 7.5%. Commission = recorded sale amount × the selected staff member's saved commission rate. These are business assumptions, not a tax determination. Confirm whether prices include VAT and whether commission is based on gross or VAT-exclusive sales with your accountant.</p></div></section>
        {page === 'Sales' && <div className="sales-layout"><section className="panel add-sale-panel"><div className="panel-heading"><div><h3>Record a sale</h3><p>Select a saved service and staff member</p></div><div className="panel-icon"><Plus size={19}/></div></div>

        <form onSubmit={addSale} className="sale-form">

          <label>Date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required/></label>

          <label>Staff member<select value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })} required><option value="">Select staff member</option>{staff.map(p => <option key={p.id} value={p.id}>{p.name} ({p.commissionRate}%)</option>)}</select></label>

          <label>Customer name <span className="optional">(optional)</span><input value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} placeholder="Customer name"/></label>

          <label>Service<select value={form.serviceId} onChange={e => { const s = services.find(x => x.id === e.target.value); setForm({ ...form, serviceId: e.target.value, amount: s ? String(s.price) : '' }); }} required><option value="">Select service</option>{services.map(s => <option key={s.id} value={s.id}>{s.name} — {money(s.price)}</option>)}</select></label>

          {!services.length && <p className="field-help">No saved services yet. Open Services to add names and prices first.</p>}

          <label>Sale amount (₦)<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Auto-filled from service price" required/></label>

          {selectedService && <p className="field-help">Standard price: {money(selectedService.price)}. You can change the amount for a discount or special price.</p>}

          <div className="calculation-box"><div><span>VAT · 7.5%</span><strong>{money(amount * VAT_RATE)}</strong></div><div><span>Commission · {selectedStaff ? rate(selectedStaff.commissionRate) : 0}%</span><strong>{money(selectedStaff ? amount * rate(selectedStaff.commissionRate) / 100 : 0)}</strong></div><div className="calc-total"><span>After VAT & commission</span><strong>{money(amount - amount * VAT_RATE - (selectedStaff ? amount * rate(selectedStaff.commissionRate) / 100 : 0))}</strong></div></div>

          <label>Notes <span className="optional">(optional)</span><textarea rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Payment method or details"/></label>

          <button className="primary full-width" type="submit"><Plus size={17}/> Save sale</button>

        </form></section>

        <section className="panel records-panel"><div className="panel-heading"><div><h3>Sales records</h3><p>{monthSales.length} entries · {month}</p></div><button className="secondary" onClick={downloadSales}><Download size={16}/> Export CSV</button></div><div className="search-wrap"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff, customer or service"/></div><SalesTable rows={filteredSales} onDelete={deleteSale}/></section>

      </div>}

      {page === 'Services' && <div className="staff-page"><section className="panel"><div className="panel-heading"><div><h3>{serviceDraft.id ? 'Edit service' : 'Services & prices'}</h3><p>Save regular services for quick sale entry</p></div><div className="panel-icon"><Package size={19}/></div></div>

        <form className="add-staff-form" onSubmit={saveServiceDraft}><input value={serviceDraft.name} onChange={e => setServiceDraft({ ...serviceDraft, name: e.target.value })} placeholder="Service name (e.g. Haircut)" aria-label="Service name" required/><input type="number" min="0.01" step="0.01" value={serviceDraft.price} onChange={e => setServiceDraft({ ...serviceDraft, price: e.target.value })} placeholder="Price in naira (₦)" aria-label="Service price" required/><button className="primary" type="submit">{serviceDraft.id ? <Check size={17}/> : <Plus size={17}/>} {serviceDraft.id ? 'Save changes' : 'Add service'}</button>{serviceDraft.id && <button className="secondary" type="button" onClick={() => setServiceDraft({ id: '', name: '', price: '' })}><X size={16}/> Cancel</button>}</form>

        <div className="table-scroll"><table><thead><tr><th>Service name</th><th>Price</th><th>Actions</th></tr></thead><tbody>{services.map(s => <tr key={s.id}><td><strong>{s.name}</strong></td><td className="money-cell">{money(s.price)}</td><td><div className="action-group"><button className="icon-button" title={`Edit ${s.name}`} onClick={() => setServiceDraft({ id: s.id, name: s.name, price: String(s.price) })}><Pencil size={15}/></button><button className="icon-button danger" title={`Remove ${s.name}`} onClick={() => { if (window.confirm(`Remove ${s.name} from the service list? Existing sales remain.`)) { saveServices(services.filter(x => x.id !== s.id)); setNotice('Service removed; existing sales are unchanged.'); } }}><Trash2 size={15}/></button></div></td></tr>)}{!services.length && <tr><td colSpan="3"><Empty text="No services saved yet. Add your first service above."/></td></tr>}</tbody></table></div>

      </section><section className="panel formula-note"><div className="formula-icon"><ReceiptText size={20}/></div><div><h3>Prices and existing sales</h3><p>Changing a service price affects future sales only. Existing sales retain their recorded amounts. You can adjust the amount on the sale form for discounts or special pricing.</p></div></section></div>}

      {page === 'Staff' && <div className="staff-page"><section className="panel"><div className="panel-heading"><div><h3>{staffDraft.id ? 'Edit staff member' : 'Staff directory'}</h3><p>Set an individual commission percentage for each person</p></div></div>

        <form className="add-staff-form" onSubmit={saveStaffDraft}><input value={staffDraft.name} onChange={e => setStaffDraft({ ...staffDraft, name: e.target.value })} placeholder="Staff member's name" aria-label="Staff name" required/><label className="commission-input">Commission %<input type="number" min="0" max="100" step="0.1" value={staffDraft.commissionRate} onChange={e => setStaffDraft({ ...staffDraft, commissionRate: e.target.value })} required/></label><button className="primary" type="submit">{staffDraft.id ? <Check size={17}/> : <Plus size={17}/>} {staffDraft.id ? 'Save changes' : 'Add staff'}</button>{staffDraft.id && <button className="secondary" type="button" onClick={() => setStaffDraft({ id: '', name: '', commissionRate: String(DEFAULT_COMMISSION) })}><X size={16}/> Cancel</button>}</form>

        <div className="table-scroll"><table><thead><tr><th>Staff member</th><th>Commission rate</th><th>Actions</th></tr></thead><tbody>{staff.map(p => <tr key={p.id}><td><div className="staff-table-name"><div className="avatar">{initials(p.name)}</div><strong>{p.name}</strong></div></td><td>{p.commissionRate}%</td><td><div className="action-group"><button className="icon-button" title={`Edit ${p.name}`} onClick={() => setStaffDraft({ id: p.id, name: p.name, commissionRate: String(p.commissionRate) })}><Pencil size={15}/></button><button className="icon-button danger" title={`Remove ${p.name}`} onClick={() => { if (sales.some(s => s.staffId === p.id || s.staff === p.name)) setNotice('This staff member has sales records. Keep them to preserve reports; you can edit their name instead.'); else if (window.confirm(`Remove ${p.name}?`)) saveStaff(staff.filter(x => x.id !== p.id)); }}><Trash2 size={15}/></button></div></td></tr>)}{!staff.length && <tr><td colSpan="3"><Empty text="No staff listed yet. Add your first staff member above."/></td></tr>}</tbody></table></div>

      </section>

      <section className="panel"><div className="panel-heading"><div><h3>Monthly staff performance</h3><p>Commission amounts saved with each sale · {month}</p></div><button className="secondary" onClick={downloadSummary}><Download size={16}/> Export report</button></div><div className="table-scroll"><table><thead><tr><th>Staff member</th><th>Current rate</th><th>Transactions</th><th>Sales</th><th>Commission on sales</th></tr></thead><tbody>{staffStats.map(s => <tr key={s.id}><td><strong>{s.name}</strong></td><td>{s.commissionRate}%</td><td>{s.count}</td><td>{money(s.sales)}</td><td className="money-cell">{money(s.commission)}</td></tr>)}</tbody><tfoot><tr><td>Total</td><td>—</td><td>{monthSales.length}</td><td>{money(totalSales)}</td><td>{money(totalCommission)}</td></tr></tfoot></table></div></section>

      <section className="panel formula-note"><div className="formula-icon"><Users size={20}/></div><div><h3>Commission history</h3><p>Each new sale saves the staff member's commission rate and commission amount at the time of sale. Updating a rate affects future sales only, not past commissions.</p></div></section></div>}

      <footer>© {new Date().getFullYear()} Essence Unisex Salon & Spa <span>Data stored in this browser · Export reports regularly</span></footer>

    </main>

  </div>;

}

function Metric({ icon: Icon, label, value, hint }) { return <div className="metric-card"><div className="metric-top"><span>{label}</span><div className="metric-icon"><Icon size={18}/></div></div><div className="metric-value">{value}</div><div className="metric-hint">{hint}</div></div>; }

function Empty({ text }) { return <div className="empty-state">{text}</div>; }

function SalesTable({ rows, onDelete, compact = false }) {

  if (!rows.length) return <Empty text="No sales recorded for this month yet. Add your first sale to get started."/>;

  return <div className="table-scroll"><table><thead><tr><th>Date</th><th>Staff / service</th><th>Sale amount</th>{!compact && <><th>VAT</th><th>Commission</th></>}<th></th></tr></thead><tbody>{rows.map(s => <tr key={s.id}><td className="date-cell">{s.date}</td><td><strong>{s.staff}</strong><div className="sub-cell">{s.service}{s.customer ? ` · ${s.customer}` : ''}</div></td><td className="money-cell">{money(s.amount)}</td>{!compact && <><td>{money(s.vatAmount ?? Number(s.amount || 0) * Number(s.vatRate ?? VAT_RATE))}</td><td>{money(s.commissionAmount ?? Number(s.amount || 0) * Number(s.commissionRate ?? DEFAULT_COMMISSION) / 100)}</td></>}<td><button className="icon-button danger" title="Delete sale" onClick={() => onDelete(s.id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div>;

}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
