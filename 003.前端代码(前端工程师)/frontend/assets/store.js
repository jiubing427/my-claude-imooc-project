// Shared ledger model. Amounts are integer fen; dates are local calendar dates.
export const categories = [
  ["food", "expense", "餐饮", "🍜"],
  ["transport", "expense", "交通", "🚇"],
  ["shopping", "expense", "购物", "🛍"],
  ["home", "expense", "居住", "🏠"],
  ["fun", "expense", "娱乐", "🎮"],
  ["health", "expense", "医疗", "💊"],
  ["study", "expense", "学习", "📚"],
  ["expense-other", "expense", "其他", "✨"],
  ["salary", "income", "工资", "💼"],
  ["bonus", "income", "奖金", "🎁"],
  ["income-other", "income", "其他", "🌷"],
].map(([id, type, name, icon], sortOrder) => ({
  id,
  type,
  name,
  icon,
  sortOrder,
}));
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const money = (n) =>
  "¥" +
  (n / 100).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export function parseAmount(value) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(String(value)))
    throw Error("请输入大于零、最多两位小数的金额");
  const [a, b = ""] = String(value).split(".");
  const fen = Number(a) * 100 + Number(b.padEnd(2, "0"));
  if (fen < 1 || fen > 9999999999)
    throw Error("金额须在 0.01 至 99,999,999.99 元之间");
  return fen;
}
export function validDate(s) {
  if (
    typeof s !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
    s < "0001-01-01" ||
    s > today()
  )
    return false;
  const d = new Date(s + "T12:00:00");
  return (
    !isNaN(d) &&
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` ===
      s
  );
}
export function validateBackup(data) {
  if (
    !data ||
    data.schemaVersion !== 1 ||
    !Array.isArray(data.records) ||
    !Array.isArray(data.categories) ||
    !Array.isArray(data.budgets)
  )
    throw Error("备份格式或版本不兼容");
  const ids = new Set(),
    cats = new Map();
  const timestamp = (s) =>
    typeof s === "string" &&
    /(Z|[+-]\d\d:\d\d)$/.test(s) &&
    !isNaN(Date.parse(s));
  for (const c of data.categories) {
    if (
      !c ||
      typeof c.id !== "string" ||
      !c.id ||
      cats.has(c.id) ||
      !["expense", "income"].includes(c.type) ||
      typeof c.name !== "string" ||
      !c.name.trim() ||
      c.name.length > 40 ||
      !Number.isInteger(c.sortOrder)
    )
      throw Error("分类数据不合法");
    cats.set(c.id, c);
  }
  for (const r of data.records) {
    if (
      !r ||
      typeof r.id !== "string" ||
      !r.id ||
      ids.has(r.id) ||
      !Number.isSafeInteger(r.amountFen) ||
      r.amountFen < 1 ||
      r.amountFen > 9999999999 ||
      !validDate(r.occurredDate) ||
      !cats.has(r.categoryId) ||
      cats.get(r.categoryId).type !== r.type ||
      typeof r.note !== "string" ||
      r.note.length > 200 ||
      !timestamp(r.createdAt) ||
      !timestamp(r.updatedAt)
    )
      throw Error("记录包含无效金额、日期、分类或重复标识");
    ids.add(r.id);
  }
  const months = new Set();
  for (const b of data.budgets) {
    if (
      !b ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(b.month) ||
      b.month.startsWith("0000") ||
      months.has(b.month) ||
      !Number.isSafeInteger(b.amountFen) ||
      b.amountFen < 1 ||
      b.amountFen > 9999999999 ||
      !timestamp(b.updatedAt)
    )
      throw Error("预算数据不合法");
    months.add(b.month);
  }
  return {
    schemaVersion: 1,
    records: data.records.map((r) => ({ ...r })),
    categories: data.categories.map((c) => ({ ...c })),
    budgets: data.budgets.map((b) => ({ ...b })),
  };
}
export function totals(records) {
  return records.reduce(
    (s, r) => {
      s[r.type] += r.amountFen;
      return s;
    },
    { expense: 0, income: 0 },
  );
}
export function filtered(
  records,
  { month, type = "", category = "", search = "" } = {},
) {
  return records
    .filter(
      (r) =>
        (!month || r.occurredDate.startsWith(month)) &&
        (!type || r.type === type) &&
        (!category || r.categoryId === category) &&
        r.note.toLowerCase().includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        b.occurredDate.localeCompare(a.occurredDate) ||
        b.createdAt.localeCompare(a.createdAt) ||
        b.id.localeCompare(a.id),
    );
}
export function csv(records, cats) {
  const escape = (s) => {
    s = String(s);
    if (/^[\s\u0000-\u001f]*[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return (
    "\ufeff" +
    [
      ["日期", "类型", "分类", "金额", "备注"],
      ...records.map((r) => [
        r.occurredDate,
        r.type === "expense" ? "支出" : "收入",
        cats.find((c) => c.id === r.categoryId)?.name || "",
        (r.amountFen / 100).toFixed(2),
        r.note,
      ]),
    ]
      .map((row) => row.map(escape).join(","))
      .join("\r\n")
  );
}
let db;
export async function openDB() {
  db = await new Promise((resolve, reject) => {
    const q = indexedDB.open("cute-pastel-ledger", 1);
    q.onupgradeneeded = () => q.result.createObjectStore("ledger");
    q.onerror = () => reject(q.error);
    q.onblocked = () => reject(Error("请关闭其他账本标签页后重试"));
    q.onsuccess = () => resolve(q.result);
  });
  db.onversionchange = () => db.close();
  return readDB();
}
export function readDB() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("ledger");
    const q = tx.objectStore("ledger").get("data");
    q.onsuccess = () =>
      resolve(
        q.result || {
          schemaVersion: 1,
          records: [],
          categories: structuredClone(categories),
          budgets: [],
        },
      );
    q.onerror = () => reject(q.error);
  });
}
export function writeDB(data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("ledger", "readwrite");
    tx.objectStore("ledger").put(data, "data");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || Error("本地存储写入失败"));
    tx.onabort = () => reject(tx.error || Error("存储事务已取消"));
  });
}
