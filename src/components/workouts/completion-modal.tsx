"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function CompletionModal({ open, onOpenChange, calories }: { open: boolean; onOpenChange: (open: boolean) => void; calories: number }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Workout completed" description="Beautiful work. Your consistency just got stronger.">
      <motion.div initial={{ scale: 0.82, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full rose-gold text-white">
          <Trophy size={42} />
        </div>
        <p className="mt-5 text-3xl font-black">{calories} kcal</p>
        <p className="mt-2 text-muted">Estimated burn logged to workout history.</p>
        <Button className="mt-6 w-full" onClick={() => onOpenChange(false)}>Close</Button>
      </motion.div>
    </Modal>
  );
}
