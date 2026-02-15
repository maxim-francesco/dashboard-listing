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

export const onboardNewClient = async (data: OnboardingData) => {
    // 1. Register business and admin
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
    let categoryId;
    try {
        const categoryResponse = await tempApi.post('/categories', { name: 'Vehicule' });
        categoryId = categoryResponse.data.id;
    } catch(error) {
        throw new Error("Nu s-a putut crea categoria implicită (Pasul 3).");
    }

    // 4. Seed attributes for the new category
    let createdAttributes;
    try {
        const attributesToCreate = [
            { name: 'Marca', type: 'STRING' }, { name: 'Model', type: 'STRING' },
            { name: 'An', type: 'NUMBER' }, { name: 'Combustibil', type: 'STRING' },
            { name: 'Capacitate Cilindrica', type: 'NUMBER' }, { name: 'Pret', type: 'NUMBER' },
            { name: 'Kilometraj', type: 'NUMBER' }, { name: 'Putere', type: 'NUMBER' },
        ];
        const attributePromises = attributesToCreate.map(attr => tempApi.post(`/categories/${categoryId}/attributes`, attr));
        const attributeResults = await Promise.all(attributePromises);
        createdAttributes = attributeResults.map(res => res.data);
    } catch (error) {
        throw new Error("Nu s-au putut crea atributele implicite (Pasul 4).");
    }

    // 5. (Optional) Seed dummy listings
    if (data.seedData) {
        try {
            const findAttrId = (name: string) => createdAttributes.find((a: any) => a.name === name)?.id;
            const dummyListings = [
                { title: 'Dacia Logan 2021', description: 'Masina de familie, in stare buna.', categoryId, attributes: [ { attributeId: findAttrId('Marca'), value: 'Dacia' }, { attributeId: findAttrId('Model'), value: 'Logan' }, { attributeId: findAttrId('An'), value: '2021' }, { attributeId: findAttrId('Combustibil'), value: 'Benzina' }, { attributeId: findAttrId('Capacitate Cilindrica'), value: '999' }, { attributeId: findAttrId('Pret'), value: '9500' }, { attributeId: findAttrId('Kilometraj'), value: '55000' }, { attributeId: findAttrId('Putere'), value: '90' } ] },
                { title: 'BMW Seria 3 2018', description: 'Pachet M, full options.', categoryId, attributes: [ { attributeId: findAttrId('Marca'), value: 'BMW' }, { attributeId: findAttrId('Model'), value: 'Seria 3' }, { attributeId: findAttrId('An'), value: '2018' }, { attributeId: findAttrId('Combustibil'), value: 'Diesel' }, { attributeId: findAttrId('Capacitate Cilindrica'), value: '1995' }, { attributeId: findAttrId('Pret'), value: '18500' }, { attributeId: findAttrId('Kilometraj'), value: '120000' }, { attributeId: findAttrId('Putere'), value: '190' } ] },
                { title: 'Audi A4 2019', description: 'S-Line, stare impecabila.', categoryId, attributes: [ { attributeId: findAttrId('Marca'), value: 'Audi' }, { attributeId: findAttrId('Model'), value: 'A4' }, { attributeId: findAttrId('An'), value: '2019' }, { attributeId: findAttrId('Combustibil'), value: 'Diesel' }, { attributeId: findAttrId('Capacitate Cilindrica'), value: '1968' }, { attributeId: findAttrId('Pret'), value: '21000' }, { attributeId: findAttrId('Kilometraj'), value: '98000' }, { attributeId: findAttrId('Putere'), value: '150' } ] },
            ];
            const listingPromises = dummyListings.map(listing => tempApi.post('/listings', listing));
            await Promise.all(listingPromises);
        } catch (error) {
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
