import classnames from "../../utils/classnames";

export const Button = ({ variant = "primary", className = "", ...props }) => {
  const base = "px-3 py-1 rounded text-sm";
  const variants = {
    primary: "bg-stone-800 hover:bg-stone-700 text-white",
    secondary: "bg-stone-200 hover:bg-stone-300 text-stone-900",
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
