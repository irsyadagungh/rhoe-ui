"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import { Dialog } from "@/registry/components/dialog/dialog";
import { Input } from "@/registry/components/input/input";
import {
  TodoCalendar,
  type TodoCalendarItem,
} from "@/registry/blocks/todo-calendar/todo-calendar";
import { PreviewCanvas } from "../../components/preview-canvas";

const initialItems: TodoCalendarItem[] = [
  {
    id: "design-review",
    title: "Review the new dashboard flow",
    description: "Check motion, spacing, and empty states with the design team.",
    date: new Date(2026, 9, 15),
  },
  {
    id: "release-notes",
    title: "Prepare release notes",
    description: "Summarize the calendar and component registry changes.",
    date: new Date(2026, 9, 15),
    completed: true,
  },
  {
    id: "publish-docs",
    title: "Publish component documentation",
    date: new Date(2026, 9, 18),
  },
  {
    id: "planning",
    title: "Plan the next component batch",
    date: new Date(2026, 9, 21),
  },
  {
    id: "accessibility",
    title: "Run the accessibility review",
    date: new Date(2026, 9, 28),
  },
];

export function TodoCalendarSandbox() {
  const [date, setDate] = useState(() => new Date(2026, 9, 15));
  const [items, setItems] = useState(initialItems);
  const [taskTitle, setTaskTitle] = useState("");

  return (
    <PreviewCanvas showReplay={false}>
      <div className="flex min-h-[44rem] w-full items-start justify-center py-6">
        <TodoCalendar
          items={items}
          value={date}
          onValueChange={setDate}
          onItemToggle={(selectedItem) => {
            setItems((current) => current.map((item) => (
              item.id === selectedItem.id
                ? { ...item, completed: !item.completed }
                : item
            )));
          }}
          addTodoAction={(
            <Dialog
              trigger={(
                <Button
                  variant="bordered"
                  tone="secondary"
                  size="small"
                  icon={<Plus />}
                  aria-label="Add to-do"
                />
              )}
              title="Add to-do"
              description={`Create an agenda item for ${new Intl.DateTimeFormat("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(date)}.`}
              width={440}
              height={340}
              continueLabel="Add task"
              continueDisabled={!taskTitle.trim()}
              onContinue={() => {
                const title = taskTitle.trim();
                if (!title) return;
                setItems((current) => [
                  ...current,
                  { id: `task-${Date.now()}`, title, date },
                ]);
                setTaskTitle("");
              }}
              onClose={() => setTaskTitle("")}
            >
              <Input
                label="Task title"
                placeholder="What needs to be done?"
                value={taskTitle}
                onValueChange={setTaskTitle}
                clearable={false}
              />
            </Dialog>
          )}
          locale="en-US"
        />
      </div>
    </PreviewCanvas>
  );
}
