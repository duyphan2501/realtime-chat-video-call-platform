"use client";

type TabId = "all" | "online" | "pending" | "blocked";

interface Tab {
  id: TabId;
  label: string;
  badge?: number;
}

interface ContactTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  pendingCount?: number;
}

export default function ContactTabs({
  activeTab,
  onTabChange,
  pendingCount = 0,
}: ContactTabsProps) {
  const tabs: Tab[] = [
    { id: "all", label: "All Friends" },
    { id: "online", label: "Online" },
    { id: "pending", label: "Pending", badge: pendingCount },
    { id: "blocked", label: "Blocked" },
  ];

  return (
    <div className="flex gap-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`text-sm font-medium pb-7 pt-7 -mb-[2px] transition-colors border-b-2 ${
            activeTab === tab.id
              ? "text-primary border-primary"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent"
          }`}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="ml-2 bg-primary px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
