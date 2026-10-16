import EventsAdminList from "@/components/EventsAdminList";
import AdminsPanel from "@/components/AdminsPanel";

export default function AdminEventsPage() {
  return (
    <main className="min-h-screen bg-white px-6">
      <EventsAdminList />
      <div className="mx-auto w-full max-w-3xl border-t border-black/10" />
      <AdminsPanel />
    </main>
  );
}
