import { SystemBars } from "react-native-edge-to-edge";

export function AppSystemBars() {
  return (
    <SystemBars
      style={{
        statusBar: "dark",
        navigationBar: "dark",
      }}
    />
  );
}
