"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="font-serif text-2xl font-bold">{title}</DialogTitle>
        {description && <DialogDescription className="mt-2 text-sm leading-6 text-muted">{description}</DialogDescription>}
        <div className="mt-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
