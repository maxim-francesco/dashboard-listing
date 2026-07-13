import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create a new axios instance
console.log("[DEBUG] API Service Loaded - Version: 1.0.2 - Path: dashboard-listing/src/services/api.ts");
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (!apiBaseUrl) {
  console.error("CRITICAL ERROR: VITE_API_BASE_URL is not defined in environment variables!");
  throw new Error("CRITICAL ERROR: VITE_API_BASE_URL is not defined in environment variables!");
}
const api = axios.create({
  baseURL: apiBaseUrl
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

export const onboardNewClient = async (
    data: OnboardingData,
    onProgress: (message: string) => void
) => {
    // 1. Register business and admin
    onProgress('Pasul 1/3: Înregistrare business și admin...');
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
    onProgress('Pasul 2/3: Autentificare temporară...');
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
        baseURL: apiBaseUrl,
        headers: { Authorization: `Bearer ${newUserToken}` }
    });
    
    // 3. Seed dummy listings if requested
    if (data.seedData) {
        onProgress('Pasul 3/3: Adăugare date de test...');
        try {
            const dummyListings = [
                { 
                    title: 'Dacia Logan 2021', 
                    description: 'Mașină de familie, în stare bună.', 
                    price: 9500, 
                    year: 2021, 
                    mileage: 55000, 
                    fuelType: 'PETROL', 
                    gearbox: 'MANUAL',
                    bodyType: 'SEDAN',
                    status: 'AVAILABLE'
                },
                { 
                    title: 'BMW Seria 3 2018', 
                    description: 'Pachet M, full options.', 
                    price: 18500, 
                    year: 2018, 
                    mileage: 120000, 
                    fuelType: 'DIESEL', 
                    gearbox: 'AUTOMATIC',
                    bodyType: 'SEDAN',
                    status: 'AVAILABLE'
                },
                { 
                    title: 'Audi A4 2019', 
                    description: 'S-Line, stare impecabilă.', 
                    price: 21000, 
                    year: 2019, 
                    mileage: 98000, 
                    fuelType: 'DIESEL', 
                    gearbox: 'AUTOMATIC',
                    bodyType: 'BREAK',
                    status: 'AVAILABLE'
                },
            ];

            const listingPromises = dummyListings.map(listing => tempApi.post('/listings', listing));
            await Promise.all(listingPromises);
        } catch (error) {
            console.error(error);
            throw new Error("Nu s-au putut adăuga anunțurile de test (Pasul 3).");
        }
    } else {
        onProgress('Pasul 3/3: Finalizare configurare...');
    }
    
    return { success: true };
};

// --- CATALOG API FUNCTIONS ---
export const getMakes = async () => {
  const response = await api.get('/catalog/makes');
  return response.data;
};

export const getModelsByMake = async (makeId: string) => {
  const response = await api.get(`/catalog/makes/${makeId}/models`);
  return response.data;
};

export const getFeatures = async () => {
  const response = await api.get('/catalog/features');
  return response.data;
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