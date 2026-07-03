"use client";

import { startTransition } from "react";

/* React resets a form the moment its action settles, success and
   failure alike, and a failure that eats what he typed is a bug by
   house law. Submitting through onSubmit sidesteps the reset: the
   fields keep their values, and forms that should clear on success
   do it explicitly with form.reset(). */
export function keepValues(run: (form: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter ?? undefined;
    const form = new FormData(e.currentTarget, submitter);
    startTransition(() => run(form));
  };
}
