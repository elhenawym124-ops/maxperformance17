import React from "react";
import {
  UserPlusIcon,
  UserMinusIcon,
  ClipboardDocumentListIcon,
  XCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const HowItWorksSection: React.FC = () => {
  const examples = [
    {
      title: "مثال 1: موظف جديد",
      icon: UserPlusIcon,
      before: [
        "HR تدور على لابتوب متاح",
        "تكتب في ورقة أو إكسل",
        "الموظف ياخد اللابتوب بدون توقيع",
        "بعد سنة ما حد فاكر مين معاه إيه",
      ],
      after: [
        "الموظف يطلب لابتوب من النظام",
        "المدير يوافق",
        "HR تخصص لابتوب وتطبع نموذج",
        "الموظف يوقع ويحفظ كل شيء للأبد",
      ],
    },
    {
      title: "مثال 2: موظف مستقيل",
      icon: UserMinusIcon,
      before: [
        "HR تحاول تفتكر إيه اللي معاه",
        "ممكن ينسوا حاجة",
        "الموظف يطلع والعهدة معاه",
      ],
      after: [
        "النظام يطلع قائمة بكل عهد الموظف",
        "Checklist لرد كل حاجة",
        "ما يقدر يكمل Offboarding قبل رد كل شيء",
        "صفر فقدان",
      ],
    },
    {
      title: "مثال 3: جرد سنوي",
      icon: ClipboardDocumentListIcon,
      before: ["كل قسم يكتب ورق والتجميع يدوي", "أخطاء كثيرة ويأخذ أسابيع"],
      after: [
        "تقرير كامل بضغطة زر",
        "مطابقة تلقائية ومعرفة المفقود فوراً",
        "يأخذ دقائق معدودة",
      ],
    },
  ];

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-warning dark:bg-warning/30 rounded-lg">
          <ClipboardDocumentListIcon className="h-6 w-6 text-warning dark:text-warning" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          أمثلة عملية: كيف يغير النظام عملك
        </h2>
      </div>

      <div className="space-y-8">
        {examples.map((example, index) => (
          <div
            key={index}
            className="bg-card rounded-xl overflow-hidden shadow-sm border border-border dark:border-border"
          >
            <div className="px-6 py-4 bg-muted dark:bg-muted border-b border-border dark:border-border flex items-center gap-3">
              <example.icon className="h-6 w-6 text-primary" />
              <h3 className="font-bold text-lg text-foreground">
                {example.title}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Before */}
              <div className="p-6 bg-destructive/30 dark:bg-destructive/10 border-r border-border dark:border-border">
                <div className="flex items-center gap-2 mb-4 text-destructive dark:text-destructive font-bold">
                  <XCircleIcon className="h-5 w-5" />
                  <span>بدون النظام</span>
                </div>
                <ul className="space-y-3">
                  {example.before.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-600 dark:text-muted-foreground flex items-start gap-2"
                    >
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-destructive shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {/* After */}
              <div className="p-6 bg-success/30 dark:bg-success/10">
                <div className="flex items-center gap-2 mb-4 text-success dark:text-success font-bold">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>مع النظام</span>
                </div>
                <ul className="space-y-3">
                  {example.after.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-800 dark:text-muted-foreground font-medium flex items-start gap-2"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorksSection;
