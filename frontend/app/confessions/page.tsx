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
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  Timer,
  Info,
  Hourglass,
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
  const [nowTime, setNowTime] = useState<number>(Date.now());

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
  const [formError, setFormError] = useState<string | null>(null);

  // 3-Day Cooldown Tracker
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null);

  // Expanded comments state: Record<confessionId, boolean>
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Local likes tracking
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const student = getAuthSession().student;

  // Live timer tick every 10 seconds to keep the "Disappears in 24h" countdowns exact
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const checkCooldown = () => {
    if (typeof window !== "undefined") {
      const last = localStorage.getItem("cu_last_confession_time");
      if (last) {
        const lastTime = parseInt(last, 10);
        const elapsed = Date.now() - lastTime;
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        if (elapsed < threeDaysMs) {
          const remMs = threeDaysMs - elapsed;
          const remHours = Math.ceil(remMs / (1000 * 60 * 60));
          const remDays = Math.floor(remHours / 24);
          const remStr = remDays > 0 ? `${remDays}d ${remHours % 24}h` : `${remHours}h`;
          setCooldownRemaining(remStr);
          return remStr;
        }
      }
      setCooldownRemaining(null);
      return null;
    }
    return null;
  };

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
    checkCooldown();
    loadConfessions();
  }, [selectedCampus, selectedCategory, sortBy]);

  // Calculate milliseconds remaining until this confession disappears (24 hours after creation)
  const getMsRemaining = (c: ConfessionItem) => {
    const createdTimestamp = c.created_at ? new Date(c.created_at).getTime() : nowTime;
    const expiresTimestamp = createdTimestamp + 24 * 60 * 60 * 1000;
    return expiresTimestamp - nowTime;
  };

  // Human-readable "Disappears in Xh Ym"
  const formatDisappearsIn = (c: ConfessionItem) => {
    const ms = getMsRemaining(c);
    if (ms <= 0) return "Disappearing now...";
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `Disappears in ${hours}h ${minutes}m`;
    }
    return `Disappears in ${minutes}m`;
  };

  // Filter out any confessions that have exceeded 24 hours
  const activeConfessions = confessions.filter((c) => getMsRemaining(c) > 0);

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
    setFormError(null);

    const text = newContent.trim();
    if (!text) {
      setFormError("Please enter your confession");
      return;
    }

    if (text.length > 80) {
      setFormError(`Confession exceeds 80 characters (${text.length}/80)`);
      return;
    }

    const cd = checkCooldown();
    if (cd) {
      setFormError(`Rate limit active: You can post 1 confession every 3 days. Next available in ${cd}.`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await submitConfession(text, newCampus, newCategory);
      setConfessions((prev) => [created, ...prev]);
      if (typeof window !== "undefined") {
        localStorage.setItem("cu_last_confession_time", Date.now().toString());
      }
      checkCooldown();
      setNewContent("");
      setPostSuccess(true);
      setTimeout(() => {
        setPostSuccess(false);
        setIsComposeOpen(false);
      }, 1400);
    } catch (err: any) {
      setFormError(err?.message || "Failed to post confession.");
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 pb-28 selection:bg-[#0f2b5c]/10 selection:text-[#0f2b5c] dark:selection:bg-blue-500/20 dark:selection:text-blue-300 transition-colors duration-200">
      <Navbar student={student} />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Header */}
        <section className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#0f2b5c] dark:text-blue-400 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Christ Campus Community</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Christ Confessions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Short 80-char campus thoughts • Disappears after 24 hours • 1 post per 3 days
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                checkCooldown();
                setFormError(null);
                setIsComposeOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0f2b5c] dark:bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-[#163b7d] dark:hover:bg-blue-500 transition-all select-none"
            >
              <Plus className="w-4 h-4" />
              <span>Share Confession</span>
            </motion.button>
          </div>

          {/* Rules and 24-Hour Disappear Notice Bar */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-800/50">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>Disappears after 24 hours</span>
            </span>

            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <Timer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>1 post per 3 days</span>
            </span>

            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Max 80 characters</span>
            </span>
          </div>

          {/* Active 3-day cooldown alert */}
          {cooldownRemaining && (
            <div className="mt-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 font-medium">
              <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>
                3-Day Cooldown Active: You have shared a confession recently. Next post unlocks in{" "}
                <strong>{cooldownRemaining}</strong>.
              </span>
            </div>
          )}
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
                    ? "bg-[#0f2b5c] dark:bg-blue-600 text-white border-[#0f2b5c] dark:border-blue-600 shadow-sm"
                    : "bg-white dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 border-slate-200/90 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800/80 text-xs font-bold">
              <button
                onClick={() => setSortBy("newest")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  sortBy === "newest"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Newest (24H)
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                  sortBy === "popular"
                    ? "bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
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
                className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 animate-pulse space-y-3"
              >
                <div className="w-24 h-4 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="w-32 h-4 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : activeConfessions.length > 0 ? (
          <div className="space-y-4">
            {activeConfessions.map((confession, idx) => (
              <motion.article
                key={confession.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,43,92,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-md transition-all space-y-3"
              >
                {/* Meta Header with Campus & Live 24-Hour Expiration Countdown */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-[#0f2b5c] dark:text-blue-400 text-[11px] flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60">
                      <MapPin className="w-3 h-3" />
                      {confession.campus}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-100 dark:border-emerald-800/60">
                      {confession.category}
                    </span>
                  </div>

                  {/* Dynamic Disappearing Countdown Badge */}
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-300/40 dark:border-amber-600/30 text-[10px] font-mono font-bold flex items-center gap-1 shadow-2xs">
                    <Hourglass className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-pulse" />
                    <span>{formatDisappearsIn(confession)}</span>
                  </span>
                </div>

                {/* Content (Strictly <= 80 chars) */}
                <p className="text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-snug font-bold">
                  “{confession.content}”
                </p>

                {/* Footer Controls: Likes & Comment Trigger */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 1.35 }}
                      onClick={() => handleLike(confession.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                        likedMap[confession.id]
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60"
                          : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedMap[confession.id] ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                      <span className="font-mono">{confession.likes_count}</span>
                    </motion.button>

                    <button
                      onClick={() => toggleComments(confession.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 font-semibold transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="font-mono">{confession.comments_count}</span>
                      {expandedComments[confession.id] ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
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
                      className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 overflow-hidden"
                    >
                      {/* Comments list */}
                      <div className="space-y-2">
                        {confession.comments && confession.comments.length > 0 ? (
                          confession.comments.map((cm) => (
                            <div
                              key={cm.id}
                              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                                <span>Anonymous Reply</span>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 font-medium">{cm.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2 font-medium">
                            No replies yet. Be the first to reply anonymously!
                          </p>
                        )}
                      </div>

                      {/* Add comment input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          maxLength={150}
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
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] dark:focus:ring-blue-500"
                        />
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          disabled={submittingComment[confession.id]}
                          onClick={() => handleAddComment(confession.id)}
                          className="p-2 rounded-xl bg-[#0f2b5c] dark:bg-blue-600 text-white hover:bg-[#163b7d] dark:hover:bg-blue-500 transition-colors disabled:opacity-50"
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
          <div className="p-12 text-center bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
              All older confessions have disappeared!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Every confession on this campus feed disappears completely after 24 hours. The board is now reset and clear. Be the first to post a new one today!
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                checkCooldown();
                setFormError(null);
                setIsComposeOpen(true);
              }}
              className="px-4 py-2 bg-[#0f2b5c] dark:bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-sm"
            >
              Post First Confession
            </motion.button>
          </div>
        )}
      </main>

      {/* Compose Confession Modal (Enforcing Max 80 Characters & 3-Day Rate Limit) */}
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      Share Campus Confession
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Disappears in 24 hours • 1 post per 3 days • Max 80 characters
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsComposeOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {postSuccess ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Confession Published!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Visible on the 24-hour campus feed. It will disappear in 24 hours. Next confession in 3 days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateConfession} className="space-y-4">
                  {/* Cooldown or Error Banner */}
                  {cooldownRemaining ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                      <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">3-Day Limit Active</strong>
                        <span>You can share 1 confession every 3 days. Your next post unlocks in {cooldownRemaining}.</span>
                      </div>
                    </div>
                  ) : formError ? (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-[#0f2b5c] dark:text-blue-400 flex-shrink-0" />
                      <span>
                        Strictly maximum <strong>80 characters</strong>. Automatically <strong>disappears after 24 hours</strong>.
                      </span>
                    </div>
                  )}

                  {/* Campus & Category Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Campus
                      </label>
                      <select
                        value={newCampus}
                        onChange={(e) => setNewCampus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] dark:focus:ring-blue-500"
                      >
                        {CAMPUSES.filter((c) => c !== "All Campuses").map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] dark:focus:ring-blue-500"
                      >
                        {CATEGORIES.filter((c) => c !== "All").map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Confession Text Area (Strictly <= 80 chars) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Your Confession (Max 80 Characters)
                    </label>
                    <textarea
                      required
                      rows={3}
                      maxLength={80}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value.slice(0, 80))}
                      placeholder="Share a short thought (max 80 chars)..."
                      className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] dark:focus:ring-blue-500 transition-all resize-none"
                    />
                    <div className="flex justify-between text-[11px] font-bold mt-1">
                      <span className="text-slate-400 dark:text-slate-500 font-normal">Disappears after 24 hours</span>
                      <span className={newContent.length >= 75 ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}>
                        {newContent.length} / 80
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsComposeOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Close
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={submitting || !newContent.trim() || !!cooldownRemaining}
                      className="px-5 py-2 rounded-xl bg-[#0f2b5c] dark:bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-[#163b7d] dark:hover:bg-blue-500 transition-all disabled:opacity-50"
                    >
                      {submitting ? "Posting..." : cooldownRemaining ? "Cooldown Active" : "Post Confession"}
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
