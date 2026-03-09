# Code vs. SRS v3.1 — Aktueller Stand
**Schleier & Dunkel** | Stand: 09.03.2026

---

## ✅ Implementiert (MVP-Basis)

| Bereich | Status |
|---|---|
| Auth (Register/Login/JWT) | ✅ Fertig |
| Graph-Generierung (6 Layer, Risikofarben) | ✅ Fertig |
| Blindes Duell (Hero + Veil parallel) | ✅ Fertig |
| Schleier-KI Routing + Risikoabwägung | ✅ Fertig |
| Schleier-Eskalation Stufen I–V | ✅ Fertig |
| Armeekampf (attack/defend/escape) | ✅ Fertig |
| 30 Events mit Choices + Effekten | ✅ Fertig |
| Armee-Wachstum pro Raum | ✅ Fertig |
| 5 Bösewicht-Helden Pool | ✅ Fertig |
| Rückblick-Karte nach Exit | ✅ Fertig |
| Persistenz (PostgreSQL) | ✅ Fertig |
| Frontend Spielscreen (React/Canvas) | ✅ Fertig |
| Deploy Pipeline (GitHub Actions → VPS) | ✅ Fertig |

---

## ❌ Fehlt noch (SRS v3.1 Delta)

| Bereich | SRS-Kapitel | Priorität |
|---|---|---|
| **Runen-System** (12 Basis-Runen, Runenwörter 2–3) | v3.1 | 🔴 Hoch |
| **Items** (8 Waffen, 6 Rüstungen, 12 Artefakte, 10 Consumables) | v3.1 | 🔴 Hoch |
| **Flüche** (10 Flüche + 6 Kombinations-Effekte) | v3.1 | 🟡 Mittel |
| **Anführer-Helden** (8 rekrutierbare mit Abgangsbedingungen) | v3.1 | 🟡 Mittel |
| **Regionen-System** (4 neue Regionen zur Wahl nach Exit) | v3.0/3.1 | 🟡 Mittel |
| **Spezial-Objekte** (Türme, Höhlen, Keller als Sub-Netzwerke) | v3.0/3.1 | 🟢 Niedrig |
| **Meta-Progression** (Runs-übergreifend) | v3.0 | 🟢 Niedrig |
| **Score/Leaderboard** | v2.0 S5 | 🟢 Niedrig |
| **Schleier-Persönlichkeitsprofile** | v3.0 | 🟢 Niedrig |
| **Ressourcen-Dreieck** (Bedrohung/Sichtb./Verderbnis tiefer) | v3.0 | 🟢 Niedrig |

---

## Umsetzungsplan

### Sprint 1 — Items & Loot *(Fundament für Runen)*
> Runen brauchen Items als Träger — daher zuerst.

1. `items.ts` — 8 Waffen, 6 Rüstungen, 12 Artefakte, 10 Consumables als JSON-Datenbank
2. DB-Schema erweitern: `inventory`-Tabelle
3. Loot-Drops in Events und Kämpfen verdrahten
4. Frontend: Inventar-Panel im linken Sidebar

### Sprint 2 — Runen-System
1. `runes.ts` — 12 Basis-Runen + Runenwörter-Kombinationen
2. Runen-Drop-Logik (selten, in roten Räumen)
3. Runen auf Items sockeln
4. Frontend: Runen-UI

### Sprint 3 — Flüche & Anführer-Helden
1. 10 Flüche mit Kombinations-Effekten
2. 8 rekrutierbare Anführer-Helden mit Abgangsbedingungen
3. Mentor-Räume und Spezial-Objekte erweitern

### Sprint 4 — Regionen-System
1. Nach Exit: 4 neue Regionen zur Wahl
2. Regionen-Regenerierung mit neuen Seeds
3. 2 weitere Startgebiete

---

## Infrastruktur

| Komponente | Detail |
|---|---|
| VPS | `root@187.77.88.215` · `/opt/schleier-dunkel` |
| Live-URL | `http://187.77.88.215:8080` |
| GitHub | `https://github.com/GreenBiber/Atlantis_newWorld` |
| DB | `schleier_prod` · User: `schleier` |
| Ports | nginx: 8080 · Backend: 3000 · Frontend: 4173 |
| Deploy | GitHub Actions → `docker compose -f docker-compose.prod.yml up -d --build` |
