import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { ReactNode } from "react";

interface HeaderProps {
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

export function Header({ leftContent, rightContent }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {leftContent ?? (
          <Link
            to="/"
            className="font-bold text-xl tracking-tighter text-gray-900 cursor-pointer"
          >
            {t("app_name")}
          </Link>
        )}
        <div className="flex items-center gap-3">
          {rightContent}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
