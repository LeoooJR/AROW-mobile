import { type PropsWithChildren, type ReactElement } from "react";
import { Text } from "react-native";

export default function LineSearchStatusMessage({
  children,
}: PropsWithChildren): ReactElement {
  return (
    <Text
      className="mt-2 rounded-lg border border-border-subtle bg-surface p-2.5 text-xs text-text-primary"
      role="status"
    >
      {children}
    </Text>
  );
}
