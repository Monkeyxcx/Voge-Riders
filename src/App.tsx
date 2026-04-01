import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import Home from "@/pages/Home";
import Models from "@/pages/Models";
import ModelDetail from "@/pages/ModelDetail";
import Workshops from "@/pages/Workshops";
import WorkshopDetail from "@/pages/WorkshopDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import Admin from "@/pages/Admin";

export default function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/modelos" replace />} />
          <Route path="/inicio" element={<Home />} />
          <Route path="/modelos" element={<Models />} />
          <Route path="/modelos/:slug" element={<ModelDetail />} />
          <Route path="/talleres" element={<Workshops />} />
          <Route path="/talleres/:id" element={<WorkshopDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/modelos" replace />} />
        </Routes>
      </AppShell>
    </Router>
  );
}
