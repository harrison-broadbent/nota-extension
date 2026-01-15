import classnames from "../../utils/classnames";

export const Button = ({ variant = "primary", className = "", ...props }) => {
  const base = "px-3 py-1.5 rounded-md text-sm font-medium shrink-0";
  const variants = {
    primary: "bg-stone-900 hover:bg-stone-700 text-stone-50",
    secondary:
      "border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800",
  };

  return (
    <button
      className={classnames(
        base,
        variants[variant] ?? variants.primary,
        className
      )}
      {...props}
    ></button>
  );
};
