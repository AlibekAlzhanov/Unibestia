import { Screen } from "../../../shared/ui/Screen";
import { AppText } from "../../../shared/ui/AppText";
import { StateView } from "../../../shared/ui/StateView";

export function QRScreen() {
  return (
    <Screen>
      <AppText variant="title">QR-код</AppText>
      <StateView
        title="Раздел в разработке"
        description="Foundation готов. Следующий шаг — подключить реальный tRPC flow для этого раздела."
      />
    </Screen>
  );
}

