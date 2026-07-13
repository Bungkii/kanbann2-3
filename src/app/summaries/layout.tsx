import { getSystemSettings } from "@/app/settings/system/actions";
import FeatureDisabled from "@/components/FeatureDisabled";

export default async function SummariesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSystemSettings();
  const isEnabled = settings.summaries_enabled !== false;

  if (!isEnabled) {
    return <FeatureDisabled title="ระบบแจกสรุปสอบ (Summaries)" />;
  }

  return children;
}
