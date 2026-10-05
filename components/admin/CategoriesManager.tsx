"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Modal, useFeedback } from "@/components/admin/Feedback";
import { AdminPageHeader, EmptyState, SubmitButton, TextArea, TextField } from "@/components/admin/fields";
import { ReorderableList } from "@/components/admin/ReorderableList";
import { deleteCategory, saveCategory } from "@/lib/actions/categories";
import { t } from "@/lib/i18n";
import type { Category } from "@/types/content";

const k = t.admin.categories;
const c = t.admin.common;

type Row = Category & { photo_count: number; album_count: number };

export function CategoriesManager({ categories }: { categories: Row[] }) {
  const router = useRouter();
  const { report, confirm } = useFeedback();
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const open = (row: Row | "new") => {
    setEditing(row);
    setName(row === "new" ? "" : row.name);
    setDescription(row === "new" ? "" : row.description ?? "");
    setErrors({});
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveCategory({ id: editing && editing !== "new" ? editing.id : null, name, description });
      if (report(result)) {
        setEditing(null);
        router.refresh();
      } else if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
      }
    });
  };

  const remove = async (row: Row) => {
    const ok = await confirm({ title: `${c.delete}: ${row.name}`, body: k.deleteConfirm(row.photo_count, row.album_count), danger: true });
    if (!ok) return;
    startTransition(async () => {
      if (report(await deleteCategory(row.id))) router.refresh();
    });
  };

  return (
    <>
      <AdminPageHeader
        title={k.title}
        actions={
          <button type="button" className="btn btn-sm btn-primary" onClick={() => open("new")}>
            <PlusIcon size={18} /> {k.add}
          </button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState title={k.empty} hint={k.emptyHint} action={<button type="button" className="btn btn-primary" onClick={() => open("new")}>{k.add}</button>} />
      ) : (
        <ReorderableList
          table="categories"
          items={categories}
          render={(row) => (
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.name}</p>
                <p className="truncate text-sm text-muted">{k.usage(row.photo_count, row.album_count)}</p>
              </div>
              <button type="button" className="btn btn-icon btn-ghost" aria-label={`${c.edit} ${row.name}`} onClick={() => open(row)}>
                <EditIcon size={18} />
              </button>
              <button type="button" className="btn btn-icon btn-ghost text-danger" aria-label={`${c.delete} ${row.name}`} onClick={() => remove(row)} disabled={pending}>
                <TrashIcon size={18} />
              </button>
            </div>
          )}
        />
      )}

      {editing && (
        <Modal title={editing === "new" ? k.add : c.edit} onClose={() => setEditing(null)} size="sm">
          <form onSubmit={submit} className="grid gap-5">
            <TextField label={k.name} value={name} onValue={setName} error={errors.name} maxLength={80} required autoFocus />
            <TextArea label={k.description} value={description} onValue={setDescription} rows={3} maxLength={300} optional />
            <div className="flex gap-2">
              <SubmitButton pending={pending} label={editing === "new" ? c.add : c.save} />
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>{c.cancel}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
