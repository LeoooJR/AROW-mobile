"use client";

import React from "react";
import { StyleSheet, TextInput } from "react-native";
import type { VariantProps } from "tailwind-variants";

import { textFieldStyles } from "@/components/primitives/text-field/styles";

type TextFieldVariants = VariantProps<typeof textFieldStyles>;

export type TextFieldProps = React.ComponentPropsWithoutRef<typeof TextInput> &
  TextFieldVariants & {
    readonly className?: string;
  };

const TextField = React.forwardRef<
  React.ComponentRef<typeof TextInput>,
  TextFieldProps
>(function TextField({ className, variant, ...props }, ref) {
  const { style, ...textInputProps } = props;

  return (
    <TextInput
      className={textFieldStyles({ className, variant })}
      ref={ref}
      style={[variant === "numeric" ? styles.numeric : undefined, style]}
      {...textInputProps}
    />
  );
});

const styles = StyleSheet.create({
  numeric: {
    textAlign: "center",
  },
});

TextField.displayName = "TextField";

export default TextField;
