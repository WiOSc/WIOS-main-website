import EventsAdminList from "@/components/EventsAdminList";
import AdminsPanel from "@/components/AdminsPanel";
import AdminShell from "@/components/AdminShell";

export default function AdminEventsPage() {
  return (
    <AdminShell>
      <EventsAdminList />
      <AdminsPanel />
    </AdminShell>
  );
}
