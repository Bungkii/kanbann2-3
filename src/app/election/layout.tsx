import { getSystemSettings } from "@/app/settings/system/actions";
import FeatureDisabled from "@/components/FeatureDisabled";

export default async function ElectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSystemSettings();
  const isEnabled = settings.election_enabled !== false;

  if (!isEnabled) {
    return <FeatureDisabled title="ระบบผลเลือกตั้ง (Election)" />;
  }

  return children;
}
