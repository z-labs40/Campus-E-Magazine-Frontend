import * as React from "react";
import { Navigate } from "react-router-dom";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { useStore } from "@/lib/store";
import { isAdminRole } from "@/lib/roles";

export default function Page() {
  const { currentUser } = useStore();

  if (!currentUser || !isAdminRole(currentUser.role)) {
    return <Navigate to="/app" replace />;
  }

  return <AdminDashboard />;
}

