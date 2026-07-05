import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaApple, FaTwitter, FaDiscord, FaInstagram } from 'react-icons/fa';
import { ChevronDown, Gamepad2, Coins, Trophy, User, Wrench, Shield } from 'lucide-react';

const faqCategories = [
  {
    id: "account",
    title: "Account",
    icon: User,
    items: [
      {
        q: "How do I create an account?",
        a: "You can create an account by choosing a unique username and setting a secure PIN directly on the login screen. No email address is required to start playing."
      },
      {
        q: "I forgot my PIN, how do I recover my account?",
        a: "On the login screen, select 'Forgot PIN'. You'll need to enter your username and follow the recovery flow to verify your identity and reset your PIN."
      },
      {
        q: "Can I change my username?",
        a: "Yes. Navigate to the Profile tab in the app, tap the settings icon, and select 'Change Username'. Your new username must be unique."
      },
      {
        q: "How do I delete my account?",
        a: "To permanently delete your account and all associated data, please contact us at support@chipsociety.app with your username."
      }
    ]
  },
  {
    id: "gameplay",
    title: "Gameplay",
    icon: Gamepad2,
    items: [
      {
        q: "How does Texas Hold'em work?",
        a: "Each player is dealt two private cards (hole cards). Five community cards are dealt face-up in the middle. You combine your hole cards with the community cards to make the best possible five-card poker hand. The best hand wins the pot."
      },
      {
        q: "What are the AI difficulty levels?",
        a: "Chip Society features 5 AI difficulty levels for solo play: Beginner, Novice, Regular, Tough, and Elite. Higher difficulties use more advanced betting strategies and hand reading."
      },
      {
        q: "What happens when I run out of chips?",
        a: "Don't worry! We provide a daily free chip bonus that replenishes your stack so you can get back to the tables."
      },
      {
        q: "How does the ranking system work?",
        a: "You earn XP by playing hands and winning pots. There are 7 prestige ranks to climb, from Bronze all the way up to Legend."
      }
    ]
  },
  {
    id: "chips",
    title: "Chips & Purchases",
    icon: Coins,
    items: [
      {
        q: "Are Chip Society chips real money?",
        a: "No. All chips in Chip Society are strictly virtual currency. We do not offer real-money gambling, and chips cannot be cashed out for real money under any circumstances."
      },
      {
        q: "How do I get more chips?",
        a: "You can acquire chips by logging in for your daily bonus, winning pots at the tables, or purchasing chip bundles through the in-app Chip Store."
      },
      {
        q: "Can I transfer chips to other players?",
        a: "No. To maintain a fair economy and prevent abuse, chip transfers between accounts are not permitted."
      },
      {
        q: "Do purchased chips expire?",
        a: "Never. Any chips you purchase or earn remain in your account indefinitely."
      }
    ]
  },
  {
    id: "tournaments",
    title: "Tournaments",
    icon: Trophy,
    items: [
      {
        q: "How do I enter a tournament?",
        a: "Navigate to the Tournaments tab in the app. Find an upcoming event, check the registration requirements, and tap 'Register' to pay the buy-in with virtual chips and secure your seat."
      },
      {
        q: "What are the prizes?",
        a: "Tournament winners receive virtual chip payouts and exclusive cosmetic rewards like premium avatars and table themes. There are no real money prizes."
      },
      {
        q: "What is the buy-in?",
        a: "Buy-ins are paid in virtual chips. The amount varies depending on the stakes and prestige of the tournament."
      }
    ]
  },
  {
    id: "technical",
    title: "Technical Issues",
    icon: Wrench,
    items: [
      {
        q: "The app crashed — what do I do?",
        a: "First, ensure your app is up to date. If the problem persists, try reinstalling. Still crashing? Contact us at support@chipsociety.app with your device model and OS version."
      },
      {
        q: "My chips didn't update after winning?",
        a: "This is usually a brief syncing issue. Force close the app and restart it. Your balance should correctly reflect your winnings upon reconnecting to the server."
      },
      {
        q: "I can't connect to multiplayer?",
        a: "Check your internet connection and ensure you aren't on a restricted network. If servers are down for maintenance, we'll post an announcement inside the app."
      }
    ]
  },
  {
    id: "community",
    title: "Community & Safety",
    icon: Shield,
    items: [
      {
        q: "How do I report a player?",
        a: "Tap on the player's avatar at the table or on their profile to open their player card, then select the 'Report' button."
      },
      {
        q: "What happens to reported players?",
        a: "Our moderation team reviews all reports within 48 hours. Depending on the severity, players may receive warnings, temporary suspensions, or permanent bans."
      },
      {
        q: "How do I block a player?",
        a: "You can block a player from their profile card. Blocked players cannot send you messages or join your private tables."
      }
    ]
  }
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors duration-200 ${
        open ? 'border-white/25 bg-white/5' : 'border-white/10'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-medium leading-snug">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-[#00d4ff] shrink-0 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-gray-400 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#050010] text-white selection:bg-[#ff0090] selection:text-white">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#bf5fff] opacity-10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00d4ff] opacity-10 blur-[120px] pointer-events-none z-0" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#050010]/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}icon.png`}
            alt="Chip Society"
            className="w-9 h-9 rounded-xl"
          />
          <span className="font-display font-bold text-lg tracking-wider text-white">
            CHIP SOCIETY
          </span>
        </div>
        <a
          href="#"
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#050010] border border-[#00d4ff] text-white text-sm font-display font-bold rounded-lg hover:bg-[#00d4ff] hover:text-[#050010] transition-all tracking-wider"
        >
          <FaApple className="text-base" />
          App Store
        </a>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 flex flex-col items-center justify-center text-center z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <div className="mb-8 p-4 bg-[#050010] border border-[#ff0090]/40 rounded-2xl shadow-[0_0_40px_rgba(255,0,144,0.2)]">
            <img
              src={`${import.meta.env.BASE_URL}icon.png`}
              alt="Chip Society App Icon"
              className="w-28 h-28 rounded-xl object-contain"
            />
          </div>

          <h1 className="font-display text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4 text-white">
            CHIP SOCIETY
          </h1>
          <p className="text-[#00d4ff] font-display font-bold text-base md:text-lg tracking-[0.25em] uppercase mb-6">
            Texas Hold'em Poker
          </p>
          <p className="text-gray-400 text-lg max-w-xl leading-relaxed mb-10">
            A premium Texas Hold'em poker game for iOS. Practice against AI, compete in
            tournaments, and climb the ranks — all with virtual chips, no real-money gambling.
          </p>

          <a
            href="#"
            className="inline-flex items-center gap-3 px-10 py-4 bg-[#050010] border-2 border-[#00d4ff] text-white rounded-xl hover:bg-[#00d4ff] hover:text-[#050010] transition-all font-display font-bold tracking-wider text-lg shadow-[0_0_30px_rgba(0,212,255,0.25)]"
          >
            <FaApple className="text-2xl" />
            Download on the App Store
          </a>
          <p className="mt-5 text-xs text-gray-600 uppercase tracking-widest">
            Free to play · Virtual chips only · No real-money gambling
          </p>
        </motion.div>
      </section>

      {/* About */}
      <section className="relative z-10 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider text-white mb-12 text-center">
              About the App
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <Gamepad2 className="w-7 h-7 text-[#ff0090] mb-4" />
                <h3 className="font-display font-bold text-white uppercase tracking-wide mb-2 text-sm">
                  AI Practice
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Full Texas Hold'em against 5 AI difficulty levels — from Beginner to Elite.
                  No internet connection required.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <Trophy className="w-7 h-7 text-[#bf5fff] mb-4" />
                <h3 className="font-display font-bold text-white uppercase tracking-wide mb-2 text-sm">
                  Tournaments & Ranks
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Compete in virtual chip tournaments. Earn XP and climb 7 prestige
                  ranks, from Bronze to Legend.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <Coins className="w-7 h-7 text-[#00d4ff] mb-4" />
                <h3 className="font-display font-bold text-white uppercase tracking-wide mb-2 text-sm">
                  Virtual Economy
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  All chips are virtual currency. Daily free bonuses keep you at the
                  tables. Zero real-money gambling.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider text-white mb-3 text-center">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 text-center mb-14 text-sm">
              Can't find what you need?{' '}
              <a
                href="mailto:support@chipsociety.app"
                className="text-[#00d4ff] hover:underline"
              >
                support@chipsociety.app
              </a>
            </p>

            <div className="space-y-10">
              {faqCategories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <category.icon className="w-5 h-5 text-[#bf5fff]" />
                    <h3 className="font-display text-base font-bold text-white uppercase tracking-wider">
                      {category.title}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {category.items.map((item, i) => (
                      <FAQItem key={i} q={item.q} a={item.a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/10 bg-black/40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}icon.png`}
                alt="Chip Society"
                className="w-8 h-8 rounded-lg opacity-70"
              />
              <span className="font-display font-bold text-white/70 tracking-wider text-sm">
                CHIP SOCIETY
              </span>
            </div>
            <div className="flex gap-5 text-gray-500">
              <a href="#" className="hover:text-[#ff0090] transition-colors">
                <FaTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-[#bf5fff] transition-colors">
                <FaDiscord className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-[#00d4ff] transition-colors">
                <FaInstagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600 uppercase tracking-wider">
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <a href="#" className="hover:text-gray-400 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-gray-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-400 transition-colors">
                Community Guidelines
              </a>
              <a
                href="mailto:support@chipsociety.app"
                className="hover:text-[#00d4ff] transition-colors"
              >
                Contact
              </a>
            </div>
            <div>&copy; 2026 Chip Society. All rights reserved.</div>
          </div>

          <p className="text-center text-xs text-gray-700 mt-6 uppercase tracking-widest">
            Virtual chips only · No real-money gambling · 18+ or 13+ with parental consent
          </p>
        </div>
      </footer>
    </div>
  );
}
