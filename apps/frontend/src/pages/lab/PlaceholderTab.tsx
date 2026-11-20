import { Construction } from "lucide-react";

export default function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="bg-card rounded-xl shadow-sm border dark:border-border p-10 text-center">
      <Construction className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">سيتم تفعيله في المرحلة القادمة</p>
    </div>
  );
}
