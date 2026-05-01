import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/auth/AuthPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AddReportPage from "./pages/groups/AddReportPage";
import AssignPublishersPage from "./pages/groups/AssignPublishersPage";
import CreateGroupPage from "./pages/groups/CreateGroupPage";
import ManageGroupsPage from "./pages/groups/ManageGroupsPage";
import ManagePublishersPage from "./pages/groups/ManagePublishersPage";
import ViewGroupsPage from "./pages/groups/ViewGroupsPage";
import ProfilePage from "./pages/profile/ProfilePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth/:mode" element={<AuthPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/groups/create" element={<CreateGroupPage />} />
        <Route path="/groups/assign" element={<AssignPublishersPage />} />
        <Route path="/groups/manage" element={<ManageGroupsPage />} />
        <Route path="/groups/manage-publishers" element={<ManagePublishersPage />} />
        <Route path="/groups/reports" element={<AddReportPage />} />
        <Route path="/groups/view" element={<ViewGroupsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
