import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import DashboardPage from "./pages/DashboardPage";
import InterviewPage from "./pages/InterviewPage";
import LandingPage from "./pages/LandingPage";
import LiveInterviewPage from "./pages/LiveInterviewPage";
import LoginPage from "./pages/LoginPage";
import SetupPage from "./pages/SetupPage";
import SummaryPage from "./pages/SummaryPage";
import TopicPage from "./pages/TopicPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/interview/:sessionId" element={<InterviewPage />} />
          <Route path="/interview/:sessionId/done" element={<SummaryPage />} />
          <Route path="/live-interview" element={<LiveInterviewPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/topics/:topic" element={<TopicPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
