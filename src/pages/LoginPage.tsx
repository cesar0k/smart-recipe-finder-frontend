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

function createLoginSchema(t: (key: string) => string) {
  return z.object({
    username: z.string().min(1, t("login_field_required")),
    password: z.string().min(1, t("login_field_required")),
  });
}

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function LoginPage() {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: string })?.from || "/";

  // If already authenticated, redirect
  if (isAuthenticated) {
    navigate(from, { replace: true });
  }

  const loginSchema = createLoginSchema(t);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(data.username, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          setError(t("login_invalid_credentials"));
        } else if (status === 403) {
          setError(t("login_account_deactivated"));
        } else {
          setError(t("login_generic_error"));
        }
      } else {
        setError(t("login_generic_error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
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
              {t("login_title")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("login_subtitle")}
            </p>
          </div>

          <Form {...form}>
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("login_username_label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("login_username_placeholder")}
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
                      {t("login_password_label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("login_password_placeholder")}
                        autoComplete="current-password"
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
                {isSubmitting ? t("login_loading") : t("login_btn")}
              </Button>
            </form>
          </Form>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t("login_no_account")}{" "}
          <Link
            to="/register"
            state={{ from }}
            className="font-medium text-black hover:underline"
          >
            {t("login_register_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
