# Rezumat Proiect - Frontend Panou de Administrare

Acest document oferă o imagine de ansamblu asupra arhitecturii și structurii frontend-ului, destinat atât dezvoltatorilor, cât și instrumentelor AI, pentru a facilita înțelegerea și modificarea codului.

## 1. Prezentare Generală

Proiectul este un panou de administrare interactiv (`Admin Dashboard`) construit pentru a oferi o interfață de gestionare a unui inventar de anunțuri (ex: mașini, proprietăți imobiliare). Acesta comunică cu un API extern pentru a prelua și manipula datele.

## 2. Tehnologii Utilizate

- **Framework**: React 18 cu Vite.js
- **Limbaj**: TypeScript
- **Rutare**: `react-router-dom`
- **Management de Date (API)**: `@tanstack/react-query` pentru data fetching, caching și sincronizare.
- **UI Kit**: `shadcn/ui` (bazat pe Radix UI și Tailwind CSS) pentru o interfață modernă și consistentă.
- **Stilizare**: Tailwind CSS pentru stilizare utilitară.
- **Formulare**: `react-hook-form` cu `zod` pentru validarea schemelor.

## 3. Structura Proiectului

Codul sursă pentru frontend se află în directorul `src/`.

```
/
├── src/                     # Directorul pentru codul de frontend
│   ├── components/
│   │   ├── ui/              # Componente de UI reutilizabile (shadcn)
│   │   ├── modals/          # Componente de tip modal
│   │   └── *.tsx            # Componente generale (Layout, Sidebar, etc.)
│   ├── hooks/               # Hook-uri custom (ex: use-toast)
│   ├── lib/                 # Utilitare (ex: cn pentru classnames)
│   ├── pages/               # Componente-pagină, mapate la rutele din App.tsx
│   ├── services/            # Clientul API (axios) pentru comunicarea cu backend-ul
│   ├── App.tsx              # Definirea rutelor principale ale aplicației
│   └── main.tsx             # Punctul de intrare al aplicației React
│
├── package.json             # Dependențele frontend-ului
├── tailwind.config.ts       # Configurare Tailwind CSS
└── vite.config.ts           # Configurare Vite
```

## 4. Arhitectura Frontend

### a. Rutare Protejată
- Componenta `ProtectedRoute` verifică existența unui token de autentificare în `localStorage` înainte de a permite accesul la paginile de administrare. Utilizatorii neautentificați sunt redirecționați către pagina de login.

### b. Data Fetching
- `@tanstack/react-query` este folosit extensiv pentru a prelua, cache-ui și sincroniza datele de la API-ul extern.
- Această abordare simplifică gestionarea stării de încărcare (`isLoading`), a erorilor și re-încercărilor automate, eliminând necesitatea stocării manuale a datelor în starea componentelor.

### c. Modularitate și Reutilizare
- Aplicația folosește componente din `shadcn/ui` pentru elemente de bază ale interfeței (butoane, carduri, formulare), asigurând un design consistent.
- Componentele custom sunt create pentru funcționalități specifice (ex: `DashboardLayout`, `ConfirmationModal`) și sunt plasate în directorul `src/components`.

### d. Managementul Stării
- Starea globală este menținută la un nivel minim.
- `react-query` gestionează starea datelor de pe server.
- Starea locală a componentelor (controlată cu `useState`) este preferată pentru elemente de UI (ex: deschiderea unui modal, valorile unui formular ne-trimis). Nu este utilizată o bibliotecă complexă de management al stării (precum Redux).
