import { getSystemSettings } from "@/app/settings/system/actions";
import FeatureDisabled from "@/components/FeatureDisabled";

export default async function AddWorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSystemSettings();
  const isEnabled = settings.add_work_enabled !== false;

  if (!isEnabled) {
    return <FeatureDisabled title="ระบบจดงาน" />;
  }

  return children;
}
