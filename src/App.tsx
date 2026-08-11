import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Listings from "./pages/Listings";
import AddEditListing from "./pages/AddEditListing";
import ListingDetail from "./pages/ListingDetail";
import { Toaster as HotToaster } from "react-hot-toast";
import MessagesPage from "./pages/MessagesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import BusinessSettings from "./pages/BusinessSettings";
import AdminPrivacyPolicy from "./pages/AdminPrivacyPolicy";
import AdminTerms from "./pages/AdminTerms";
import CookieBanner from "./components/CookieBanner";
import NotFound from "./pages/NotFound";
import AdminReviewsPage from "./pages/AdminReviewsPage";
import ContractsPage from "./pages/ContractsPage";
import ReservationsPage from "./pages/ReservationsPage";
import CalendarPage from "./pages/CalendarPage";
import SchedulePage from "./pages/SchedulePage";
import ProfitabilityReport from "./pages/Reports/ProfitabilityReport";
import SuperAdmin from "./pages/SuperAdmin";
import PublicFeedPreview from "./pages/PublicFeedPreview";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import FirmaPage from "./pages/FirmaPage";
import NetworkHome from "./pages/network/NetworkHome";
import NetworkMessages from "./pages/network/NetworkMessages";
import NetworkThread from "./pages/network/NetworkThread";
import NetworkDealers from "./pages/network/NetworkDealers";
import NetworkTransport from "./pages/network/NetworkTransport";
import NetworkCars from "./pages/network/NetworkCars";
import NetworkSettings from "./pages/network/NetworkSettings";


// Blog Pages
import BlogList from "./pages/Blog/BlogList";
import BlogForm from "./pages/Blog/BlogForm";

// New Legal Pages
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HotToaster position="top-center" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          {/* --- GROUP 1: Public, Standalone Pages (No Layout) --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/politica-de-confidentialitate-admin" element={<AdminPrivacyPolicy />} />
          <Route path="/termeni-admin" element={<AdminTerms />} />
          
          {/* Public Legal Pages */}
          <Route path="/termeni-si-conditii" element={<TermsAndConditions />} />
          <Route path="/politica-de-confidentialitate" element={<PrivacyPolicy />} />
          <Route path="/politica-cookies" element={<CookiePolicy />} />
          <Route path="/public-feed/:businessId" element={<PublicFeedPreview />} />
          
          {/* --- GROUP 2: Super Admin Route (Standalone) --- */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
            <Route path="/super-admin" element={<SuperAdmin />} />
          </Route>

          {/* --- GROUP 3: Protected Pages (Inside the Main Layout) --- */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:phone" element={<CustomerDetailPage />} />
              <Route path="/reservations" element={<ReservationsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/listings/new" element={<AddEditListing />} />
              <Route path="/listings/:listingId/edit" element={<AddEditListing />} />
              <Route path="/listings/:listingId" element={<ListingDetail />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/network/setari" element={<NetworkSettings />} />
              <Route path="/network" element={<NetworkHome />} />
              <Route path="/network/messages" element={<NetworkMessages />} />
              <Route path="/network/messages/:conversationId" element={<NetworkThread />} />
              <Route path="/network/dealers" element={<NetworkDealers />} />
              <Route path="/network/transport" element={<NetworkTransport />} />
              <Route path="/network/cars" element={<NetworkCars />} />
              <Route path="/firma" element={<FirmaPage />} />
              <Route path="/reviews" element={<AdminReviewsPage />} />
              <Route path="/settings" element={<BusinessSettings />} />
              <Route path="/reports" element={<ProfitabilityReport />} />
              
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/new" element={<BlogForm />} />
              <Route path="/blog/:postId/edit" element={<BlogForm />} />
            </Route>
          </Route>

          {/* --- GROUP 4: Catch-all for any other route --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
