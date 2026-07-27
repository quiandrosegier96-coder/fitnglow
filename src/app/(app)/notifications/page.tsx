import { PageHeader } from "@/components/page-header";
import { NotificationsList } from "@/components/notifications/notifications-list";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Meldingen"
        title="Jouw community updates"
        description="Reacties op jouw tijdlijn en antwoorden op jouw reacties verschijnen hier op datum."
      />
      <NotificationsList />
    </div>
  );
}
