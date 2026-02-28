import { HiOutlineBell } from "react-icons/hi";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("learnsphere_user") || "null");
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("learnsphere_user") || "null"));
      } catch (e) {
        setUser(null);
      }
    };

    // custom event fired on same window when login/logout happen
    window.addEventListener("userUpdated", handleUpdate);
    // storage event for changes from other tabs/windows
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("userUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* LogoText */}
        <Link
          to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/"}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <span className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500" />
          <span className="font-bold text-sm sm:text-base tracking-tight hidden sm:inline">
            Learn
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Sphere
            </span>
          </span>
          <span className="font-bold text-xs sm:hidden">LS</span>
        </Link>

        {/* Actions: show only Register/Login when logged out; Notifications/Profile when logged in */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {user.role !== "admin" && (
                <Link
                  to="/notifications"
                  className="p-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-slate-100"
                  title="Notifications"
                >
                  <HiOutlineBell size={20} />
                </Link>
              )}

              <Link
                to={user.role === "admin" ? "/admin" : "/profile"}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg font-semibold text-white text-sm sm:text-base bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 transition"
                title="Profile"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a5 5 0 100-10 5 5 0 000 10zm-7 7a7 7 0 0114 0H3z" />
                </svg>
                <span className="hidden sm:inline">
                  {user.name || "Profile"}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm text-white bg-gradient-to-tr from-indigo-600 to-blue-500 hover:opacity-90 transition"
              >
                Sign up
              </Link>
              <Link
                to="/login"
                className="px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm border border-white/20 text-white hover:bg-white/10 transition"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
