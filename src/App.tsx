import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RTL_LANGUAGES } from "@/i18n";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SuperAdminRoute } from "@/components/admin/SuperAdminRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Projects from "./pages/Projects";
import Dashboard from "./pages/Dashboard";
import SchoolUsers from "./pages/SchoolUsers";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTenants from "./pages/admin/AdminTenants";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminSystemSettings from "./pages/admin/AdminSystemSettings";
import NotFound from "./pages/NotFound";

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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
