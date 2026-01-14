// src/utils/cn.js
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export default function classnames(...inputs) {
	return twMerge(clsx(inputs));
}
