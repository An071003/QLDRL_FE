"use client";

import React, { createContext, useContext, ReactNode } from "react";

// Context for tab state
interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

// Hook to use the tabs context
function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ 
  value, 
  onValueChange, 
  children, 
  className = "" 
}: TabsProps) {
  // Find all Tab children
  const tabs = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab
  );

  // Find the selected tab's content
  const selectedTab = React.Children.toArray(children).find(
    (child) => 
      React.isValidElement(child) && 
      child.type === Tab && 
      child.props.value === value
  );

  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`w-full ${className}`}>
        <div className="flex border-b border-gray-200 mb-4">
          {tabs.map((tab) => {
            if (React.isValidElement(tab)) {
              return (
                <button
                  key={tab.props.value}
                  onClick={() => onValueChange(tab.props.value)}
                  className={`px-4 py-2 font-medium ${
                    tab.props.value === value
                      ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.props.title}
                </button>
              );
            }
            return null;
          })}
        </div>
        <div className="tab-content">
          {selectedTab}
        </div>
      </div>
    </TabsContext.Provider>
  );
}

interface TabProps {
  value: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Tab({ 
  value, 
  title, 
  children, 
  className = "" 
}: TabProps) {
  return <div className={className}>{children}</div>;
} 