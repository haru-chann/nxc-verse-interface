import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Public Pages
import Index from "./pages/Index";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Store from "./pages/Store";
import Checkout from "./pages/Checkout";
import Blog from "./pages/Blog";
import FAQs from "./pages/FAQs";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";

// Dashboard Pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import ProfileEditor from "./pages/dashboard/ProfileEditor";
import QRBuilder from "./pages/dashboard/QRBuilder";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/store" element={<Store />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Auth Routes (No Layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Public Profile */}
          <Route path="/u/:username" element={<PublicProfile />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<ProfileEditor />} />
            <Route path="themes" element={<ProfileEditor />} />
            <Route path="qr-builder" element={<QRBuilder />} />
            <Route path="interactions" element={<DashboardHome />} />
            <Route path="contacts" element={<DashboardHome />} />
            <Route path="export" element={<DashboardHome />} />
            <Route path="security" element={<DashboardHome />} />
            <Route path="orders" element={<DashboardHome />} />
            <Route path="settings" element={<ProfileEditor />} />
            <Route path="billing" element={<DashboardHome />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminDashboard />} />
            <Route path="templates" element={<AdminDashboard />} />
            <Route path="content" element={<AdminDashboard />} />
            <Route path="moderation" element={<AdminDashboard />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
