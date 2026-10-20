import { Image } from "expo-image";
import { useState } from "react";
import {
  ScrollView,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "@/components/primitives/button";

export interface StartupScreenProps {
  readonly failed: boolean;
  readonly onLayout: () => void;
  readonly onRetry: () => void;
  readonly showProgress?: boolean;
  readonly onArtworkReady?: () => void;
}

export default function StartupScreen({
  failed,
  onLayout,
  onRetry,
  showProgress = true,
  onArtworkReady,
}: StartupScreenProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { height } = useWindowDimensions();
  const [retryFocused, setRetryFocused] = useState(false);
  const screenHeight = Math.max(560, height);
  const artworkOffset = Math.max(
    160,
    Math.min((screenHeight - 160) / 2, screenHeight - 400),
  );
  const artwork =
    colorScheme === "dark"
      ? require("@/assets/images/app-icon-dark.png")
      : failed
        ? require("@/assets/images/android-icon.png")
        : require("@/assets/images/splash-mark.png");

  return (
    <View
      className="absolute inset-0 bg-white dark:bg-[#0A0A0A]"
      onLayout={onLayout}
      testID="startup-screen"
      accessibilityViewIsModal
    >
      <ScrollView
        contentContainerClassName={
          failed
            ? "min-h-[560px] grow items-center"
            : "grow items-center justify-center px-6 py-12"
        }
      >
        {failed ? (
          <View className="shrink-0" style={{ height: artworkOffset }} />
        ) : null}
        <Image
          accessible={false}
          contentFit="contain"
          onLoad={onArtworkReady}
          testID="startup-artwork"
          source={artwork}
          className={failed ? "rounded-[8px]" : undefined}
          style={{ width: failed ? 160 : 200, height: failed ? 160 : 200 }}
        />
        {failed ? (
          <View
            className="w-full max-w-[360px] shrink-0 items-center px-[24px] pt-[24px]"
            style={{
              minHeight: screenHeight - artworkOffset - 160,
              paddingBottom: Math.max(24, insets.bottom),
            }}
          >
            <Text
              role="alert"
              className="text-center text-[22px] font-semibold leading-[29px] tracking-[-0.55px] text-[#0A0A0A] dark:text-white"
            >
              Chargement impossible
            </Text>
            <Text className="mb-[24px] mt-[12px] text-center text-[15px] leading-[24px] text-[#0A0A0A] dark:text-white">
              {
                "La carte n’a pas pu être chargée.\nVérifiez votre connexion, puis réessayez."
              }
            </Text>
            <Button
              role="button"
              accessibilityLabel="Réessayer"
              accessibilityHint="Relance le chargement de l’application."
              className="min-h-[52px] w-full rounded-[8px] border border-[#FF6A00] bg-[#FF6A00] px-[20px] py-[12px] active:bg-[#FF6A00]"
              onPress={onRetry}
              onFocus={() => setRetryFocused(true)}
              onBlur={() => setRetryFocused(false)}
            >
              {({ pressed }) => (
                <>
                  {retryFocused ? (
                    <View
                      pointerEvents="none"
                      className="absolute -inset-[8px] rounded-[14px] border-[3px] border-[#0A0A0A] dark:border-white"
                    />
                  ) : null}
                  {pressed ? (
                    <View
                      pointerEvents="none"
                      className="absolute inset-0 rounded-[8px] border-2 border-[#0A0A0A]"
                    />
                  ) : null}
                  <Text className="text-[15px] font-semibold tracking-[-0.075px] text-[#0A0A0A]">
                    Réessayer
                  </Text>
                </>
              )}
            </Button>
          </View>
        ) : showProgress ? (
          <Text role="status" className="mt-6 text-sm text-text-muted">
            Chargement de la carte…
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
