import { Card } from "@/components/ui/Card";
import { FAQ } from "@/lib/faq";
import { InfoHeader } from "../InfoHeader";

/** よくある質問（公開ページ。内容は LP と共通の lib/faq.ts） */
export default function FaqPage() {
  return (
    <div className="flex flex-1 flex-col pb-10">
      <InfoHeader title="よくある質問" />
      <div className="stagger space-y-3 px-4 py-4">
        {FAQ.map((item) => (
          <Card key={item.q} as="details" className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-semibold text-ink">{item.q}</span>
              <span className="text-primary transition-transform duration-300 group-open:rotate-45">
                ＋
              </span>
            </summary>
            <p className="details-body border-t border-line px-4 py-3.5 text-sm leading-relaxed text-ink-soft">
              {item.a}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
