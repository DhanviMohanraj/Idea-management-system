import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/navbar";
import ProtectedRoute from "./components/protectedroute";

// Page components (use PascalCase for React components)
import Register from "./pages/register";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import CreateIdea from "./pages/CreateIdea";
import MyIdeas from "./pages/MyIdeas";

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="team_lead">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/createidea"
          element={
            <ProtectedRoute requiredRole="team_member">
              <CreateIdea />
            </ProtectedRoute>
          }
        />

        <Route
          path="/myideas"
          element={
            <ProtectedRoute requiredRole="team_member">
              <MyIdeas />
            </ProtectedRoute>
          }
        />
        </Routes>
      </main>
    </div>
  );
}

export default App;
