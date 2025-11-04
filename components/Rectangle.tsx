"use client";
import * as React from "react";

type Size = number | string;

type RectangleProps = {
  width: Size;
  height: Size;
  color: string;
  radius?: number;
  borderColor?: string;
  borderWidth?: number;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  children?: React.ReactNode;
  opacity?: number;
};

export default function Rectangle({
  width,
  height,
  color,
  radius = 0,
  borderColor = "black",
  borderWidth = 1,
  borderTop,
  borderRight,
  borderBottom,
  borderLeft,
  position = "static",
  top,
  left,
  right,
  bottom,
  children,
  opacity,
}: RectangleProps) {
  return (
    <div
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        backgroundColor: color,
        borderRadius: `${radius}px`,
        border: `${borderWidth}px solid ${borderColor}`, // default border
        borderTop,   // override if provided
        borderRight, // override if provided
        borderBottom,
        borderLeft,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position,
        top: typeof top === "number" ? `${top}px` : top,
        left: typeof left === "number" ? `${left}px` : left,
        right: typeof right === "number" ? `${right}px` : right,
        bottom: typeof bottom === "number" ? `${bottom}px` : bottom,
        opacity: opacity,
      }}
    >
      {children}
    </div>
  );
}
