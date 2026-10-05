import { AccountSettings } from "@/components/admin/AccountSettings";
import { listOtherAdmins, type AdminAccount } from "@/lib/actions/account";
import { AdminPageHeader } from "@/components/admin/fields";
import { requireAdminPage } from "@/lib/auth";
import { logError } from "@/lib/utils/log";
import { t } from "@/lib/i18n";

export default async function AccountPage() {
  const { supabase, user } = await requireAdminPage();

  let role: "owner" | "admin" | "editor" = "admin";
  try {
    const { data } = await supabase.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
    if (data?.role) role = data.role;
  } catch (error) {
    logError("account:page", error);
  }

  // Owners can reset other admins' passwords; load that list on the server.
  let others: AdminAccount[] = [];
  let othersError: string | null = null;
  if (role === "owner") {
    const result = await listOtherAdmins();
    if (result.ok) others = result.data ?? [];
    else othersError = result.error;
  }

  return (
    <>
      <AdminPageHeader title={t.admin.account.title} />
      <AccountSettings email={user.email ?? ""} role={role} others={others} othersError={othersError} />
    </>
  );
}
