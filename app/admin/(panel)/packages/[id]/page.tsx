import { notFound } from "next/navigation";
import { PackageForm } from "@/components/admin/PackageForm";
import { requireAdminPage } from "@/lib/auth";
import { getPackage } from "@/lib/data/admin";
import { isUuid } from "@/lib/utils/ids";

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase } = await requireAdminPage();
  const pkg = await getPackage(supabase, id);
  if (!pkg) notFound();
  return <PackageForm key={pkg.updated_at} pkg={pkg} />;
}
