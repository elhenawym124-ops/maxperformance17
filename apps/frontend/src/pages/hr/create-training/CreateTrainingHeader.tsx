import React from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface CreateTrainingHeaderProps {
  onBack: () => void;
}

export const CreateTrainingHeader: React.FC<CreateTrainingHeaderProps> = ({
  onBack,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="rounded-full bg-white/80 backdrop-blur-sm border-primary hover:bg-primary/10 hover:border-primary transition-all shadow-sm"
        >
          <ArrowRight className="h-5 w-5 text-primary" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-primary">
            إضافة سجل تدريبي
          </h1>
          <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
            <BookOpen className="h-4 w-4 text-primary" />
            توثيق الدورات التدريبية والتطويرية للموظفين
          </p>
        </div>
      </div>
    </div>
  );
};
