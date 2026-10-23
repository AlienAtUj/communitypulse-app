import React from "react";
import { DataProvider, useData } from "./context/DataContext";
import { HomeScreen } from "./screens/HomeScreen";
import { UpdatesScreen } from "./screens/UpdatesScreen";
import { SchedulesScreen } from "./screens/SchedulesScreen";
import { HelpScreen } from "./screens/HelpScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { NgoScreen } from "./screens/NgoScreen";
import { ReportSheet } from "./screens/ReportSheet";
import { IncidentDetailSheet } from "./screens/IncidentDetailSheet";
import { Toast } from "./components/Toast";

function AppRoutes() {
  const {
    pathname,
    incidents,
    selectedIncidentId,
    setSelectedIncidentId,
    updateIncidentStatus,
    navigate,
    toast,
    dismissToast,
    showToast,
  } = useData();

  const selectedIncident =
    incidents.find((inc) => inc.id === selectedIncidentId) || null;

  const handleFindHelpFromDetail = () => {
    setSelectedIncidentId(null);
    navigate("/help");
  };

  const handleConfirmResolved = (id: string) => {
    updateIncidentStatus(id, "resolved");
    setSelectedIncidentId(null);
    showToast("Marked as resolved. Thank you for confirming.", "success");
  };

  let ScreenComponent = HomeScreen;
  if (pathname === "/updates") {
    ScreenComponent = UpdatesScreen;
  } else if (pathname === "/schedules") {
    ScreenComponent = SchedulesScreen;
  } else if (pathname === "/help") {
    ScreenComponent = HelpScreen;
  } else if (pathname === "/dashboard") {
    ScreenComponent = DashboardScreen;
  } else if (pathname === "/ngo") {
    ScreenComponent = NgoScreen;
  }

  return (
    <>
      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          onDismiss={dismissToast}
        />
      )}

      <ScreenComponent />

      <ReportSheet />

      <IncidentDetailSheet
        incident={selectedIncident}
        onClose={() => setSelectedIncidentId(null)}
        onFindHelp={handleFindHelpFromDetail}
        onConfirmResolved={handleConfirmResolved}
      />
    </>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppRoutes />
    </DataProvider>
  );
}
