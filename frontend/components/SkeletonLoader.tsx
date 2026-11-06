"use client";

import React from "react";

export const SkeletonHeroRing: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 animate-pulse">
      <div className="w-56 h-56 rounded-full border-[14px] border-slate-200 dark:border-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-24 h-10 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center space-y-1">
            <div className="w-12 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-8 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonSubjectCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 animate-pulse flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2 flex-1">
            <div className="w-16 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="mt-5 space-y-2">
          <div className="flex justify-between">
            <div className="w-12 h-2 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <div className="w-28 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="w-14 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    </div>
  );
};

export const SkeletonList: React.FC = () => {
  return (
    <div className="space-y-2.5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
        >
          <div className="space-y-2 flex-1">
            <div className="w-40 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
      ))}
    </div>
  );
};

