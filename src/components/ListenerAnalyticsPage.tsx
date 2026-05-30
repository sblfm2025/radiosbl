import React from "react";
import { AnalyticsDashboard } from "../features/analytics/components/AnalyticsDashboard";

export function ListenerAnalyticsPage() {
  return (
    <main className="analytics-page" style={{ background: "var(--soft)", minHeight: "100vh" }}>
      <AnalyticsDashboard />
    </main>
  );
}
