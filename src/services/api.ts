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
export interface CreateManualLeadData {
  name?: string;
  phone: string;
  email?: string;
  message?: string;
  type?: 'GENERAL' | 'STOCK' | 'ORDER' | 'BUYBACK';
  listingId?: string | null;
}

export const createManualLead = async (payload: CreateManualLeadData): Promise<any> => {
  const response = await api.post("/messages", payload);
  return response.data;
};

export interface CreateOfferPayload {
  listingId: string;
  clientName: string;
  clientPhone: string;
  offerPrice: number;
  listPrice?: number | null;
  validityDays: number;
}
export interface CreateOfferResponse {
  token: string;
  publicUrl: string;
  expiresAt: string;
}
export const createOffer = async (payload: CreateOfferPayload): Promise<CreateOfferResponse> => {
  const { data } = await api.post('/offers', payload);
  return data as CreateOfferResponse;
};

export interface CreateContractPayload {
  listingId: string;
  buyerType: "INDIVIDUAL" | "COMPANY";
  buyerName: string;
  buyerAddress?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerCnp?: string;
  buyerCiSeries?: string;
  buyerCiNumber?: string;
  buyerCui?: string;
  buyerRegCom?: string;
  buyerLegalRep?: string;
  salePrice: number;
  saleDate: string;
  plateNumber?: string;
  mileageAtSale?: number;
  clauses?: string;
}
export interface CreateContractResponse {
  id: string;
  contractNumber: number;
  code: string;
}
export const createContract = async (payload: CreateContractPayload): Promise<CreateContractResponse> => {
  const { data } = await api.post('/contracts', payload);
  return data as CreateContractResponse;
};

export interface CreateReservationPayload {
  listingId: string;
  clientName: string;
  clientPhone: string;
  depositAmount: number;
  reservationDays: number;
}
export const createReservation = async (payload: CreateReservationPayload): Promise<{ id: string; expiresAt: string }> => {
  const { data } = await api.post('/reservations', payload);
  return data;
};

export interface ContractListItem {
  id: string;
  contractNumber: number;
  salePrice: number;
  saleDate: string;
  plateNumber: string | null;
  handoverDate: string | null;
  code: string | null;
  createdAt: string;
  buyer: { name: string; type: "INDIVIDUAL" | "COMPANY" } | null;
  vehicleSnapshot: any;
}
export const getContracts = async (): Promise<ContractListItem[]> => {
  const { data } = await api.get('/contracts');
  return data as ContractListItem[];
};
export const getContract = async (id: string): Promise<any> => {
  const { data } = await api.get(`/contracts/${id}`);
  return data;
};

export interface CustomerListItem {
  phone: string;
  name: string;
  contractsCount: number;
  reservationsCount: number;
  appointmentsCount: number;
  messagesCount: number;
  purchasedCars: string[];
  lastInteraction: string;
  sources: string[];
}
export const getCustomers = async (): Promise<CustomerListItem[]> => {
  const { data } = await api.get('/customers');
  return data as CustomerListItem[];
};
export const getCustomer = async (phone: string): Promise<any> => {
  const { data } = await api.get(`/customers/${phone}`);
  return data;
};

export interface ReservationItem {
  id: string;
  clientName: string;
  clientPhone: string;
  depositAmount: number;
  startDate: string;
  expiresAt: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  createdAt: string;
  listing: { id: string; title: string; status: string } | null;
}
export const getReservations = async (): Promise<ReservationItem[]> => {
  const { data } = await api.get('/reservations');
  return data as ReservationItem[];
};
export const completeReservation = async (id: string): Promise<any> => {
  const { data } = await api.patch(`/reservations/${id}/complete`);
  return data;
};
export const cancelReservation = async (id: string): Promise<any> => {
  const { data } = await api.patch(`/reservations/${id}/cancel`);
  return data;
};
export interface HandoverPayload {
  handoverDate?: string | null;
  handoverMileage?: number | null;
  handoverNotes?: string | null;
  handoverItems?: any;
}
export const updateHandover = async (id: string, payload: HandoverPayload): Promise<any> => {
  const { data } = await api.patch(`/contracts/${id}/handover`, payload);
  return data;
};

export const toggleMessageRead = (messageId: string, isRead: boolean) =>
  api.patch(`/messages/${messageId}/read`, { isRead });


export const deleteMessage = (messageId: string) =>
  api.delete(`/messages/${messageId}`);

export interface MessageActivity {
  id: string;
  messageId: string;
  kind: 'CREATED' | 'STATUS_CHANGED' | 'TYPE_CHANGED' | 'NOTE' | 'REMINDER_SET' | 'REMINDER_CLEARED' | 'LINKED_LISTING';
  fromValue: string | null;
  toValue: string | null;
  body: string | null;
  authorId: string | null;
  createdAt: string;
}

export interface ListingImage {
  id: string;
  url: string;
  order: number;
}

export interface LinkedListing {
  id: string;
  title: string;
  price: number | null;
  images: ListingImage[];
  slug: string | null;
  publicUrl?: string | null;
}

export interface MessageDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'GENERAL' | 'STOCK' | 'ORDER' | 'BUYBACK';
  status: 'NEW' | 'CONTACTED' | 'VIEWING' | 'OFFER' | 'WON' | 'LOST';
  lostReason: 'PRICE' | 'BOUGHT_ELSEWHERE' | 'UNREACHABLE' | 'NOT_SERIOUS' | 'OTHER' | null;
  reminderAt: string | null;
  listingId: string | null;
  listing: LinkedListing | null;
  activities: MessageActivity[];
}

export const getMessageDetail = async (id: string): Promise<MessageDetail> => {
  const response = await api.get(`/messages/${id}`);
  return response.data;
};

export const updateMessageStatus = async (
  id: string,
  payload: { status: 'NEW' | 'CONTACTED' | 'VIEWING' | 'OFFER' | 'WON' | 'LOST'; lostReason?: 'PRICE' | 'BOUGHT_ELSEWHERE' | 'UNREACHABLE' | 'NOT_SERIOUS' | 'OTHER' | null }
): Promise<any> => {
  const response = await api.patch(`/messages/${id}/status`, payload);
  return response.data;
};

export const updateMessage = async (
  id: string,
  payload: { type?: 'GENERAL' | 'STOCK' | 'ORDER' | 'BUYBACK'; listingId?: string | null }
): Promise<any> => {
  const response = await api.patch(`/messages/${id}`, payload);
  return response.data;
};

export const createMessageNote = async (
  id: string,
  payload: { body: string }
): Promise<any> => {
  const response = await api.post(`/messages/${id}/notes`, payload);
  return response.data;
};

export const updateMessageReminder = async (
  id: string,
  payload: { reminderAt: string | null }
): Promise<any> => {
  const response = await api.patch(`/messages/${id}/reminder`, payload);
  return response.data;
};

export const suggestReply = async (messageId: string) => {
  const { data } = await api.post(`/messages/${messageId}/suggest-reply`)
  return data as { reply: string }
}

export const getActiveListings = async (): Promise<any[]> => {
  const response = await api.get('/listings');
  return response.data;
};

export interface MessageCounts {
  actionNeeded: number;
  unread: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

export const getMessageCounts = async (): Promise<MessageCounts> => {
  const response = await api.get('/messages/counts');
  return response.data;
};


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

export async function generateDescription(payload: any) {
  const res = await api.post('/ai/generate-description', payload);
  return res.data;
}

export interface GenerateArticleData { template: string; topic?: string }
export const generateArticle = async (payload: GenerateArticleData) => {
  const { data } = await api.post('/ai/generate-article', payload)
  return data as { title: string; excerpt: string; content: string; category: string; categoryKey: string; readTime: string }
}

export const suggestTopics = async () => {
  const { data } = await api.post('/ai/suggest-topics', {})
  return data as { suggestions: string[] }
}

export type AppointmentType = "TEST_DRIVE" | "VIEWING" | "HANDOVER" | "MEETING" | "OTHER";
export interface Appointment {
  id: string;
  title: string;
  type: AppointmentType;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  startAt: string;
  endAt: string;
  clientName: string | null;
  clientPhone: string | null;
  listingId: string | null;
  notes: string | null;
  listing?: { id: string; title: string } | null;
}
export const getAppointments = async (params?: { start?: string; end?: string }): Promise<Appointment[]> => {
  const { data } = await api.get('/appointments', { params });
  return data as Appointment[];
};
export interface AppointmentPayload {
  title: string;
  type: AppointmentType;
  startAt: string;
  endAt: string;
  clientName?: string | null;
  clientPhone?: string | null;
  listingId?: string | null;
  notes?: string | null;
}
export const createAppointment = async (payload: AppointmentPayload): Promise<Appointment> => {
  const { data } = await api.post('/appointments', payload);
  return data as Appointment;
};
export const updateAppointment = async (id: string, payload: Partial<AppointmentPayload> & { status?: string }): Promise<Appointment> => {
  const { data } = await api.patch(`/appointments/${id}`, payload);
  return data as Appointment;
};
export const deleteAppointment = async (id: string): Promise<any> => {
  const { data } = await api.delete(`/appointments/${id}`);
  return data;
};

export interface NetworkSettings {
  networkEnabled: boolean;
  city: string | null;
  networkDisplayName: string | null;
  networkContactPhone: string | null;
  networkContactEmail: string | null;
  name: string;
}

export interface NetworkDealer {
  id: string;
  name: string;
  city: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}

export const getNetworkSettings = async (): Promise<NetworkSettings> => (await api.get('/network/settings')).data;

export const updateNetworkSettings = async (payload: Partial<Pick<NetworkSettings,
  'networkEnabled'|'city'|'networkDisplayName'|'networkContactPhone'|'networkContactEmail'>>):
  Promise<NetworkSettings> => (await api.patch('/network/settings', payload)).data;

export const getNetworkDealers = async (): Promise<NetworkDealer[]> => (await api.get('/network/dealers')).data;

// ── TRANSPORT BOARD ────────────────────────────────
export interface TransportOwner {
  id: string;
  name: string;
  city: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}

export interface TransportRun {
  id: string;
  kind: 'OFFER' | 'REQUEST';
  transportType: 'PLATFORM_OPEN' | 'ENCLOSED' | 'TARP' | null;
  acceptsNonRunning: boolean;
  fromCountry: string | null;
  departureDateEnd: string | null;
  fromCity: string;
  toCity: string;
  departureDate: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerCar: number | null;
  notes: string | null;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  owner: TransportOwner | null;
  interestCount?: number;
}

export interface TransportInterest {
  id: string;
  seatsRequested: number;
  note: string | null;
  isSeen: boolean;
  createdAt: string;
  dealer: TransportOwner | null;
}

export const getTransportRuns = async (params?: {
  fromCity?: string;
  toCity?: string;
  dateFrom?: string;
  dateTo?: string;
  kind?: 'OFFER' | 'REQUEST';
  fromCountry?: string;
}): Promise<TransportRun[]> => {
  const cleanedParams = { ...params };
  if (!cleanedParams.kind || (cleanedParams.kind as any) === 'all' || (cleanedParams.kind as any) === '') {
    delete cleanedParams.kind;
  }
  if (!cleanedParams.fromCountry || cleanedParams.fromCountry === 'all' || cleanedParams.fromCountry === '') {
    delete cleanedParams.fromCountry;
  }
  const { data } = await api.get('/network/transport', { params: cleanedParams });
  return data as TransportRun[];
};

export const getMyTransportRuns = async (): Promise<TransportRun[]> => {
  const { data } = await api.get('/network/transport/mine');
  return data as TransportRun[];
};

export const createTransportRun = async (payload: {
  kind: 'OFFER' | 'REQUEST';
  transportType?: string | null;
  acceptsNonRunning?: boolean;
  fromCountry?: string | null;
  departureDateEnd?: string | null;
  fromCity: string;
  toCity: string;
  departureDate: string;
  seatsTotal: number;
  pricePerCar?: number | null;
  notes?: string | null;
}): Promise<TransportRun> => {
  const { data } = await api.post('/network/transport', payload);
  return data as TransportRun;
};

export const expressTransportInterest = async (
  runId: string,
  payload: { seatsRequested: number; note?: string | null }
): Promise<any> => {
  const { data } = await api.post(`/network/transport/${runId}/interest`, payload);
  return data;
};

export const getTransportRunInterests = async (runId: string): Promise<TransportInterest[]> => {
  const { data } = await api.get(`/network/transport/${runId}/interests`);
  return data as TransportInterest[];
};

export const updateTransportRun = async (
  id: string,
  payload: {
    status?: "OPEN" | "CLOSED";
    seatsAvailable?: number;
    notes?: string | null;
    pricePerCar?: number | null;
  }
): Promise<TransportRun> => {
  const { data } = await api.patch(`/network/transport/${id}`, payload);
  return data as TransportRun;
};

export const deleteTransportRun = async (id: string): Promise<void> => {
  await api.delete(`/network/transport/${id}`);
};

export const getTransportInterestsCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get('/network/transport/interests/count');
  return data as { count: number };
};

export const getConversations = async (): Promise<ConversationSummary[]> => {
  const { data } = await api.get('/network/conversations');
  return data as ConversationSummary[];
};

export const getOrCreateConversation = async (payload: {
  otherBusinessId: string;
  contextType?: "GENERAL" | "TRANSPORT" | "TRADE";
  contextId?: string | null;
}): Promise<ConversationSummary> => {
  const { data } = await api.post('/network/conversations', payload);
  return data as ConversationSummary;
};

export const getConversationMessages = async (id: string): Promise<DealerMessage[]> => {
  const { data } = await api.get(`/network/conversations/${id}/messages`);
  return data as DealerMessage[];
};

export const sendConversationMessage = async (
  id: string,
  payload: { body: string }
): Promise<DealerMessage> => {
  const { data } = await api.post(`/network/conversations/${id}/messages`, payload);
  return data as DealerMessage;
};

export const getConversationsUnreadCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get('/network/conversations/unread/count');
  return data as { count: number };
};

export interface ConversationDealer {
  id: string;
  name: string;
  city: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}

export interface ConversationSummary {
  id: string;
  contextType: "GENERAL" | "TRANSPORT" | "TRADE";
  contextId: string | null;
  lastMessageAt: string;
  createdAt: string;
  otherDealer: ConversationDealer;
  unreadCount: number;
  lastMessage: {
    body: string;
    createdAt: string;
    fromMe: boolean;
  } | null;
}

export interface DealerMessage {
  id: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  fromMe: boolean;
}

// ── B2B TRADE API TYPES ──
export interface TradeCar {
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  fuelType: string | null;
  gearbox: string | null;
  bodyType: string | null;
  price: number | null;
  image: string | null;
}

export interface TradeListing {
  id: string;
  listingId: string;
  b2bPrice: number | null;
  acceptsTrade: boolean;
  note: string | null;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
  car: TradeCar;
  owner: {
    id: string;
    name: string;
    city: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
  } | null;
}

export interface SlowStockItem {
  listingId: string;
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  price: number | null;
  image: string | null;
  daysInStock: number;
  isExposed: boolean;
  tradeStatus: "ACTIVE" | "CLOSED" | null;
}

// ── B2B TRADE API FUNCTIONS ──
export const getSlowStock = async (days?: number): Promise<SlowStockItem[]> => {
  const { data } = await api.get('/network/trade/slow-stock', { params: { days } });
  return data as SlowStockItem[];
};

export const exposeTradeListing = async (payload: {
  listingId: string;
  b2bPrice?: number | null;
  acceptsTrade?: boolean;
  note?: string | null;
}): Promise<TradeListing> => {
  const { data } = await api.post('/network/trade/expose', payload);
  return data as TradeListing;
};

export const getMyTradeListings = async (): Promise<TradeListing[]> => {
  const { data } = await api.get('/network/trade/mine');
  return data as TradeListing[];
};

export const browseTradeListings = async (params?: {
  acceptsTrade?: boolean;
  priceMax?: number;
  make?: string;
}): Promise<TradeListing[]> => {
  const { data } = await api.get('/network/trade', { params });
  return data as TradeListing[];
};

export const updateTradeListing = async (
  id: string,
  payload: {
    b2bPrice?: number | null;
    acceptsTrade?: boolean;
    note?: string | null;
    status?: "ACTIVE" | "CLOSED";
  }
): Promise<TradeListing> => {
  const { data } = await api.patch(`/network/trade/${id}`, payload);
  return data as TradeListing;
};

export const unexposeTradeListing = async (id: string): Promise<void> => {
  await api.delete(`/network/trade/${id}`);
};

// ── B2B TRADE NEGOTIATIONS TYPES ──
export interface TradeProposalItem {
  id: string;
  kind: "BUY" | "EXCHANGE";
  offeredPrice: number | null;
  note: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "SUPERSEDED";
  createdAt: string;
  fromMe: boolean;
  proposer: {
    id: string;
    name: string;
    city: string | null;
  } | null;
  offeredCar: {
    title: string;
    make: string | null;
    model: string | null;
    year: number | null;
    mileage: number | null;
    price: number | null;
    image: string | null;
  } | null;
}

export interface NegotiationSummary {
  id: string;
  status: "OPEN" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  role: "SELLER" | "BUYER";
  car: {
    title: string;
    make: string | null;
    model: string | null;
    year: number | null;
    mileage: number | null;
    price: number | null;
    image: string | null;
  } | null;
  tradeListingId: string;
  tradeListingStatus: "ACTIVE" | "CLOSED" | null;
  counterparty: {
    id: string;
    name: string;
    city: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
  } | null;
  latestProposal: TradeProposalItem | null;
  awaitingMyResponse: boolean;
}

export interface NegotiationDetail extends NegotiationSummary {
  proposals: TradeProposalItem[];
}

// ── B2B TRADE NEGOTIATIONS FUNCTIONS ──
export const createProposal = async (payload: {
  tradeListingId: string;
  kind: "BUY" | "EXCHANGE";
  offeredPrice?: number | null;
  offeredListingId?: string | null;
  note?: string | null;
}): Promise<any> => {
  const { data } = await api.post('/network/trade/negotiations', payload);
  return data;
};

export const getNegotiations = async (): Promise<NegotiationSummary[]> => {
  const { data } = await api.get('/network/trade/negotiations');
  return data as NegotiationSummary[];
};

export const getNegotiation = async (id: string): Promise<NegotiationDetail> => {
  const { data } = await api.get(`/network/trade/negotiations/${id}`);
  return data as NegotiationDetail;
};

export const acceptNegotiation = async (id: string): Promise<any> => {
  const { data } = await api.post(`/network/trade/negotiations/${id}/accept`);
  return data;
};

export const declineNegotiation = async (id: string): Promise<any> => {
  const { data } = await api.post(`/network/trade/negotiations/${id}/decline`);
  return data;
};

export const counterNegotiation = async (
  id: string,
  payload: {
    kind: "BUY" | "EXCHANGE";
    offeredPrice?: number | null;
    offeredListingId?: string | null;
    note?: string | null;
  }
): Promise<any> => {
  const { data } = await api.post(`/network/trade/negotiations/${id}/counter`, payload);
  return data;
};

export const cancelNegotiation = async (id: string): Promise<any> => {
  const { data } = await api.post(`/network/trade/negotiations/${id}/cancel`);
  return data;
};

export const getPendingProposalsCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get('/network/trade/negotiations/pending/count');
  return data as { count: number };
};

export default api;