import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STAT_DESCRIPTIONS, GLOSSARY_INTRO } from "@/lib/glossary";
import { PROFILE_STAT_GROUPS } from "@/lib/types";

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Golf Stats, Explained</h1>
        <p className="text-muted-foreground">
          No golf background needed. Here&apos;s what every number on this site actually means.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {GLOSSARY_INTRO.map((item) => (
          <Card key={item.term} className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.term}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight">Every stat, by category</h2>
        {PROFILE_STAT_GROUPS.map((group) => (
          <Card key={group.title} className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">{group.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                {group.stats.map((stat) => (
                  <div key={String(stat.key)}>
                    <dt className="font-semibold">{stat.label}</dt>
                    <dd className="text-sm text-muted-foreground">
                      {STAT_DESCRIPTIONS[stat.key] ?? "No description available yet."}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
