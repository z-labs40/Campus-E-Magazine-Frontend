import * as React from "react";
import { Navigate } from "react-router-dom";
import WriterDashboard from "@/components/dashboard/WriterDashboard";
import { useStore } from "@/lib/store";
import { isAdminRole } from "@/lib/roles";

export default function Page() {
  const { currentUser } = useStore();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (isAdminRole(currentUser.role)) {
    return <Navigate to="/app/admin" replace />;
  }

  return <WriterDashboard />;
}

