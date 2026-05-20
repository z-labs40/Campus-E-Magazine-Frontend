import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Providers } from "./providers";

// 1. Core Route Shell Imports
import LandingPageWrapper from "./page";
import LoginPageWrapper from "./login/page";
import RegisterPageWrapper from "./register/page";
import ForgotPasswordPageWrapper from "./forgot-password/page";
import VerifyOtpPageWrapper from "./verify-otp/page";
import ResetPasswordPageWrapper from "./reset-password/page";
import MagazineHomepageWrapper from "./magazine/page";
import MagazineReaderPageWrapper from "./magazine/reader/page";
import DiscoverPageWrapper from "./discover/page";
import ArchivePageWrapper from "./archive/page";

// 2. Protected App Dashboard Wrappers
import WriterDashboardWrapper from "./app/page";
import EditorDashboardWrapper from "./app/editor/page";
import AdminDashboardWrapper from "./app/admin/page";
import RichTextEditorPageWrapper from "./app/editor-tool/page";
import SuggestionReviewPageWrapper from "./app/suggestion-review/page";
import NotificationsPageWrapper from "./app/notifications/page";
import ProfilePageWrapper from "./app/profile/page";
import VersionHistoryPageWrapper from "./app/version-history/page";

import { AppShell } from "@/components/app/AppShell";
import NotFoundPage from "@/components/Common/NotFoundPage";

export default function AppLayout() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPageWrapper />} />
          <Route path="/login" element={<LoginPageWrapper />} />
          <Route path="/register" element={<RegisterPageWrapper />} />
          <Route path="/forgot-password" element={<ForgotPasswordPageWrapper />} />
          <Route path="/verify-otp" element={<VerifyOtpPageWrapper />} />
          <Route path="/reset-password" element={<ResetPasswordPageWrapper />} />
          <Route path="/magazine" element={<MagazineHomepageWrapper />} />
          <Route path="/magazine/:id" element={<MagazineReaderPageWrapper />} />
          <Route path="/discover" element={<DiscoverPageWrapper />} />
          <Route path="/archive" element={<ArchivePageWrapper />} />

          {/* CMS Protected / Workspace Routes */}
          <Route path="/app" element={<AppShell />}>
            <Route index element={<WriterDashboardWrapper />} />
            <Route path="editor" element={<EditorDashboardWrapper />} />
            <Route path="admin" element={<AdminDashboardWrapper />} />
            <Route path="editor-tool" element={<RichTextEditorPageWrapper />} />
            <Route path="editor-tool/:id" element={<RichTextEditorPageWrapper />} />
            <Route path="suggestion-review" element={<SuggestionReviewPageWrapper />} />
            <Route path="suggestion-review/:id" element={<SuggestionReviewPageWrapper />} />
            <Route path="notifications" element={<NotificationsPageWrapper />} />
            <Route path="profile" element={<ProfilePageWrapper />} />
            <Route path="version-history/:id" element={<VersionHistoryPageWrapper />} />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
