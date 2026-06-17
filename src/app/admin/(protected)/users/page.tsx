"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { userService } from "@/shared/api/user-service";
import { getErrorMessage } from "@/shared/api/error";
import { userFullName, type User } from "@/shared/domain/user";
import { useAuth } from "@/shared/auth/auth-context";
import { useUsers } from "@/shared/users/users-context";
import { Modal } from "@/shared/ui/modal";
import { UserFilterBar } from "./_components/user-filter-bar";
import { CreateUserModal } from "./_components/create-user-modal";
import { EditUserModal } from "./_components/edit-user-modal";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { refresh: refreshPickers } = useUsers();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    userService
      .list()
      .then((list) => {
        if (active) setUsers(list);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  const handleSearchChange = useCallback((next: string) => {
    setSearch(next);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.surname.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q),
    );
  }, [users, search]);

  function handleCreated() {
    refresh();
    refreshPickers();
  }

  function handleSaved() {
    refresh();
    refreshPickers();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await userService.remove(pendingDelete._id);
      setPendingDelete(null);
      refresh();
      refreshPickers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-[0.15em] text-ink-soft">
              /admin/users
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              Користувачі
            </h1>
            <p className="text-sm text-ink-soft">
              Персонал. Показано: {filtered.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            <Plus className="size-4" strokeWidth={2.5} /> Новий користувач
          </button>
        </div>

        {/* Search */}
        <UserFilterBar
          value={search}
          onChange={handleSearchChange}
          loading={loading}
          onRefresh={refresh}
        />

        {/* Content */}
        <div className="overflow-hidden rounded-2xl border border-paper-line bg-white">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={refresh}
                className="rounded-lg border border-paper-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-paper"
              >
                Спробувати ще раз
              </button>
            </div>
          ) : loading ? (
            <p className="px-6 py-16 text-center font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
              Завантаження…
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-ink-soft">
              Користувачів не знайдено.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-paper-line font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
                  <th className="px-4 py-3 font-medium">Ім&apos;я</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Телефон</th>
                  <th className="px-4 py-3 text-right font-medium">Дії</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = u._id === currentUser.id;
                  return (
                    <tr
                      key={u._id}
                      onClick={() => setEditing(u)}
                      className="cursor-pointer border-b border-paper-line/70 transition-colors last:border-0 hover:bg-paper/50"
                    >
                      <td className="px-4 py-3 font-medium text-ink">
                        {userFullName(u)}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                        {u.phone}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(u);
                          }}
                          disabled={isSelf}
                          aria-label="Видалити користувача"
                          title={
                            isSelf
                              ? "Не можна видалити власний обліковий запис"
                              : undefined
                          }
                          className="rounded-lg border border-paper-line p-1.5 text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-soft"
                        >
                          <Trash2 className="size-4" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <EditUserModal
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
      />

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Видалити користувача?"
      >
        <p className="text-sm text-ink-soft">
          Користувача{" "}
          <span className="font-medium text-ink">
            {pendingDelete ? userFullName(pendingDelete) : ""}
          </span>{" "}
          буде видалено. Цю дію не можна скасувати.
        </p>
        <div className="flex justify-end gap-3 pt-5">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className="rounded-lg border border-paper-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Видалення…" : "Видалити"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
