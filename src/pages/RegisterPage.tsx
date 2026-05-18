import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import axios from "axios";
import { ChefHat } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/auth/auth-context";
import { useTranslation } from "react-i18next";
import { useDismissSplash } from "@/hooks/useDismissSplash";
import { useRecaptcha } from "@/hooks/useRecaptcha";

function createRegisterSchema(t: (key: string) => string) {
  return z
    .object({
      email: z.email(t("register_invalid_email")),
      username: z
        .string()
        .min(3, t("register_username_min"))
        .max(100, t("register_username_max")),
      displayName: z.string().max(200).optional(),
      password: z
        .string()
        .min(8, t("register_password_min"))
        .max(128, t("register_password_max")),
      confirmPassword: z.string().min(1, t("register_confirm_required")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: t("register_passwords_must_match"),
    });
}

type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;

export function RegisterPage() {
  useDismissSplash();
  const { t } = useTranslation();
  const { register: registerUser, loginWithGoogle, isAuthenticated } = useAuth();
  const executeRecaptcha = useRecaptcha("register");
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: string })?.from || "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (response) => {
      setError(null);
      setIsSubmitting(true);
      try {
        await loginWithGoogle(response.code);
        navigate(from, { replace: true });
      } catch {
        setError(t("google_auth_error"));
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => {
      setError(t("google_auth_error"));
    },
  });

  const registerSchema = createRegisterSchema(t);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", username: "", displayName: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const recaptchaToken = await executeRecaptcha();
      await registerUser(data.email, data.username, data.password, data.displayName, recaptchaToken);
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          setError(t("register_conflict"));
        } else if (status === 422) {
          setError(t("register_validation_error"));
        } else {
          setError(t("register_generic_error"));
        }
      } else {
        setError(t("register_generic_error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Logo header */}
          <div className="flex items-center justify-center py-4 border-b border-gray-300">
            <Link to="/" className="group flex items-center gap-0 hover:gap-2 transition-all duration-300">
              <div className="w-0 group-hover:w-8 h-8 overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
                <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
                  <ChefHat className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="text-lg font-bold tracking-tighter text-gray-900">
                {t("app_name")}
              </span>
            </Link>
          </div>

          {/* Form body */}
          <div className="px-8 pb-8 pt-6 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("register_title")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("register_subtitle")}
            </p>
          </div>

          {/* Google Sign-Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full h-12 text-sm font-medium gap-3 border-gray-200 hover:bg-gray-50"
            onClick={() => googleLogin()}
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t("google_sign_up")}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase">{t("or_divider")}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Form {...form}>
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoCapitalize="none"
                        {...field}
                        className="rounded-full px-4 border-gray-300 bg-white h-12"
                      />
                    </FormControl>
                    <FormMessage className="ml-4" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("register_username_label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("register_username_placeholder")}
                        autoComplete="username"
                        autoCapitalize="none"
                        {...field}
                        className="rounded-full px-4 border-gray-300 bg-white h-12"
                      />
                    </FormControl>
                    <FormMessage className="ml-4" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("register_display_name_label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("register_display_name_placeholder")}
                        autoComplete="name"
                        {...field}
                        className="rounded-full px-4 border-gray-300 bg-white h-12"
                      />
                    </FormControl>
                    <FormMessage className="ml-4" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("register_password_label")}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={t("register_password_placeholder")}
                        autoComplete="new-password"
                        {...field}
                        className="rounded-full px-4 border-gray-300 bg-white h-12"
                      />
                    </FormControl>
                    <FormMessage className="ml-4" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("register_confirm_password_label")}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={t("register_confirm_password_placeholder")}
                        autoComplete="new-password"
                        {...field}
                        className="rounded-full px-4 border-gray-300 bg-white h-12"
                      />
                    </FormControl>
                    <FormMessage className="ml-4" />
                  </FormItem>
                )}
              />

              {error && (
                <p className="text-sm text-red-600 text-center px-4">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full rounded-full h-12 text-base font-semibold bg-black hover:bg-gray-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("register_loading") : t("register_btn")}
              </Button>
              <p className="text-center text-[11px] text-gray-400">
                {t("recaptcha_notice")}
              </p>
            </form>
          </Form>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t("register_has_account")}{" "}
          <Link
            to="/login"
            state={{ from }}
            className="font-medium text-black hover:underline"
          >
            {t("register_login_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
