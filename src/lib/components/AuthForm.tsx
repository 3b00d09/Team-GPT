"use client";

import { useFormState } from "react-dom";

export function AuthForm({
  children,
  action,
}: {
  children: React.ReactNode;
  action: (prevState: any, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useFormState(action, {
    error: null,
  });
  return (
    <form
      action={formAction}
      className="flex flex-col justify-center items-center gap-2"
    >
      {children}
      {state.error && (
        <p className="bg-red-900 rounded-md p-2 w-1/2 text-wrap text-center">{state.error}</p>
      )}
    </form>
  );
}

export interface ActionResult {
  error: string | null;
}
