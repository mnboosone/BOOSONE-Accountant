// ==================== تنظیمات ====================
const CATEGORIES = [
  "حمل‌ونقل", "خوراک", "لباس", "مسکن / اجاره", "قبوض",
  "درمانی", "آموزش", "تفریح", "متفرقه",
  "ارسال پول", "دریافت پول",
  "چک دریافتی", "چک صادره",
  "یادآوری"
];

// دسته‌هایی که درآمد محسوب می‌شوند
const INCOME_CATS = ["دریافت پول", "چک دریافتی"];

let currentSection = null;
let currentFilter = "today";

// ==================== ذخیره‌سازی ====================
function getData() {
  const raw = localStorage.getItem("boosone_accountant");
  if (!raw) {
    const init = { entries: {}, reminders: [] };
    CATEGORIES.forEach(c => { if (c !== "یادآوری") init.entries[c] = []; });
    localStorage.setItem("boosone_accountant", JSON.stringify(init));
    return init;
  }
  const data = JSON.parse(raw);
  if (!data.entries) data.entries = {};
  if (!data.reminders) data.reminders = [];
  CATEGORIES.forEach(c => {
    if (c !== "یادآوری" && !data.entries[c]) data.entries[c] = [];
  });
  return data;
}

function saveData(data) {
  localStorage.setItem("boosone_accountant", JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString("fa-IR");
}

function toISODate(d) {
  const x = new Date(d);
  return x.toISOString().split("T")[0];
}

function todayStr() {
  return toISODate(new Date());
}

function isSameMonth(isoDate) {
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function isToday(isoDate) {
  return toISODate(isoDate) === todayStr();
}

// ==================== ناوبری ====================
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function goHome() {
  currentSection = null;
  updateHomeSummary();
  showPage("home-page");
}

// ==================== صفحه اصلی ====================
function renderHome() {
  const grid = document.getElementById("sections-grid");
  grid.innerHTML = "";
  CATEGORIES.forEach((name, i) => {
    const btn = document.createElement("button");
    btn.className = "section-btn";
    btn.textContent = name;
    btn.onclick = () => openSection(name);
    btn.style.animationDelay = (i * 0.07) + "s";
    grid.appendChild(btn);
  });
  updateHomeSummary();
}

function updateHomeSummary() {
  const { expense: eToday, income: iToday } = calcTotals("today");
  const { expense: eMonth, income: iMonth } = calcTotals("month");
  document.getElementById("home-today").textContent = formatMoney(eToday - iToday);
  document.getElementById("home-month").textContent = formatMoney(eMonth - iMonth);
}

function openSection(name) {
  currentSection = name;
  document.getElementById("section-title").textContent = name;

  const normal = document.getElementById("normal-section-ui");
  const rem = document.getElementById("reminder-section-ui");

  if (name === "یادآوری") {
    normal.classList.add("hidden");
    rem.classList.remove("hidden");
    hideAddReminderForm();
    renderReminders();
  } else {
    rem.classList.add("hidden");
    normal.classList.remove("hidden");
    hideAddForm();
    renderEntries();
  }
  showPage("section-page");
}

// ==================== ثبت‌ها ====================
function showAddForm() {
  document.getElementById("add-form").classList.remove("hidden");
  document.getElementById("entry-amount").value = "";
  document.getElementById("entry-note").value = "";
  document.getElementById("entry-date").value = todayStr();
  document.getElementById("entry-amount").focus();
}

function hideAddForm() {
  document.getElementById("add-form").classList.add("hidden");
}

function saveEntry() {
  const amount = parseFloat(document.getElementById("entry-amount").value);
  const date = document.getElementById("entry-date").value;
  const note = document.getElementById("entry-note").value.trim();

  if (!amount || amount <= 0) { alert("مبلغ معتبر وارد کنید."); return; }
  if (!date) { alert("تاریخ را انتخاب کنید."); return; }

  const data = getData();
  data.entries[currentSection].unshift({
    id: generateId(),
    amount,
    date,
    note,
    createdAt: new Date().toISOString()
  });
  saveData(data);
  hideAddForm();
  renderEntries();
}

function renderEntries() {
  const data = getData();
  const list = data.entries[currentSection] || [];
  const box = document.getElementById("entries-list");
  box.innerHTML = "";

  if (list.length === 0) {
    box.innerHTML = `<div class="empty-state">هنوز ثبتی وجود ندارد.</div>`;
    return;
  }

  const isIncome = INCOME_CATS.includes(currentSection);

  list.forEach(e => {
    const div = document.createElement("div");
    div.className = "entry-item";
    div.innerHTML = `
      <div class="entry-info">
        <div class="entry-amount ${isIncome ? "income" : "expense"}">${formatMoney(e.amount)} تومان</div>
        <div class="entry-meta">${new Date(e.date).toLocaleDateString("fa-IR")}</div>
        ${e.note ? `<div class="entry-note">${e.note}</div>` : ""}
      </div>
      <div class="entry-actions">
        <button class="btn-danger" onclick="deleteEntry('${e.id}')">حذف</button>
      </div>
    `;
    box.appendChild(div);
  });
}

function deleteEntry(id) {
  if (!confirm("این مورد حذف شود؟")) return;
  const data = getData();
  data.entries[currentSection] = (data.entries[currentSection] || []).filter(e => e.id !== id);
  saveData(data);
  renderEntries();
}

// ==================== یادآوری ====================
function showAddReminderForm() {
  document.getElementById("add-reminder-form").classList.remove("hidden");
  document.getElementById("rem-title").value = "";
  document.getElementById("rem-note").value = "";
  const t = new Date(); t.setDate(t.getDate() + 1);
  document.getElementById("rem-date").value = toISODate(t);
}

function hideAddReminderForm() {
  document.getElementById("add-reminder-form").classList.add("hidden");
}

function saveReminder() {
  const title = document.getElementById("rem-title").value.trim();
  const note = document.getElementById("rem-note").value.trim();
  const date = document.getElementById("rem-date").value;
  if (!title) { alert("عنوان را وارد کنید."); return; }
  if (!date) { alert("تاریخ را انتخاب کنید."); return; }

  const data = getData();
  data.reminders.unshift({
    id: generateId(),
    title, note, date,
    createdAt: new Date().toISOString()
  });
  saveData(data);
  hideAddReminderForm();
  renderReminders();
}

function renderReminders() {
  const data = getData();
  const list = data.reminders || [];
  const box = document.getElementById("reminders-list");
  box.innerHTML = "";

  if (list.length === 0) {
    box.innerHTML = `<div class="empty-state">یادآوری‌ای ثبت نشده است.</div>`;
    return;
  }

  const now = todayStr();
  list.sort((a, b) => a.date.localeCompare(b.date));

  list.forEach(r => {
    const isDue = r.date <= now;
    const div = document.createElement("div");
    div.className = "entry-item reminder-item" + (isDue ? " due" : "");
    const badge = isDue ? `<span class="badge-due">موعد رسیده</span>` : `<span class="badge-soon">آینده</span>`;
    div.innerHTML = `
      <div class="entry-info">
        <div class="entry-amount">${badge} ${r.title}</div>
        <div class="entry-meta">${new Date(r.date).toLocaleDateString("fa-IR")}</div>
        ${r.note ? `<div class="entry-note">${r.note}</div>` : ""}
      </div>
      <div class="entry-actions">
        <button class="btn-danger" onclick="deleteReminder('${r.id}')">حذف</button>
      </div>
    `;
    box.appendChild(div);
  });
}

function deleteReminder(id) {
  if (!confirm("حذف شود؟")) return;
  const data = getData();
  data.reminders = data.reminders.filter(r => r.id !== id);
  saveData(data);
  renderReminders();
}

// ==================== گزارش و جمع‌ها ====================
function calcTotals(filter, fromDate, toDate) {
  const data = getData();
  let expense = 0, income = 0;
  const byCat = {};

  CATEGORIES.forEach(c => {
    if (c === "یادآوری") return;
    byCat[c] = 0;
    (data.entries[c] || []).forEach(e => {
      let ok = false;
      if (filter === "today") ok = isToday(e.date);
      else if (filter === "month") ok = isSameMonth(e.date);
      else if (filter === "custom") {
        ok = e.date >= fromDate && e.date <= toDate;
      }
      if (!ok) return;

      byCat[c] += e.amount;
      if (INCOME_CATS.includes(c)) income += e.amount;
      else expense += e.amount;
    });
  });

  return { expense, income, byCat };
}

function openSummary() {
  currentFilter = "today";
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".filter-btn")[0].classList.add("active");
  document.getElementById("custom-range").classList.add("hidden");
  renderReport("today");
  showPage("summary-page");
}

function setFilter(type, btn) {
  currentFilter = type;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  if (type === "custom") {
    document.getElementById("custom-range").classList.remove("hidden");
    const now = new Date();
    document.getElementById("to-date").value = todayStr();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    document.getElementById("from-date").value = toISODate(first);
  } else {
    document.getElementById("custom-range").classList.add("hidden");
    renderReport(type);
  }
}

function applyCustomRange() {
  const from = document.getElementById("from-date").value;
  const to = document.getElementById("to-date").value;
  if (!from || !to) { alert("هر دو تاریخ را انتخاب کنید."); return; }
  if (from > to) { alert("تاریخ شروع باید قبل از پایان باشد."); return; }
  renderReport("custom", from, to);
}

function renderReport(filter, fromDate, toDate) {
  const { expense, income, byCat } = calcTotals(filter, fromDate, toDate);
  const balance = income - expense;

  document.getElementById("rep-expense").textContent = formatMoney(expense) + " تومان";
  document.getElementById("rep-income").textContent = formatMoney(income) + " تومان";
  document.getElementById("rep-balance").textContent = formatMoney(balance) + " تومان";
  document.getElementById("rep-balance").className = "amount " + (balance >= 0 ? "income" : "expense");

  const box = document.getElementById("report-by-category");
  box.innerHTML = "";

  Object.keys(byCat).forEach(cat => {
    if (byCat[cat] === 0) return;
    const isInc = INCOME_CATS.includes(cat);
    const div = document.createElement("div");
    div.className = "cat-report-item";
    div.innerHTML = `
      <span class="cat-name">${cat}</span>
      <span class="cat-sum ${isInc ? "income" : "expense"}">${formatMoney(byCat[cat])} تومان</span>
    `;
    box.appendChild(div);
  });

  if (box.children.length === 0) {
    box.innerHTML = `<div class="empty-state">در این بازه ثبتی وجود ندارد.</div>`;
  }
}

// ==================== شروع ====================
document.addEventListener("DOMContentLoaded", () => {
  renderHome();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    if (splash) {
      splash.classList.add("hide");
      setTimeout(() => {
        splash.style.display = "none";
        showPage("home-page");

        // یادآوری‌های موعدرسیده
        const data = getData();
        const due = (data.reminders || []).filter(r => r.date <= todayStr());
        if (due.length > 0) {
          setTimeout(() => {
            alert(`شما ${due.length} یادآوری موعدرسیده دارید.\nبه بخش «یادآوری» سر بزنید.`);
          }, 400);
        }
      }, 600);
    } else {
      showPage("home-page");
    }
  }, 4000);
});
