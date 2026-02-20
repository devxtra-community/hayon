import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Crown, Sparkles } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { UpgradeToPro } from "@/components/shared/UpgradeToPro";
import Link from "next/link";

export default function PricingPage() {
  const features = {
    free: [
      { name: "30 posts per month", included: true },
      { name: "50 AI Caption requests per month", included: true },
      { name: "Basic analytics", included: true },
      { name: "Community support", included: true },
      { name: "Advanced AI customization", included: false },
      { name: "Unlimited posts", included: false },
      { name: "Multiple accounts", included: false },
      { name: "Priority support", included: false },
      { name: "Custom branding", included: false },
    ],
    pro: [
      { name: "100 posts per month", included: true },
      { name: "100 AI Caption requests per month", included: true },
      { name: "Up to 10 social media accounts", included: true },
      { name: "Advanced analytics & insights", included: true },
      { name: "Priority 24/7 support", included: true },
      { name: "Advanced AI customization", included: true },
      { name: "Custom post scheduling", included: true },
      { name: "Brand voice training", included: true },
      { name: "Remove Hayon branding", included: true },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <BackButton />
      <section className="p-4 pb-10 relative">
        <div className="gradient rounded-xl relative py-10 px-4 md:px-8">
          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
            <Badge className="mb-4 bg-white/90 text-black px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Simple, Transparent Pricing
            </Badge>

            <h1 className="text-2xl md:text-4xl font-bold mb-3 text-[#0a0a0a]">
              Choose Your Right Plan!
            </h1>

            <p className="text-sm md:text-base text-[#0a0a0a] opacity-90">
              Start free and upgrade when you&apos;re ready. No hidden fees, cancel anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="mt-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* --- Free Plan --- */}
            <Card className="relative hover:shadow-md transition-all bg-card flex flex-col p-4 py-6">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-black text-white px-4 py-1 text-lg font-semibold">
                    Free
                  </Badge>
                  <Zap className="w-5 h-5 text-muted-foreground" />
                </div>

                <CardDescription className="text-xs">
                  Perfect for getting started with AI content
                </CardDescription>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Forever free — no credit card required
                  </p>
                </div>
              </CardHeader>

              <CardContent className="grow">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-3">
                  What&apos;s included
                </h3>

                <ul className="space-y-2">
                  {features.free.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {f.included ? (
                        <div className="bg-green-500/10 p-1 rounded-full mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                      ) : (
                        <div className="bg-muted p-1 rounded-full mt-0.5">
                          <X className="w-3 h-3 text-muted-foreground/40" />
                        </div>
                      )}
                      <span
                        className={
                          f.included ? "text-sm" : "text-sm text-muted-foreground/60 line-through"
                        }
                      >
                        {f.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Link href="/dashboard" className="w-full">
                  <Button variant="outline" className="w-full h-10 text-sm font-medium">
                    Go to Dashboard
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* --- Pro Plan --- */}
            <Card className="relative hover:shadow-lg transition-all bg-card flex flex-col p-4 py-6 border-2 border-[#318D62]/20 shadow-green-50">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-black text-white px-4 py-1 text-lg font-semibold">
                    Premium
                  </Badge>
                  <div className="bg-[#318D62]/10 p-2 rounded-full">
                    <Crown className="w-5 h-5 text-black" />
                  </div>
                </div>

                <CardDescription className="text-xs">
                  For serious content creators and businesses
                </CardDescription>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$4.99</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Billed monthly — cancel anytime
                  </p>
                </div>
              </CardHeader>

              <CardContent className="grow">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-3">
                  Everything in Free, plus
                </h3>

                <ul className="space-y-2">
                  {features.pro.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="bg-[#318D62]/10 p-1 rounded-full mt-0.5">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                      <span className="text-sm font-medium">{f.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <UpgradeToPro />
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10">
        <div className="max-w-3xl mx-auto text-center bg-muted/30 rounded-xl p-6">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Still have questions?</h2>

          <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
            Our support team is here to help you choose the right plan for your needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" className="text-sm px-6 h-10">
              Contact Support
            </Button>
            <Button className="text-sm px-6 h-10" variant="black">
              Continue with free plan
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
