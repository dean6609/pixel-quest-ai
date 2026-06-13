"use client";

import React from "react";

export default function ScrollContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full h-full overflow-y-auto overflow-x-hidden px-2 md:px-6"
      style={{
        maxHeight: "calc(100% - 120px)",
      }}
    >
      {children}
    </div>
  );
}
