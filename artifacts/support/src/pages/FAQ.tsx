import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { User, Gamepad2, Coins, Trophy, Wrench, Shield } from "lucide-react";
import { useLocation } from "wouter";

const faqData = [
  {
    id: "account",
    title: "Account",
    icon: User,
    color: "text-secondary",
    items: [
      { q: "How do I create an account?", a: "You can create an account by choosing a unique username and setting a secure PIN directly on the login screen. No email address is required to start playing." },
      { q: "I forgot my PIN, how do I recover my account?", a: "On the login screen, select 'Forgot PIN'. You'll need to enter your username and follow the recovery flow to verify your identity and reset your PIN." },
      { q: "Can I change my username?", a: "Yes. Navigate to the Profile tab in the app, tap the settings icon, and select 'Change Username'. Note that your new username must be unique." },
      { q: "How do I delete my account?", a: "To permanently delete your account and all associated data, please contact support via our Submit a Ticket page with your username." }
    ]
  },
  {
    id: "gameplay",
    title: "Gameplay",
    icon: Gamepad2,
    color: "text-primary",
    items: [
      { q: "How does Texas Hold'em work?", a: "Each player is dealt two private cards (hole cards). Five community cards are dealt face-up in the middle. You combine your hole cards with the community cards to make the best possible five-card poker hand. The best hand wins the pot." },
      { q: "What are the AI difficulty levels?", a: "Chip Society features 5 AI difficulty levels for solo play: Beginner, Novice, Regular, Tough, and Elite. Higher difficulties use more advanced betting strategies and hand reading." },
      { q: "What happens when I run out of chips?", a: "Don't worry! We provide a daily free chip bonus that replenishes your stack so you can get back to the tables." },
      { q: "How does the ranking system work?", a: "You earn XP by playing hands and winning pots. There are 7 prestige ranks to achieve, ranging from Neon Bronze all the way up to Neon Legend." }
    ]
  },
  {
    id: "chips",
    title: "Chips & Purchases",
    icon: Coins,
    color: "text-accent",
    items: [
      { q: "Are Chip Society chips real money?", a: "No. All chips in Chip Society are strictly virtual currency. We do not offer real-money gambling, and chips cannot be cashed out for real money." },
      { q: "How do I get more chips?", a: "You can acquire chips by logging in for your daily bonus, winning pots at the tables, or purchasing chip bundles in the in-app Chip Store." },
      { q: "Can I transfer chips to other players?", a: "No. To maintain a fair economy and prevent abuse, chip transfers between accounts are not permitted." },
      { q: "Do purchased chips expire?", a: "Never. Any chips you purchase or win remain in your account indefinitely." }
    ]
  },
  {
    id: "tournaments",
    title: "Tournaments",
    icon: Trophy,
    color: "text-secondary",
    items: [
      { q: "How do I enter a tournament?", a: "Navigate to the Tournaments tab in the app. Find an upcoming event, check the registration requirements, and tap 'Register' to pay the buy-in and secure your seat." },
      { q: "What are the prizes?", a: "Tournament winners receive massive virtual chip payouts and exclusive cosmetic rewards like premium avatars and table themes. There are no real money prizes." },
      { q: "What is the buy-in?", a: "Buy-ins require virtual chips. The amount varies depending on the stakes and prestige of the tournament." }
    ]
  },
  {
    id: "technical",
    title: "Technical Issues",
    icon: Wrench,
    color: "text-primary",
    items: [
      { q: "The app crashed, what do I do?", a: "First, ensure your app is up to date. If the problem persists, try reinstalling. Still crashing? Contact support with your device model and OS version." },
      { q: "My chips didn't update after winning?", a: "This is usually a brief syncing issue. Force close the app and restart it. Your balance should correctly reflect your winnings upon reconnecting to the server." },
      { q: "I can't connect to multiplayer?", a: "Check your internet connection and ensure you aren't on a restricted network (like some school or work WiFis). If the servers are down for maintenance, we'll post an announcement in the app." }
    ]
  },
  {
    id: "community",
    title: "Community & Safety",
    icon: Shield,
    color: "text-accent",
    items: [
      { q: "How do I report a player?", a: "Tap on the offending player's avatar at the table or in their profile to open their player card, then select the 'Report' button." },
      { q: "What happens to reported players?", a: "Our moderation team reviews all reports within 48 hours. Depending on the severity of the offense, players may receive warnings, temporary suspensions, or permanent bans." },
      { q: "How do I block a player?", a: "You can block a player from their profile card. Blocked players cannot chat with you or join your private tables." }
    ]
  }
];

export default function FAQ() {
  const [location] = useLocation();
  const [activeCategory, setActiveCategory] = useState(faqData[0].id);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get("category");
    if (categoryParam && faqData.some(c => c.id === categoryParam)) {
      setActiveCategory(categoryParam);
    }
  }, [location]);

  const activeData = faqData.find(c => c.id === activeCategory) || faqData[0];

  return (
    <div className="flex-1 w-full bg-background pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold text-white mb-4 text-shadow-neon-blue">
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p className="text-muted-foreground">Find answers to the most common issues in Chip Society.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="sticky top-24 space-y-2">
              {faqData.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeCategory === category.id 
                      ? "bg-white/10 text-white font-medium border border-white/20" 
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <category.icon className={`w-5 h-5 ${activeCategory === category.id ? category.color : ""}`} />
                  {category.title}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <activeData.icon className={`w-8 h-8 ${activeData.color}`} />
                <h2 className="text-2xl font-display text-white">{activeData.title}</h2>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-4">
                {activeData.items.map((item, i) => (
                  <AccordionItem 
                    key={i} 
                    value={`item-${i}`}
                    className="border border-white/10 bg-card px-6 rounded-lg data-[state=open]:border-white/30 transition-colors"
                  >
                    <AccordionTrigger className="text-white hover:text-white/80 text-left font-medium py-4">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
