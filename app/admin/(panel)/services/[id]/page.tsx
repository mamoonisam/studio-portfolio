import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { requireAdminPage } from "@/lib/auth";
import { getService } from "@/lib/data/admin";
import { isUuid } from "@/lib/utils/ids";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase } = await requireAdminPage();
  const service = await getService(supabase, id);
  if (!service) notFound();
  return <ServiceForm key={service.updated_at} service={service} />;
}
