import React from "react";
import {
  CheckCircle,
  AlertTriangle,
  Star,
  FileText,
  Briefcase,
  Lightbulb,
} from "lucide-react";

interface ResumeReviewDisplayProps {
  review: string;
}

function parseReviewSections(review: string) {
  const sections = review.split(/\n{2,}/).filter(Boolean);
  return sections.map((section) => {
    const [firstLine, ...rest] = section.split("\n");
    let title = firstLine;
    let contentLines = rest;

    if (!title.endsWith(":")) {
      const idx = rest.findIndex((l) => l.endsWith(":"));
      if (idx !== -1) {
        title = rest[idx];
        contentLines = rest.slice(idx + 1);
      }
    }

    title = title.replace(/:$/, "").trim();

    const bullets = contentLines.filter((l) =>
      /^[*\-•]\s+/.test(l.trim()),
    );

    const nonBullets = contentLines.filter(
      (l) => !/^[*\-•]\s+/.test(l.trim()) && l.trim(),
    );

    return {
      title,
      bullets: bullets.map((b) =>
        b.replace(/^[*\-•]\s+/, "").trim(),
      ),
      content: nonBullets.join(" ").trim(),
    };
  });
}

function getIcon(title: string) {
  const t = title.toLowerCase();

  if (t.includes("score")) return <Star className="w-5 h-5 text-yellow-500" />;
  if (t.includes("experience")) return <Briefcase className="w-5 h-5 text-blue-500" />;
  if (t.includes("mistake")) return <AlertTriangle className="w-5 h-5 text-red-500" />;
  if (t.includes("recommend")) return <Lightbulb className="w-5 h-5 text-green-500" />;

  return <FileText className="w-5 h-5 text-gray-500" />;
}

function highlightText(text: string) {
  if (text.includes("⭐⭐")) {
    return <span className="text-yellow-500 font-semibold">{text}</span>;
  }
  if (text.toLowerCase().includes("missing")) {
    return <span className="text-red-500 font-medium">{text}</span>;
  }
  if (text.toLowerCase().includes("present")) {
    return <span className="text-green-600 font-medium">{text}</span>;
  }
  return text;
}

export const ResumeReviewDisplay: React.FC<ResumeReviewDisplayProps> = ({
  review,
}) => {
  const sections = parseReviewSections(review);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {sections.map((section, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-2xl shadow-sm hover:shadow-md transition p-6"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            {getIcon(section.title)}
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {section.title}
            </h2>
          </div>
          {/* Content */}
          {section.content && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {section.content}
            </p>
          )}
          {/* Bullets */}
          {section.bullets.length > 0 && (
            <ul className="space-y-2 pl-4">
              {section.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 mt-1 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-200 leading-relaxed">
                    {highlightText(b)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};