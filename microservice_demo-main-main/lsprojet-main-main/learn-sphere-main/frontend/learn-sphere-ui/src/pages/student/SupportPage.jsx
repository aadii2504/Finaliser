import React, { useState } from "react";
import Sidebar from "../../components/Dashboard/Sidebar";
import { toast } from "react-toastify";
import { FaPaperPlane, FaLightbulb, FaHeadset } from "react-icons/fa";

export default function SupportPage() {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(
        "Message received. Our support team will reach out shortly.",
      );
      setFormData({ subject: "", message: "" });
    }, 1000);
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#f8fafc] dark:bg-[#0b0c10]">
      <aside className="w-16 md:w-64 flex-shrink-0 transition-all duration-300 border-r border-[#e2e8f0] dark:border-white/5">
        <Sidebar />
      </aside>

      <main className="flex-1 w-full p-4 md:p-12 overflow-y-auto flex flex-col justify-center items-center font-sans">
        <div className="w-full max-w-xl">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-none dark:border dark:border-white/10 text-indigo-500 mb-6">
              <FaHeadset className="w-7 h-7" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0f172a] dark:text-white mb-3">
              How can we help?
            </h1>
            <p className="text-[#64748b] dark:text-white/50 text-base md:text-lg max-w-md mx-auto">
              Our team is here to assist you. Send us a detailed message and
              we'll get back to you promptly.
            </p>
          </div>

          <div className="bg-white dark:bg-[#12141a] border border-[#f1f5f9] dark:border-white/5 p-8 md:p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#64748b] dark:text-white/50 mb-2 uppercase tracking-wide">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Access Issue"
                  className="w-full bg-[#f8fafc] dark:bg-[#0b0c10] border-none rounded-xl px-5 py-4 text-[#0f172a] dark:text-white placeholder-[#94a3b8] dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#0b0c10] transition-all shadow-inner"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748b] dark:text-white/50 mb-2 uppercase tracking-wide">
                  Message Details
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe your issue in detail..."
                  className="w-full bg-[#f8fafc] dark:bg-[#0b0c10] border-none rounded-xl px-5 py-4 text-[#0f172a] dark:text-white placeholder-[#94a3b8] dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#0b0c10] transition-all resize-none shadow-inner"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !formData.subject.trim() ||
                    !formData.message.trim()
                  }
                  className="w-full px-8 py-4 bg-[#0f172a] dark:bg-white text-white dark:text-black font-bold rounded-xl transition-all shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex justify-center items-center gap-3"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>Submit Request</span>
                      <FaPaperPlane className="w-4 h-4 opacity-70" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 flex items-start gap-4 p-6 rounded-3xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <FaLightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#0f172a] dark:text-amber-100 text-sm mb-1">
                Have you checked our FAQs?
              </h3>
              <p className="text-[#64748b] dark:text-amber-200/70 text-sm leading-relaxed">
                Many common issues are already resolved in our community
                knowledge base. Check it out for instant answers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
