import { getSystemSettings } from "@/app/settings/system/actions";
import FeatureDisabled from "@/components/FeatureDisabled";

export default async function KanbanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSystemSettings();
  const isEnabled = settings.kanban_enabled !== false;

  if (!isEnabled) {
    return <FeatureDisabled title="ระบบกระดานงาน (Kanban)" />;
  }

  return children;
}
