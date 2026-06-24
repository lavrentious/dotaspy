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
import { ScrollArea } from "@/components/ui/scroll-area";
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
    () =>
      heroes.filter((h) =>
        h.localized_name.toLowerCase().includes(search.toLowerCase())
      ),
    [heroes, search]
  );

  function toggle(id: number) {
    const next = new Set(enabledIds);
    if (next.has(id)) {
      if (next.size > 3) next.delete(id); // keep minimum 3 heroes
    } else {
      next.add(id);
    }
    onChange(next);
  }

  function selectAll() {
    onChange(new Set(heroes.map((h) => h.id)));
  }

  function deselectAll() {
    // Keep at least 3
    const keep = new Set(heroes.slice(0, 3).map((h) => h.id));
    onChange(keep);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Выбор героев</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-1">
          <span>{enabledIds.size} из {heroes.length} выбрано</span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={selectAll}>
            Все
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={deselectAll}>
            Сбросить
          </Button>
        </div>
        <Input
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="shrink-0"
        />
        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
          <div className="grid grid-cols-2 gap-1 py-2">
            {filtered.map((hero) => (
              <label
                key={hero.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer select-none"
              >
                <Checkbox
                  checked={enabledIds.has(hero.id)}
                  onCheckedChange={() => toggle(hero.id)}
                />
                <span className="text-sm truncate">{hero.localized_name}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
        <Button onClick={onClose} className="shrink-0 mt-2">
          Готово
        </Button>
      </DialogContent>
    </Dialog>
  );
}
