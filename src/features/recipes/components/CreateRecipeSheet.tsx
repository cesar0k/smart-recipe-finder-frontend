import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RecipeForm, type RecipeFormServerErrors } from "./RecipeForm";
import { useRecipeMutations } from "../hooks/useRecipeMutations";
import { type RecipeFormValues } from "../types/schema";
import { useTranslation } from "react-i18next";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useHistoryBack } from "@/hooks/useHistoryBack";

export function CreateRecipeSheet() {
  const [open, setOpen] = useState(false);
  // When the backend returns 422 we re-open the modal with the user's last
  // submitted values and surface field errors inline. These two pieces of
  // state get cleared on the next successful submit and when the user
  // manually closes the modal.
  const [lastValues, setLastValues] = useState<Partial<RecipeFormValues> | undefined>(undefined);
  const [serverErrors, setServerErrors] = useState<RecipeFormServerErrors | undefined>(undefined);
  const { t } = useTranslation();
  const handleOpenChange = useHistoryBack(open, (next) => {
    setOpen(next);
    if (!next) {
      // Reset server errors when the user closes the modal — fresh start next time.
      setServerErrors(undefined);
    }
  });

  const { createRecipe } = useRecipeMutations({
    onSuccess: () => {
      handleOpenChange(false);
      setLastValues(undefined);
      setServerErrors(undefined);
    },
    onFieldErrors: (errors, data) => {
      setLastValues(data);
      setServerErrors(errors);
      setOpen(true);
    },
  });

  const onSubmit = (data: RecipeFormValues) => {
    // Clear stale server errors so they don't briefly persist between submits.
    setServerErrors(undefined);
    createRecipe(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full font-bold bg-black text-white hover:bg-gray-800 transition-all">
          {/* Mobile: icon only; Desktop: full label */}
          <Plus className="w-4 h-4 md:hidden" />
          <span className="hidden md:inline">{t("create_btn")}</span>
        </Button>
      </DialogTrigger>
      <DialogScrollContent>
        <DialogHeader className="text-left px-0 py-2">
          <DialogTitle>{t("form_create_title")}</DialogTitle>
        </DialogHeader>
        <VisuallyHidden>
          <p>{t("form_create_title")}</p>
        </VisuallyHidden>

        <RecipeForm
          defaultValues={lastValues}
          serverErrors={serverErrors}
          onSubmit={onSubmit}
        />
      </DialogScrollContent>
    </Dialog>
  );
}
