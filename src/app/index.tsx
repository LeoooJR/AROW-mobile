import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-6">
      <Text className="text-center text-3xl font-bold text-cyan-400">
        Tailwind CSS is ready.
      </Text>
      <Text className="mt-3 text-center text-base text-slate-300">
        Edit src/app/index.tsx to start building.
      </Text>
    </View>
  );
}
