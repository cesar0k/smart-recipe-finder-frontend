import { useState } from "react";
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

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
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
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((ingredient) => (
          <Badge
            key={ingredient}
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
        ))}
      </div>
    </div>
  );
}
