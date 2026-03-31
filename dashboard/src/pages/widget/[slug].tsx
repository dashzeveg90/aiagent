// pages/widget/[slug].tsx
import { useRouter } from "next/router";
import WidgetRoot from "@/components/chat/WidgetRoot";

export default function WidgetPage() {
  const router = useRouter();
  const { slug, mode, subtitle, greeting, position } = router.query;

  if (!slug) return null; // router init хүлээнэ

  return (
    <WidgetRoot
      slug={slug as string}
      mode={(mode as "floating" | "inline") ?? "floating"}
      subtitle={(subtitle as string) ?? "Онлайн"}
      greeting={
        (greeting as string) ??
        "Сайн байна уу! Та надаас юу асуухыг хүсч байна вэ?"
      }
      position={(position as "right" | "left") ?? "right"}
    />
  );
}
