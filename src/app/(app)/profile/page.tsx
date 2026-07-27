import { PageHeader } from "@/components/page-header";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Profile" title="Mijn profiel" description="Bekijk en beheer je persoonlijke gegevens, doelen, voorkeuren en profielfoto." />
      <ProfileSettingsForm />
    </div>
  );
}
