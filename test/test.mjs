// ชุดทดสอบของ ChordPro Maker · รันด้วย: node test/test.mjs
//
// แอปเป็นไฟล์เดียวและไม่มี export · ชุดทดสอบจึงดึง <script> ออกมา ถอดเปลือก IIFE
// แล้วเติม export ให้ตัวเอง · วิธีนี้ทดสอบโค้ดตัวเดียวกับที่ผู้ใช้เปิดจริง ไม่ใช่สำเนา
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(here, "..", "index.html");
const html = fs.readFileSync(APP, "utf8");
const whole = html.match(/<script>([\s\S]*)<\/script>/)[1];

// ถอดเปลือก (() => { ... })(); ออก ให้ของข้างในเป็นระดับบนสุดของโมดูล
const body = whole.replace(/^\s*\(\(\) => \{/, "").replace(/\}\)\(\);\s*$/, "");

const stub = `
const nodes = new Map();
const mk = (id) => ({ id, children: [], listeners: {}, classes: new Set(),
  textContent: "", hidden: true, disabled: false, value: "", checked: false,
  placeholder: "", options: [], style: {},
  get className(){ return [...this.classes].join(" "); },
  set className(v){ this.classes = new Set(String(v).split(/\\s+/).filter(Boolean)); },
  addEventListener(n, f){ (this.listeners[n] ||= []).push(f); },
  replaceChildren(...k){ this.children = k; }, append(...k){ this.children.push(...k); },
  click(){}, select(){}, focus(){} });
globalThis.__nodes = nodes;
globalThis.document = {
  body: null, documentElement: {},
  getElementById: id => { if (!nodes.has(id)) nodes.set(id, mk(id)); return nodes.get(id); },
  createElement: () => mk("new"),
  querySelector: () => null, querySelectorAll: () => [] };
globalThis.window = globalThis;
globalThis.addEventListener ??= () => {};
globalThis.localStorage = (() => { const m = new Map(); return {
  getItem: k => (m.has(k) ? m.get(k) : null),
  setItem: (k, v) => { m.set(k, String(v)); },
  removeItem: k => { m.delete(k); }, clear: () => m.clear() }; })();
globalThis.btoa ??= s => Buffer.from(s, "binary").toString("base64");
globalThis.atob ??= s => Buffer.from(s, "base64").toString("binary");
globalThis.navigator ??= {};
globalThis.URL.createObjectURL ??= () => "blob:x";
globalThis.URL.revokeObjectURL ??= () => {};
globalThis.Blob ??= class { constructor(parts){ this.parts = parts; } };
`;

const tmp = path.join(here, "_app.mjs");
fs.writeFileSync(tmp, stub + body + `
export { md5, crc32, zipStore, sbpSong, sbpFile, sbpBase64, chordFormat, chordPrompt,
         chordTitle, directive, CHORD_RULES, apiRequest, apiReply, apiError,
         API_MODELS, API_HELP, chordSearchUrl, i18n, i18x, EN, setLang,
         buskSlug, buskColIndex, buskMerge, buskKeys, buskChordPro, buskSheet,
         buskPage, CHORD_SITES, findChordSong, popup, popupClose };
`);
const app = await import("./_app.mjs?v=" + Date.now());
const nodes = globalThis.__nodes;
fs.unlinkSync(tmp);

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) console.log(`        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`);
};
const enc = s => new TextEncoder().encode(s);

console.log("\n[1] MD5 — เทียบกับเวกเตอร์ทดสอบใน RFC 1321 ทั้งหมด");
{
  const vectors = [
    ["", "d41d8cd98f00b204e9800998ecf8427e"],
    ["a", "0cc175b9c0f1b6a831c399e269772661"],
    ["abc", "900150983cd24fb0d6963f7d28e17f72"],
    ["message digest", "f96b697d7cb7938d525a2f31aaf161d0"],
    ["abcdefghijklmnopqrstuvwxyz", "c3fcd3d76192e4007dfb496cca67e13b"],
    ["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
     "d174ab98d277d9f5a5611c2c9f419d9f"],
    ["12345678901234567890123456789012345678901234567890123456789012345678901234567890",
     "57edf4a22be3c955ac49da2e2107b67a"],
  ];
  for (const [input, want] of vectors)
    check(`md5(${JSON.stringify(input).slice(0, 24)})`, app.md5(enc(input)), want);
  // ข้อความไทยเป็นหลายไบต์ต่อตัวอักษร · ต้องแฮชจากไบต์ ไม่ใช่จากจำนวนตัวอักษร
  check("ข้อความไทยยาวเกินหนึ่งบล็อก",
        app.md5(enc("ก".repeat(100))).length, 32);
}

console.log("\n[2] CRC32 — ค่าตรวจมาตรฐานของสตริง 123456789");
{
  check("ค่าตรวจคือ cbf43926",
        app.crc32(enc("123456789")).toString(16).padStart(8, "0"), "cbf43926");
  check("ข้อมูลว่างได้ศูนย์", app.crc32(new Uint8Array(0)), 0);
}

console.log("\n[3] วงเล็บปีกกาของ ChordPro");
{
  const text = "{title: ทดสอบ}\n{artist: วงทดสอบ}\n{tempo: 92}\n{time: 6/8}\n";
  check("อ่านชื่อเพลง", app.directive(text, "title"), "ทดสอบ");
  check("อ่านศิลปิน", app.directive(text, "artist"), "วงทดสอบ");
  check("อ่าน tempo", app.directive(text, "tempo"), "92");
  check("อ่านเลขห้อง", app.directive(text, "time"), "6/8");
  check("ไม่มีก็ได้ค่าว่าง", app.directive(text, "capo"), "");
  check("เว้นวรรคแปลกๆ ก็ยังอ่านได้", app.directive("{ Tempo :  104 }", "tempo"), "104");
  check("ข้อความว่างไม่ล้ม", app.directive("", "title"), "");
}

console.log("\n[4] ชื่อเพลง — ที่พิมพ์เองมาก่อน ไม่ได้พิมพ์ก็ดูจากในเนื้อ");
{
  nodes.clear();
  check("ไม่มีอะไรเลยได้ค่าว่าง", app.chordTitle(), "");
  globalThis.document.getElementById("chord-text").value = "{title: จากในเนื้อ}\n";
  check("ไม่ได้พิมพ์ ก็เอาจาก {title:}", app.chordTitle(), "จากในเนื้อ");
  globalThis.document.getElementById("chord-title").value = "  ที่พิมพ์เอง  ";
  check("พิมพ์เองแล้วใช้ของที่พิมพ์", app.chordTitle(), "ที่พิมพ์เอง");
}

console.log("\n[5] จัดรูปแบบ — ท่อนดนตรีรวมบรรทัดเดียว ท่อนซ้ำครอบวงเล็บ");
{
  // ผลลัพธ์ปิดท้ายด้วยบรรทัดว่างเสมอ ซึ่งถูกแล้วสำหรับไฟล์ข้อความ · เทียบเฉพาะเนื้อใน
  check("ท่อนดนตรีรวมเป็นบรรทัดเดียว",
        app.chordFormat("Intro\nG C G C\n").trim(), "[Intro: /] [G /] [C /] [G /] [C /]");
  check("ชื่อท่อนกับคอร์ดอยู่บรรทัดเดียวกันก็ได้",
        app.chordFormat("Solo Em Am D\n").trim(), "[Solo: /] [Em /] [Am /] [D /]");
  check("ท่อนซ้ำโดดๆ ถูกครอบวงเล็บ", app.chordFormat("( * )\n").trim(), "[( * )]");
  // บรรทัดเนื้อร้องต้องไม่ถูกแตะ
  const lyric = "[Am]ก็เลยมาร้อง[D]เพลงบอก";
  check("บรรทัดเนื้อร้องผ่านไปตามเดิม", app.chordFormat(lyric + "\n").trim(), lyric);
}

console.log("\n[6] พร้อมท์ — กติกาสี่ข้อต้องถึง AI ครบ และต้องแนบต้นฉบับไปด้วย");
{
  nodes.clear();
  const g = globalThis.document.getElementById;
  g("chord-title").value = "ชื่อเพลงทดสอบ";
  g("chord-artist").value = "ศิลปินทดสอบ";
  g("chord-src").value = "Intro\nG C\nเนื้อร้องบรรทัดหนึ่ง";
  const p = app.chordPrompt();
  check("มีชื่อเพลงในพร้อมท์", p.includes("ชื่อเพลงทดสอบ"), true);
  check("มีชื่อศิลปินในพร้อมท์", p.includes("ศิลปินทดสอบ"), true);
  check("แนบต้นฉบับไปด้วย", p.includes("เนื้อร้องบรรทัดหนึ่ง"), true);
  check("คั่นต้นฉบับให้ AI เห็นขอบเขต",
        p.includes("--- เริ่มต้นฉบับ ---") && p.includes("--- จบต้นฉบับ ---"), true);
  // กติกาสี่ข้อเป็นของผู้ใช้ ต้องไปถึง AI ครบทุกข้อ ไม่ถูกย่อหรือตัด
  for (const n of ["1.", "2.", "3.", "4."])
    check(`มีกติกาข้อ ${n}`, p.includes("\n" + n) || p.startsWith(n), true);
  check("กติกาไปครบทั้งก้อน", p.includes(app.CHORD_RULES), true);
  check("สั่งให้ทำเลยไม่ต้องถามซ้ำ", /ไม่ต้องถามซ้ำ/.test(p), true);
  // แอปนี้ไม่มีโครงสร้าง part ของ BeatBuddy · อย่าให้หลุดเข้าไปในพร้อมท์
  check("ไม่มีเรื่องพาร์ทของ BeatBuddy", /BeatBuddy|พาร์ท/.test(p), false);
}

console.log("\n[7] เพลงหนึ่งเพลงในไฟล์ .sbp");
{
  nodes.clear();
  const g = globalThis.document.getElementById;
  g("chord-title").value = "เพลงหนึ่ง";
  g("chord-artist").value = "วงหนึ่ง";
  const content = "{title: เพลงหนึ่ง}\n{tempo: 92}\n{time: 3/4}\nเนื้อ\n";
  const song = app.sbpSong(content, new Date(Date.UTC(2026, 0, 2, 3, 4, 5)));
  check("ชื่อมาจากช่องที่พิมพ์", song.name, "เพลงหนึ่ง");
  check("ศิลปินไปอยู่ใน subTitle", song.subTitle, "วงหนึ่ง");
  check("hash คือ MD5 ของเนื้อ", song.hash, app.md5(enc(content)));
  check("tempo มาจากวงเล็บปีกกา", [song.tempo, song.TempoInt], ["92", 92]);
  check("เลขห้องมาจากวงเล็บปีกกา", song.timeSig, "3/4");
  check("เวลาที่แก้ไขไม่มี Z ต่อท้าย", /Z$/.test(song.ModifiedDateTime), false);
  // แอปนี้ไม่ผูกกับเครื่องดนตรีตัวไหน จึงไม่ฝังคำสั่ง MIDI ลงไป
  check("ไม่มีคำสั่ง MIDI ติดไป", song.midiOnLoad, null);
  // ชุดช่องต้องครบตามที่ SongBookPro เขียนเอง ไม่งั้นนำเข้าแล้วอาจเพี้ยน
  for (const k of ["Id", "SyncId", "Deleted", "locked", "type", "name", "subTitle", "author",
                   "content", "hash", "key", "KeyShift", "Capo", "tempo", "TempoInt", "timeSig",
                   "Duration", "SongNumber", "Url", "Copyright", "NotesText", "SectionOrder",
                   "ParentId", "HasChildren", "Rotation", "ZoomFactor", "Chords", "LinkedAudio",
                   "DisplayParams", "_folders", "_tags", "Tags", "ModifiedDateTime", "midiOnLoad"])
    check(`มีช่อง ${k}`, k in song, true);

  // ไม่ได้พิมพ์ศิลปิน ก็ดูจาก {artist:} ในเนื้อ
  g("chord-artist").value = "";
  check("ไม่ได้พิมพ์ศิลปินก็ดูจากในเนื้อ",
        app.sbpSong("{artist: จากในเนื้อ}\n").subTitle, "จากในเนื้อ");
}

console.log("\n[8] ไฟล์ .sbp ทั้งไฟล์ — เป็น ZIP ที่มีสามรายการ");
{
  nodes.clear();
  globalThis.document.getElementById("chord-title").value = "เพลงสอง";
  const bytes = app.sbpFile("{title: เพลงสอง}\nเนื้อ\n", new Date(Date.UTC(2026, 0, 2)));
  const u8 = new Uint8Array(bytes);
  check("ขึ้นต้นด้วยลายเซ็น ZIP", [...u8.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  const text = new TextDecoder().decode(u8);
  for (const name of ["dataFile.hash", "dataFile.txt", "pdf/"])
    check(`มีรายการ ${name}`, text.includes(name), true);
  // ท้ายไฟล์ ZIP ต้องมี End Of Central Directory ไม่งั้นโปรแกรมอื่นเปิดไม่ออก
  check("มี EOCD ปิดท้าย", text.lastIndexOf("PK\u0005\u0006") > 0, true);
}

console.log("\n[9] ส่งตรงด้วย API — สามเจ้าคนละรูปแบบ");
{
  const P = "พร้อมท์";
  const o = app.apiRequest("openai", "", "sk-test", P);
  check("OpenAI ยิงที่ chat/completions", o.url, "https://api.openai.com/v1/chat/completions");
  check("OpenAI ใส่คีย์ใน Authorization", o.headers.Authorization, "Bearer sk-test");
  check("ไม่ระบุรุ่นก็ใช้ค่าตั้งต้น", o.body.model, app.API_MODELS.openai);

  const a = app.apiRequest("anthropic", "", "sk-ant", P);
  check("Anthropic ใส่คีย์ใน x-api-key", a.headers["x-api-key"], "sk-ant");
  check("Anthropic ระบุเวอร์ชัน", a.headers["anthropic-version"], "2023-06-01");
  // ขาดหัวนี้ Anthropic จะปัดคำขอที่มาจากเบราว์เซอร์ทิ้ง
  check("Anthropic อนุญาตให้ยิงจากเบราว์เซอร์",
        a.headers["anthropic-dangerous-direct-browser-access"], "true");

  const gm = app.apiRequest("gemini", "", "AIza-test", P);
  // คีย์ของ Gemini ต้องอยู่ในหัวคำขอ ไม่ใช่ใน URL ไม่งั้นมันไปโผล่ใน log ของเซิร์ฟเวอร์
  check("Gemini ไม่เอาคีย์ไปไว้ใน URL", /AIza-test/.test(gm.url), false);
  check("Gemini ใส่คีย์ในหัวคำขอ", gm.headers["x-goog-api-key"], "AIza-test");

  check("อ่านคำตอบของ OpenAI ได้",
        app.apiReply("openai", { choices: [{ message: { content: "ผลลัพธ์" } }] }), "ผลลัพธ์");
  check("อ่านคำตอบของ Anthropic ได้",
        app.apiReply("anthropic", { content: [{ type: "text", text: "ผลลัพธ์" }] }), "ผลลัพธ์");
  check("บอกสาเหตุที่เจ้าของ API ส่งกลับมา",
        /หมดโควตา|quota|429/i.test(app.apiError(429, { error: { message: "quota" } }, "")), true);
}

console.log("\n[10] ภาษา — ข้อความไทยทุกจุดต้องมีคำแปล");
{
  const dict = new Set(Object.keys(app.EN));
  const norm = x => x.replace(/\s+/g, " ").trim();
  // ก้อนที่ติด data-keep-lang ตั้งใจไม่ให้แปล เช่นปุ่มเลือกภาษาเอง · ไม่ต้องตรวจ
  const scan = html.replace(/<(span|a)\b[^>]*data-keep-lang[^>]*>[\s\S]*?<\/\1>/g, "");
  const want = [];
  for (const m of scan.matchAll(/placeholder="([^"]+)"/g)) want.push(m[1]);
  for (const m of scan.matchAll(/<button[^>]*>([^<]+)<\/button>/g)) want.push(m[1]);
  for (const m of scan.matchAll(/<label[^>]*>([^<]+)/g)) want.push(m[1]);
  for (const m of scan.matchAll(/<p class="hint">([\s\S]*?)<\/p>/g)) want.push(m[1]);
  const thai = [...new Set(want.map(norm))].filter(x => /[฀-๿]/.test(x));
  console.log(`     ข้อความไทยในหน้า ${thai.length} รายการ`);
  check("มีข้อความให้ตรวจจริง", thai.length > 6, true);
  check("มีคำแปลครบทุกรายการ", thai.filter(x => !dict.has(x)), []);

  // ข้อความที่ JS เขียนเอง ข้อ [10] ที่กวาดจาก markup มองไม่เห็น
  const says = ["ใส่ชื่อเพลงก่อน", "วางใบคอร์ดต้นฉบับก่อน", "ใส่ API key ก่อน", "ยังไม่มีข้อความ",
                "คัดลอกแล้ว", "จัดรูปแบบแล้ว", "บันทึกแล้ว", "พร้อมท์พร้อมแล้ว",
                "ส่งออก .sbp แล้ว · เปิดไฟล์นี้ด้วย SongBookPro ได้เลย"];
  check("ข้อความที่ JS เขียนเองมีคำแปลครบ", says.filter(x => !dict.has(x)), []);

  // สลับไปอังกฤษแล้วต้องได้คำแปลจริง ไม่ใช่คืนคำไทยเดิม
  app.setLang("en");
  check("สลับเป็นอังกฤษแล้วแปลจริง", app.i18n("ใส่ชื่อเพลงก่อน"), app.EN["ใส่ชื่อเพลงก่อน"]);
  app.setLang("th");
  check("สลับกลับเป็นไทยได้คำเดิม", app.i18n("ใส่ชื่อเพลงก่อน"), "ใส่ชื่อเพลงก่อน");
}

console.log("\n[11] ค้นหาคอร์ดจากฐานข้อมูล — ชื่อเพลง ตำแหน่งคอร์ดบนคำไทย และการกางท่อนซ้ำ");
{
  check("ตัดชื่อเพลงออกจากลิงก์ได้",
        app.buskSlug("https://busk.town/songs/loso-song?x=1#top"), "loso-song");
  check("ไม่ใช่ลิงก์ก็คืนตามเดิม", app.buskSlug("  ชื่อเพลง  "), "ชื่อเพลง");
  // สระบนล่างกับวรรณยุกต์ไทยไม่กินความกว้าง · นับเป็นตัวอักษรตรงๆ แล้วคอร์ดจะเลื่อนผิดทั้งเพลง
  const LY = "ฉันรักเธอ";
  check("ช่อง 2 คือตัว ร ไม่ใช่ตัวที่สอง", app.buskColIndex(LY, 2), 3);
  check("ไม่ใช่การนับตัวอักษรตรงๆ", app.buskColIndex(LY, 2) === 2, false);
  check("คอร์ดลงตรงช่องที่ตาเห็น", app.buskMerge("  A E", LY), "ฉัน[A]รัก[E]เธอ");
  // ข้อที่แข็งแรงที่สุด · ถอดวงเล็บออกแล้วต้องได้เนื้อเดิมครบทุกตัวอักษร
  for (const [cl, ly] of [["  A E", LY], ["A B", "กขค"], ["   Bm7  F#m7 E", "ตั้งใจซ้อมให้ดีที่สุด"]])
    check(`ถอดคอร์ดออกแล้วได้เนื้อเดิม: ${ly}`,
          app.buskMerge(cl, ly).replace(/\[[^\]]*\]/g, ""), ly);

  const CTX = {
    slug: "ทดสอบ",
    moss: {
      title: "ทดสอบ",
      attributes: { authors: [{ name: "วงทดสอบ" }], originalKey: "A", tempo: 67, timesig: "4/4" },
      sections: [
        { type: "original", alias: null, name: "Intro", tokens: [{ type: "chord-line" }],
          trueChordLines: { A: ["| A | D | E | [x2]"], C: ["| C | F | G | [x2]"] },
          easyChordLines: { A: ["| A | D | E |"], C: ["| C | F | G |"] } },
        { type: "original", alias: "*", name: "Hook",
          tokens: [{ type: "chord-line" }, { type: "lyric-line", text: LY }],
          trueChordLines: { A: ["  A E"], C: ["  C G"] },
          easyChordLines: { A: ["  A E"], C: ["  C G"] } },
        { type: "cloned", alias: "*", name: "Hook" },
      ],
    },
  };
  check("คีย์ที่เลือกได้ครบ", app.buskKeys(CTX), ["A", "C"]);
  const pro = app.buskChordPro(CTX, "", false);
  check("หัวไฟล์เป็นชื่อเพลง", pro.split("\n")[0], "{title: ทดสอบ}");
  check("มีที่มาเป็นคอมเมนต์", pro.includes("# " + app.buskPage("ทดสอบ")), true);
  check("ท่อนดนตรีเป็นบรรทัดเดียว", pro.includes("[Intro: /] [A /] [D /] [E /] [x2]"), true);
  check("คอร์ดแทรกในเนื้อถูกตำแหน่ง", pro.includes("ฉัน[A]รัก[E]เธอ"), true);
  // ท่อนซ้ำในข้อมูลไม่เก็บเนื้อไว้ ต้องกางออกมาเต็ม
  check("ท่อนซ้ำกางออกมาเต็ม", pro.split("ฉัน[A]รัก[E]เธอ").length - 1, 2);
  check("เปลี่ยนคีย์แล้วคอร์ดเปลี่ยน", app.buskChordPro(CTX, "C", false).includes("ฉัน[C]รัก[G]เธอ"), true);
  check("เปลี่ยนคีย์แล้วเนื้อไม่เปลี่ยน", app.buskChordPro(CTX, "C", false).includes(LY.slice(0, 3)), true);
  // กล่องบนเป็นคอร์ดเหนือเนื้อ คนละแบบกับกล่องล่าง
  const sheet = app.buskSheet(CTX, "", false);
  check("ใบคอร์ดไม่มีวงเล็บก้ามปู", /\[[A-G]/.test(sheet), false);
  check("ใบคอร์ดมีเนื้อร้องครบ", sheet.includes(LY), true);

  // ไล่หาทีละเว็บ · ใช้ของปลอมแทนเน็ต ชุดทดสอบต้องไม่ยิงออกนอกเครื่อง
  const NEED = ["name", "owns", "find", "keys", "sheet", "pro", "title", "meta", "link"];
  check("ทุกเว็บในทะเบียนมีครบทุกหน้าที่",
        app.CHORD_SITES.flatMap(x => NEED.filter(k => x[k] === undefined)), []);
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const hit = decodeURIComponent(String(url)).includes("/songs/ทดสอบ/");
    return { ok: hit, status: hit ? 200 : 404, json: async () => ({ result: { pageContext: CTX } }) };
  };
  try {
    const hit = await app.findChordSong("ทดสอบ", "");
    check("เจอแล้วบอกว่าได้มาจากเว็บไหน", hit && hit.site.name, "busk.town");
    check("ไม่มีก็คืนค่าว่าง", await app.findChordSong("ไม่มีเพลงนี้", ""), null);
  } finally { globalThis.fetch = realFetch; }
}

console.log("\n[12] ของที่สั่งซ่อนต้องซ่อนจริง");
{
  // เคยพลาดมาแล้ว · .row กับ .modal ตั้ง display: flex ซึ่งชนะกฎ [hidden] ที่เบราว์เซอร์
  // ให้มาเอง กล่องกลางจอจึงค้างคาหน้าจอและแถวเลือกคีย์โผล่ทั้งที่ยังไม่ได้ค้นอะไร
  // อ่านพร็อพเพอร์ตี้ .hidden ไม่เจอบั๊กนี้ เพราะมันเป็น true อยู่จริง ต้องดูที่ CSS
  check("มีกฎบังคับซ่อน", /\[hidden\]\s*\{\s*display:\s*none\s*!important/.test(html), true);
  // ทุกก้อนที่พึ่งกฎนั้นอยู่ · ถ้าเพิ่มก้อนใหม่ที่ใช้ hidden ก็ยังปลอดภัยเพราะกฎครอบทั้งหน้า
  for (const id of ["chord-manual", "busk-tune", "ai-tools", "modal", "chord-msg"])
    check(`${id} ตั้ง hidden ไว้ใน markup`,
          new RegExp(`id="${id}"[^>]*\\shidden`).test(html), true);
}

console.log("\n[13] ขอบเขตและมารยาท");
{
  check("ไม่มีโค้ดของการ์ด BeatBuddy", /BBSF|parseBBS|\.DRM\b/.test(html), false);
  // ดึงทีละเพลงตามที่ผู้ใช้กด ไม่มีโหมดไล่ดูดทั้งเว็บ
  check("ไม่ไล่อ่านแผนผังเว็บ", /sitemap/i.test(html), false);
  // คนถอดคอร์ดควรได้คนเข้าเว็บกลับไป · เครดิตต้องอยู่ทั้งในแอปและในไฟล์ที่ส่งออก
  check("มีเครดิตในหน้าแอป", /ข้อมูลคอร์ดและเนื้อร้องจาก[\s\S]{0,120}busk\.town/.test(html), true);
  check("มีปุ่มกลับไปดูที่เว็บต้นทาง", html.includes("เปิดดูที่เว็บต้นทาง"), true);
  check("ที่มาติดไปกับไฟล์ที่ส่งออก",
        app.buskChordPro({ slug: "x", moss: { title: "x", attributes: {}, sections: [] } }, "", false)
          .includes("busk.town/songs/x"), true);
  // ยิงออกนอกเครื่องได้เฉพาะเว็บฐานข้อมูล กับ API ของ AI ที่ผู้ใช้ใส่คีย์เอง
  // www.w3.org เป็นชื่อเนมสเปซของ SVG ในไอคอน ไม่ใช่ปลายทางที่ถูกยิงจริง
  const hosts = [...html.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map(m => m[1]);
  const unexpected = [...new Set(hosts)].filter(h =>
    !/^(www\.w3\.org|busk\.town|api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|www\.google\.com|chatgpt\.com|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|www\.perplexity\.ai|platform\.openai\.com|console\.anthropic\.com|aistudio\.google\.com|github\.com)$/.test(h));
  check("ไม่มีปลายทางแปลกปลอม", unexpected, []);
  check("ไม่มีตัวนับสถิติหรือสคริปต์ภายนอก", /<script[^>]+src=/i.test(html), false);
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
