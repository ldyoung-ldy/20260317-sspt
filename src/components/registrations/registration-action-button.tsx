"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import type { RegistrationStatusValue } from "@/lib/registration-status";

type RegistrationMutationResult = {
  id: string;
  status: RegistrationStatusValue;
};

type RegistrationActionButtonProps = {
  action: (input: { registrationId: string }) => Promise<ActionResult<RegistrationMutationResult>>;
  registrationId: string;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
};

export function RegistrationActionButton({
  action,
  registrationId,
  label,
  pendingLabel,
  variant = "default",
}: RegistrationActionButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled={isPending}
        onClick={() => {
          setError(null);

          startTransition(async () => {
            const result = await action({ registrationId });

            if (!result.success) {
              setError(result.error.message);
              return;
            }

            router.refresh();
          });
        }}
      >
        {isPending ? <LoaderCircle className="animate-spin" /> : null}
        {isPending ? pendingLabel : label}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
