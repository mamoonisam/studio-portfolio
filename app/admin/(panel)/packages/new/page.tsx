import { PackageForm } from "@/components/admin/PackageForm";
import { requireAdminPage } from "@/lib/auth";

export default async function NewPackagePage() {
  await requireAdminPage();
  return <PackageForm pkg={null} />;
}
