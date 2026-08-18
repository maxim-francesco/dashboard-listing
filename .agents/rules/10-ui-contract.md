---
trigger: always_on
---

# CONTRACT UI — panou admin

> Fișier stabil. Se schimbă doar prin decizie explicită.
> Duplicat intenționat cu `.agents/rules/10-ui-contract.md` — Antigravity îl
> folosește la execuție, eu la proiectare. **Dacă se schimbă unul, se schimbă
> amândouă.**

---

## Poziția de design

Instrument intern dens, pentru dealeri auto care stau pe el toată ziua.
Densitatea informației și scanabilitatea bat efectul vizual.

**De evitat explicit:** glassmorphism, gradienți, animație decorativă, secțiuni
hero supradimensionate, spațiu alb generos pe desktop, grile de carduri unde ar
trebui un tabel.

Nu se introduce un limbaj vizual nou. Se potrivește cu ce există deja.

**Densitatea rămâne în liste, pe desktop.** Cromul (header, navigație, hub-uri,
pagina de start) nu se înghesuie. Pentru ecrane cu multe funcții: hub cu meniu.
Pentru formulare lungi: multi-step.

---

## Tema

**Temă dark unică (Obsidian), fără comutator.** Un singur `:root` în
`src/index.css`. `class="dark"` pe `<html>` există doar pentru variantele `dark:`
rămase în codul existent — nu e comutator și nu se tratează ca unul.

Tokenii autoritativi:

| Token | Valoare |
|---|---|
| `--background` | `0 0% 3%` |
| `--card` | `0 0% 8%` |
| `--surface-alt` | `0 0% 15%` |
| `--border` | `0 0% 22%` |
| `--muted` | `0 0% 14%` |
| `--accent` | `0 0% 18%` |
| `--foreground` | `0 0% 97%` |
| `--muted-foreground` | `0 0% 68%` |
| `--primary` | `217 91% 62%` |
| `--primary-foreground` | `217 40% 12%` |

`--primary-foreground` e text închis pe albastru — decizie de contrast, 5.21.

`--surface-alt` e nemapat în `tailwind.config.ts` **intenționat**; se consumă prin
`bg-[hsl(var(--surface-alt))]`.

Orice suprascriere de tokeni din afara `index.css` are nevoie de doi selectori —
vezi INFRA capcana #7.

---

## Rețeta cardurilor (Card Recipe)

Cardurile din interfață folosesc rețeta centralizată din `src/components/today/cardRecipe.ts`:
- `CARD`: `"bg-card border border-border rounded-lg"`
- `CARD_HEADER`: `"flex items-baseline gap-2 px-4 py-2.5 border-b border-border"`
- `CARD_LABEL`: `"flex-1 text-[11px] uppercase tracking-wide text-muted-foreground"`
- `CARD_LABEL_M`: `"flex-1 text-[13px] font-medium text-foreground"`
- `CARD_COUNT`: `"text-[13px] text-muted-foreground tabular-nums"`

**Reguli:**
- Clasele rețetei nu se inlinează niciodată.
- Titlurile trăiesc în interiorul cardului ca rând de antet cu `border-b`, niciodată plutind deasupra lui.

---

## Tiparul cu două layouturi

Rândurile de listă poartă două blocuri frate într-o singură componentă:

```jsx
<div className="... lg:hidden">        {/* cardul mobil existent — NEATINS */}
<div className="hidden lg:flex ...">   {/* rândul dens desktop */}
```

Niciodată nu se face un layout responsiv care se transformă în celălalt.
Două blocuri, o componentă. Duplicarea aici e intenționată și corectă.

Se aplică și la pagini întregi, nu doar la rânduri: `Dashboard.tsx` primește
stiva mobilă existentă sub `lg:hidden` și layoutul desktop nou sub
`hidden lg:flex`, fără să atingă niciunul din copii.

### Divergența ordinii între breakpointuri
Ordinea blocurilor poate diferi între breakpointuri când intenția operațională diferă.
Pagina de start este precedentul stabilit: cifrele/indicatorii apar primii pe desktop (în `StatsStrip`), dar ultimii pe mobil.

---

## Geometria rândului desktop — per mod

Contractul declară înălțimea **per mod de rând**, nu una singură.

### Mod Tabel (bordură doar jos) — LIVRAT
Înălțime: **54px**. Padding `px-3 py-1.5`, `items-center`, `gap-3`.
Container rând: `bg-card border border-border rounded-lg hover:bg-accent/5
transition-colors w-full select-none`.
Livrat în Fazele 2.1 (`/listings`) și 2.2 (`/customers`).

### Mod Cards (container cu bordură completă), densitate Confortabil — DECIS, NEAPLICAT
Înălțime: **64px**. Padding `px-3 py-3`, `gap-4`, `min-h-[64px]`.
Decis în Faza 4.1, aprobat.

**Când se aplică, se aplică simultan pe `/listings` ȘI `/customers`**, altfel
marginile paginilor se decalează.

53px pentru un tabel cu bordură doar jos **nu e regresie** față de 54px — sunt
moduri diferite, nu aceeași măsurătoare.

### Reguli comune ambelor moduri
- Antetul de coloane TREBUIE să aibă `border border-transparent`, ca box-model-ul
  să fie identic cu al rândului. Fără asta, antetul și rândurile se decalează cu 2px.
- Antetul e `hidden lg:flex`
- Gap listă: `gap-2.5 lg:gap-1`

### Instrumentare
Fiecare rând primește `data-row`, fiecare celulă `data-col="<nume>"`.
Nu e decor — e ce face posibilă măsurarea automată a alinierii.

---

## Lățimi de coloană (comune tuturor suprafețelor de listă)

Aceleași lățimi în stoc, clienți și lead-uri, ca marginile să se alinieze
între pagini:

| Rol | Clasă |
|---|---|
| thumbnail | `w-16` (imagine 64x40), `shrink-0` |
| avatar | `w-9` (imagine 36x36), `shrink-0` |
| identitate primară (nume / mașină) | `flex-1 min-w-0` + `truncate` |
| bani | `w-32 shrink-0 text-right text-[15px] font-semibold tabular-nums` |
| status / badge | `w-28 shrink-0 flex justify-center text-[13px]` |
| text secundar lung | `w-72 shrink-0 text-[13px] truncate` |
| metrică secundară | `w-24 shrink-0 text-right text-[13px] tabular-nums` |
| metrică terțiară | `w-20 shrink-0 text-right text-[13px] tabular-nums` |
| buton acțiune final | dimensiune fixă, `shrink-0`, `e.stopPropagation()` la click |

**Fiecare coloană numerică primește `tabular-nums`.** Fără excepție — altfel
coloanele tremură pe măsură ce valorile se schimbă.

Lățimile se exportă ca obiect constant din componenta de rând (vezi
`CUSTOMER_COLS` în `CustomerRow.tsx`) și se folosesc și în antet. Antetul nu
are voie să aibă lățimi hardcodate proprii — așa se decalează.
Încălcare existentă de reparat: `ListingCard.tsx` + `Listings.tsx:858-865`
(DATORII #16).

---

## Scara tipografică

| Mărime | Rol |
|---|---|
| 20px semibold | titlu de pagină |
| 17px semibold | titlu de secțiune (desktop) |
| 17px medium | primar rând mobil |
| 15px semibold | primar rând desktop și bani |
| 14px | secundar mobil |
| 13px | secundar desktop, toate metricile |
| 11px uppercase tracking-wide | antete de coloană și de grup |

Nu se introduc mărimi în afara acestei scări.

### Cifre de afișare — DECIS
Cifrele de afișare sunt **DECIDE** la **19px medium** (`text-[19px] font-medium`) pentru cifrele dintr-o celulă de panou/strip (cum e în `StatsStrip`). Aceasta înlocuiește `text-[34px]`, `text-[22px]` și `text-[28px]`.
O cifră care stă în antetul unui card lângă etichetă folosește `CARD_COUNT` la **13px** (`text-[13px] tabular-nums`) și nu are nevoie de mărime proprie.

### Clase Tailwind implicite — de eliminat
`text-base`, `text-sm`, `text-lg`, `text-xs` nu sunt în scară. Se înlocuiesc cu valoarea
explicită corespunzătoare când se atinge fișierul, nu într-o rundă separată.

---

## Contractul de interacțiune

- O cifră / celulă pe care se poate da click duce către un ecran care afișează exact același set de date.
- O cifră fără o destinație verificată rămâne **non-interactivă**: fără `cursor-pointer`, fără efecte de `hover`, și fără chevron pe mobil.
- Celulele interactive sunt elemente reale `<button type="button">`, cu `focus-visible` explicit, nu div-uri cu onClick.

---

## Dimensiuni de tap și crom

- **Crom desktop**: înălțime de **36px** (navigație, butoane compacte de unelte).
- **Ținte de tap mobil**: minim **44px** (`min-h-[44px]`). Implicitul shadcn de 40px (`h-10`) este insuficient pentru mobil — orice buton nou se măsoară, nu se presupune.
- **Aliniere DialogHeader**: `dialog.tsx:55` are `pr-10` și fără padding stânga (`pr-10` pentru butonul X de închidere). Din acest motiv, `text-center` în interior centrează pe o lățime falsă și este decalat cu ~20px spre stânga. Se măsoară ambele margini.
- **Tipărire / Print**: Ieșirea de tipar are propria scară în puncte (`pt`) pe fundal alb. Scara în pixeli (`px`) de aici este exclusiv pentru ecran; cele două nu se armonizează forțat.

---

## Tokeni de culoare

Se folosesc DOAR aceștia, niciodată paleta Tailwind brută:

`foreground`, `muted-foreground`, `card`, `border`, `input`, `muted`, `accent`,
`primary`, `admin-bg`, `destructive` + `destructive/10`, `warning` +
`warning-light`, `success` + `success-light`, `surface-alt`

`text-gray-500`, `bg-slate-100` sau o valoare hex în acest cod e un defect.

Excepții preexistente, care **nu se extind**:
- culorile punctelor de tip lead și clasele de badge din `CustomerRow.tsx`
- hex-urile de categorie pentru evenimente de calendar
  (`CalendarPage.tsx:25-29`, `TodayAgenda.tsx:11-15`) — DATORII #18, o singură
  decizie de tokeni pentru ambele locuri
- paleta brută din `ListingsMenu.tsx` și `CustomersMenu.tsx`
  (`border-l-blue-500`, `bg-blue-50 dark:bg-blue-900/20`, `bg-red-500 text-white`).
  Cu tema unică, variantele `dark:` sunt active, deci culorile astea **se văd**.

---

## Container

`DashboardLayout` folosește `max-w-7xl lg:max-w-[1600px]`.
Layouturile desktop se proiectează pentru **1600px de lățime utilizabilă**, nu 1920.

---

## Pagini compuse din blocuri auto-gardate

Se aplică paginii de start și oricărei pagini unde copiii decid singuri dacă
randează.

- Părintele **nu** primește logică de detectare a vidului. Coloanele primesc
  `empty:hidden`.
- **`flex`, nu `grid` cu coloane fixe.** Cu `grid-cols-[1fr_380px]` o coloană
  goală lasă o gaură; cu `lg:flex` + `empty:hidden` coloana dispare și `gap`
  dispare cu ea.
- Coloanele nu au voie să conțină noduri de text din spații albe — `:empty` cere
  zero copii, iar un `{" "}` accidental îl invalidează.
- Un bloc dezactivat sau fără date returnează `null`, nu un wrapper ascuns.

### Model pentru pagina de start — DECIS
Coloană principală (`flex-1 min-w-0`) = coada de acțiune, în ordinea urgenței.
Raft dreapta (`lg:w-[380px] shrink-0`) = starea firmei.
Raftul se alege din blocurile care nu returnează `null` niciodată, ca să nu poată
fi gol; vidul e permis doar în coloana principală.

---

## Contractul metricilor

Orice număr afișat declară patru lucruri:

1. **unitate** — rânduri sau entități
2. **scope** — tenant, filtru, ce e inclus și ce nu
3. **fereastră de timp** — tot istoricul, luna, ziua
4. **sursă** — calculat pe server sau derivat în browser

**O metrică nu are două implementări.**

**Eticheta conține unitatea.** Nu „159 de sunat", ci „159 persoane cu lead
deschis". Nu „Cereri noi 34", ci ce înseamnă „nou" operațional.

Încălcări cunoscute, de reparat:
- badge-ul „Rețea": `Header.tsx:49` însumează trei hooks, `BottomNav.tsx:25`
  folosește unul singur. Aceeași pastilă, două formule, pe fiecare pagină
  (DATORII #24).
- „Necesită acțiune" = 185 rânduri de la server (`MessagesPage.tsx:233`) vs
  „de sunat" = 159 persoane calculate în browser (`ActionCallList.tsx:108`).
  Aceeași definiție, unitate diferită, ambele pe ecran.
- 16 valori derivate client-side pe pagina de start (DATORII #21).

Vocabularul operațional se decide în `DICTIONAR.md` (Faza 3A), cu Francesco —
sunt decizii de produs, nu de implementare.

---

## Stări goale și de încărcare

Fiecare listă are nevoie de o stare goală reală, cu o propoziție care spune ce
ar aduce date acolo.

Skeletoanele trebuie să aibă variantă desktop care se potrivește cu rândul —
un skeleton mobil în spatele unui tabel desktop e un glitch vizibil.

**Distincție pentru blocuri auto-gardate:** un bloc care e absent din pagină nu
are nevoie de stare goală. Un bloc care rămâne pe ecran are. Pe pagina de start
8 din 10 dispar complet, iar 2 rămân (`WeeklySummaryCard` cu fallback textual,
`StockPulse` cu secțiunea A) — doar acestea două intră sub regula stării goale.

---

## Verificare obligatorie după orice modificare

1. `npx tsc --noEmit` la 0 erori
2. Aliniere antet↔rând măsurată, nu apreciată din captură:
   marginile stânga trebuie să coincidă la 0px pe fiecare coloană
3. Regresie mobilă la 390x844: înălțimi de rând și scrollHeight identice cu
   baseline-ul. Orice schimbare pe mobil — chiar și o îmbunătățire — e EȘEC.
4. Consolă curată: avertismentele de key React, erorile de hidratare și
   imaginile care nu se încarcă sunt defecte de raportat, și frecvent cauza
   reală a unui layout care „arată puțin ciudat"
5. Pentru pagini cu blocuri auto-gardate: layoutul se aprobă pe **cazurile
   degenerate** (zero blocuri, un bloc, toate blocurile), direct în pagină,
   nu doar pe starea curentă a bazei de date.