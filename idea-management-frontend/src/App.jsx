import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/navbar";
import ProtectedRoute from "./components/protectedroute";

import register from "./pages/register";
import login from "./pages/login";
import dashboard from "./pages/dashboard";
import CreateIdea from "./pages/CreateIdea";
import MyIdeas from "./pages/MyIdeas";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<register />} />
        <Route path="/login" element={<login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/createidea"
          element={
            <ProtectedRoute>
              <CreateIdea />
            </ProtectedRoute>
          }
        />

        <Route
          path="/myideas"
          element={
            <ProtectedRoute>
              <MyIdeas />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
