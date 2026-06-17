"use client";

import { useState, type FormEvent } from "react";

import { Modal } from "@/shared/ui/modal";
import { fieldClass, labelClass } from "@/shared/ui/form";
import { userService } from "@/shared/api/user-service";
import { getErrorMessage } from "@/shared/api/error";
import type { User } from "@/shared/domain/user";

interface EditUserModalProps {
  /** The user being edited, or `null` when the modal is closed. */
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditUserModal({ user, onClose, onSaved }: EditUserModalProps) {
  return (
    <Modal open={user !== null} onClose={onClose} title="Редагувати користувача">
      {/* Remount per user so the form seeds cleanly from props (no effect). */}
      {user && (
        <EditUserForm
          key={user._id}
          user={user}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

function EditUserForm({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [surname, setSurname] = useState(user.surname);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await userService.update({
        id: user._id,
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="edit-user-name" className={labelClass}>
            Ім&apos;я
          </label>
          <input
            id="edit-user-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="edit-user-surname" className={labelClass}>
            Прізвище
          </label>
          <input
            id="edit-user-surname"
            required
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-user-email" className={labelClass}>
          Email
        </label>
        <input
          id="edit-user-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-user-phone" className={labelClass}>
          Телефон
        </label>
        <input
          id="edit-user-phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+380501234567"
          className={fieldClass}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-paper-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
        >
          Скасувати
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Збереження…" : "Зберегти"}
        </button>
      </div>
    </form>
  );
}
