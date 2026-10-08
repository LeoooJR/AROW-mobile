import { Image } from "expo-image";
import { ScrollView, Text, View } from "react-native";

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
  return (
    <View
      className="absolute inset-0 bg-white dark:bg-[#0A0A0A]"
      onLayout={onLayout}
      testID="startup-screen"
      accessibilityViewIsModal
    >
      <ScrollView contentContainerClassName="grow items-center justify-center px-6 py-12">
        <Image
          accessible={false}
          contentFit="contain"
          onLoad={onArtworkReady}
          testID="startup-artwork"
          source={require("@/assets/images/splash-mark.png")}
          style={{ width: 200, height: 200 }}
        />
        {failed ? (
          <View className="mt-6 w-full max-w-sm items-center gap-4">
            <Text
              role="alert"
              className="text-center text-xl font-semibold text-text-primary"
            >
              Impossible de charger la carte.
            </Text>
            <Text className="text-center text-sm text-text-muted">
              Vérifiez votre connexion, puis réessayez.
            </Text>
            <Button
              role="button"
              accessibilityLabel="Réessayer"
              className="mt-2 w-full px-6"
              onPress={onRetry}
              size="control"
              variant="accent"
            >
              {({ pressed }) => (
                <Text
                  className={
                    pressed
                      ? "text-base font-semibold text-canvas"
                      : "text-base font-semibold text-primary-foreground"
                  }
                >
                  Réessayer
                </Text>
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
