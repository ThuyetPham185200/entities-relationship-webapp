"use client";
import * as React from "react";

type Size = number | string; // cho phép 200 hoặc "100%"

type LineBorderProps = {
  orientation?: "horizontal" | "vertical";
  length?: Size;
  thickness?: number | string;
  color?: string;
  margin?: string;

  // positioning
  position?: "static" | "relative" | "absolute" | "fixed";
  top?: Size;
  left?: Size;
  right?: Size;
  bottom?: Size;
};

export default function LineBorder({
  orientation = "horizontal",
  length = "100%",       // 👈 mặc định chiếm hết parent
  thickness = 2,
  color = "black",
  margin = "10px 0",
  position = "static",
  top,
  left,
  right,
  bottom,
}: LineBorderProps) {
  const baseStyle: React.CSSProperties =
    orientation === "horizontal"
      ? {
          width: typeof length === "number" ? `${length}px` : length,
          height: typeof thickness === "number" ? `${thickness}px` : thickness,
        }
      : {
          width: typeof thickness === "number" ? `${thickness}px` : thickness,
          height: typeof length === "number" ? `${length}px` : length,
        };

  const style: React.CSSProperties = {
    ...baseStyle,
    backgroundColor: color,
    margin,
    position,
    top: typeof top === "number" ? `${top}px` : top,
    left: typeof left === "number" ? `${left}px` : left,
    right: typeof right === "number" ? `${right}px` : right,
    bottom: typeof bottom === "number" ? `${bottom}px` : bottom,
  };

  return <div style={style} />;
}
