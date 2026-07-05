import { useState } from "react";
import { Link } from "wouter";
import { Search, User, Gamepad2, Coins, Trophy, Wrench, Shield, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  {
    id: "account",
    title: "Account",
    icon: User,
    color: "text-secondary",
    shadow: "box-shadow-neon-blue",
    desc: "Manage your profile, PIN recovery, and username."
  },
  {
    id: "gameplay",
    title: "Gameplay",
    icon: Gamepad2,
    color: "text-primary",
    shadow: "box-shadow-neon-pink",
    desc: "Rules of Texas Hold'em, AI difficulty, and ranks."
  },
  {
    id: "chips",
    title: "Chips & Purchases",
    icon: Coins,
    color: "text-accent",
    shadow: "shadow-[0_0_15px_rgba(191,95,255,0.4)]",
    desc: "Virtual chips, daily bonuses, and store purchases."
  },
  {
    id: "tournaments",
    title: "Tournaments",
    icon: Trophy,
    color: "text-secondary",
    shadow: "box-shadow-neon-blue",
    desc: "Entering tournaments, buy-ins, and prizes."
  },
  {
    id: "technical",
    title: "Technical Issues",
    icon: Wrench,
    color: "text-primary",
    shadow: "box-shadow-neon-pink",
    desc: "Crashes, syncing issues, and multiplayer connection."
  },
  {
    id: "community",
    title: "Community & Safety",
    icon: Shield,
    color: "text-accent",
    shadow: "shadow-[0_0_15px_rgba(191,95,255,0.4)]",
    desc: "Reporting players, blocking, and sportsmanship."
  }
];

export default function Home() {
  const [search, setSearch] = useState("");

  const filteredCategories = categories.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 w-full">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold font-display text-white mb-6 text-shadow-neon-blue">
              HOW CAN WE HELP YOU?
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Welcome to the official back-office. Find answers, troubleshoot issues, and get back to the tables.
            </p>

            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-0 bg-secondary/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center bg-card border border-white/20 rounded-full overflow-hidden focus-within:border-secondary transition-colors box-shadow-neon-blue">
                <Search className="w-6 h-6 text-white/50 ml-6" />
                <input
                  type="text"
                  placeholder="Search for answers..."
                  className="w-full bg-transparent border-none text-white px-4 py-5 outline-none placeholder:text-white/40"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-display text-white mb-4">Browse Topics</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full box-shadow-neon-pink" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredCategories.map((category, i) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link href={`/faq?category=${category.id}`} className="block h-full">
                  <div className={`h-full bg-card border border-white/10 rounded-xl p-8 hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 group relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-white to-transparent" />
                    <category.icon className={`w-12 h-12 ${category.color} mb-6 transition-transform group-hover:scale-110`} />
                    <h3 className="text-xl font-display text-white mb-3 group-hover:text-shadow-neon-blue transition-all">{category.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {category.desc}
                    </p>
                    <div className="flex items-center text-xs font-bold text-white/60 group-hover:text-white uppercase tracking-wider mt-auto">
                      View Articles <ChevronRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            
            {filteredCategories.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">No topics found for "{search}".</p>
                <button 
                  onClick={() => setSearch("")}
                  className="mt-4 text-primary hover:text-shadow-neon-pink"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-white/10 bg-black/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display text-white mb-6">Still need help?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-10">
            Can't find what you're looking for? Our support team is ready to assist you directly.
          </p>
          <Link 
            href="/contact" 
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-bold tracking-widest uppercase rounded-sm hover:bg-white hover:text-primary transition-all duration-300 box-shadow-neon-pink hover:shadow-[0_0_30px_rgba(255,255,255,0.8)]"
          >
            Submit a Ticket
          </Link>
        </div>
      </section>
    </div>
  );
}
