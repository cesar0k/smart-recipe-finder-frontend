import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IngredientTagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  variant?: "default" | "destructive";
}

export function IngredientTagInput({
  value,
  onChange,
  placeholder = "Add ingredient...",
  variant = "default",
}: IngredientTagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addIngredient();
    }
  };

  const addIngredient = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  };

  const removeIngredient = (ingredientToRemove: string) => {
    onChange(value.filter((i) => i !== ingredientToRemove));
  };

  // Match the cuisine section's layout transition so this component's
  // animations rhyme with the rest of the filter modal.
  const LAYOUT_TRANSITION = {
    layout: { duration: 0.36, ease: [0.32, 0.72, 0, 1] as const },
  } as const;

  return (
    // Root + input row use `layout="position"`: they should glide to a new
    // Y when the tag row above/below changes size, but must NOT have their
    // own size counter-scaled (that distorts the input + button — the
    // "ghost / half-fade" artefact). Only the tag row uses full `layout`
    // because it genuinely animates its own height as tags wrap/collapse.
    <motion.div layout="position" transition={LAYOUT_TRANSITION} className="space-y-3">
      <motion.div layout="position" transition={LAYOUT_TRANSITION} className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="rounded-full"
        />
        <Button
          type="button"
          onClick={addIngredient}
          size="icon"
          variant="outline"
          className="rounded-full shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* The tag row is `layout` too so it animates its OWN height when
          it collapses to zero (last tag removed) — without this, it used
          to snap from one row down to 0 px in a single frame, breaking
          the parent section's smooth shrink. `relative` anchors the
          popLayout exit of individual tags so their fade-out detaches
          inside this row rather than to a far-away positioned ancestor. */}
      <motion.div
        layout
        transition={LAYOUT_TRANSITION}
        className="relative flex flex-wrap gap-2"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {value.map((ingredient) => (
            <motion.div
              key={ingredient}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{
                duration: 0.18,
                ease: "easeOut",
                layout: { duration: 0.36, ease: [0.32, 0.72, 0, 1] },
              }}
            >
              <Badge
                variant={variant === "destructive" ? "destructive" : "secondary"}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-full cursor-pointer transition-all hover:opacity-80 flex items-center gap-1",
                  variant === "default" &&
                    "bg-green-100 text-green-800 hover:bg-green-200"
                )}
                onClick={() => removeIngredient(ingredient)}
              >
                {ingredient}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
