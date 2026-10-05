import { PackagesList } from "@/components/admin/PackagesList";
import { requireAdminPage } from "@/lib/auth";
import { listPackages } from "@/lib/data/admin";

export default async function PackagesAdminPage() {
  const { supabase } = await requireAdminPage();
  return <PackagesList packages={await listPackages(supabase)} />;
}
