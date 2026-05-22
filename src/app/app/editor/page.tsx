import * as React from "react";
import { Navigate } from "react-router-dom";

export default function Page() {
  return <Navigate to="/app" replace />;
}

