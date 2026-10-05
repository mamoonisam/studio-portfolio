"use client";

import { useState, useTransition } from "react";
import { KeyIcon } from "@/components/icons";
import { SubmitButton, TextField } from "@/components/admin/fields";
import { useFeedback } from "@/components/admin/Feedback";
import { changeOwnPassword, setAdminPassword, type AdminAccount } from "@/lib/actions/account";
import { t } from "@/lib/i18n";

const a = t.admin.account;

interface Props {
  email: string;
  role: "owner" | "admin" | "editor";
  others: AdminAccount[];
  othersError: string | null;
}

export function AccountSettings({ email, role, others, othersError }: Props) {
  return (
    <div className="grid max-w-xl gap-6">
      <section className="card p-5 sm:p-6">
        <p className="text-sm text-muted">{a.signedInAs}</p>
        <p className="mt-1 font-medium" dir="ltr">{email}</p>
        <p className="mt-1 text-sm text-muted">{a.roles[role]}</p>
      </section>

      <ChangePasswordForm />

      {role === "owner" && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-sans text-lg font-semibold">{a.othersTitle}</h2>
          <p className="mt-1 text-[0.95rem] text-muted">{a.othersIntro}</p>
          {othersError ? (
            <p className="mt-4 text-sm text-danger">{othersError}</p>
          ) : others.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{a.noOthers}</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {others.map((admin) => (
                <OtherAdminRow key={admin.user_id} admin={admin} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function ChangePasswordForm() {
  const { report } = useFeedback();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await changeOwnPassword({ current, password, confirm });
      setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
      if (report(result, a.changed)) {
        setCurrent("");
        setPassword("");
        setConfirm("");
      }
    });
  };

  return (
    <form onSubmit={submit} className="card grid gap-4 p-5 sm:p-6" noValidate>
      <h2 className="font-sans text-lg font-semibold">{a.changeTitle}</h2>
      <TextField
        label={a.current}
        type="password"
        autoComplete="current-password"
        dir="ltr"
        value={current}
        onValue={setCurrent}
        error={errors.current}
      />
      <TextField
        label={a.newPassword}
        type="password"
        autoComplete="new-password"
        dir="ltr"
        value={password}
        onValue={setPassword}
        hint={a.hint}
        error={errors.password}
      />
      <TextField
        label={a.confirm}
        type="password"
        autoComplete="new-password"
        dir="ltr"
        value={confirm}
        onValue={setConfirm}
        error={errors.confirm}
      />
      <div>
        <SubmitButton pending={pending} label={a.change} pendingLabel={a.changing} />
      </div>
    </form>
  );
}

function OtherAdminRow({ admin }: { admin: AdminAccount }) {
  const { report } = useFeedback();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await setAdminPassword({ user_id: admin.user_id, password, confirm });
      setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
      if (report(result, a.setDone(admin.email))) {
        setPassword("");
        setConfirm("");
        setOpen(false);
      }
    });
  };

  return (
    <li className="rounded-xl border border-line p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium" dir="ltr">{admin.email}</p>
          <p className="text-sm text-muted">{a.roles[admin.role]}</p>
        </div>
        {!open && (
          <button type="button" className="btn btn-sm btn-outline" onClick={() => setOpen(true)}>
            <KeyIcon size={16} />
            {a.setPassword}
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-4" noValidate>
          <p className="text-sm font-medium">{a.setFor(admin.email)}</p>
          <TextField
            label={a.newPassword}
            type="password"
            autoComplete="new-password"
            dir="ltr"
            value={password}
            onValue={setPassword}
            hint={a.hint}
            error={errors.password}
          />
          <TextField
            label={a.confirm}
            type="password"
            autoComplete="new-password"
            dir="ltr"
            value={confirm}
            onValue={setConfirm}
            error={errors.confirm}
          />
          <div className="flex flex-wrap gap-2">
            <SubmitButton pending={pending} label={a.set} />
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={pending}>
              {t.admin.common.cancel}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
