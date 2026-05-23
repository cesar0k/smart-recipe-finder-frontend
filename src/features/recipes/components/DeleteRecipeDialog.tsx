import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteRecipeDialogProps {
  /** The recipe to delete. The dialog is open whenever this is non-null. */
  recipe: { id: number; title?: string | null } | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (recipeId: number) => void | Promise<void>;
  isDeleting?: boolean;
}

/**
 * Single delete-confirmation dialog used everywhere a recipe can be deleted.
 *
 * We keep a local copy of `recipe` so the title text stays rendered during the
 * AlertDialog exit animation (Radix unmounts children only after the animation
 * finishes — but the parent typically clears `recipe` synchronously on close,
 * which would otherwise blank the title mid-animation).
 */
export function DeleteRecipeDialog({
  recipe,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteRecipeDialogProps) {
  const { t } = useTranslation();

  // Latched copy of recipe — preserved during exit animation. We update the
  // latch during render (on the transition from null → non-null) instead of
  // in a useEffect, which would log a cascading-render warning.
  const [latched, setLatched] = useState<typeof recipe>(null);
  if (recipe && recipe !== latched) {
    setLatched(recipe);
  }

  const open = !!recipe;
  const displayed = recipe ?? latched;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("delete_dialog_title")}</AlertDialogTitle>
          <AlertDialogDescription className="[word-break:break-word]">
            {t("delete_dialog_desc", { title: displayed?.title ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">
            {t("cancel_btn")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (displayed) onConfirm(displayed.id);
            }}
            className="bg-red-600 hover:bg-red-700 text-white border-none rounded-full"
            disabled={isDeleting}
          >
            {t("delete_btn")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
