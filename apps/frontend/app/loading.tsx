"use client";

import React from "react";
import { LoaderFour } from "../components/ui/load";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md">
      <div className="rounded-3xl border border-white/10 bg-white/90 px-8 py-6 shadow-2xl dark:bg-black/80">
        <LoaderFour text="Loading..." />
      </div>
    </div>
  );
}