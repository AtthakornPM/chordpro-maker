# ChordPro Maker

ทำไฟล์คอร์ด/เนื้อร้องสำหรับ **SongBookPro** จากใบคอร์ดที่คุณมีอยู่
ไฟล์เดียว เปิดในเบราว์เซอร์ ไม่ต้องติดตั้งอะไร ใช้แบบออฟไลน์ได้

*Turn a chord sheet you already have into a ChordPro file for **SongBookPro**.
One HTML file, runs in the browser, no install, works offline.*

---

## ใช้ยังไง · How to use

1. เปิด `index.html` ด้วยเบราว์เซอร์ หรือเปิดจากลิงก์ GitHub Pages
2. ใส่ **ชื่อเพลง** แล้ว **วางใบคอร์ดของคุณ** ลงในกล่องบน
3. กด **จัดรูปแบบ** — หรือให้ AI ช่วยเกลาก่อนก็ได้
4. กด **บันทึก .txt** หรือ **ส่งออก .sbp** แล้วเปิดไฟล์นั้นด้วย SongBookPro

ไฟล์ `.sbp` นำเข้า SongBookPro ได้ตรงๆ ไม่ต้องแปลงอีกชั้น

---

## มีอะไรบ้าง · What it does

| | |
|---|---|
| **จัดรูปแบบ ChordPro** | แทรกคอร์ดในวงเล็บก้ามปู รวมท่อนดนตรีให้อยู่บรรทัดเดียว ครอบวงเล็บให้ท่อนซ้ำ |
| **ส่งออก `.sbp`** | เขียนไฟล์ ZIP ตามรูปแบบที่ SongBookPro เขียนเอง พร้อม MD5 ครบถ้วน |
| **บันทึก `.txt`** | ไฟล์ ChordPro ธรรมดา เอาไปใช้กับโปรแกรมอื่นได้ |
| **ช่วยด้วย AI** | สร้างพร้อมท์ให้คัดลอกไปวางในแชท หรือใส่ API key แล้วให้แอปส่งเอง |
| **ไทย / English** | สลับภาษาได้ทั้งแอป |

ดึง `{title}` `{artist}` `{tempo}` `{time}` จากเนื้อ ChordPro ไปใส่ในไฟล์ `.sbp` ให้อัตโนมัติ

---

## ข้อมูลของคุณอยู่ที่ไหน · Privacy

ทุกอย่างทำงานในเบราว์เซอร์ของคุณ **ไม่มีการอัปโหลดไฟล์หรือเนื้อเพลงไปที่ไหนทั้งสิ้น**
ไม่มีตัวนับสถิติ ไม่มีสคริปต์จากภายนอก

ข้อยกเว้นเดียวคือตอนกด **ส่งให้ AI ทำเลย** ซึ่งแอปจะยิงตรงไปที่เจ้าของ API
(OpenAI / Anthropic / Google) ด้วยคีย์ของคุณเอง · คีย์เก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น
ไม่ได้ส่งไปที่อื่น · ถ้าไม่อยากส่งอะไรออกเลย ใช้ปุ่ม **จัดรูปแบบ** อย่างเดียวก็พอ

*Everything runs locally. Nothing is uploaded. The only outbound request is the optional
"Let the AI do it" button, which calls your chosen API provider directly with your own key.
The key is kept in this browser and goes nowhere else.*

---

## เรื่องลิขสิทธิ์ · About lyrics

แอปนี้ **ไม่ไปหาเนื้อเพลงมาให้** และ AI ก็จะไม่พิมพ์เนื้อเพลงที่มีลิขสิทธิ์ออกมา
งานของมันคือ **จัดรูปแบบใบคอร์ดที่คุณมีอยู่แล้ว** ให้เป็น ChordPro
เนื้อเพลงที่คุณนำมาใช้ยังเป็นลิขสิทธิ์ของเจ้าของเช่นเดิม

*This tool does not fetch or generate lyrics. It reformats a sheet you already have.*

---

## ทดสอบ · Tests

```bash
node test/test.mjs
```

ไม่ต้องติดตั้ง dependency อะไร ใช้ Node เปล่าๆ · ชุดทดสอบอ่านโค้ดจาก `index.html`
ตัวจริง ไม่ใช่สำเนา · ครอบคลุม MD5 (เทียบกับเวกเตอร์ใน RFC 1321), CRC32,
โครงไฟล์ `.sbp`, ตัวจัดรูปแบบ, การแปลภาษา และการต่อ API

---

## ที่มาของโค้ด · Credits

ส่วนที่ใช้ร่วมกัน — เครื่องแปลภาษา ตัวเขียน MD5/ZIP ตัวจัดรูปแบบ ChordPro และตัวต่อ API —
ยกมาจาก **BeatBuddy Player+** ซึ่งเป็นอีกโครงการหนึ่งของผู้เขียนคนเดียวกัน

SongBookPro เป็นผลิตภัณฑ์ของผู้พัฒนารายอื่น · โครงการนี้ไม่มีความเกี่ยวข้องกับเขา
แค่เขียนไฟล์ในรูปแบบที่โปรแกรมนั้นอ่านได้

*SongBookPro is a third-party product. This project is not affiliated with it — it simply
writes a file format that app can read.*

---

## สัญญาอนุญาต · License

MIT — ดู [LICENSE](LICENSE)
