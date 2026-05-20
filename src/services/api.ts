import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create a new axios instance
console.log("[DEBUG] API Service Loaded - Version: 1.0.2 - Path: dashboard-listing/src/services/api.ts");
const api = axios.create({
  baseURL: 'https://saas-platform-backend.onrender.com/api'
});

// Use an interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface OnboardingData {
    businessName: string;
    email: string;
    password: string;
    seedData: boolean;
    vertical: 'auto' | 'imobiliare';
}

const autoAttributeData = [
  {
    groupName: "Informații Tehnice",
    attributes: [
      { name: "Combustibil", type: "STRING" },
      { name: "Capacitate cilindrică", type: "NUMBER" },
      { name: "Putere (CP)", type: "NUMBER" },
      { name: "Cutie de viteze", type: "STRING" },
      { name: "Norma de poluare", type: "STRING" },
      { name: "Emisii CO2", type: "NUMBER" },
      { name: "Consum mixt", type: "NUMBER" },
      { name: "Tracțiune", type: "STRING" },
    ],
  },
  {
    groupName: "Confort și Interior",
    attributes: [
      { name: "Număr locuri", type: "NUMBER" },
      { name: "Tapiterie", type: "STRING" },
      { name: "Climatizare", type: "STRING" },
      { name: "Scaune încălzite", type: "BOOLEAN" },
      { name: "Sistem Navigație", type: "BOOLEAN" },
      { name: "Apple CarPlay/Android Auto", type: "BOOLEAN" },
      { name: "Trapă / Panoramă", type: "BOOLEAN" },
      { name: "Geamuri electrice", type: "BOOLEAN" },
    ],
  },
  {
    groupName: "Siguranță și Sisteme Ajutătoare",
    attributes: [
        { name: "Senzori parcare", type: "STRING" },
        { name: "Pilot Automat (Cruise Control)", type: "BOOLEAN" },
        { name: "ABS/ESP", type: "BOOLEAN" },
        { name: "Asistență bandă (Lane Assist)", type: "BOOLEAN" },
        { name: "Frânare de urgență (Pre-Safe)", type: "BOOLEAN" },
        { name: "Senzori ploaie/lumini", type: "BOOLEAN" },
        { name: "Faruri", type: "STRING" },
    ]
  },
  {
      groupName: "Istoric și Stare",
      attributes: [
        { name: "Primul proprietar", type: "BOOLEAN" },
        { name: "Fără accident în istoric", type: "BOOLEAN" },
        { name: "Carte service", type: "BOOLEAN" },
        { name: "TVA deductibil", type: "BOOLEAN" },
        { name: "Garanție (luni)", type: "NUMBER" },
        { name: "Pret", type: "NUMBER" },
        { name: "An", type: "NUMBER" },
        { name: "Marca", type: "STRING" },
        { name: "Model", type: "STRING" },
        { name: "Kilometraj", type: "NUMBER" },
      ]
  }
];

const imobiliareAttributeData = [
  {
    groupName: "Detalii Generale",
    attributes: [
      { name: "Tip proprietate", type: "STRING" },
      { name: "Status", type: "STRING" },
      { name: "Compartimentare", type: "STRING" },
      { name: "Etaj", type: "NUMBER" },
      { name: "Suprafata Utila", type: "NUMBER" },
      { name: "An Constructie", type: "NUMBER" },
    ],
  },
  {
    groupName: "Interior & Dotari",
    attributes: [
      { name: "Numar Camere", type: "NUMBER" },
      { name: "Numar Bai", type: "NUMBER" },
      { name: "Numar Balcoane", type: "NUMBER" },
      { name: "Mobilat", type: "STRING" },
      { name: "Incalzire", type: "STRING" },
      { name: "Aer Conditionat", type: "BOOLEAN" },
    ],
  },
  {
    groupName: "Facilitati Cladire",
    attributes: [
      { name: "Loc parcare", type: "BOOLEAN" },
      { name: "Lift", type: "BOOLEAN" },
      { name: "Paza/Supraveghere", type: "BOOLEAN" },
      { name: "Gradina/Curte", type: "BOOLEAN" },
      { name: "Piscina", type: "BOOLEAN" },
    ],
  },
  {
    groupName: "Localizare & Vecinatati",
    attributes: [
      { name: "Orientare", type: "STRING" },
      { name: "Distanta Metrou", type: "NUMBER" },
      { name: "Distanta Centru", type: "NUMBER" },
      { name: "Zona linistita", type: "BOOLEAN" },
    ],
  },
  {
    groupName: "Finante & Juridic",
    attributes: [
      { name: "Pret", type: "NUMBER" },
      { name: "Comision", type: "NUMBER" },
      { name: "Moneda", type: "STRING" },
      { name: "Disponibilitate", type: "STRING" },
      { name: "Certificat energetic", type: "STRING" },
      { name: "Credit ipotecar acceptat", type: "BOOLEAN" },
    ],
  },
];


export const onboardNewClient = async (
    data: OnboardingData,
    onProgress: (message: string) => void
) => {
    // 1. Register business and admin
    onProgress('Pasul 1/5: Înregistrare business și admin...');
    try {
        await api.post('/auth/register', {
            businessName: data.businessName,
            email: data.email,
            password: data.password,
        });
    } catch(error: any) {
        throw new Error(error.response?.data?.message || "Eroare la înregistrarea afacerii (Pasul 1).");
    }

    // 2. Login as the new admin to get their token
    onProgress('Pasul 2/5: Autentificare temporară...');
    let newUserToken;
    try {
        const loginResponse = await api.post('/auth/login', {
            email: data.email,
            password: data.password,
        });
        newUserToken = loginResponse.data.token;
    } catch (error: any) {
        throw new Error("Nu s-a putut autentifica noul client pentru configurare (Pasul 2).");
    }
    
    const tempApi = axios.create({
        baseURL: 'https://saas-platform-backend.onrender.com/api',
        headers: { Authorization: `Bearer ${newUserToken}` }
    });
    
    // 3. Create default category based on vertical
    const isAuto = data.vertical === 'auto';
    const categoryName = isAuto ? 'Vehicule' : 'Proprietăți';
    onProgress(`Pasul 3/5: Creare categorie implicită ('${categoryName}')...`);
    let categoryId;
    try {
        const categoryResponse = await tempApi.post('/categories', { name: categoryName });
        categoryId = categoryResponse.data.id;
    } catch(error) {
        throw new Error("Nu s-a putut crea categoria implicită (Pasul 3).");
    }
    
    // 4. Create attribute groups
    const attributeGroupsToSeed = isAuto ? autoAttributeData : imobiliareAttributeData;
    onProgress('Pasul 4/5: Creare grupuri de atribute...');
    const groupNameToIdMap = new Map<string, string>();
    try {
        for (const group of attributeGroupsToSeed) {
          const groupResponse = await tempApi.post('/attribute-groups', { name: group.groupName });
          groupNameToIdMap.set(group.groupName, groupResponse.data.id);
          console.log(`[Onboarding] Created group: ${group.groupName} (ID: ${groupResponse.data.id})`);
        }
    } catch (error) {
        throw new Error("Eroare la crearea grupurilor de atribute (Pasul 4).");
    }

    // 5. Seed attributes for the new category
    onProgress('Pasul 5/5: Creare atribute...');
    const allAttributes = attributeGroupsToSeed.flatMap(g => g.attributes.map(a => ({...a, groupName: g.groupName})));
    let createdCount = 0;
    let createdAttributes: any[] = [];
    try {
        for (const attr of allAttributes) {
            const attributeGroupId = groupNameToIdMap.get(attr.groupName);
            const response = await tempApi.post(`/categories/${categoryId}/attributes`, {
                name: attr.name,
                type: attr.type,
                attributeGroupId: attributeGroupId
            });
            createdAttributes.push(response.data);
            createdCount++;
            onProgress(`Pasul 5/5: Se crează atributele... (${createdCount}/${allAttributes.length})`);
        }
    } catch (error) {
        throw new Error("Nu s-au putut crea atributele implicite (Pasul 5).");
    }

    // 6. (Optional) Seed dummy listings
    if (data.seedData) {
        onProgress('Pasul final: Adăugare date de test...');
        try {
            const findAttrId = (name: string) => createdAttributes.find((a: any) => a.name === name)?.id;
            
            const dummyListings = isAuto ? [
                { title: 'Dacia Logan 2021', description: 'Masina de familie, in stare buna.', categoryId, attributes: [ { attributeId: findAttrId('Marca'), value: 'Dacia' }, { attributeId: findAttrId('Model'), value: 'Logan' }, { attributeId: findAttrId('An'), value: '2021' }, { attributeId: findAttrId('Combustibil'), value: 'Benzina' }, { attributeId: findAttrId('Capacitate cilindrică'), value: '999' }, { attributeId: findAttrId('Pret'), value: '9500' }, { attributeId: findAttrId('Kilometraj'), value: '55000' }, { attributeId: findAttrId('Putere (CP)'), value: '90' } ] },
                { title: 'BMW Seria 3 2018', description: 'Pachet M, full options.', categoryId, attributes: [ { attributeId: findAttrId('Marca'), value: 'BMW' }, { attributeId: findAttrId('Model'), value: 'Seria 3' }, { attributeId: findAttrId('An'), value: '2018' }, { attributeId: findAttrId('Combustibil'), value: 'Diesel' }, { attributeId: findAttrId('Capacitate cilindrică'), value: '1995' }, { attributeId: findAttrId('Pret'), value: '18500' }, { attributeId: findAttrId('Kilometraj'), value: '120000' }, { attributeId: findAttrId('Putere (CP)'), value: '190' } ] },
                { title: 'Audi A4 2019', description: 'S-Line, stare impecabila.', categoryId, attributes: [ { attributeId: findAttrId('Marca'), value: 'Audi' }, { attributeId: findAttrId('Model'), value: 'A4' }, { attributeId: findAttrId('An'), value: '2019' }, { attributeId: findAttrId('Combustibil'), value: 'Diesel' }, { attributeId: findAttrId('Capacitate cilindrică'), value: '1968' }, { attributeId: findAttrId('Pret'), value: '21000' }, { attributeId: findAttrId('Kilometraj'), value: '98000' }, { attributeId: findAttrId('Putere (CP)'), value: '150' } ] },
            ] : [
                { title: 'Apartament 2 camere, Manastur', description: 'Apartament modern, complet mobilat.', categoryId, attributes: [ { attributeId: findAttrId('Tip proprietate'), value: 'Apartament' }, { attributeId: findAttrId('Numar Camere'), value: '2' }, { attributeId: findAttrId('An Constructie'), value: '2019' }, { attributeId: findAttrId('Suprafata Utila'), value: '55' }, { attributeId: findAttrId('Pret'), value: '125000' }, { attributeId: findAttrId('Etaj'), value: '3' } ] },
                { title: 'Casa individuala, Buna Ziua', description: 'Curte proprie, finisaje de lux.', categoryId, attributes: [ { attributeId: findAttrId('Tip proprietate'), value: 'Casa' }, { attributeId: findAttrId('Numar Camere'), value: '5' }, { attributeId: findAttrId('An Constructie'), value: '2020' }, { attributeId: findAttrId('Suprafata Utila'), value: '180' }, { attributeId: findAttrId('Pret'), value: '450000' }, { attributeId: findAttrId('Gradina/Curte'), value: true } ] },
                { title: 'Teren intravilan, Faget', description: 'Teren construibil cu panorama superba.', categoryId, attributes: [ { attributeId: findAttrId('Tip proprietate'), value: 'Teren' }, { attributeId: findAttrId('Suprafata Utila'), value: '1000' }, { attributeId: findAttrId('Pret'), value: '150000' } ] },
            ];

            const listingPromises = dummyListings.map(listing => tempApi.post('/listings', listing));
            await Promise.all(listingPromises);
        } catch (error) {
            console.error(error);
            throw new Error("Nu s-au putut adăuga anunțurile de test (Pasul 5).");
        }
    }
    
    return { success: true };
};


export const rotateImage = async (imageId: string, angle: number) => {
  const response = await api.put(`/images/${imageId}/rotate`, { angle });
  return response.data;
};

export const deleteBanner = async () => {
  const response = await api.delete('/business/banner');
  return response.data;
};

export const getSoldListings = async () => {
  const response = await api.get('/listings/status/sold');
  return response.data;
};

export const markListingAsSold = (
  listingId: string, 
  saleData: { sellingPrice: number; soldAt: string }
) => {
  return api.put(`/listings/${listingId}/sell`, saleData);
};

export const reactivateListing = (listingId: string) => {
  return api.put(`/listings/${listingId}/reactivate`);
};

export const deleteListing = (listingId: string) => {
    return api.delete(`/listings/${listingId}`);
};

// --- NEW SUPER ADMIN FUNCTIONS ---

// NOTE: These endpoints are assumed to exist and be protected by a SUPER_ADMIN role middleware on the backend.
export const getPlatformStats = async () => {
  const response = await api.get('/super-admin/stats');
  return response.data;
}

export const getAllBusinesses = async () => {
  const response = await api.get('/super-admin/businesses');
  return response.data;
}

// Autovit Integration
export const getAutovitStatus = (listingId: string) =>
  api.get(`/autovit/${listingId}/status`);

export const publishToAutovit = (listingId: string) =>
  api.post(`/autovit/${listingId}/activate`);

export const unpublishFromAutovit = (listingId: string) =>
  api.post(`/autovit/${listingId}/deactivate`);

export const exportToOLX = (listingId: string) =>
  api.post(`/autovit/${listingId}/export-olx`);

export const publishToAutovitAndOLX = (listingId: string) =>
  api.post(`/autovit/${listingId}/publish`);


// Messages
export const toggleMessageRead = (messageId: string, isRead: boolean) =>
  api.patch(`/messages/${messageId}/read`, { isRead });

export const deleteMessage = (messageId: string) =>
  api.delete(`/messages/${messageId}`);

export const resetViewsForListing = (listingId: string) =>
  api.delete(`/views/listing/${listingId}`);

// ── BLOG ──────────────────────────────────────────

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  categoryKey: string
  readTime: string
  coverImage: string | null
  publishedAt: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  businessId: string
}

export interface CreateBlogPostData {
  title: string
  excerpt: string
  content: string
  category: string
  categoryKey: string
  readTime: string
  coverImage?: string | null
  isPublished: boolean
}

// Get all posts (admin)
export const getBlogPosts = async (): Promise<BlogPost[]> => {
  const { data } = await api.get('/blog')
  return data
}

// Create post
export const createBlogPost = async (postData: CreateBlogPostData): Promise<BlogPost> => {
  const { data } = await api.post('/blog', postData)
  return data
}

// Update post
export const updateBlogPost = async (postId: string, postData: Partial<CreateBlogPostData>): Promise<BlogPost> => {
  const { data } = await api.put(`/blog/${postId}`, postData)
  return data
}

// Delete post
export const deleteBlogPost = async (postId: string): Promise<void> => {
  await api.delete(`/blog/${postId}`)
}

export default api;