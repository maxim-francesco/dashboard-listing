import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import CategoryAttributes from "./pages/CategoryAttributes";
import Listings from "./pages/Listings";
import AddEditListing from "./pages/AddEditListing";
import { Toaster as HotToaster } from "react-hot-toast";
import MessagesPage from "./pages/MessagesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import BusinessSettings from "./pages/BusinessSettings";
import AdminPrivacyPolicy from "./pages/AdminPrivacyPolicy";
import AdminTerms from "./pages/AdminTerms";
import CookieBanner from "./components/CookieBanner";
import NotFound from "./pages/NotFound";
import AttributeGroups from "./pages/AttributeGroups";

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

          {/* --- GROUP 2: Protected Pages (Inside the Main Layout) --- */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/:categoryId/attributes" element={<CategoryAttributes />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/new" element={<AddEditListing />} />
              <Route path="/listings/:listingId/edit" element={<AddEditListing />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/settings" element={<BusinessSettings />} />
              <Route path="/settings/attribute-groups" element={<AttributeGroups />} />
            </Route>
          </Route>

          {/* --- GROUP 3: Catch-all for any other route --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
