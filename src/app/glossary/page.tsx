import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  STAT_DESCRIPTIONS,
  GLOSSARY_INTRO,
  EXTENDED_STAT_CATALOG,
  EXTENDED_STAT_DESCRIPTIONS,
  EXTENDED_CATEGORY_ORDER,
} from "@/lib/glossary";
import { PROFILE_STAT_GROUPS } from "@/lib/types";

const EXTENDED_BY_CATEGORY = new Map<string, typeof EXTENDED_STAT_CATALOG>();
for (const stat of EXTENDED_STAT_CATALOG) {
  if (!EXTENDED_BY_CATEGORY.has(stat.category)) EXTENDED_BY_CATEGORY.set(stat.category, []);
  EXTENDED_BY_CATEGORY.get(stat.category)!.push(stat);
}
const EXTENDED_CATEGORIES = [...EXTENDED_BY_CATEGORY.keys()].sort(
  (a, b) => EXTENDED_CATEGORY_ORDER.indexOf(a) - EXTENDED_CATEGORY_ORDER.indexOf(b)
);

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-heading font-bold sm:text-3xl">Golf Stats, Explained</h1>
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

      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight">72 more stats, by category</h2>
        <p className="text-muted-foreground">
          Pulled directly from PGA Tour&apos;s own stats site, shown in the &quot;More Stats&quot;
          section on player profiles.
        </p>
        {EXTENDED_CATEGORIES.map((category) => (
          <Card key={category} className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                {EXTENDED_BY_CATEGORY.get(category)!.map((stat) => (
                  <div key={stat.key}>
                    <dt className="font-semibold">{stat.label}</dt>
                    <dd className="text-sm text-muted-foreground">
                      {EXTENDED_STAT_DESCRIPTIONS[stat.key] ?? "No description available yet."}
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
