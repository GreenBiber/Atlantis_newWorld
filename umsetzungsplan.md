# Umsetzungsplan — Schleier & Dunkel
**Basis: SRS v3.1** | Stand: 09.03.2026

---

## Sprint 1 — Items & Loot *(Fundament für Runen)*
> Runen brauchen Items als Träger — daher zuerst.

### Backend
- [ ] `backend/src/game/items.ts` erstellen
  - 8 Waffen (mit Schaden, Rüstungsdurchbruch, Runen-Slots)
  - 6 Rüstungen (mit Rüstungswert, Resistenzen, Runen-Slots)
  - 12 Artefakte (passive Dauereffekte)
  - 10 Consumables (Tränke, Schriftrollen, Talismane)
- [ ] DB-Schema erweitern: `inventory`-Tabelle
  - `run_id`, `item_id`, `slot` (weapon/armor/artifact/bag), `rune_slots[]`, `equipped`
- [ ] Loot-Drop-Logik in `events.ts` verdrahten
  - Grüner Raum: Common-Item (70%)
  - Gelber Raum: Uncommon-Item (25%)
  - Roter Raum: Rare-Item (5%) oder Artefakt garantiert
- [ ] Loot bei Kampfsieg in `runs.ts` vergeben
- [ ] API-Endpoint: `GET /runs/:id/inventory`
- [ ] API-Endpoint: `POST /runs/:id/inventory/equip`

### Frontend
- [ ] Inventar-Panel im linken Sidebar (unterhalb Armee)
- [ ] Item-Karten mit Tooltip (Name, Effekt, Runen-Slots)
- [ ] Ausrüsten/Ablegen per Klick
- [ ] Loot-Anzeige nach Events und Kämpfen im Drawer

---

## Sprint 2 — Runen-System
> 12 Basis-Runen, selten droppend, kombinierbar zu Runenwörtern.

### Backend
- [ ] `backend/src/game/runes.ts` erstellen
  - 12 Basis-Runen mit Norse-Symbolen und Effekten
  - 10 Zwei-Runen-Wörter
  - 6 Drei-Runen-Wörter (inkl. HELLEBASFEUER, KARAZANSCHATTEN, ZEITKRISTALL)
  - Vollständige Spiegel-Runen für Schleier-Seite
- [ ] Runen-Drop-Logik (nur rote Räume, ~5% Chance)
- [ ] Runen-Kombinations-Erkennung beim Sockeln
- [ ] DB-Schema: `runes`-Tabelle (`run_id`, `rune_id`, `socketed_item_id`)
- [ ] Schleier-Seite: Runen-Diebstahl und Runen-Zerstörung

### Frontend
- [ ] Runen-Anzeige im Inventar-Panel
- [ ] Sockeln-UI: Rune auf Item ziehen
- [ ] Runenwort-Anzeige wenn Kombination aktiv
- [ ] Schleier-Runen-Indikator (welche Runen der Schleier trägt)

---

## Sprint 3 — Flüche & Anführer-Helden

### Flüche
- [ ] `backend/src/game/curses.ts` erstellen
  - 10 Flüche mit Auslöser, Dauer und Gegenmaßnahmen
  - 6 Kombinations-Effekte (zwei aktive Flüche = Synergie)
- [ ] Fluch-Anwendung in Events (Verderbnis-Tags)
- [ ] Fluch-Heilung: Händler, Mentor-Räume
- [ ] Frontend: Aktive Flüche im linken Panel anzeigen

### Anführer-Helden
- [ ] `backend/src/game/leaders.ts` erstellen
  - 8 rekrutierbare Anführer-Helden
  - Jeder mit: Name, Klasse, Spezialfähigkeit, Abgangsbedingung, Synergien
- [ ] Rekrutierung in Mentor-Räumen und Spezial-Objekten
- [ ] Abgangs-Logik (Held verlässt Armee bei Bedingung)
- [ ] Mentor-Räume und erste Spezial-Objekte (Turm, Höhle) erweitern
- [ ] Frontend: Anführer-Helden-Panel mit Portrait und Fähigkeit

---

## Sprint 4 — Regionen-System

### Regionen-Auswahl nach Exit
- [ ] Nach jedem Exit: 4 neue Regionen zur Wahl generieren
- [ ] Alle zuvor besuchten Regionen ebenfalls wählbar (neue Seeds)
- [ ] Regionen-Auswahl-Screen im Frontend

### Neue Regionen
- [ ] Region 3 (Name aus SRS v3.1)
- [ ] Region 4 (Name aus SRS v3.1)
- [ ] Jede Region mit eigener Loot-DNA, Schleier-Starttyp, Raumverteilung

### Meta-Progression
- [ ] Runs-übergreifende Freischaltungen (Klassen, Regionen, Helden)
- [ ] Score-Berechnung pro Run
- [ ] Leaderboard-Tabelle

---

## Technische Schulden (parallel abarbeiten)

| Problem | Fix |
|---|---|
| `schema.sql` wird beim Build nicht kopiert | ✅ Behoben (package.json build-script) |
| nginx Port 5173 statt 4173 | ✅ Behoben |
| Git Push via HTTPS braucht Token | Personal Access Token einrichten |
| Keine Error-Boundaries im Frontend | Nach Sprint 1 nachrüsten |
| Keine Unit-Tests | Nach Sprint 2 nachrüsten |

---

## Aktuelle Ordnerstruktur

```
Atlantis_2.0/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.ts
│   │   │   └── schema.sql
│   │   ├── game/
│   │   │   ├── graph.ts
│   │   │   ├── veil.ts
│   │   │   ├── combat.ts
│   │   │   └── events.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── runs.ts
│   │   ├── utils/
│   │   │   └── prng.ts
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx.conf
├── .gitignore
└── README.md
```

### Geplante neue Dateien (Sprints 1–4)

```
backend/src/game/
├── items.ts        ← Sprint 1
├── runes.ts        ← Sprint 2
├── curses.ts       ← Sprint 3
└── leaders.ts      ← Sprint 3

backend/src/routes/
└── inventory.ts    ← Sprint 1

frontend/src/
├── components/
│   ├── InventoryPanel.tsx   ← Sprint 1
│   ├── RuneUI.tsx           ← Sprint 2
│   ├── CursePanel.tsx       ← Sprint 3
│   └── LeaderPanel.tsx      ← Sprint 3
└── screens/
    └── RegionSelect.tsx     ← Sprint 4
```

---

## Infrastruktur-Referenz

| Komponente | Detail |
|---|---|
| VPS | `root@187.77.88.215` · `/opt/schleier-dunkel` |
| Live-URL | `http://187.77.88.215:8080` |
| GitHub | `https://github.com/GreenBiber/Atlantis_newWorld` |
| DB | `schleier_prod` · User: `schleier` |
| Ports | nginx: 8080 · Backend: 3000 · Frontend: 4173 |
| Deploy | `git pull && docker compose -f docker-compose.prod.yml up -d --build` |
