import { Tabs, Button } from "antd";
import type { TabsProps } from "antd";
import type { Activity } from "@/types/activity";
import ActivityTable from "./ActivityTable";

interface ActivityRegistrationTabsProps {
  availableActivities: Activity[];
  registeredActivities: Activity[];
  selectedToRegister: number[];
  selectedToCancel: number[];
  loading: boolean;
  onRegisterSelectionChange: (keys: number[]) => void;
  onCancelSelectionChange: (keys: number[]) => void;
  onRegister: () => void;
  onCancel: () => void;
}

export default function ActivityRegistrationTabs({
  availableActivities,
  registeredActivities,
  selectedToRegister,
  selectedToCancel,
  loading,
  onRegisterSelectionChange,
  onCancelSelectionChange,
  onRegister,
  onCancel
}: ActivityRegistrationTabsProps) {
  const tabItems: TabsProps["items"] = [
    {
      key: "register",
      label: "Đăng ký",
      children: (
        <>
          <ActivityTable
            activities={availableActivities}
            selectedRows={selectedToRegister}
            onSelectionChange={onRegisterSelectionChange}
            loading={loading}
          />
          {availableActivities.length > 0 && (
            <div className="text-right mt-4">
              <Button 
                type="primary" 
                disabled={!selectedToRegister.length} 
                onClick={onRegister}
              >
                Đăng ký
              </Button>
            </div>
          )}
        </>
      ),
    },
    {
      key: "cancel",
      label: "Hủy",
      children: (
        <>
          <ActivityTable
            activities={registeredActivities}
            selectedRows={selectedToCancel}
            onSelectionChange={onCancelSelectionChange}
            loading={loading}
          />
          {registeredActivities.length > 0 && (
            <div className="text-right mt-4">
              <Button 
                danger 
                disabled={!selectedToCancel.length} 
                onClick={onCancel}
              >
                Hủy đăng ký
              </Button>
            </div>
          )}
        </>
      ),
    },
  ];

  return <Tabs items={tabItems} />;
} 