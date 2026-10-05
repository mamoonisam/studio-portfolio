import { ServicesList } from "@/components/admin/ServicesList";
import { requireAdminPage } from "@/lib/auth";
import { listServices } from "@/lib/data/admin";

export default async function ServicesPage() {
  const { supabase } = await requireAdminPage();
  return <ServicesList services={await listServices(supabase)} />;
}
