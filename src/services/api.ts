import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create a new axios instance
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
}

const attributeData = [
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
    
    // Create a temporary axios instance with the new user's token
    const tempApi = axios.create({
        baseURL: 'https://saas-platform-backend.onrender.com/api',
        headers: { Authorization: `Bearer ${newUserToken}` }
    });
    
    // 3. Create default category
    onProgress('Pasul 2/5: Creare categorie implicită...');
    let categoryId;
    try {
        const categoryResponse = await tempApi.post('/categories', { name: 'Vehicule' });
        categoryId = categoryResponse.data.id;
    } catch(error) {
        throw new Error("Nu s-a putut crea categoria implicită (Pasul 3).");
    }
    
    // 4. Create attribute groups
    onProgress('Pasul 3/5: Creare grupuri de atribute...');
    const groupNameToIdMap = new Map<string, string>();
    try {
        for (const group of attributeData) {
          const groupResponse = await tempApi.post('/attribute-groups', { name: group.groupName });
          groupNameToIdMap.set(group.groupName, groupResponse.data.id);
          console.log(`[Onboarding] Created group: ${group.groupName} (ID: ${groupResponse.data.id})`);
        }
    } catch (error) {
        throw new Error("Eroare la crearea grupurilor de atribute (Pasul 3).");
    }

    // 5. Seed attributes for the new category
    onProgress('Pasul 4/5: Creare atribute...');
    const allAttributes = attributeData.flatMap(g => g.attributes.map(a => ({...a, groupName: g.groupName})));
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
            onProgress(`Pasul 4/5: Se crează atributele... (${createdCount}/${allAttributes.length})`);
        }
    } catch (error) {
        throw new Error("Nu s-au putut crea atributele implicite (Pasul 4).");
    }

    // 6. (Optional) Seed dummy listings
    if (data.seedData) {
        onProgress('Pasul 5/5: Adăugare date de test...');
        try {
            const findAttrId = (name: string) => createdAttributes.find((a: any) => a.name === name)?.id;
            const dummyListings = [
                { title: 'Dacia Logan 2021', description: 'Masina de familie, in stare buna.', categoryId, attributes: [ { attributeId: findAttrId('Marca'), value: 'Dacia' }, { attributeId: findAttrId('Model'), value: 'Logan' }, { attributeId: findAttrId('An'), value: '2021' }, { attributeId: findAttrId('Combustibil'), value: 'Benzina' }, { attributeId: findAttrId('Capacitate cilindrică'), value: '999' }, { attributeId: findAttrId('Pret'), value: '9500' }, { attributeId: findAttrId('Kilometraj'), value: '55000' }, { attributeId: findAttrId('Putere (CP)'), value: '90' } ] },
                { title: 'BMW Seria 3 2018', description: 'Pachet M, full options.', categoryId, attributes: [ { attributeId: findAttrId('Marca'), value: 'BMW' }, { attributeId: findAttrId('Model'), value: 'Seria 3' }, { attributeId: findAttrId('An'), value: '2018' }, { attributeId: findAttrId('Combustibil'), value: 'Diesel' }, { attributeId: findAttrId('Capacitate cilindrică'), value: '1995' }, { attributeId: findAttrId('Pret'), value: '18500' }, { attributeId: findAttrId('Kilometraj'), value: '120000' }, { attributeId: findAttrId('Putere (CP)'), value: '190' } ] },
                { title: 'Audi A4 2019', description: 'S-Line, stare impecabila.', categoryId, attributes: [ { attributeId: findAttrId('Marca'), value: 'Audi' }, { attributeId: findAttrId('Model'), value: 'A4' }, { attributeId: findAttrId('An'), value: '2019' }, { attributeId: findAttrId('Combustibil'), value: 'Diesel' }, { attributeId: findAttrId('Capacitate cilindrică'), value: '1968' }, { attributeId: findAttrId('Pret'), value: '21000' }, { attributeId: findAttrId('Kilometraj'), value: '98000' }, { attributeId: findAttrId('Putere (CP)'), value: '150' } ] },
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


export default api;
