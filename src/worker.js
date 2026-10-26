/*
  教師課堂管理整合工具 — Cloudflare 後端（cloudflareV1）

  網頁檔案（public/）由 Cloudflare 直接提供，這支程式只處理 /api/ 開頭的請求。
  資料存在 Durable Object 內建的 SQLite 資料庫，每個 localStorage 鍵值一列。

  權限：不帶密碼只能讀取（檢視模式）；寫入必須帶正確密碼（編輯模式）。
  密碼放在 X-Pass 標頭 = encodeURIComponent(管理密碼)；第一次使用的密碼即成為管理密碼。
    GET  /api/data?since=版本號   只回傳該版本之後有變動的資料（since=0 時回傳全部）
         → { rev, full, data: {鍵: 值}, del: [已刪除的鍵], editable, hasPass }
         有帶密碼但密碼錯誤 → 401
    POST /api/data  { set: {鍵: 值}, del: [鍵] }   只寫入有變動的鍵（需要密碼）
         → { prev, rev }
*/
import { DurableObject } from "cloudflare:workers";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      // 全部資料集中在同一個資料庫實體
      return env.CLASSDB.get(env.CLASSDB.idFromName("main")).fetch(request);
    }
    return new Response("Not found", { status: 404 });
  },
};

export class ClassDB extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    // rev：每次寫入的版本號；v 為 NULL 代表該鍵已刪除（讓其他裝置知道要刪除）
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT, rev INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS kv_rev ON kv (rev);
      CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
    `);
    // 密碼雜湊只讀一次後放在記憶體，減少資料庫讀取（null = 尚未設定密碼）
    const row = this.sql.exec("SELECT v FROM meta WHERE k = 'pass'").toArray()[0];
    this.passHash = row ? row.v : null;
  }

  async fetch(request) {
    try {
      const header = request.headers.get("X-Pass");
      const url = new URL(request.url);
      if (url.pathname === "/api/data" && request.method === "GET") {
        // 沒帶密碼 = 檢視模式，只能讀取
        if (header) await this.checkPass(header);
        const result = this.load(Number(url.searchParams.get("since")) || 0);
        result.editable = !!header;
        result.hasPass = this.passHash !== null;
        return json(result);
      }
      if (url.pathname === "/api/data" && request.method === "POST") {
        await this.checkPass(header);
        return json(this.save(await request.json()));
      }
      return json({ error: "Not found" }, 404);
    } catch (e) {
      return json({ error: e.message }, e.status || 500);
    }
  }

  async checkPass(header) {
    const pass = header ? decodeURIComponent(header) : "";
    if (!pass) throw httpErr(401, "檢視模式無法修改資料，請先輸入密碼");
    const hash = await sha256(pass);
    if (this.passHash === null) {
      this.sql.exec("INSERT INTO meta (k, v) VALUES ('pass', ?)", hash);
      this.passHash = hash;
    } else if (this.passHash !== hash) {
      throw httpErr(401, "管理密碼錯誤");
    }
  }

  currentRev() {
    return this.sql.exec("SELECT MAX(rev) AS r FROM kv").one().r || 0;
  }

  load(since) {
    const rev = this.currentRev();
    // since 比資料庫版本還新（例如資料庫被重建）時，改為回傳全部資料
    const full = since <= 0 || since > rev;
    const rows = full
      ? this.sql.exec("SELECT k, v FROM kv WHERE v IS NOT NULL").toArray()
      : this.sql.exec("SELECT k, v FROM kv WHERE rev > ?", since).toArray();
    const data = {};
    const del = [];
    for (const r of rows) {
      if (r.v === null) del.push(r.k);
      else data[r.k] = r.v;
    }
    return { rev, full, data, del };
  }

  save(body) {
    const set = Object.entries(body.set || {});
    const del = body.del || [];
    const prev = this.currentRev();
    if (set.length === 0 && del.length === 0) return { prev, rev: prev };
    const rev = prev + 1;
    this.ctx.storage.transactionSync(() => {
      for (const [k, v] of set) {
        this.sql.exec(
          "INSERT INTO kv (k, v, rev) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, rev = excluded.rev",
          k, String(v), rev
        );
      }
      for (const k of del) {
        this.sql.exec("UPDATE kv SET v = NULL, rev = ? WHERE k = ?", rev, k);
      }
    });
    return { prev, rev };
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
