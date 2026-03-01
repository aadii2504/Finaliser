import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineChartBar,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineCog,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineLogout,
  HiOutlineVideoCamera,
} from "react-icons/hi";

// NavLink class: active gets brand background and elegant text colors
const itemClass = ({ isActive }) =>
  [
    "group flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-300",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
    isActive
      ? "bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 font-semibold border border-indigo-500/20 shadow-sm"
      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 border border-transparent dark:hover:text-white",
  ].join(" ");

export default function AdminSidebar() {
  const [open, setOpen] = React.useState(false); // mobile drawer
  const [theme, setTheme] = React.useState(
    localStorage.getItem("theme") ||
      document.documentElement.getAttribute("data-theme") ||
      "dark",
  );
  const navigate = useNavigate();

  // Prevent background scroll when mobile drawer is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => (document.body.style.overflow = "");
  }, [open]);

  // Theme toggler (persist)
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  const logout = () => {
    localStorage.removeItem("learnsphere_user");
    window.dispatchEvent(new Event("userUpdated"));
    navigate("/login");
  };

  // Desktop/Drawer content: full-height sticky sidebar
  const SidebarContent = ({ onNavigate }) => (
    <aside
      className="h-screen sticky top-0 w-64 p-4 border-r border-[var(--border)] bg-[var(--card)] text-[var(--text)]"
      aria-label="Admin sidebar"
      role="navigation"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-md shadow-indigo-500/20">
            A
          </span>
          <span className="text-lg font-bold tracking-tight text-gray-800 dark:text-gray-100">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-white/10"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title="Toggle theme"
        >
          {theme === "dark" ? <HiOutlineSun /> : <HiOutlineMoon />}
        </button>
      </div>

      {/* Flat Menu Items (no dropdowns) */}
      <nav className="space-y-2">
        <NavLink
          to="/admin"
          end
          className={itemClass}
          onClick={() => onNavigate?.()}
        >
          <HiOutlineHome className="text-base" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/analytics"
          className={itemClass}
          onClick={() => onNavigate?.()}
        >
          <HiOutlineChartBar className="text-base" />
          <span>Analytics</span>
        </NavLink>

        <NavLink
          to="/admin/courses"
          className={itemClass}
          onClick={() => onNavigate?.()}
        >
          <HiOutlineAcademicCap className="text-base" />
          <span>Course Management</span>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={itemClass}
          onClick={() => onNavigate?.()}
        >
          <HiOutlineUserGroup className="text-base" />
          <span>User Management</span>
        </NavLink>

        <NavLink
          to="/admin/live-sessions"
          className={itemClass}
          onClick={() => onNavigate?.()}
        >
          <HiOutlineVideoCamera className="text-base" />
          <span>Live Sessions</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-600/20 text-red-400 text-sm"
        >
          <HiOutlineLogout className="text-base" />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile toggle button (visible < md) */}
      <button
        type="button"
        className="md:hidden fixed top-3 left-3 z-50 px-3 py-2 rounded-md bg-[var(--card)] border border-[var(--border)] text-[var(--text)]"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
      >
        ☰
      </button>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer content (already full height via h-screen) */}
      <div
        className={`md:hidden fixed top-0 left-0 z-50 h-screen w-64 transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Admin menu"
      >
        <div className="h-full bg-[var(--card)] border-r border-[var(--border)] text-[var(--text)] p-4">
          {/* Drawer header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-md shadow-indigo-500/20">
                A
              </span>
              <span className="text-lg font-bold tracking-tight text-gray-800 dark:text-gray-100">
                Admin
              </span>
            </div>
            <button
              type="button"
              className="px-3 py-1 rounded-md hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Close admin menu"
            >
              ✕
            </button>
          </div>

          <SidebarContent onNavigate={() => setOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar (full-height sticky) */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>
    </>
  );
}
