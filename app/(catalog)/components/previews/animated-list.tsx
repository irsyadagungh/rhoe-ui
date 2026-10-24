"use client";

import {
  Archive,
  BellRing,
  CircleCheck,
  ChevronRight,
  FileText,
  FolderKanban,
  GitPullRequest,
  MessageSquareText,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/registry/components/button/button";
import {
  AnimatedList,
  AnimatedListItem,
  type AnimatedListItemVariant,
} from "@/registry/components/animated-list/animated-list";
import styles from "../preview-styles/animated-list.module.css";

const activity = [
  {
    id: "deploy",
    title: "Production deployment",
    description: "Completed 2 minutes ago",
    icon: <CircleCheck aria-hidden="true" />,
  },
  {
    id: "project",
    title: "Design system review",
    description: "Updated by Maya Chen",
    icon: <FolderKanban aria-hidden="true" />,
  },
  {
    id: "release",
    title: "Release notes",
    description: "Ready for publication",
    icon: <FolderKanban aria-hidden="true" />,
  },
  {
    id: "review",
    title: "Pull request review",
    description: "Three comments need attention",
    icon: <GitPullRequest aria-hidden="true" />,
  },
  {
    id: "comment",
    title: "New design comment",
    description: "Ava replied to the navigation proposal",
    icon: <MessageSquareText aria-hidden="true" />,
  },
  {
    id: "member",
    title: "New team member",
    description: "Noah joined the workspace",
    icon: <UserPlus aria-hidden="true" />,
  },
  {
    id: "brief",
    title: "Project brief updated",
    description: "The product scope was revised",
    icon: <FileText aria-hidden="true" />,
  },
  {
    id: "notification",
    title: "Reminder scheduled",
    description: "Weekly planning starts tomorrow",
    icon: <BellRing aria-hidden="true" />,
  },
  {
    id: "qa",
    title: "Quality check passed",
    description: "All release checks completed",
    icon: <CircleCheck aria-hidden="true" />,
  },
  {
    id: "roadmap",
    title: "Roadmap published",
    description: "The next milestone is available",
    icon: <FolderKanban aria-hidden="true" />,
  },
  {
    id: "handoff",
    title: "Design handoff ready",
    description: "Development can begin implementation",
    icon: <FileText aria-hidden="true" />,
  },
];

export function AnimatedListExample({
  variant = "bordered",
}: {
  variant?: AnimatedListItemVariant;
}) {
  const [visibleActivity, setVisibleActivity] = useState(activity);
  const [dense, setDense] = useState(false);
  const [descriptionPlacement, setDescriptionPlacement] = useState<"below" | "inline">("below");

  return (
    <div className={styles.preview}>
      <AnimatedList
        className={styles.previewList}
        aria-label="Recent activity"
        items={visibleActivity}
        getItemKey={(item) => item.id}
        replay="both"
        dense={dense}
        renderItem={(item) => (
          <AnimatedListItem
            variant={variant}
            leading={item.icon}
            title={item.title}
            description={item.description}
            descriptionPlacement={descriptionPlacement}
            trailing={<ChevronRight size={17} aria-hidden="true" />}
            swipeActions={{
              left: {
                label: "Archive",
                icon: <Archive size={16} aria-hidden="true" />,
                tone: "success",
                onAction: () => setVisibleActivity((entries) => entries.filter((entry) => entry.id !== item.id)),
              },
              right: {
                label: "Delete",
                icon: <Trash2 size={16} aria-hidden="true" />,
                tone: "danger",
                onAction: () => setVisibleActivity((entries) => entries.filter((entry) => entry.id !== item.id)),
              },
            }}
          />
        )}
      />
      <div className={styles.previewControls}>
        <div className={styles.previewControl}>
          <span>Dense list</span>
          <Button
            variant="bordered"
            tone="secondary"
            size="small"
            aria-pressed={dense}
            onClick={() => setDense((current) => !current)}
          >
            {dense ? "On" : "Off"}
          </Button>
        </div>
        <div className={styles.previewControl}>
          <span>Subtitle placement</span>
          <Button
            variant="bordered"
            tone="secondary"
            size="small"
            aria-pressed={descriptionPlacement === "inline"}
            onClick={() => setDescriptionPlacement((current) => current === "below" ? "inline" : "below")}
          >
            {descriptionPlacement === "below" ? "Below" : "Inline"}
          </Button>
        </div>
      </div>
    </div>
  );
}
