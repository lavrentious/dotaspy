import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { Hero } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  heroes: Hero[];
  enabledIds: Set<number>;
  onChange: (ids: Set<number>) => void;
}

export function HeroSelectModal({ open, onClose, heroes, enabledIds, onChange }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => heroes.filter((h) => h.localized_name.toLowerCase().includes(search.toLowerCase())),
    [heroes, search]
  );

  function toggle(id: number) {
    const next = new Set(enabledIds);
    if (next.has(id)) {
      if (next.size > 3) next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <div className="p-6 pb-3 flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle>Выбор героев</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{enabledIds.size} из {heroes.length} выбрано</span>
            <Button
              variant="ghost" size="sm" className="h-6 px-2 text-xs ml-auto"
              onClick={() => onChange(new Set(heroes.map((h) => h.id)))}
            >
              Все
            </Button>
            <Button
              variant="ghost" size="sm" className="h-6 px-2 text-xs"
              onClick={() => onChange(new Set(heroes.slice(0, 3).map((h) => h.id)))}
            >
              Сбросить
            </Button>
          </div>
          <Input
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto max-h-[55vh] px-4">
          <div className="grid grid-cols-2 gap-0.5 pb-3">
            {filtered.map((hero) => (
              <label
                key={hero.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer select-none"
              >
                <Checkbox
                  checked={enabledIds.has(hero.id)}
                  onCheckedChange={() => toggle(hero.id)}
                />
                <img
                  src={`/icons/${hero.slug}.png`}
                  alt=""
                  className="w-6 h-6 rounded-sm object-cover shrink-0"
                />
                <span className="text-sm truncate">{hero.localized_name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 pt-3 border-t">
          <Button className="w-full" onClick={onClose}>Готово</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
