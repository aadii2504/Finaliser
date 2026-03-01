import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { RegistrationPage } from "./pages/RegistrationPage";
import { Footer } from "./components/Footer";
import { DashboardPage } from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import { Profile } from "./pages/Profile";
import NotificationsList from "./components/NotificationsList";

import { ProtectedRoute } from "./components/dashboard/ProtectedRoute";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CoursesAdmin from "./pages/admin/CoursesAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import LoginPage from "./pages/LoginPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AssessmentForm from "./pages/admin/AssessmentForm";
import EnrolledCourses from "./pages/EnrolledCourses";
import "react-toastify/dist/ReactToastify.css";
import Analytics from "./pages/admin/Analytics";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursePlayerPage from "./pages/CoursePlayerPage";
import LiveSessionsPage from "./pages/LiveSessionsPage";
import LiveSessionPlayer from "./pages/LiveSessionPlayer";
import LiveSessionManager from "./pages/admin/LiveSessionManager";
import SupportPage from "./pages/student/SupportPage";

export default function App() {
  const [courses] = useState([
    {
      id: "c-201",
      title: "Complete Web Development Cohort",
      level: "Beginner → Advanced",
      lessons: 120,
      thumbnail:
        "https://appx-content-v2.classx.co.in/paid_course3/2025-12-21-0_2662284761741538.jpg",
      description: "Learn web development from scratch to advanced level.",
      learningPoints: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
      requirements: ["Basic computer knowledge", "Internet connection"],
    },
    {
      id: "c-202",
      title: "Complete Web3 Cohort",
      level: "Intermediate",
      lessons: 80,
      thumbnail:
        "https://appx-content-v2.classx.co.in/paid_course3/2025-12-21-0_03044769464934871.jpg",
      description: "Dive into the world of blockchain and Web3 technologies.",
      learningPoints: ["Blockchain Basics", "Smart Contracts", "Ethereum"],
      requirements: ["Basic programming knowledge"],
    },
  ]);
  const [liveSessions] = useState([
    {
      id: "ls-101",
      title: "Introduction to Web Development",
      date: "2023-12-15",
      time: "10:00 AM - 11:00 AM",
      description: "Join us for an introduction to web development.",
      instructor: "John Doe",
    },
    {
      id: "ls-102",
      title: "Advanced JavaScript Concepts",
      date: "2023-12-16",
      time: "02:00 PM - 03:00 PM",
      description: "Deep dive into advanced JavaScript concepts.",
      instructor: "Jane Smith",
    },
  ]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/notifications" element={<NotificationsList />} />

          <Route path="/enrolled-courses" element={<EnrolledCourses />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          {/* Admin area (requires admin role) */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedAdminRoute>
                <CoursesAdmin />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedAdminRoute>
                <Analytics />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedAdminRoute>
                <UsersAdmin />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportPage />
              </ProtectedRoute>
            }
          />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/course/:slug" element={<CourseDetailPage />} />
          <Route
            path="/course/:slug/learn"
            element={
              <ProtectedRoute>
                <CoursePlayerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live-sessions"
            element={<LiveSessionsPage liveSessions={liveSessions} />}
          />
          <Route
            path="/session/:id"
            element={
              <ProtectedRoute>
                <LiveSessionPlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/live-sessions"
            element={
              <ProtectedAdminRoute>
                <LiveSessionManager />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
