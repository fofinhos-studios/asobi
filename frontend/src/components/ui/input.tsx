import type { JSX } from "preact";

import { cx } from "./utils";

interface InputProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "class"> {
  class?: string;
}

export function Input({ class: className, ...props }: InputProps) {
  return <input class={cx("ui-input", className)} {...props} />;
}
