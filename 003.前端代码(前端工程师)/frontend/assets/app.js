import {
  today,
  money,
  parseAmount,
  validDate,
  totals,
  filtered,
  csv,
  openDB,
  readDB,
  writeDB,
  validateBackup,
} from "./store.js";
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const page = document.body.dataset.page,
  params = new URLSearchParams(location.search),
  currentMonth = today().slice(0, 7);
let month =
  params.get("month") || sessionStorage.getItem("ledger-month") || currentMonth;
if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) month = currentMonth;
let data,
  dirty = false,
  busy = false,
  limit = 50,
  filter = { type: "", category: "", search: "" };
const routes = [
  ["dashboard", "首页概览", "▦"],
  ["transactions", "收支明细", "▤"],
  ["analytics", "统计与分析", "◔"],
  ["entry", "记一笔", "✎"],
  ["settings", "系统设置", "☷"],
];
const link = (p, query = "") => `${p}.html${query ? "?" + query : ""}`;
const entryLink = (id) =>
  link(
    "entry",
    new URLSearchParams({
      ...(id ? { id } : {}),
      from: ["dashboard", "transactions", "analytics", "settings"].includes(
        page,
      )
        ? page
        : "dashboard",
      month,
    }),
  );
function notify(s) {
  $("#status").textContent = s;
  setTimeout(() => {
    $("#status").textContent = "";
  }, 4500);
}
function nav(mobile = false) {
  return routes
    .map(
      ([id, title, icon]) =>
        `<a href="${id === "entry" ? entryLink() : link(id)}" ${page === id ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span><span>${mobile ? { dashboard: "首页", transactions: "明细", analytics: "统计", entry: "记一笔", settings: "设置" }[id] : title}</span></a>`,
    )
    .join("");
}
function shell() {
  if (page === "login") {
    $("#shell").innerHTML =
      '<main class="login" id="app" style="margin:50px auto"></main>';
    return;
  }
  $("#shell").innerHTML =
    `<aside><a href="dashboard.html" class="brand"><span class="logo">♧</span><span>萌萌记账<small>Cute Pastel Ledger</small></span></a><div class="aside-card">🌸 今天也记一笔吧<br><small>给生活留下温柔痕迹</small></div><nav aria-label="主要导航">${nav()}</nav><div class="aside-card aside-bottom">♡ 心愿储蓄罐<p>每一笔记录，都是认真生活的印记。</p></div></aside><header><div class="row"><label for="month" class="muted">月份</label><input type="month" id="month" value="${month}"></div><div class="row"><a class="primary button" href="${entryLink()}">＋ 记一笔</a><a class="user" href="login.html">本地账本 ♡</a></div></header><main id="app" tabindex="-1"><p>正在读取本地账本…</p></main><nav class="mobile-nav" aria-label="手机导航">${nav(true)}</nav>`;
  $("#month").onchange = (e) => {
    if (!e.target.value) return;
    if (dirty && !confirm("表单尚未保存，切换月份将丢失输入。继续吗？")) {
      e.target.value = month;
      return;
    }
    dirty = false;
    month = e.target.value;
    sessionStorage.setItem("ledger-month", month);
    limit = 50;
    render();
  };
}
let monthCache, monthCacheData, monthCacheKey;
function monthRecords() {
  if (monthCacheData !== data || monthCacheKey !== month) {
    monthCache = filtered(data.records, { month });
    monthCacheData = data;
    monthCacheKey = month;
  }
  return monthCache;
}
const records = monthRecords,
  category = (id) => data.categories.find((c) => c.id === id),
  blank = () =>
    '<div class="empty"><b>🌸 还没有记录</b>今天也记一笔吧<br><a class="button" href="' +
    entryLink() +
    '">＋ 记一笔</a></div>';
function hero(title, subtitle) {
  return `<section class="hero"><div><h1>${title}</h1><p>${subtitle}</p></div><span class="tag">温柔记录 · 本地保存</span></section>`;
}
function budget() {
  const b = data.budgets.find((b) => b.month === month),
    n = totals(records()).expense;
  if (!b)
    return '<p>尚未设置本月预算</p><a class="button" href="settings.html">设置本月预算</a>';
  const pct = (n / b.amountFen) * 100;
  return `<div>${n > b.amountFen ? "本月已超出预算" : "剩余预算"} <b>${money(Math.abs(b.amountFen - n))}</b></div><div class="progress"><span style="width:${Math.min(100, pct)}%"></span></div><small>预算 ${money(b.amountFen)} · 已使用 ${pct.toFixed(1)}%</small>${pct >= 100 ? '<p class="error">' + (n === b.amountFen ? "预算已用完" : "本月已超出预算 " + money(n - b.amountFen)) + "</p>" : pct >= 80 ? '<p class="error">预算已使用 80% 以上</p>' : ""}`;
}
function metrics() {
  const t = totals(records()),
    daily = totals(
      data.records.filter((r) => r.occurredDate === today()),
    ).expense;
  return `<div class="cards"><section class="card"><small>本月总支出</small><strong class="amount">${money(t.expense)}</strong><small>${records().filter((r) => r.type === "expense").length} 笔支出</small></section><section class="card"><small>本月总收入</small><strong class="amount income">${money(t.income)}</strong><small>收入与支出分开统计</small></section><section class="card"><small>本月收支差额</small><strong class="amount" style="color:#4a2938">${money(t.income - t.expense)}</strong><small>收入减支出</small></section><section class="card"><small>今日支出 · ${today()}</small><strong class="amount">${money(daily)}</strong><small>按本地当天计算</small></section></div>`;
}
function recordList(rs, actions = false) {
  return rs.length
    ? rs
        .map(
          (r) =>
            `<article class="record"><span class="icon" aria-hidden="true">${esc(category(r.categoryId)?.icon || "🌸")}</span><div class="detail"><a href="${entryLink(r.id)}">${esc(r.note || category(r.categoryId)?.name)}</a><small>${esc(r.occurredDate)} · ${r.type === "expense" ? "支出" : "收入"} · ${esc(category(r.categoryId)?.name)}</small></div><strong class="${r.type === "income" ? "income" : ""}">${r.type === "expense" ? "−" : "＋"}${money(r.amountFen)}</strong>${actions ? `<div class="actions"><a class="button" aria-label="编辑${esc(r.note || category(r.categoryId)?.name)}" href="${entryLink(r.id)}">编辑</a><button class="danger" data-delete="${esc(r.id)}">删除</button></div>` : ""}</article>`,
        )
        .join("")
    : blank();
}
function breakdown(type = "expense") {
  const rs = records().filter((r) => r.type === type),
    total = totals(rs)[type],
    groups = data.categories
      .filter((c) => c.type === type)
      .map((c) => ({
        ...c,
        value: rs
          .filter((r) => r.categoryId === c.id)
          .reduce((s, r) => s + r.amountFen, 0),
      }))
      .filter((c) => c.value)
      .sort((a, b) => b.value - a.value);
  return groups.length
    ? groups
        .map(
          (c) =>
            `<div class="chart-row"><div class="row"><span>${esc(c.icon || "🌸")} ${esc(c.name)}</span><b>${money(c.value)} · ${((c.value / total) * 100).toFixed(1)}%</b></div><div class="progress"><span style="width:${(c.value / total) * 100}%"></span></div></div>`,
        )
        .join("")
    : '<p class="empty">本月暂无' +
        (type === "expense" ? "支出" : "收入") +
        "，记录后显示分类占比。</p>";
}
function trend() {
  const days = new Date(
      Number(month.slice(0, 4)),
      Number(month.slice(5)),
      0,
    ).getDate(),
    values = Array.from({ length: days }, (_, i) => ({
      date: month + "-" + String(i + 1).padStart(2, "0"),
      value: 0,
    }));
  for (const r of records())
    if (r.type === "expense")
      values[Number(r.occurredDate.slice(-2)) - 1].value += r.amountFen;
  const max = Math.max(1, ...values.map((x) => x.value));
  return `${values.every((v) => !v.value) ? '<p class="muted">本月暂无支出，记账后显示每日趋势。</p>' : ""}<div class="bars" role="img" aria-label="${month} 每日支出柱状图，下方提供文字金额">${values.map((v) => `<span title="${v.date} ${money(v.value)}" style="height:${(v.value / max) * 100}%"></span>`).join("")}</div><div class="row between"><small>${month}-01</small><small>${month}-${days}</small></div><details><summary>查看每日支出金额</summary><div class="trend-table"><table><thead><tr><th>日期</th><th>支出</th></tr></thead><tbody>${values.map((v) => `<tr><td>${v.date}</td><td>${money(v.value)}</td></tr>`).join("")}</tbody></table></div></details>`;
}
function form(r) {
  return `<form id="entry-form" novalidate class="stack"><div class="segmented"><label><input type="radio" name="type" value="expense" ${!r || r.type === "expense" ? "checked" : ""}>支出</label><label><input type="radio" name="type" value="income" ${r?.type === "income" ? "checked" : ""}>收入</label></div><div><label for="amount">金额（元）*</label><input id="amount" name="amount" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${r ? (r.amountFen / 100).toFixed(2) : ""}" aria-describedby="amount-error"><span id="amount-error" class="error"></span></div><div><label>选择分类 *</label><div class="category-grid" id="category-grid"></div><input type="hidden" name="categoryId" value="${esc(r?.categoryId || "")}"><span id="category-error" class="error"></span></div><div><label for="date">发生日期 *</label><input id="date" name="occurredDate" type="date" max="${today()}" value="${r?.occurredDate || today()}" aria-describedby="date-error"><span id="date-error" class="error"></span></div><div><label for="note">备注（选填，最多 200 字）</label><textarea id="note" name="note" maxlength="200">${esc(r?.note || "")}</textarea><small id="note-count">${r?.note?.length || 0} / 200</small><span id="note-error" class="error"></span></div><span id="save-error" class="error" role="alert"></span><div class="row"><button type="reset">重置</button><button class="primary" type="submit">${r ? "保存修改" : "保存这笔账"}</button>${!r && page === "entry" ? '<button type="submit" name="next" value="yes">保存并记下一笔</button>' : ""}<a href="${returnURL()}">取消</a></div></form>`;
}
function returnURL() {
  const from = params.get("from");
  return link(
    ["dashboard", "transactions", "analytics", "settings"].includes(from)
      ? from
      : "dashboard",
  );
}
function bindForm(r) {
  const f = $("#entry-form");
  if (!f) return;
  function paint() {
    const type = f.elements.type.value;
    $("#category-grid").innerHTML = data.categories
      .filter((c) => c.type === type)
      .map(
        (c) =>
          `<button type="button" data-category="${esc(c.id)}" aria-pressed="${f.elements.categoryId.value === c.id}"><span>${esc(c.icon || "🌸")}</span>${esc(c.name)}</button>`,
      )
      .join("");
    $("#category-grid").onclick = (e) => {
      const b = e.target.closest("[data-category]");
      if (b) {
        f.elements.categoryId.value = b.dataset.category;
        dirty = true;
        paint();
      }
    };
  }
  paint();
  f.oninput = () => {
    dirty = true;
    $("#note-count").textContent = f.elements.note.value.length + " / 200";
  };
  f.elements.type.forEach(
    (input) =>
      (input.onchange = () => {
        f.elements.categoryId.value = "";
        paint();
      }),
  );
  f.onreset = (e) => {
    e.preventDefault();
    if (dirty && !confirm("重置将清除尚未保存的输入，继续吗？")) return;
    dirty = false;
    render();
  };
  f.onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    f.querySelectorAll(".error").forEach((x) => (x.textContent = ""));
    let amountFen,
      ok = true;
    try {
      amountFen = parseAmount(f.elements.amount.value);
    } catch (err) {
      $("#amount-error").textContent = err.message;
      ok = false;
    }
    if (!validDate(f.elements.occurredDate.value)) {
      $("#date-error").textContent = "请选择有效日期，不能晚于今天";
      ok = false;
    }
    const c = category(f.elements.categoryId.value);
    if (!c || c.type !== f.elements.type.value) {
      $("#category-error").textContent = "请选择当前类型的分类";
      ok = false;
    }
    if (f.elements.note.value.length > 200) {
      $("#note-error").textContent = "备注不能超过 200 字";
      ok = false;
    }
    if (!ok) {
      f.querySelector(".error:not(:empty)").previousElementSibling?.focus();
      return;
    }
    const stamp = new Date().toISOString(),
      item = {
        id: r?.id || crypto.randomUUID(),
        type: f.elements.type.value,
        amountFen,
        categoryId: c.id,
        occurredDate: f.elements.occurredDate.value,
        note: f.elements.note.value,
        createdAt: r?.createdAt || stamp,
        updatedAt: stamp,
      };
    busy = true;
    f.querySelectorAll("button").forEach((b) => (b.disabled = true));
    try {
      const latest = await readDB();
      if (r && !latest.records.some((x) => x.id === r.id))
        throw Error("该记录已被其他页面删除，请重新打开");
      const next = {
        ...latest,
        records: [...latest.records.filter((x) => x.id !== item.id), item],
      };
      await writeDB(next);
      data = next;
      dirty = false;
      notify("已记账");
      if (e.submitter?.name === "next") {
        busy = false;
        render();
        $("#amount").focus();
      } else if (page === "entry") {
        sessionStorage.setItem("ledger-toast", "已记账");
        location.href = returnURL();
      } else {
        busy = false;
        render();
      }
    } catch (err) {
      $("#save-error").textContent = "尚未保存：" + err.message;
    } finally {
      busy = false;
      f.querySelectorAll("button").forEach((b) => (b.disabled = false));
    }
  };
}
function transactions() {
  const rs = filtered(data.records, { month, ...filter }),
    groups = new Map();
  for (const r of rs.slice(0, limit)) {
    if (!groups.has(r.occurredDate)) groups.set(r.occurredDate, []);
    groups.get(r.occurredDate).push(r);
  }
  return (
    hero("收支明细台账", "按日期查看生活的每一笔收支") +
    metrics() +
    `<section class="card"><div class="row between"><h2>筛选记录</h2><div class="row"><button id="csv">导出 CSV</button><button id="backup">JSON 备份</button></div></div><div class="filters"><div><label for="filter-type">类型</label><select id="filter-type"><option value="">全部收支</option><option value="expense" ${filter.type === "expense" ? "selected" : ""}>仅支出</option><option value="income" ${filter.type === "income" ? "selected" : ""}>仅收入</option></select></div><div><label for="filter-category">分类</label><select id="filter-category"><option value="">全部分类</option>${data.categories
      .filter((c) => !filter.type || c.type === filter.type)
      .map(
        (c) =>
          `<option value="${esc(c.id)}" ${filter.category === c.id ? "selected" : ""}>${c.type === "expense" ? "支出" : "收入"} · ${esc(c.name)}</option>`,
      )
      .join(
        "",
      )}</select></div><div><label for="search">搜索备注</label><input id="search" value="${esc(filter.search)}" placeholder="输入备注关键词"></div></div><button id="clear-filter">清除筛选</button><p class="muted">共 ${rs.length} 笔 · 支出 ${money(totals(rs).expense)} · 收入 ${money(totals(rs).income)}</p>${
      rs.length
        ? [...groups]
            .map(([date, items]) => {
              const sums = totals(rs.filter((r) => r.occurredDate === date));
              return `<h3>${date} <small>支出 ${money(sums.expense)} · 收入 ${money(sums.income)}</small></h3>${recordList(items, true)}`;
            })
            .join("")
        : '<div class="empty"><b>没有匹配的记录</b>试试清除筛选，或记下第一笔。</div>'
    }${rs.length > limit ? '<button id="more" class="wide">加载更多</button>' : ""}</section>`
  );
}
function settings() {
  const b = data.budgets.find((x) => x.month === month);
  return (
    hero("系统设置", "预算与数据，都由你来管理") +
    `<div class="columns"><div><section class="card"><h2>${month} 月度预算</h2><form id="budget-form" novalidate><label for="budget">总支出预算（元）</label><input id="budget" inputmode="decimal" placeholder="例如 5000.00" value="${b ? (b.amountFen / 100).toFixed(2) : ""}"><span class="error" id="budget-error" role="alert"></span><p class="muted">所有支出均计入预算；收入不抵扣支出。</p><div class="row"><button class="primary" type="submit">保存预算</button>${b ? '<button id="cancel-budget" type="button">取消本月预算</button>' : ""}</div></form><div class="field">${budget()}</div></section><section class="card"><h2>分类</h2><p class="muted">首版使用以下固定分类。</p>${[
      "expense",
      "income",
    ]
      .map(
        (type) =>
          `<h3>${type === "expense" ? "支出" : "收入"}</h3><div class="row">${data.categories
            .filter((c) => c.type === type)
            .map(
              (c) =>
                `<span class="tag">${esc(c.icon || "🌸")} ${esc(c.name)}</span>`,
            )
            .join("")}</div>`,
      )
      .join(
        "",
      )}</section></div><div><section class="card"><h2>数据备份与恢复</h2><p>当前共有 <b>${data.records.length}</b> 笔记录、${data.budgets.length} 个月预算。</p><div class="stack"><button id="backup" class="primary">导出完整 JSON 备份</button><a class="button" href="transactions.html">前往明细筛选并导出 CSV</a><div><label for="import">从 JSON 备份恢复</label><input id="import" type="file" accept=".json,application/json"></div><span class="error" id="import-error" role="alert"></span></div><p class="footer-note">导入会完整替换当前账本。确认前可先下载当前数据备份；取消不会修改数据。</p></section><section class="card" id="privacy"><h2>本地存储与隐私</h2><p class="notice">财务数据保存在当前浏览器的 IndexedDB 中，不上传服务器。清除浏览器数据、更换浏览器或访问地址可能使你无法找回账本，请定期备份。</p><p class="footer-note">本地存储不是加密保险箱。首版无需注册，尚未提供密码保护、账户登录或云同步。</p><a class="button" href="login.html">返回欢迎页</a></section></div></div>`
  );
}
function render() {
  document.title =
    {
      dashboard: "首页概览",
      transactions: "收支明细",
      analytics: "统计与分析",
      entry: "记一笔",
      settings: "系统设置",
      login: "欢迎使用",
    }[page] + " · 萌萌记账";
  const app = $("#app");
  if (page === "dashboard")
    app.innerHTML =
      hero(month + " 财务看板", "今天也记一笔吧 🌸 给生活留下温柔痕迹") +
      metrics() +
      `<div class="columns"><div><section class="card"><div class="row between"><h2>最近明细动态</h2><a href="transactions.html">查看完整明细 →</a></div><small>所选月份最近五笔记录</small>${recordList(records().slice(0, 5))}</section><section class="card"><h2>本月每日开支走势</h2>${trend()}</section></div><div><section class="card"><h2>✎ 桌面快捷记账</h2>${form()}</section><section class="card"><h2>月度预算执行</h2>${budget()}<p><a href="settings.html">调整预算 →</a></p></section><section class="card"><h2>分类支出占比</h2>${breakdown()}</section><section class="card"><h2>数据安全与本地状态</h2><p class="muted">IndexedDB 本地保存，请定期备份。</p><button id="backup">导出 JSON</button> <a href="transactions.html">导出 CSV →</a></section></div></div>`;
  if (page === "transactions") app.innerHTML = transactions();
  if (page === "analytics")
    app.innerHTML =
      hero(month + " 统计与分析", "看看这个月的钱花在哪里") +
      metrics() +
      `<div class="columns"><div><section class="card"><h2>每日支出趋势</h2>${trend()}</section><section class="card"><h2>本月独立收入</h2>${breakdown("income")}</section></div><div><section class="card"><h2>分类支出占比排行榜</h2>${breakdown()}</section><section class="card"><h2>预算执行</h2>${budget()}<p><a href="settings.html">管理预算 →</a></p></section></div></div>`;
  if (page === "entry") {
    const r = params.get("id")
      ? data.records.find((r) => r.id === params.get("id"))
      : null;
    app.innerHTML =
      hero(
        r ? "编辑记录" : "记一笔账",
        "每一笔日常小开销，都是好好生活的真实印记～",
      ) +
      `<section class="card form-page">${params.get("id") && !r ? '<p>该记录不存在或已被删除。</p><a href="transactions.html">返回明细</a>' : form(r)}<p class="footer-note">记录保存在本地浏览器中，可随时在设置中备份。</p></section>`;
    bindForm(r);
  } else bindForm();
  if (page === "settings") app.innerHTML = settings();
  if (page === "login")
    app.innerHTML = `<div class="brand"><span class="logo">♧</span><span>萌萌记账<small>Cute Pastel Ledger</small></span></div><section class="card"><span class="tag">本地账本 · 无需注册</span><div class="empty"><b>🌷 欢迎回来</b><h1>认真生活，温柔记账</h1></div><p>记录每天的收支，慢慢靠近自己的小目标。</p><a class="button primary" href="dashboard.html">进入本地账本 →</a><a class="button" href="settings.html">从 JSON 备份恢复</a><p class="footer-note">账本保存在当前浏览器中，不提供密码保护或云同步。首次使用为空账本；已有记录会继续保留。</p><a href="settings.html#privacy">了解本地存储与隐私 →</a></section>`;
  bindActions();
}
function download(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function backup() {
  download(
    JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2),
    "萌萌记账-" + today() + ".json",
    "application/json",
  );
}
function modal(title, body, onConfirm, extra = "") {
  const d = document.createElement("dialog");
  d.innerHTML = `<h2>${esc(title)}</h2><div>${body}</div><p class="error" role="alert"></p><div class="row">${extra}<button data-cancel>取消</button><button class="primary" data-confirm>确认</button></div>`;
  document.body.append(d);
  d.querySelector("[data-cancel]").onclick = () => d.close();
  d.onclose = () => d.remove();
  d.showModal();
  d.querySelector("[data-cancel]").focus();
  d.querySelector("[data-backup]")?.addEventListener("click", backup);
  d.querySelector("[data-confirm]").onclick = async () => {
    const b = d.querySelector("[data-confirm]");
    b.disabled = true;
    try {
      await onConfirm();
      d.close();
    } catch (e) {
      d.querySelector(".error").textContent =
        "操作失败，原有数据保留：" + e.message;
      b.disabled = false;
    }
  };
}
function bindActions() {
  if ($("#backup")) $("#backup").onclick = backup;
  if ($("#csv"))
    $("#csv").onclick = () =>
      download(
        csv(filtered(data.records, { month, ...filter }), data.categories),
        "收支明细-" + month + ".csv",
        "text/csv;charset=utf-8",
      );
  if (page === "transactions") {
    const update = () => {
      filter.type = $("#filter-type").value;
      filter.category = $("#filter-category").value;
      filter.search = $("#search").value;
      limit = 50;
      render();
    };
    $("#filter-type").onchange = () => {
      filter.category = "";
      $("#filter-category").value = "";
      update();
    };
    $("#filter-category").onchange = update;
    $("#search").oninput = () => {
      const pos = $("#search").selectionStart;
      update();
      $("#search").focus();
      $("#search").setSelectionRange(pos, pos);
    };
    $("#clear-filter").onclick = () => {
      filter = { type: "", category: "", search: "" };
      render();
    };
    if ($("#more"))
      $("#more").onclick = () => {
        limit += 50;
        render();
      };
    document.querySelectorAll("[data-delete]").forEach(
      (b) =>
        (b.onclick = () => {
          const id = b.dataset.delete,
            r = data.records.find((x) => x.id === id);
          modal(
            "确定删除这笔记录？",
            `<p>${esc(r.occurredDate)} · ${money(r.amountFen)} · ${esc(r.note || category(r.categoryId)?.name)}</p><p>删除后无法撤销，月度预算设置会保留。</p>`,
            async () => {
              const latest = await readDB();
              const next = {
                ...latest,
                records: latest.records.filter((x) => x.id !== id),
              };
              await writeDB(next);
              data = next;
              render();
              notify("已删除记录");
            },
          );
        }),
    );
  }
  if (page === "settings") {
    $("#budget-form").onsubmit = async (e) => {
      e.preventDefault();
      const b = e.submitter;
      b.disabled = true;
      try {
        const amountFen = parseAmount($("#budget").value),
          latest = await readDB(),
          next = {
            ...latest,
            budgets: [
              ...latest.budgets.filter((x) => x.month !== month),
              { month, amountFen, updatedAt: new Date().toISOString() },
            ],
          };
        await writeDB(next);
        data = next;
        render();
        notify("预算已保存");
      } catch (err) {
        $("#budget-error").textContent = "尚未保存：" + err.message;
      } finally {
        b.disabled = false;
      }
    };
    if ($("#cancel-budget"))
      $("#cancel-budget").onclick = () =>
        modal("取消本月预算？", "<p>记录会保留。</p>", async () => {
          const latest = await readDB(),
            next = {
              ...latest,
              budgets: latest.budgets.filter((b) => b.month !== month),
            };
          await writeDB(next);
          data = next;
          render();
          notify("本月预算已取消");
        });
    $("#import").onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      $("#import-error").textContent = "";
      try {
        if (file.size > 30000000)
          throw Error("文件超过 30 MB，请使用较小的备份");
        const incoming = validateBackup(JSON.parse(await file.text()));
        modal(
          "恢复备份并替换当前账本？",
          `<p>备份包含 ${incoming.records.length} 笔记录、${incoming.budgets.length} 个月预算、${incoming.categories.length} 个分类。</p><p>当前 ${data.records.length} 笔记录将被替换。建议先下载当前数据备份。</p>`,
          async () => {
            await writeDB(incoming);
            data = incoming;
            render();
            notify("备份恢复成功");
          },
          "<button data-backup>先备份当前账本</button>",
        );
      } catch (err) {
        $("#import-error").textContent = "未导入，原有数据保留：" + err.message;
      }
      e.target.value = "";
    };
  }
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (a && dirty && !confirm("这笔账尚未保存，离开会丢失输入。继续吗？"))
    e.preventDefault();
  else if (a) dirty = false;
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
shell();
try {
  data = await openDB();
  render();
  const message = sessionStorage.getItem("ledger-toast");
  if (message) {
    sessionStorage.removeItem("ledger-toast");
    notify(message);
  }
} catch (e) {
  $("#app").innerHTML =
    `<section class="card"><h1>无法读取本地存储</h1><p>${esc(e.message)}</p><p>账本尚未载入。请允许浏览器使用本地存储，并通过 localhost 打开后重试。</p><button onclick="location.reload()">重新加载</button></section>`;
}
