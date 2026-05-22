import * as React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useStore } from "@/lib/store";
import { isAdminRole } from "@/lib/roles";
import UserEditor from "./UserEditor";
import AdminAuditor from "./AdminAuditor";

export default function EditorRouter() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const reviewEditId = searchParams.get("reviewEditId");
  
  const { currentUser, articles } = useStore();
  
  const existingArt = id ? articles.find(a => a.id === id) : null;

  // Render Admin Auditor if:
  // 1. User is an admin AND (there is a reviewEditId OR the article exists and is NOT owned by this admin)
  const isAdminAuditor =
    isAdminRole(currentUser?.role) &&
    (reviewEditId !== null || (existingArt && existingArt.authorId !== currentUser?.id));

  if (isAdminAuditor) {
    return <AdminAuditor />;
  }
  
  return <UserEditor />;
}
