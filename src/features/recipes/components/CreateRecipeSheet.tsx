import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RecipeForm } from "./RecipeForm";
import { useRecipeMutations } from "../hooks/useRecipeMutations";
import { type RecipeFormValues } from "../types/schema";
import { useTranslation } from "react-i18next";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useHistoryBack } from "@/hooks/useHistoryBack";

export function CreateRecipeSheet() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const handleOpenChange = useHistoryBack(open, setOpen);

  const { createRecipe, isSubmitting } = useRecipeMutations(() =>
    handleOpenChange(false)
  );

  const onSubmit = async (data: RecipeFormValues) => {
    await createRecipe(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full font-bold bg-black text-white hover:bg-gray-800 transition-all">
          {t("create_btn")}
        </Button>
      </DialogTrigger>
      <DialogScrollContent>
        <DialogHeader className="text-left px-0 py-2">
          <DialogTitle>{t("form_create_title")}</DialogTitle>
        </DialogHeader>
        <VisuallyHidden>
          <p>{t("form_create_title")}</p>
        </VisuallyHidden>

        <RecipeForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </DialogScrollContent>
    </Dialog>
  );
}
