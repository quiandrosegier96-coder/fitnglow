import { Heart, MessageCircle, Plus } from "lucide-react";
import { communityPosts } from "@/data/catalog";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CommunityPage() {
  return (
    <div>
      <PageHeader eyebrow="Community" title="Share the proof, celebrate the process" description="Success stories, photo uploads, likes, comments, and supportive community feed controls." />
      <div className="mb-6 flex justify-end">
        <Button><Plus size={17} /> Create post</Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {communityPosts.map((post) => (
          <Card key={post.name}>
            <div className="mb-4 h-40 rounded-[1.5rem] rose-gold" />
            <CardTitle>{post.name}</CardTitle>
            <p className="mt-3 leading-7 text-muted">{post.text}</p>
            <div className="mt-5 flex gap-3">
              <Button variant="outline"><Heart size={17} /> {post.likes}</Button>
              <Button variant="ghost"><MessageCircle size={17} /> Comment</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
