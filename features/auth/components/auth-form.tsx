"use client";

import { apiUrl } from "@/features/shared/api-url";


import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PasswordField from "./password-field";
import { useAuth } from "./auth-provider";
import type { AuthMode } from "../types";
import { validateLogin, validateRegistration } from "../validation";
import { loginUser, registerUser } from "../services/auth-api";
import styles from "../auth.module.css";

const googleMessages = new Map([
  ["google_cancelled", "تم إلغاء الدخول بجوجل. بتقدر تحاول مرة ثانية أو تدخل بالإيميل وكلمة المرور."],
  ["google_invalid_request", "انتهت محاولة الدخول أو صارت غير صالحة. اضغط المتابعة باستخدام Google للمحاولة من جديد."],
  ["google_account_exists", "هذا الإيميل مرتبط بحساب موجود. سجّل دخولك بالطريقة السابقة؛ الحسابات ما بتنربط تلقائيًا."],
  ["google_failed", "تعذّر تسجيل الدخول بجوجل. جرّب مرة ثانية، أو استخدم الإيميل وكلمة المرور."],
]);

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const formId = useId();
  const searchParams = useSearchParams();
  const googleCode = searchParams.get("error") || "";
  const googleNotice = googleMessages.get(googleCode) || "";
  const { session, signIn, signOut, isRestoring } = useAuth();
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    setNotice("");
    setIsError(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    };
    const confirmation = String(formData.get("confirm-password") ?? "");
    const validationError = isRegister
      ? validateRegistration(payload, confirmation)
      : validateLogin(payload);

    if (validationError) {
      setIsError(true);
      setNotice(validationError);
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await registerUser(payload);
        setNotice("تم إنشاء حسابك بنجاح!");
      } else {
        const result = await loginUser({ email: payload.email, password: payload.password });
        signIn(result);
      }
      form.reset();
    } catch (error) {
      setIsError(true);
      setNotice(error instanceof Error ? error.message : "صار خطأ غير متوقع. حاول مرة ثانية.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isRestoring) return <p role="status">جاري التحقق من الدخول…</p>;

  if (!isRegister && session) {
    return (
      <div className={styles.accountSummary}>
        <p role="status">✓ تم تسجيل الدخول بنجاح!</p>
        <strong>مرحبًا، {session.user.name}</strong>
        <p dir="ltr">{session.user.email}</p>
        <Link className="send-button" href="/">انتقل للرسائل <span aria-hidden="true">↖</span></Link>
        <button type="button" className={styles.signOut} onClick={signOut}>تسجيل الخروج</button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
      {googleNotice && !notice && (
        <p className={`${styles.notice} ${googleCode === "google_cancelled" ? "" : styles.error}`}
          role={googleCode === "google_cancelled" ? "status" : "alert"}>
          {googleNotice}
        </p>
      )}
      <fieldset className={styles.fieldset} disabled={isLoading}>
      <button className={styles.googleButton} type="button" disabled={isLoading}
        onClick={() => window.location.assign(apiUrl("/api/auth/google"))}>
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.67-.35-3.92H24v7.42h11c-.47 2.4-1.83 4.43-3.86 5.79v4.81h6.25c3.65-3.36 6.22-8.31 6.22-14.1Z" />
          <path fill="#34A853" d="M24 44c5.4 0 9.93-1.79 13.24-4.84l-6.25-4.81c-1.79 1.2-4.08 1.91-6.99 1.91-5.21 0-9.62-3.52-11.2-8.25H6.35v4.97C9.64 39.52 16.3 44 24 44Z" />
          <path fill="#FBBC05" d="M12.8 28.01A12 12 0 0 1 12.17 24c0-1.39.24-2.74.63-4.01v-4.97H6.35A20 20 0 0 0 4 24c0 3.23.78 6.29 2.35 8.98l6.45-4.97Z" />
          <path fill="#EA4335" d="M24 11.74c3.02 0 5.73 1.04 7.86 3.09l5.9-5.9C34.19 5.6 29.66 4 24 4 16.3 4 9.64 8.48 6.35 15.02l6.45 4.97C14.38 15.26 18.79 11.74 24 11.74Z" />
        </svg>
        <span>المتابعة باستخدام Google</span>
      </button>
      <div className={styles.divider}><span>أو بالإيميل</span></div>
      {isRegister && (
        <div className={styles.field}>
          <label htmlFor={`${formId}-name`}>الاسم الكامل</label>
          <input id={`${formId}-name`} name="name" type="text" autoComplete="name" placeholder="شو اسمك؟" required />
        </div>
      )}
      <div className={styles.field}>
        <label htmlFor={`${formId}-email`}>البريد الإلكتروني</label>
        <input id={`${formId}-email`} name="email" type="email" autoComplete="email" placeholder="you@example.com" dir="ltr" required />
      </div>
      <PasswordField name="password" label="كلمة المرور" autoComplete={isRegister ? "new-password" : "current-password"} />
      {isRegister && <PasswordField name="confirm-password" label="تأكيد كلمة المرور" autoComplete="new-password" />}
      {isRegister && <p className={styles.passwordHint}>كلمة المرور 8 أحرف على الأقل، والتأكيد لازم يطابقها.</p>}
      <button className={`send-button ${styles.submit}`} type="submit" disabled={isLoading}>
        <span>{isLoading ? isRegister ? "جاري إنشاء الحساب…" : "جاري تسجيل الدخول…" : isRegister ? "إنشاء حساب" : "تسجيل الدخول"}</span>
        {isLoading ? <span className="loading-spinner" aria-hidden="true" /> : <span aria-hidden="true">↖</span>}
      </button>
      </fieldset>
      <p className={`${styles.notice} ${isError ? styles.error : ""}`} role={isError ? "alert" : "status"} aria-live={isError ? "assertive" : "polite"}>{notice}</p>
    </form>
  );
}
