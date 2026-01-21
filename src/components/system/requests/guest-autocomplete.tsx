"use client";

import { Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchGuests } from "@/lib/actions/guest-actions";
import { cn } from "@/lib/utils";

interface Guest {
  id: string;
  name: string;
  identityCard: string;
  phone: string | null;
  email: string | null;
  instagramHandle: string | null;
}

interface GuestAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  onGuestSelect?: (guest: Guest) => void;
  placeholder?: string;
}

export function GuestAutocomplete({
  value,
  onValueChange,
  onGuestSelect,
  placeholder = "Buscar invitado...",
}: GuestAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback(async (searchValue: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchValue.length < 2) {
      setGuests([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await searchGuests(searchValue);
        if (result.success && result.data) {
          setGuests(result.data);
        } else {
          setGuests([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setGuests([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          if (!open) setOpen(true);
          debouncedSearch(e.target.value);
        }}
        onFocus={() => {
          if (value.length >= 2) setOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 200);
        }}
        placeholder={placeholder}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {open && guests.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
          <Command>
            <CommandList>
              {isSearching && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isSearching && guests.length === 0 && value.length >= 2 && (
                <CommandEmpty>
                  No se encontraron invitados. Escribe para crear uno nuevo.
                </CommandEmpty>
              )}
              {!isSearching && guests.length > 0 && (
                <CommandGroup heading="Invitados encontrados">
                  {guests.map((guest) => (
                    <CommandItem
                      key={guest.id}
                      value={guest.name}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (onGuestSelect) {
                          onGuestSelect(guest);
                        } else {
                          onValueChange(guest.name);
                        }
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{guest.name}</span>
                          <span className="text-xs text-muted-foreground">
                            CI: {guest.identityCard}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {guest.phone && <span>Tel: {guest.phone}</span>}
                          {guest.instagramHandle && (
                            <span>{guest.instagramHandle}</span>
                          )}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          value === guest.name ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
