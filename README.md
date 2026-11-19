# SmartSoko — Usimamizi wa Fedha za Bodi (Board Finance)

App ya kujitegemea (standalone) ya kusimamia fedha za wanabodi/wanachama wa SmartSoko.
React 18 + Vite 5 + Tailwind CSS. Haitegemei huduma ya kulipia.

## Kukimbia
```bash
cd smartsoko-board-finance
npm install       # node_modules ipo tayari kwenye mashine hii
npm run dev       # http://localhost:5173
```

Production:
```bash
npm run build
npm run preview -- --host --port 4173
```

## Akaunti
Akaunti zinatolewa na msimamizi (CFO) kupitia **Mipangilio → Watumiaji**.
Nenosiri huhifadhiwa kwa SHA-256 na hakuna taarifa za kuingia zinazoonyeshwa hadharani.

Nafasi (roles):
- **CFO** — msimamizi mkuu: fedha + watumiaji + audit log.
- **Mhasibu (Accountant)** — kuingiza na kuidhinisha data ya kifedha.
- **CEO / Mkurugenzi** — haki sawa na mhasibu kwenye data ya fedha.
- **Mwanachama** — kuona taarifa (bila kubadilisha data).

## Vipengele
1. **Wanabodi** — CRUD, utafutaji, wasifu wa kifedha, taarifa ya mwanachama (PDF), import/export CSV.
2. **Michango** — kampeni maalum, lengo, kiasi kwa mwanachama, maendeleo ya ukusanyaji.
3. **Malipo** — kurekodi malipo, risiti za picha, chujio kwa mwanachama/kampeni, jumla ya mwezi.
4. **Matumizi** — uainishaji (uendeshaji/uwekezaji), risiti, **mtiririko wa idhini** (inasubiri → imeidhinishwa/imakataliwa).
5. **Bajeti** — bajeti ya mwezi/mwaka dhidi ya matumizi halisi, tahadhari ya kuzidi.
6. **Dashibodi** — KPI, maendeleo ya ukusanyaji, chati ya mapato vs matumizi, wachangiaji bora, malipo ya karibuni.
7. **Ripoti** — muhtasari, Profit & Loss, orodha ya wanachama, CSV, chapisha/PDF.
8. **Arifa** — vikumbusho vya madeni kupitia WhatsApp, nakala ya ujumbe, taarifa ya mwanachama.
9. **Usalama** — roles, auto-logout baada ya dakika 30, audit log, backup/restore JSON.
10. **UX** — dark mode, utafutaji wa haraka (Ctrl+K), animations, PWA (installable), print styles.

## Hifadhi ya data
Data zote zinahifadhiwa kwenye kivinjari (localStorage, key `smartsoko_board_finance_v3`).
Tumia **Mipangilio → Backup & Restore** kuhifadhi data kwenye faili. Data haisambazwi kati ya vifaa.

Supabase (free tier) inaweza kuunganishwa baadaye; schema ipo kwenye
`supabase/migrations/015_board_finance.sql`.
