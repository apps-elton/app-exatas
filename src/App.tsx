import { useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";
import { RTL_LANGUAGES } from "@/i18n";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SuperAdminRoute } from "@/components/admin/SuperAdminRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Projects from "./pages/Projects";
import Dashboard from "./pages/Dashboard";
import SchoolUsers from "./pages/SchoolUsers";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import EquationBreaker from "./pages/EquationBreaker";

const Index = lazy(() => import("./pages/Index"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminTenants = lazy(() => import("./pages/admin/AdminTenants"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminSystemSettings = lazy(() => import("./pages/admin/AdminSystemSettings"));

function DirectionManager() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const dir = RTL_LANGUAGES.includes(i18n.language) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DirectionManager />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equation-breaker"
                element={
                  <ProtectedRoute>
                    <EquationBreaker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/school/users"
                element={
                  <ProtectedRoute>
                    <SchoolUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <SuperAdminRoute>
                      <AdminDashboard />
                    </SuperAdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tenants"
                element={
                  <ProtectedRoute>
                    <SuperAdminRoute>
                      <AdminTenants />
                    </SuperAdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <SuperAdminRoute>
                      <AdminUsers />
                    </SuperAdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/subscriptions"
                element={
                  <ProtectedRoute>
                    <SuperAdminRoute>
                      <AdminSubscriptions />
                    </SuperAdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/support"
                element={
                  <ProtectedRoute>
                    <SuperAdminRoute>
                      <AdminSupport />
                    </SuperAdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute>
                    <SuperAdminRoute>
                      <AdminSystemSettings />
                    </SuperAdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <CookieConsent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
