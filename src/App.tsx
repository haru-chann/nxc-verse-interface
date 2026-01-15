import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageLoader } from "@/components/ui/PageLoader";

// Layouts
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ScrollToTop from "@/components/layout/ScrollToTop";

// Public Pages - Lazy Loaded
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Features = lazy(() => import("./pages/Features"));
const Pricing = lazy(() => import("./pages/Pricing"));
const FAQs = lazy(() => import("./pages/FAQs"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RedirectHandler = lazy(() => import("./pages/RedirectHandler"));
const TapHandler = lazy(() => import("./pages/TapHandler"));

// Dashboard Pages - Lazy Loaded
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const ProfileEditor = lazy(() => import("./pages/dashboard/ProfileEditor"));
const QRBuilder = lazy(() => import("./pages/dashboard/QRBuilder"));
const InteractionLog = lazy(() => import("./pages/dashboard/InteractionLog"));
const ContactsManager = lazy(() => import("./pages/dashboard/ContactsManager"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const CardLink = lazy(() => import("./pages/dashboard/CardLink"));
const Checkout = lazy(() => import("@/pages/dashboard/Checkout"));
const CustomizeOrder = lazy(() => import("@/pages/dashboard/CustomizeOrder").then(module => ({ default: module.CustomizeOrder })));
const EditOrder = lazy(() => import("@/pages/dashboard/EditOrder").then(module => ({ default: module.EditOrder })));
const MyCards = lazy(() => import("@/pages/dashboard/MyCards"));

// Admin - Lazy Loaded
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
import { RequireAdmin } from "./components/auth/RequireAdmin";
import { AdminRoute } from "./components/auth/AdminRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then(module => ({ default: module.AdminDashboard })));
const AdminCMS = lazy(() => import("./pages/admin/CMS"));
const AdminUsers = lazy(() => import("./pages/admin/Users").then(module => ({ default: module.AdminUsers })));
const FormBuilder = lazy(() => import("./pages/admin/FormBuilder").then(module => ({ default: module.FormBuilder })));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans").then(module => ({ default: module.AdminPlans })));
const AdminReports = lazy(() => import("./pages/admin/Reports").then(module => ({ default: module.AdminReports })));

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
            <Suspense fallback={<PageLoader />}>
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

                {/* Profile Routes */}
                <Route path="/u/:uid" element={<PublicProfile />} />
                <Route path="/:usernameParam" element={<PublicProfile />} />
                <Route path="/t/:nfcId" element={<TapHandler />} />

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
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
