"use client";

import { useState, type FormEvent } from "react";

import { Modal } from "@/shared/ui/modal";
import { fieldClass, labelClass } from "@/shared/ui/form";
import { userService } from "@/shared/api/user-service";
import { getErrorMessage } from "@/shared/api/error";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserModal({
  open,
  onClose,
  onCreated,
}: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setSurname("");
    setEmail("");
    setPhone("");
    setPassword("");
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await userService.create({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Новий користувач">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="create-user-name" className={labelClass}>
              Ім&apos;я
            </label>
            <input
              id="create-user-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Іван"
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="create-user-surname" className={labelClass}>
              Прізвище
            </label>
            <input
              id="create-user-surname"
              required
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="Іваненко"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="create-user-email" className={labelClass}>
            Email
          </label>
          <input
            id="create-user-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ivan@example.com"
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="create-user-phone" className={labelClass}>
            Телефон
          </label>
          <input
            id="create-user-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+380501234567"
            className={fieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="create-user-password" className={labelClass}>
            Пароль
          </label>
          <input
            id="create-user-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {submitting ? "Створення…" : "Створити"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
