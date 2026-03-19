"use client";

import { QuestionConfig, QuestionOption } from "@/interfaces/match";
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  DollarSign,
  GraduationCap,
  LucideProps,
  MapPin,
  RefreshCw,
  Scale,
  ShieldCheck,
  Users,
  Vote,
} from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes, useState } from "react";

const ICON_MAP: Record<
  string,
  ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >
> = {
  Calendar,
  ShieldCheck,
  GraduationCap,
  Users,
  Briefcase,
  Scale,
  Award,
  MapPin,
  DollarSign,
  RefreshCw,
  Vote,
};

interface Props {
  question: QuestionConfig;
  onAnswer: (option: QuestionOption) => void;
}

export const QuestionCard = ({ question, onAnswer }: Props) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const IconComponent = question.icon ? ICON_MAP[question.icon] : null;

  const handlePress = (opt: QuestionOption, index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    setTimeout(() => {
      onAnswer(opt);
      setSelectedIndex(null);
    }, 180);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Icon + Question */}
      <div>
        <h2 className="text-2xl font-black text-foreground leading-tight">
          {question.question}
        </h2>
        {question.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {question.description}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {question.options.map((opt, index) => {
          const isSelected = selectedIndex === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => handlePress(opt, index)}
              disabled={selectedIndex !== null}
              className={`border-2 p-3 rounded-2xl flex items-center text-left transition-all duration-150 cursor-pointer w-full ${
                isSelected
                  ? "bg-primary/10 border-primary scale-[0.98]"
                  : "bg-card border-border hover:border-primary/40 active:scale-[0.98]"
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex-1 mr-3">
                <span
                  className={`text-base font-semibold leading-relaxed block ${
                    isSelected ? "text-primary" : "text-foreground"
                  }`}
                >
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="text-sm text-muted-foreground mt-1 block">
                    {opt.description}
                  </span>
                )}
              </div>

              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? "bg-primary" : "bg-muted"
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 size={24} color="#ffffff" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-muted-foreground text-sm text-center">
        Selecciona la opción que mejor te represente
      </p>
    </div>
  );
};
