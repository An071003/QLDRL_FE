"use client";

import React, { createContext, ReactNode } from "react";

// Context for tab state
interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

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
      (child.props as TabProps).value === value
  );

  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`w-full ${className}`}>
        <div className="flex border-b border-gray-200 mb-4">
          {tabs.map((tab) => {
            if (React.isValidElement(tab)) {
              const tabProps = tab.props as TabProps;
              return (
                <button
                  key={tabProps.value}
                  onClick={() => onValueChange(tabProps.value)}
                  className={`px-4 py-2 font-medium ${
                    tabProps.value === value
                      ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tabProps.title}
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

export function Tab({ children, className = "" }: TabProps) {
  return <div className={className}>{children}</div>;
} 