
import React, { useState } from "react";
import NotificationModal from "./NotificationModal";

const sampleData = [
  {
    id: 1,
    type: "notification",
    title: "New Course: Data Structures",
    message: "Explore the new course in the catalog.",
    timestamp: new Date().toISOString(),
  },
  {
    id: 2,
    type: "announcement",
    title: "Live Session Friday, 6 PM",
    message: "Join the live doubt-clearing session.",
    timestamp: new Date().toISOString(),
  },
];

export default function NotificationsList() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);

  const handleOpen = (item) => {
    setActive(item);
    setOpen(true);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-2">Notifications & Announcements</h1>
      <p className="text-white/60 mb-6">Click an item to view details.</p>

      <div className="space-y-3">
        {sampleData.map((item) => (
          <button
            key={item.id}
            onClick={() => handleOpen(item)}
            className="w-full text-left p-4 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 transition"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{item.title}</h3>

              <span className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-600/20 text-slate-300 border border-slate-400/40">
                {item.type.toUpperCase()}
              </span>
            </div>

            <p className="text-sm text-gray-300 mt-1">{item.message}</p>

            <p className="text-xs text-gray-500 mt-1">
              {new Date(item.timestamp).toLocaleString()}
            </p>
          </button>
        ))}
      </div>

      <NotificationModal
        open={open}
        data={active}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
