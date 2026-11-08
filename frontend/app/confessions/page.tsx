"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import {
  fetchConfessions,
  submitConfession,
  upvoteConfession,
  submitConfessionComment,
  ConfessionItem,
  ApiError,
} from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import {
  MessageSquare,
  Heart,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  Tag,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CAMPUSES = [
  "All Campuses",
  "Central Campus",
  "BGR Campus",
  "Kengeri",
  "Yeshwanthpur",
  "Delhi NCR",
  "Lavasa",
];

const CATEGORIES = [
  "All",
  "Campus Life",
  "Crushes & Moments",
  "Faculty & Classes",
  "Hostel Stories",
  "Advice",
];

export default function ConfessionsPage() {
  const [confessions, setConfessions] = useState<ConfessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCampus, setSelectedCampus] = useState("All Campuses");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");

  // Compose Modal
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCampus, setNewCampus] = useState("Central Campus");
  const [newCategory, setNewCategory] = useState("Campus Life");
  const [submitting, setSubmitting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Expanded comments state: Record<confessionId, boolean>
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Local likes tracking to prevent duplicate spam in current session
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const student = getAuthSession().student;

  const loadConfessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConfessions(selectedCampus, selectedCategory, sortBy);
      setConfessions(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load confessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfessions();
  }, [selectedCampus, selectedCategory, sortBy]);

  const handleLike = async (id: string) => {
    if (likedMap[id]) return;

    // Optimistic UI update
    setLikedMap((prev) => ({ ...prev, [id]: true }));
    setConfessions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likes_count: c.likes_count + 1 } : c))
    );

    try {
      await upvoteConfession(id);
    } catch {
      // Revert if network error
      setLikedMap((prev) => ({ ...prev, [id]: false }));
      setConfessions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, likes_count: Math.max(0, c.likes_count - 1) } : c))
      );
    }
  };

  const handleCreateConfession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSubmitting(true);
    try {
      const created = await submitConfession(newContent.trim(), newCampus, newCategory);
      setConfessions((prev) => [created, ...prev]);
      setNewContent("");
      setPostSuccess(true);
      setTimeout(() => {
        setPostSuccess(false);
        setIsComposeOpen(false);
      }, 1200);
    } catch (err: any) {
      alert(err?.message || "Failed to post confession.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (confessionId: string) => {
    const text = (commentInputs[confessionId] || "").trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [confessionId]: true }));
    try {
      const comment = await submitConfessionComment(confessionId, text);
      setConfessions((prev) =>
        prev.map((c) =>
          c.id === confessionId
            ? {
                ...c,
                comments_count: c.comments_count + 1,
                comments: [...(c.comments || []), comment],
              }
            : c
        )
      );
      setCommentInputs((prev) => ({ ...prev, [confessionId]: "" }));
    } catch (err: any) {
      alert(err?.message || "Failed to post comment.");
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [confessionId]: false }));
    }
  };

  const toggleComments = (id: string) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 selection:bg-[#0f2b5c]/10 selection:text-[#0f2b5c]">
      <Navbar student={student} />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Header */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,43,92,0.05)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[#0f2b5c] text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Christ Campus Community</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Christ Confessions
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                100% anonymous campus stories, thoughts, confessions & advice
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsComposeOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0f2b5c] text-white text-xs font-bold shadow-md hover:bg-[#163b7d] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Share Confession</span>
            </motion.button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Zero identity tracking • Reg number is never linked or logged
            </span>
            <span className="font-semibold text-slate-700 font-mono">
              {confessions.length} Confessions
            </span>
          </div>
        </section>

        {/* Filter Bar: Campus & Sort */}
        <section className="space-y-3">
          {/* Campuses Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CAMPUSES.map((camp) => (
              <motion.button
                key={camp}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCampus(camp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCampus === camp
                    ? "bg-[#0f2b5c] text-white border-[#0f2b5c] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-100"
                }`}
              >
                {camp}
              </motion.button>
            ))}
          </div>

          {/* Categories & Sort Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    selectedCategory === cat
                      ? "bg-slate-200 text-slate-900"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/90 text-xs font-bold">
              <button
                onClick={() => setSortBy("newest")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  sortBy === "newest"
                    ? "bg-slate-100 text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                  sortBy === "popular"
                    ? "bg-slate-100 text-rose-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Top</span>
              </button>
            </div>
          </div>
        </section>

        {/* Confessions Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 animate-pulse space-y-3"
              >
                <div className="w-24 h-4 bg-slate-100 rounded" />
                <div className="w-full h-16 bg-slate-100 rounded-xl" />
                <div className="w-32 h-4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : confessions.length > 0 ? (
          <div className="space-y-4">
            {confessions.map((confession, idx) => (
              <motion.article
                key={confession.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_2px_12px_rgba(15,43,92,0.03)] hover:shadow-md transition-shadow space-y-4"
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 font-bold text-[#0f2b5c] text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {confession.campus}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-100">
                      {confession.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    #{confession.id.substring(0, 6)}
                  </span>
                </div>

                {/* Content */}
                <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                  {confession.content}
                </p>

                {/* Footer Controls: Likes & Comment Trigger */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 1.35 }}
                      onClick={() => handleLike(confession.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                        likedMap[confession.id]
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedMap[confession.id] ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                      <span>{confession.likes_count}</span>
                    </motion.button>

                    <button
                      onClick={() => toggleComments(confession.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60 font-semibold transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-slate-500" />
                      <span>{confession.comments_count}</span>
                      {expandedComments[confession.id] ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    Christ Anonymous
                  </span>
                </div>

                {/* Expandable Comments Drawer */}
                <AnimatePresence>
                  {expandedComments[confession.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-3 border-t border-slate-100 space-y-3 overflow-hidden"
                    >
                      {/* Comments list */}
                      <div className="space-y-2">
                        {confession.comments && confession.comments.length > 0 ? (
                          confession.comments.map((cm) => (
                            <div
                              key={cm.id}
                              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                                <span>Anonymous Christite</span>
                              </div>
                              <p className="text-slate-800 font-medium">{cm.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 text-center py-2 font-medium">
                            No replies yet. Be the first to reply anonymously!
                          </p>
                        )}
                      </div>

                      {/* Add comment input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={commentInputs[confession.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [confession.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(confession.id);
                          }}
                          placeholder="Reply anonymously..."
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
                        />
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          disabled={submittingComment[confession.id]}
                          onClick={() => handleAddComment(confession.id)}
                          className="p-2 rounded-xl bg-[#0f2b5c] text-white hover:bg-[#163b7d] transition-colors disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-extrabold text-slate-900 text-base">
              No confessions found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No confessions match your filter yet. Share the first anonymous confession!
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsComposeOpen(true)}
              className="px-4 py-2 bg-[#0f2b5c] text-white rounded-2xl text-xs font-bold"
            >
              Post Confession
            </motion.button>
          </div>
        )}
      </main>

      {/* Compose Confession Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl w-full max-w-lg space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Share Anonymous Confession
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      100% untracked • Respectful campus rules apply
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsComposeOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {postSuccess ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-slate-900 text-base">
                    Confession Posted Anonymously!
                  </h4>
                  <p className="text-xs text-slate-500">
                    Your confession is live on the campus feed.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateConfession} className="space-y-4">
                  {/* Campus & Category Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Campus
                      </label>
                      <select
                        value={newCampus}
                        onChange={(e) => setNewCampus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
                      >
                        {CAMPUSES.filter((c) => c !== "All Campuses").map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
                      >
                        {CATEGORIES.filter((c) => c !== "All").map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Confession Text Area */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your Confession
                    </label>
                    <textarea
                      required
                      rows={5}
                      maxLength={2000}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Write your campus confession, story, crush, or advice here..."
                      className="w-full p-3.5 rounded-2xl border border-slate-300 bg-slate-50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] transition-all resize-none"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Please avoid harassment, hate speech, or real names</span>
                      <span>{newContent.length} / 2000</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsComposeOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={submitting || !newContent.trim()}
                      className="px-5 py-2 rounded-xl bg-[#0f2b5c] text-white text-xs font-bold shadow-md hover:bg-[#163b7d] transition-all disabled:opacity-50"
                    >
                      {submitting ? "Posting..." : "Post Anonymously"}
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
