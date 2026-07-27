type CommunityNotification = {
  href: string | null;
  feed_item_id: string | null;
  feed_item_type: string | null;
};

export function getNotificationHref(notification: CommunityNotification) {
  if (notification.feed_item_id && isCommunityFeedType(notification.feed_item_type)) {
    return `/community?item=${encodeURIComponent(notification.feed_item_id)}`;
  }

  return notification.href ?? "/notifications";
}

function isCommunityFeedType(type: string | null) {
  return type === "post" || type === "strava" || type === "workout" || type === "challenge";
}
