import type { ReactNode } from "react";
import { CodeBlock } from "@/registry/components/code-block/code-block";
import { ExpandableCard } from "@/registry/components/expandable-card/expandable-card";
import { AnimatedListExample } from "./previews/animated-list";
import { BadgeExample } from "./previews/badge";
import { AvatarExample, AvatarInfoExample } from "./previews/avatar";
import { BarChartExample } from "./previews/bar-chart";
import { ButtonExample } from "./previews/button";
import { CalendarSandbox } from "./previews/calendar";
import { AppDrawerSandbox } from "./previews/app-drawer";
import { BottomSheetSandbox } from "./previews/bottom-sheet";
import { DatePickerSandbox } from "./previews/date-picker";
import { DateRangePickerSandbox } from "./previews/date-range-picker";
import { CheckboxSandbox } from "./previews/checkbox";
import { CurrencyInputExample } from "./previews/currency-input";
import { CurvedCarouselExample } from "./previews/curved-carousel";
import { DialogSandbox } from "./previews/dialog";
import { DropdownMenuSandbox } from "./previews/dropdown-menu";
import { ExpandingSearchSandbox } from "./previews/expanding-search";
import { IconMorphExample } from "./previews/icon-morph";
import { InputExample } from "./previews/input";
import { LineChartExample } from "./previews/line-chart";
import { MeterSandbox } from "./previews/meter";
import { ModalSandbox } from "./previews/modal";
import { NavigationExample } from "./previews/navigation";
import { NumberInputExample } from "./previews/number-input";
import { PasswordStrengthExample } from "./previews/password-strength";
import { PopoverSandbox } from "./previews/popover";
import { RadioSandbox } from "./previews/radio";
import { SelectSandbox } from "./previews/select";
import { SwitchSandbox } from "./previews/switch";
import { TableSandbox } from "./previews/table";
import { TextareaSandbox } from "./previews/textarea";
import { TextAnimationExample } from "./previews/text-animation";
import { ToastSandbox } from "./previews/toast";
import { TooltipExample } from "./previews/tooltip";
import { VerificationCodeExample } from "./previews/verification-code";
import { TodoCalendarSandbox } from "../blocks/previews/todo-calendar";
import { AuthFormExample } from "../blocks/previews/auth-form";
import { RealtimeLineChartExample } from "../blocks/previews/realtime-line-chart";
import type { ComponentPreviewVariant } from "./component-preview";

export interface PreviewDefinition {
  preview?: ReactNode;
  sandbox?: ReactNode;
  variants?: ComponentPreviewVariant[];
  showReplay?: boolean;
}

const codePreview = `import { Badge } from "@/components/ui/badge";
type StatusProps = { ready: boolean };
export function Status({ ready }: StatusProps) {
  const label = ready ? "Deployment ready" : "Preparing deployment";
  return (
    <Badge tone={ready ? "success" : "neutral"}>
      {label}
    </Badge>
  );
}`;

export function getComponentPreview(name: string): PreviewDefinition {
  switch (name) {
    case "avatar": return { showReplay: false, variants: [
      { value: "default", label: "Default", preview: <AvatarExample /> },
      { value: "grouped", label: "Grouped", preview: <AvatarExample grouped /> },
    ] };
    case "avatar-info": return { showReplay: false, variants: [
      { value: "right", label: "Right", preview: <AvatarInfoExample side="right" /> },
      { value: "left", label: "Left", preview: <AvatarInfoExample side="left" /> },
    ] };
    case "badge": return { showReplay: false, variants: [
      { value: "filled", label: "Filled", preview: <BadgeExample variant="filled" /> },
      { value: "bordered", label: "Bordered", preview: <BadgeExample variant="bordered" /> },
    ] };
    case "tooltip": return { showReplay: false, variants: [
      { value: "filled", label: "Filled", preview: <TooltipExample variant="filled" /> },
      { value: "bordered", label: "Bordered", preview: <TooltipExample variant="bordered" /> },
    ] };
    case "toast": return { sandbox: <ToastSandbox />, showReplay: false };
    case "meter": return { sandbox: <MeterSandbox />, showReplay: false };
    case "dialog": return { sandbox: <DialogSandbox />, showReplay: false };
    case "modal": return { sandbox: <ModalSandbox />, showReplay: false };
    case "popover": return { sandbox: <PopoverSandbox />, showReplay: false };
    case "switch": return { sandbox: <SwitchSandbox />, showReplay: false };
    case "checkbox": return { sandbox: <CheckboxSandbox />, showReplay: false };
    case "radio": return { sandbox: <RadioSandbox />, showReplay: false };
    case "select": return { sandbox: <SelectSandbox />, showReplay: false };
    case "calendar": return { sandbox: <CalendarSandbox />, showReplay: false };
    case "app-drawer": return { sandbox: <AppDrawerSandbox />, showReplay: false };
    case "bottom-sheet": return { sandbox: <BottomSheetSandbox />, showReplay: false };
    case "date-picker": return { sandbox: <DatePickerSandbox />, showReplay: false };
    case "date-range-picker": return { sandbox: <DateRangePickerSandbox />, showReplay: false };
    case "line-chart": return { preview: <LineChartExample />, showReplay: false };
    case "bar-chart": return { showReplay: false, variants: [
      { value: "vertical", label: "Vertical", preview: <BarChartExample orientation="vertical" /> },
      { value: "horizontal", label: "Horizontal", preview: <BarChartExample orientation="horizontal" /> },
    ] };
    case "table": return { sandbox: <TableSandbox />, showReplay: false };
    case "todo-calendar": return { sandbox: <TodoCalendarSandbox />, showReplay: false };
    case "auth-form": return { showReplay: false, variants: [
      { value: "sign-in", label: "Sign in", preview: <AuthFormExample mode="sign-in" /> },
      { value: "sign-in-link", label: "Forgot · Link", preview: <AuthFormExample mode="sign-in" forgotPasswordVariant="link" /> },
      { value: "sign-in-otp", label: "Forgot · OTP", preview: <AuthFormExample mode="sign-in" forgotPasswordVariant="otp" /> },
      { value: "sign-up", label: "Sign up", preview: <AuthFormExample mode="sign-up" /> },
      { value: "sign-up-otp", label: "Sign up · OTP", preview: <AuthFormExample mode="sign-up" signUpVerificationVariant="otp" /> },
      { value: "sign-up-link", label: "Sign up · Link", preview: <AuthFormExample mode="sign-up" signUpVerificationVariant="link" /> },
    ] };
    case "realtime-line-chart": return { preview: <RealtimeLineChartExample />, showReplay: false };
    case "button": return { showReplay: false, variants: [
      { value: "filled", label: "Filled", preview: <ButtonExample variant="filled" /> },
      { value: "bordered", label: "Bordered", preview: <ButtonExample variant="bordered" /> },
      { value: "text", label: "Text", preview: <ButtonExample variant="text" /> },
      { value: "action", label: "Action", preview: <ButtonExample variant="action" /> },
    ] };
    case "input": return { showReplay: false, variants: [
      { value: "filled", label: "Filled", preview: <InputExample variant="filled" /> },
      { value: "bordered", label: "Bordered", preview: <InputExample variant="bordered" /> },
    ] };
    case "textarea": return { showReplay: false, variants: [
      { value: "filled", label: "Filled", preview: <TextareaSandbox variant="filled" /> },
      { value: "bordered", label: "Bordered", preview: <TextareaSandbox variant="bordered" /> },
    ] };
    case "password-strength": return { showReplay: false, variants: [
      { value: "filled", label: "Filled", preview: <PasswordStrengthExample variant="filled" /> },
      { value: "bordered", label: "Bordered", preview: <PasswordStrengthExample variant="bordered" /> },
    ] };
    case "verification-code": return { preview: <VerificationCodeExample />, showReplay: false };
    case "currency-input": return { showReplay: false, variants: [
      { value: "filled", label: "Filled", preview: <CurrencyInputExample variant="filled" /> },
      { value: "bordered", label: "Bordered", preview: <CurrencyInputExample variant="bordered" /> },
    ] };
    case "number-input": return { showReplay: false, variants: [
      { value: "filled", label: "Filled", preview: <NumberInputExample variant="filled" /> },
      { value: "bordered", label: "Bordered", preview: <NumberInputExample variant="bordered" /> },
    ] };
    case "animated-list": return { variants: [
      { value: "filled", label: "Filled", preview: <AnimatedListExample variant="filled" /> },
      { value: "bordered", label: "Bordered", preview: <AnimatedListExample variant="bordered" /> },
      { value: "transparent", label: "Transparent", preview: <AnimatedListExample variant="transparent" /> },
    ] };
    case "curved-carousel": return { preview: <CurvedCarouselExample />, showReplay: false };
    case "dropdown-menu": return { sandbox: <DropdownMenuSandbox />, showReplay: false };
    case "expanding-search": return { sandbox: <ExpandingSearchSandbox />, showReplay: false };
    case "icon-morph": return { variants: [
      { value: "path", label: "Path morph", preview: <IconMorphExample /> },
      { value: "fallback", label: "Fallback", preview: <IconMorphExample fallback /> },
    ] };
    case "expandable-card": return { preview: <ExpandableCard title="Deployment" description="Ready to ship">The deployment is configured and ready for review.</ExpandableCard> };
    case "code-block": return { preview: <CodeBlock code={codePreview} filename="example.tsx" language="tsx" previewLines={7} /> };
    case "sidebar-navigation": return { preview: <NavigationExample type="sidebar" /> };
    case "table-of-contents": return { preview: <NavigationExample type="table-of-contents" /> };
    case "tabs": return { variants: [
      { value: "flat-text", label: "Flat · Text", preview: <NavigationExample type="tabs" tabsVariant="flat-text" /> },
      { value: "flat-icon", label: "Flat · Icon", preview: <NavigationExample type="tabs" tabsVariant="flat-icon" /> },
      { value: "grouped-text", label: "Grouped · Text", preview: <NavigationExample type="tabs" tabsVariant="grouped-text" /> },
      { value: "grouped-icon", label: "Grouped · Icon", preview: <NavigationExample type="tabs" tabsVariant="grouped-icon" /> },
    ] };
    case "text-reveal": return { variants: [
      { value: "word", label: "Word", preview: <TextAnimationExample type="reveal" /> },
      { value: "character", label: "Character", preview: <TextAnimationExample type="reveal" revealBy="character" /> },
      { value: "line", label: "Line", preview: <TextAnimationExample type="reveal" revealBy="line" /> },
    ] };
    case "morphing-text": return { preview: <TextAnimationExample type="morph" />, showReplay: false };
    case "scramble-text": return { preview: <TextAnimationExample type="scramble" />, showReplay: false };
    case "rolling-number": return { preview: <TextAnimationExample type="number" />, showReplay: false };
    default: return {};
  }
}
