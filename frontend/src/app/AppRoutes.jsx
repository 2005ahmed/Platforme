// App.jsx
import { BrowserRouter, Routes, Route , Navigate} from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

// Pages
import AuthPage from "../pages/AuthPage";
import DashboardPage from "../pages/DashboardPage";
import ApplicationsPage from "../pages/ApplicationsPage";
import AIAssistantPage from "../pages/AIAssistantPage";
import NotificationsPage from "../pages/NotificationsPage";
import ProfilePage from "../pages/ProfilePage";
import AdminPage from "../pages/AdminPage";
import RecruiterPage from "../pages/RecruiterPage";
import RecruiterAnalyticsPage from "../pages/RecruiterAnalyticsPage";

// App.jsx - Routes b strict checking
function App() {
  return (
        <Routes>
          {/* Public */}
          <Route path="/" element={<AuthPage />} />

          {/* ========== CANDIDATE (User) ONLY ========== */}
          <Route path="/dashboard" element={
            <ProtectedRoute userOnly>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/applications" element={
            <ProtectedRoute userOnly>
              <ApplicationsPage />
            </ProtectedRoute>
          } />
          <Route path="/ai" element={
            <ProtectedRoute userOnly>
              <AIAssistantPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute userOnly>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute userOnly>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          {/* ========== RECRUITER ONLY ========== */}
          <Route path="/recruiter" element={
            <ProtectedRoute recruiterOnly>
              <RecruiterPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/analytics" element={
            <ProtectedRoute recruiterOnly>
              <RecruiterAnalyticsPage />
            </ProtectedRoute>
          } />

          {/* ========== ADMIN ONLY ========== */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          } />

          {/* ========== CATCH ALL ========== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
  );
}

export default App;