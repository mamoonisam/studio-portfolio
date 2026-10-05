import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/auth";
import { getSettingsForAdmin } from "@/lib/data/admin";
import { siteName } from "@/lib/data/defaults";
import { logError } from "@/lib/utils/log";

/**
 * Every page under here is admin-only. The proxy already sends signed-out
 * visitors to the login page; this check also verifies the admin ROLE on the
 * server, so hiding links is never the only protection.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAdminPage();

  let name = "";
  let newBookings = 0;
  try {
    const [settings, bookings] = await Promise.all([
      getSettingsForAdmin(supabase),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);
    name = siteName(settings);
    newBookings = bookings.count ?? 0;
  } catch (error) {
    logError("admin:layout", error);
  }

  return (
    <AdminShell siteName={name} email={user.email ?? ""} newBookings={newBookings}>
      {children}
    </AdminShell>
  );
}
