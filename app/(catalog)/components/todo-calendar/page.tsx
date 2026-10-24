import { permanentRedirect } from "next/navigation";

export default function LegacyTodoCalendarPage() {
  permanentRedirect("/blocks/todo-calendar");
}
