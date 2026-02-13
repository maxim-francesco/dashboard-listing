# Rezumat Proiect - Platformă SaaS de Administrare Anunțuri

Acest document oferă o imagine de ansamblu asupra arhitecturii și structurii proiectului, destinat atât dezvoltatorilor, cât și instrumentelor AI, pentru a facilita înțelegerea și modificarea codului.

## 1. Prezentare Generală

Proiectul este o aplicație web **full-stack** de tip **SaaS (Software as a Service)**. Aceasta permite utilizatorilor (administratori de afaceri) să gestioneze un inventar de anunțuri (ex: mașini, proprietăți imobiliare).

Aplicația este împărțită în două componente principale:
- **Frontend**: Un panou de administrare interactiv (`Admin Dashboard`) construit cu React, Vite și ShadCN.
- **Backend**: Un API RESTful construit cu Node.js, Express și Prisma, care gestionează logica de business și comunicarea cu baza de date.

## 2. Tehnologii Utilizate

### Frontend
- **Framework**: React 18 cu Vite.js
- **Limbaj**: TypeScript
- **Rutare**: `react-router-dom`
- **Management de Date (API)**: `@tanstack/react-query`
- **UI Kit**: `shadcn/ui` (bazat pe Radix UI și Tailwind CSS)
- **Stilizare**: Tailwind CSS
- **Formulare**: `react-hook-form` cu `zod` pentru validare

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Limbaj**: JavaScript (ES modules)
- **Bază de Date**: PostgreSQL (gestionată via Docker Compose)
- **ORM**: Prisma
- **Autentificare**: JWT (JSON Web Tokens) cu `jsonwebtoken`
- **Procesare Imagini**: `sharp` pentru redimensionare și `cloudinary` pentru stocare
- **Gestionare Uploads**: `multer`

## 3. Structura Proiectului

Proiectul are o structură de monorepo, cu frontend-ul și backend-ul în același director rădăcină.

```
/
├── saas-platform-backend/   # Directorul pentru codul de backend
│   ├── prisma/
│   │   └── schema.prisma    # Definirea modelelor de date și a relațiilor
│   ├── src/
│   │   ├── config/          # Fișiere de configurare (Prisma, Cloudinary)
│   │   ├── controllers/     # Logica de business pentru fiecare rută
│   │   ├── middlewares/     # Middleware-uri Express (ex: auth, upload)
│   │   ├── routes/          # Definirea endpoint-urilor API
│   │   └── services/        # Servicii externe (ex: integrare BestAuto)
│   ├── docker-compose.yml   # Definește serviciul de bază de date PostgreSQL
│   └── package.json
│
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

## 4. Concepte și Funcționalități Cheie

### a. Multi-Tenancy (Multi-Afacere)
- Fiecare resursă majoră (anunțuri, categorii, mesaje etc.) este legată de un `businessId`.
- Middleware-ul de autentificare (`isAuthenticated`) extrage `businessId` din token-ul JWT.
- Controller-ele backend folosesc acest `businessId` în clauzele `WHERE` ale interogărilor Prisma pentru a se asigura că un utilizator poate accesa doar datele propriei afaceri.

### b. Modelul de Date (Prisma)
Principalele entități din `schema.prisma` sunt:
- `Business`: Reprezintă o afacere client.
- `User`: Administratorul unei afaceri (cu rol `ADMIN`).
- `Category`: Categoriile în care sunt organizate anunțurile (ex: "Autoturisme", "SUV").
- `Listing`: Anunțul propriu-zis (ex: o mașină). Are status `AVAILABLE` sau `SOLD`.
- `Attribute`: O caracteristică a unei categorii (ex: "Culoare", "An fabricație").
- `AttributeGroup`: Un grup pentru atribute (ex: "Dotări", "Siguranță").
- `AttributeValue`: Valoarea unui atribut pentru un anunt specific.
- `ListingImage`: Imaginile asociate unui anunț.
- `Message`: Mesajele trimise prin formularul de contact.
- `Review`: Recenziile lăsate de clienți.

### c. Autentificare
- Se bazează pe JWT.
- La înregistrare, se creează un `Business` și un `User` de tip `ADMIN`.
- La login, se generează un token JWT care conține `userId`, `businessId` și `role`.
- Token-ul este stocat în `localStorage` pe frontend și trimis în header-ul `Authorization` la fiecare cerere către API.

### d. Gestionarea Imaginilor
1.  **Upload**: Frontend-ul trimite imaginile către backend folosind `multer`.
2.  **Procesare**: Backend-ul folosește `sharp` pentru a redimensiona imaginile și a aplica un banner/watermark (dacă este configurat).
3.  **Stocare**: Imaginile procesate sunt încărcate pe **Cloudinary**.
4.  **Referință**: URL-ul de pe Cloudinary este salvat în baza de date în tabela `ListingImage`.

### e. Rute API
- **`/api/auth`**: Înregistrare și login.
- **`/api/categories`**: CRUD pentru categorii.
- **`/api/listings`**: CRUD pentru anunțuri, inclusiv gestionarea imaginilor, marcarea ca vândut etc.
- **`/api/public`**: Endpoint-uri publice pentru afișarea anunțurilor pe un site extern, fără autentificare.
- **`/api/dashboard`**: Endpoint-uri pentru statisticile din panoul de bord.
- **`/api/business`**: Gestionarea setărilor afacerii (ex: upload banner).
- **`/api/reviews`**: Moderarea recenziilor.
- **`/api/reports`**: Generarea rapoartelor (ex: profitabilitate).

### f. Arhitectura Frontend
- **Rutare Protejată**: Componenta `ProtectedRoute` verifică existența token-ului în `localStorage` înainte de a permite accesul la paginile de administrare.
- **Data Fetching**: `react-query` este folosit pentru a prelua, cache-ui și sincroniza datele de la API, simplificând gestionarea stării de încărcare și a erorilor.
- **Modularitate**: Componentele de UI din `shadcn/ui` și componentele custom asigură o bază de cod curată și reutilizabilă.
- **Stare Globală Minimală**: Starea este gestionată în mare parte local în componente sau prin `react-query`. Nu există o librărie complexă de management al stării (precum Redux).
