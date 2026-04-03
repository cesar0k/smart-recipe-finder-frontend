import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import axios from "axios";
import { ChefHat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function createRegisterSchema(t: (key: string) => string) {
  return z
    .object({
      email: z.email(t("register_invalid_email")),
      username: z
        .string()
        .min(3, t("register_username_min"))
        .max(100, t("register_username_max")),
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
  const { t } = useTranslation();
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: string })?.from || "/";

  if (isAuthenticated) {
    navigate(from, { replace: true });
  }

  const registerSchema = createRegisterSchema(t);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", username: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await registerUser(data.email, data.username, data.password);
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
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Logo header */}
          <div className="flex items-center justify-center py-4 border-b border-gray-200">
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
                        {...field}
                        className="rounded-full px-4 border-gray-200 bg-gray-50/50 focus:bg-white h-12"
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
                        {...field}
                        className="rounded-full px-4 border-gray-200 bg-gray-50/50 focus:bg-white h-12"
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
                      <Input
                        type="password"
                        placeholder={t("register_password_placeholder")}
                        autoComplete="new-password"
                        {...field}
                        className="rounded-full px-4 border-gray-200 bg-gray-50/50 focus:bg-white h-12"
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
                      <Input
                        type="password"
                        placeholder={t("register_confirm_password_placeholder")}
                        autoComplete="new-password"
                        {...field}
                        className="rounded-full px-4 border-gray-200 bg-gray-50/50 focus:bg-white h-12"
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
