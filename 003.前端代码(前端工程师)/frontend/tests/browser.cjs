const { chromium } = require("playwright");
const fs = require("fs"),
  http = require("http"),
  path = require("path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const artifacts = path.join(__dirname, "artifacts");
fs.mkdirSync(artifacts, { recursive: true });
(async () => {
  const results = [];
  const check = (name, condition) => {
    assert.ok(condition, name);
    results.push(name);
    console.log("PASS", name);
  };
  const server = http
    .createServer((req, res) => {
      try {
        const p = path.join(root, decodeURIComponent(req.url.split("?")[0])),
          ext = path.extname(p);
        res.setHeader(
          "Content-Type",
          {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
          }[ext] || "application/octet-stream",
        );
        res.end(fs.readFileSync(p));
      } catch {
        res.writeHead(404);
        res.end("missing");
      }
    })
    .listen(8788, "127.0.0.1");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--no-proxy-server"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      acceptDownloads: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const goto = async (name) => {
      await page.goto("http://127.0.0.1:8788/" + name + ".html");
      await page.waitForFunction(
        () =>
          document.querySelector("#app") &&
          !document.querySelector("#app").textContent.includes("正在读取"),
      );
    };
    const read = () =>
      page.evaluate(
        async () => await (await import("/assets/store.js")).readDB(),
      );
    await goto("dashboard");
    check("首次空账本且无虚假记录", (await read()).records.length === 0);
    const state = await page.evaluate(async () => {
      const s = await import("/assets/store.js");
      return { today: s.today(), month: s.today().slice(0, 7) };
    });
    async function add(type, amount, cat, note) {
      await goto("entry");
      await page.locator("input[name=type][value=" + type + "]").check();
      await page.locator("#amount").fill(amount);
      await page.locator('[data-category="' + cat + '"]').click();
      await page.locator("#note").fill(note);
      await page
        .getByRole("button", { name: "保存这笔账", exact: true })
        .click();
      await page.waitForURL("**/dashboard.html");
    }
    await add("expense", "25.50", "food", "测试午餐");
    check(
      "新增25.50元支出以整数分保存",
      (await read()).records[0].amountFen === 2550,
    );
    check(
      "首页支出更新",
      (await page.locator(".cards .card").first().textContent()).includes(
        "¥25.50",
      ),
    );
    await goto("settings");
    await page.locator("#budget").fill("100");
    await page.getByRole("button", { name: "保存预算", exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector("#status").textContent.includes("预算已保存"),
    );
    check(
      "预算剩余74.50",
      (await page.locator("#app").textContent()).includes("¥74.50"),
    );
    await add("income", "5000", "salary", "测试工资");
    await goto("settings");
    check(
      "收入不抵扣支出预算",
      (await page.locator("#app").textContent()).includes("¥74.50"),
    );
    await page.reload();
    await page.waitForSelector("#budget");
    check(
      "刷新保留记录和预算",
      (await read()).records.length === 2 &&
        (await read()).budgets.length === 1,
    );
    await goto("transactions");
    await page.getByRole("link", { name: "编辑测试午餐", exact: true }).click();
    await page.waitForSelector("#amount");
    await page.locator("#amount").fill("20.00");
    await page.getByRole("button", { name: "保存修改", exact: true }).click();
    await page.waitForURL("**/transactions.html");
    check(
      "编辑后金额更新",
      (await read()).records.find((r) => r.note === "测试午餐").amountFen ===
        2000,
    );
    await page.locator("#filter-type").selectOption("income");
    check("类型筛选", (await page.locator(".record").count()) === 1);
    await page.locator("#search").fill("不存在");
    check(
      "无匹配结果提示",
      (await page.locator("#app").textContent()).includes("没有匹配的记录"),
    );
    await page.getByRole("button", { name: "清除筛选", exact: true }).click();
    check("清除筛选恢复两笔", (await page.locator(".record").count()) === 2);
    // Filtered CSV download and backup.
    await page.locator("#filter-type").selectOption("income");
    let dl = page.waitForEvent("download");
    await page.locator("#csv").click();
    let file = await dl;
    const csvText = fs.readFileSync(await file.path(), "utf8");
    check(
      "CSV只导出当前筛选",
      csvText.includes("测试工资") && !csvText.includes("测试午餐"),
    );
    await page.locator("#backup").click({ trial: true });
    dl = page.waitForEvent("download");
    await page.locator("#backup").click();
    file = await dl;
    const backup = JSON.parse(fs.readFileSync(await file.path(), "utf8"));
    check(
      "完整JSON包含记录预算分类",
      backup.records.length === 2 &&
        backup.budgets.length === 1 &&
        backup.categories.length === 11,
    );
    await goto("entry");
    await page.locator("[data-category=food]").click();
    for (const value of ["0", "-1", "1.234"]) {
      await page.locator("#amount").fill(value);
      await page
        .getByRole("button", { name: "保存这笔账", exact: true })
        .click();
      check(
        "拒绝非法金额 " + value,
        !!(await page.locator("#amount-error").textContent()),
      );
    }
    await page.locator("#amount").fill("1");
    await page.locator("#date").fill("2099-01-01");
    await page.getByRole("button", { name: "保存这笔账", exact: true }).click();
    check("拒绝未来日期", !!(await page.locator("#date-error").textContent()));
    // Switch income/expense clears category but retains amount/note.
    await page.locator("#note").fill("保留备注");
    await page.locator("input[value=income]").check();
    check(
      "切换类型清空分类保留输入",
      (await page.locator("[name=categoryId]").inputValue()) === "" &&
        (await page.locator("#amount").inputValue()) === "1" &&
        (await page.locator("#note").inputValue()) === "保留备注",
    );
    let prompted = false;
    page.once("dialog", async (d) => {
      prompted = true;
      await d.dismiss();
    });
    await page.locator('aside a[href="dashboard.html"]').first().click();
    check(
      "离开未保存表单提示且可取消",
      prompted && page.url().includes("entry.html"),
    );
    page.once("dialog", (d) => d.accept());
    await page.locator('aside a[href="transactions.html"]').click();
    await page.waitForURL("**/transactions.html");
    await page
      .getByRole("button", { name: "删除", exact: true })
      .first()
      .click();
    await page.locator("dialog [data-cancel]").click();
    check("取消删除保留记录", (await read()).records.length === 2);
    await page
      .getByRole("button", { name: "删除", exact: true })
      .first()
      .click();
    await page.locator("dialog [data-confirm]").click();
    await page.waitForSelector("dialog", { state: "detached" });
    check(
      "确认删除仅移除记录并保留预算",
      (await read()).records.length === 1 &&
        (await read()).budgets.length === 1,
    );
    await goto("settings");
    await page
      .locator("#import")
      .setInputFiles({
        name: "bad.json",
        mimeType: "application/json",
        buffer: Buffer.from("{broken"),
      });
    await page.waitForFunction(() =>
      document.querySelector("#import-error").textContent.includes("未导入"),
    );
    check(
      "损坏备份不修改账本",
      (await page.locator("#import-error").textContent()).includes("未导入") &&
        (await read()).records.length === 1,
    );
    await page
      .locator("#import")
      .setInputFiles({
        name: "backup.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(backup)),
      });
    await page.waitForSelector("dialog");
    check(
      "导入前展示摘要",
      (await page.locator("dialog").textContent()).includes("2 笔记录"),
    );
    await page.locator("dialog [data-cancel]").click();
    check("取消导入保持原数据", (await read()).records.length === 1);
    await page
      .locator("#import")
      .setInputFiles({
        name: "backup.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(backup)),
      });
    await page.locator("dialog [data-confirm]").click();
    await page.waitForSelector("dialog", { state: "detached" });
    check("合法备份整库恢复", (await read()).records.length === 2);
    // IndexedDB write failure: abort actual transaction, verify form inputs remain.
    await goto("entry");
    await page.locator("#amount").fill("8.80");
    await page.locator("[data-category=food]").click();
    await page.locator("#note").fill("失败保留");
    await page.evaluate(() => {
      window.originalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function () {
        const q = window.originalPut.apply(this, arguments);
        this.transaction.abort();
        return q;
      };
    });
    await page.getByRole("button", { name: "保存这笔账", exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector("#save-error").textContent.includes("尚未保存"),
    );
    check(
      "写入失败保留输入且不误报成功",
      (await page.locator("#amount").inputValue()) === "8.80" &&
        (await read()).records.length === 2,
    );
    await page.evaluate(
      () => (IDBObjectStore.prototype.put = window.originalPut),
    );
    page.once("dialog", (d) => d.accept());
    await page.locator('aside a[href="dashboard.html"]').first().click();
    await page.waitForURL("**/dashboard.html");
    for (const [route, title] of [
      ["transactions", "收支明细台账"],
      ["analytics", "统计与分析"],
      ["settings", "系统设置"],
      ["entry", "记一笔账"],
      ["dashboard", "财务看板"],
    ]) {
      await page.locator('aside nav a[href^="' + route + '.html"]').click();
      await page.waitForFunction(
        (t) => document.querySelector("#app")?.textContent.includes(t),
        title,
      );
      check("导航到" + route, page.url().includes(route + ".html"));
    }
    await goto("login");
    await page.getByRole("link", { name: "进入本地账本 →" }).click();
    await page.waitForURL("**/dashboard.html");
    check("欢迎页进入账本", true);
    await page.setViewportSize({ width: 360, height: 800 });
    for (const route of [
      "dashboard",
      "transactions",
      "analytics",
      "entry",
      "settings",
      "login",
    ]) {
      await goto(route);
      check(
        "360px无横向溢出 " + route,
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: path.join(artifacts, route + "-mobile.png"),
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await goto("settings");
    await page.screenshot({
      path: path.join(artifacts, "settings-desktop.png"),
      fullPage: true,
    });
    await goto("dashboard");
    await page.screenshot({
      path: path.join(artifacts, "dashboard-desktop.png"),
      fullPage: true,
    });
    // Model validation, XSS-safe rendering, CSV injection, and 10,000-record measurement.
    const model = await page.evaluate(async () => {
      const s = await import("/assets/store.js");
      const d = await s.readDB();
      let rejects = 0;
      for (const change of [
        (x) => x.records.push({ ...x.records[0] }),
        (x) => (x.records[0].occurredDate = "2026-02-30"),
        (x) => (x.records[0].amountFen = 0),
        (x) => (x.schemaVersion = 2),
      ]) {
        const x = structuredClone(d);
        change(x);
        try {
          s.validateBackup(x);
        } catch {
          rejects++;
        }
      }
      const safe = s.csv(
        [
          {
            occurredDate: s.today(),
            type: "expense",
            categoryId: "food",
            amountFen: 100,
            note: '=SUM(1,2)\n"test"',
          },
        ],
        d.categories,
      );
      return { rejects, safe };
    });
    check("拒绝重复ID无效日期金额和版本", model.rejects === 4);
    check(
      "CSV公式与引号换行转义",
      model.safe.includes("'=SUM") && model.safe.includes('""test""'),
    );
    await page.evaluate(async () => {
      const s = await import("/assets/store.js");
      const d = await s.readDB();
      d.records = Array.from({ length: 10000 }, (_, i) => ({
        id: "perf-" + i,
        type: "expense",
        amountFen: 100,
        categoryId: "food",
        occurredDate: s.today(),
        note:
          i === 0
            ? '<img src=x onerror="window.injected=true">'
            : "性能记录" + i,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      await s.writeDB(d);
    });
    let start = Date.now();
    await goto("dashboard");
    const homeMs = Date.now() - start;
    start = Date.now();
    await goto("transactions");
    const detailMs = Date.now() - start;
    check(
      "10000笔明细分批渲染",
      (await page.locator(".record").count()) === 50,
    );
    check(
      "备注按纯文本呈现",
      !(await page.evaluate(() => window.injected)) &&
        (await page.locator(".record img").count()) === 0,
    );
    start = Date.now();
    await page.locator("#search").fill("性能记录99");
    const filterMs = Date.now() - start;
    console.log("PERFORMANCE", JSON.stringify({ homeMs, detailMs, filterMs }));
    check("浏览器无未捕获错误", errors.length === 0);
    fs.writeFileSync(
      path.join(artifacts, "results.json"),
      JSON.stringify({ results, homeMs, detailMs, filterMs, errors }, null, 2),
    );
    console.log("ALL", results.length);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
