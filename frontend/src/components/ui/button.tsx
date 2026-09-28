import type { JSX } from "preact";
import { forwardRef } from "preact/compat";

import { cx } from "./utils";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "class"> {
  class?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  unstyled?: boolean;
  feedbackState?: "idle" | "loading" | "success";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "outline",
      size = "md",
      block = false,
      unstyled = false,
      feedbackState = "idle",
      class: className,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        data-feedback={feedbackState}
        class={cx(
          "ui-button",
          unstyled
            ? "ui-button--unstyled"
            : `ui-button--${variant} ui-button--${size}`,
          block && "ui-button--block",
          className,
        )}
        {...props}
      />
    );
  },
);
