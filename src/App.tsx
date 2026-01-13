import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";

// Layouts
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ScrollToTop from "@/components/layout/ScrollToTop";

// Public Pages
import Index from "./pages/Index";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import FAQs from "./pages/FAQs";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";
import RedirectHandler from "./pages/RedirectHandler";

// Dashboard Pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import ProfileEditor from "./pages/dashboard/ProfileEditor";
import QRBuilder from "./pages/dashboard/QRBuilder";
import InteractionLog from "./pages/dashboard/InteractionLog";
import ContactsManager from "./pages/dashboard/ContactsManager";
import Settings from "./pages/dashboard/Settings";
import CardLink from "./pages/dashboard/CardLink";
import Checkout from "@/pages/dashboard/Checkout";
import { CustomizeOrder } from "@/pages/dashboard/CustomizeOrder";
import { EditOrder } from "@/pages/dashboard/EditOrder";
import MyCards from "@/pages/dashboard/MyCards";

import AdminOrders from "./pages/admin/Orders";
import { RequireAdmin } from "./components/auth/RequireAdmin";
import { AdminRoute } from "./components/auth/AdminRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import AdminCMS from "./pages/admin/CMS";
import { AdminUsers } from "./pages/admin/Users";
import { FormBuilder } from "./pages/admin/FormBuilder";
import { AdminPlans } from "./pages/admin/AdminPlans";
import { AdminReports } from "./pages/admin/Reports";

const queryClient = new QueryClient();




const App = () => {
  useEffect(() => {
    // Prevent right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevent copy/cut
    const handleCopyCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // Prevent dragging (images, text)
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // Prevent specific keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C (Copy), Ctrl+X (Cut), Ctrl+S (Save), Ctrl+P (Print), Ctrl+U (View Source)
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'x', 's', 'p', 'u'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyCut);
    document.addEventListener("cut", handleCopyCut);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyCut);
      document.removeEventListener("cut", handleCopyCut);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/faqs" element={<FAQs />} />
                <Route path="/contact" element={<Contact />} />
              </Route>

              {/* Auth Routes (No Layout) */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Public Profile */}
              <Route path="/u/:uid" element={<PublicProfile />} />

              {/* NFC Card Redirect */}
              <Route path="/c/:cardId" element={<RedirectHandler />} />

              {/* Dashboard Routes - Protected */}
              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="profile" element={<ProfileEditor />} />
                  <Route path="qr-builder" element={<QRBuilder />} />
                  <Route path="interactions" element={<InteractionLog />} />
                  <Route path="contacts" element={<ContactsManager />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="card-link" element={<CardLink />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="/dashboard/customize/:planId" element={<CustomizeOrder />} />
                  <Route path="/dashboard/edit-order/:orderId" element={<EditOrder />} />
                  <Route path="/dashboard/checkout" element={<Checkout />} />
                  <Route path="my-cards" element={<MyCards />} />
                </Route>
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="forms" element={<FormBuilder />} />
                  <Route path="plans" element={<AdminPlans />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="cms" element={<AdminCMS />} />
                </Route>
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
