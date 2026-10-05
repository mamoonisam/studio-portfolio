import { ServiceForm } from "@/components/admin/ServiceForm";
import { requireAdminPage } from "@/lib/auth";

export default async function NewServicePage() {
  await requireAdminPage();
  return <ServiceForm service={null} />;
}
