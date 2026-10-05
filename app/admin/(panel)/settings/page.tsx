import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdminPage } from "@/lib/auth";
import { getSettingsForAdmin } from "@/lib/data/admin";

export default async function SettingsPage() {
  const { supabase } = await requireAdminPage();
  const settings = await getSettingsForAdmin(supabase);
  return <SettingsForm settings={settings} />;
}
