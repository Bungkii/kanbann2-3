import { getSystemSettings } from "@/app/settings/system/actions";
import FeatureDisabled from "@/components/FeatureDisabled";

export default async function EvaluateBossLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSystemSettings();
  const isEnabled = settings.boss_evaluation_enabled !== false;

  if (!isEnabled) {
    return <FeatureDisabled title="ระบบประเมินหัวหน้า (Evaluate Boss)" />;
  }

  return children;
}
