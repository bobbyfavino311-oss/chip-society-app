import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaApple, FaGooglePlay, FaTwitter, FaDiscord, FaInstagram } from 'react-icons/fa';
import { Trophy, Users, Zap, Image as ImageIcon, Shield, Flame, ChevronRight, MessageSquare, Target, Smartphone } from 'lucide-react';

import heroBg from './assets/images/hero-bg.png';
import character1 from './assets/images/character-1.png';
import character2 from './assets/images/character-2.png';
import gameUi from './assets/images/game-ui.png';
import tournamentImg from './assets/images/tournament.png';
import chipsImg from './assets/images/chips.png';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function App() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#050010] text-white selection:bg-[#ff0090] selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#bf5fff] opacity-10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00d4ff] opacity-10 blur-[120px] pointer-events-none z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#050010]/80 backdrop-blur-md border-b border-[#bf5fff]/20">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}icon.png`} alt="Chip Society Icon" className="w-10 h-10 rounded-xl box-glow-pink" />
          <span className="font-display font-bold text-xl tracking-wider text-glow-pink">CHIP SOCIETY</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-medium text-sm tracking-wide">
          <a href="#features" className="hover:text-[#00d4ff] transition-colors">FEATURES</a>
          <a href="#tournaments" className="hover:text-[#bf5fff] transition-colors">TOURNAMENTS</a>
          <a href="#social" className="hover:text-[#00d4ff] transition-colors">SOCIAL</a>
          <a href="#roster" className="hover:text-[#ff0090] transition-colors">ROSTER</a>
        </div>
        <button className="px-6 py-2 bg-[#ff0090] text-white font-display font-bold text-sm tracking-widest rounded hover:bg-white hover:text-[#ff0090] transition-all box-glow-pink uppercase hidden sm:block">
          Play Now
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Neon Synthwave City" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050010]/80 via-[#050010]/40 to-[#050010]" />
        </div>

        <div className="container relative z-10 mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-left"
          >
            <motion.div variants={fadeIn} className="inline-block px-4 py-1.5 mb-6 border border-[#00d4ff]/40 bg-[#00d4ff]/10 text-[#00d4ff] font-display text-sm tracking-[0.2em] uppercase box-glow-blue rounded-sm">
              The Underground Awaits
            </motion.div>
            <motion.h1 variants={fadeIn} className="font-display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-6 uppercase tracking-tighter">
              <span className="block text-glow-pink text-[#ff0090]">High Stakes.</span>
              <span className="block text-white text-glow-blue">Neon Nights.</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-[#bf5fff] text-lg md:text-xl font-medium mb-10 max-w-lg leading-relaxed">
              Step into Miami's most exclusive underground card room. Real Texas Hold'em gameplay, fierce AI opponents, and a pulsing synthwave aesthetic. Virtual chips, real glory.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
              <a href="#" className="flex items-center justify-center gap-3 px-8 py-4 bg-[#050010] border border-[#00d4ff] text-white rounded-lg box-glow-blue hover:bg-[#00d4ff] hover:text-[#050010] transition-all group">
                <FaApple className="text-2xl group-hover:scale-110 transition-transform" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] tracking-wider uppercase opacity-80">Download on the</div>
                  <div className="font-display font-bold text-lg">App Store</div>
                </div>
              </a>
              <a href="#" className="flex items-center justify-center gap-3 px-8 py-4 bg-[#050010] border border-[#ff0090] text-white rounded-lg box-glow-pink hover:bg-[#ff0090] hover:text-white transition-all group">
                <FaGooglePlay className="text-2xl group-hover:scale-110 transition-transform" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] tracking-wider uppercase opacity-80">Get it on</div>
                  <div className="font-display font-bold text-lg">Google Play</div>
                </div>
              </a>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative hidden lg:block perspective-1000"
            style={{ 
              transform: `rotateY(${mousePosition.x * 10}deg) rotateX(${-mousePosition.y * 10}deg)`
            }}
          >
            <div className="relative z-10 w-64 h-64 md:w-96 md:h-96 mx-auto">
              <motion.img 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                src={`${import.meta.env.BASE_URL}icon.png`}
                alt="Game Icon" 
                className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(255,0,144,0.8)]"
              />
            </div>
            
            {/* Decorator rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-[#00d4ff]/20 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border border-[#ff0090]/20 rounded-full border-dashed"
            />
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-[0.3em] font-display text-[#bf5fff] uppercase">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-[#bf5fff] to-transparent" />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
              <span className="text-white">Rule The </span>
              <span className="text-[#00d4ff] text-glow-blue">Table</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Not your casual social casino. We built Chip Society for players who respect the game, wrapped in a sensory experience that demands attention.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-[#ff0090]" />}
              title="Advanced AI Opponents"
              desc="Face off against 5 distinct AI difficulty tiers. From loose-passive tourists to hyper-aggressive sharks, adapt your strategy or go home broke."
              color="#ff0090"
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-[#00d4ff]" />}
              title="Global Multiplayer"
              desc="Sit at tables with players worldwide. Rise through the ranks, build your bankroll, and claim your seat at the high-roller tables."
              color="#00d4ff"
            />
            <FeatureCard 
              icon={<Trophy className="w-8 h-8 text-[#bf5fff]" />}
              title="Live Tournaments"
              desc="Multi-table tournaments running 24/7. Massive virtual prize pools, escalating blinds, and winner-takes-all prestige."
              color="#bf5fff"
            />
            <FeatureCard 
              icon={<MessageSquare className="w-8 h-8 text-[#00d4ff]" />}
              title="Social Hand Feed"
              desc="Hit a royal flush? Suck out on the river? Share your most devastating hands directly to the community feed and bask in the glory."
              color="#00d4ff"
            />
            <FeatureCard 
              icon={<ImageIcon className="w-8 h-8 text-[#ff0090]" />}
              title="80 Cinematic Avatars"
              desc="Unlock beautifully illustrated 80s-inspired character portraits as you level up. Command the table before the first card is dealt."
              color="#ff0090"
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-[#bf5fff]" />}
              title="Fair Play Engine"
              desc="Certified RNG card dealing. Pure odds, pure skill. The house has no edge here—only the sharpest players survive."
              color="#bf5fff"
            />
          </motion.div>
        </div>
      </section>

      {/* Gameplay Showcase */}
      <section className="py-24 relative overflow-hidden bg-[#050010] border-y border-[#bf5fff]/20">
        <div className="absolute inset-0 grid-bg opacity-30" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase mb-6 leading-tight">
                <span className="text-[#bf5fff] text-glow-purple">Immersive</span><br/>
                Action
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Feel the weight of the chips. Hear the snap of the cards. We've obsessed over every micro-interaction to recreate the tension of a high-stakes underground game.
              </p>
              <ul className="space-y-6 mb-10">
                <ListItem icon={<Smartphone className="w-5 h-5" />} text="Smooth, intuitive betting controls designed for one-handed portrait play" color="#00d4ff" />
                <ListItem icon={<Target className="w-5 h-5" />} text="Dynamic table themes that react to pot sizes and player actions" color="#ff0090" />
                <ListItem icon={<Zap className="w-5 h-5" />} text="Detailed hand histories and session statistics to analyze your play" color="#bf5fff" />
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#00d4ff]/30 box-glow-blue shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050010] to-transparent z-10 opacity-60" />
                <img src={gameUi} alt="Game Interface" className="w-full h-auto" />
                
                {/* Overlay UI elements */}
                <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
                  <div className="px-4 py-2 bg-[#050010]/80 backdrop-blur border border-[#00d4ff] rounded text-[#00d4ff] font-display text-xl font-bold">
                    POT: 450,000
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1], textShadow: ["0 0 10px rgba(255,0,144,0.5)", "0 0 20px rgba(255,0,144,0.8)", "0 0 10px rgba(255,0,144,0.5)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="px-6 py-3 bg-[#ff0090] text-white font-display font-bold uppercase rounded shadow-[0_0_20px_rgba(255,0,144,0.6)]"
                  >
                    ALL IN
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tournaments Section */}
      <section id="tournaments" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center flex-row-reverse">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase mb-6 leading-tight">
                <span className="text-white">Glory &</span><br/>
                <span className="text-[#00d4ff] text-glow-blue">Gold</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Compete in daily and weekly multi-table tournaments. Climb the leaderboard, earn exclusive badges, and take down massive virtual prize pools.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-display font-bold text-[#ff0090] tracking-wider mb-1">NEON NIGHTS FREEROLL</div>
                    <div className="text-sm text-gray-400">Starts in 00:45:12</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-xl text-white">50M Chips</div>
                    <div className="text-xs text-gray-500 uppercase">Prize Pool</div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-display font-bold text-[#bf5fff] tracking-wider mb-1">HIGH ROLLER INVITATIONAL</div>
                    <div className="text-sm text-gray-400">Registration Open</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-xl text-white">1B Chips</div>
                    <div className="text-xs text-gray-500 uppercase">Prize Pool</div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#bf5fff]/30 box-glow-purple shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050010] via-transparent to-transparent z-10 opacity-80" />
                <img src={tournamentImg} alt="Tournament Trophy" className="w-full h-auto aspect-video object-cover" />
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-full text-center">
                  <Trophy className="w-16 h-16 text-[#00d4ff] mx-auto mb-4 opacity-80" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social & Feed Section */}
      <section id="social" className="py-24 relative bg-[#0a0515] border-y border-white/5">
        <div className="container mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
              <span className="text-[#ff0090] text-glow-pink">Flex Your </span>
              <span className="text-white">Wins</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              The social feed is where legends are born. Share your hand histories, sickest bad beats, and tournament victories directly to the timeline.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#00d4ff]/10 via-[#ff0090]/10 to-[#bf5fff]/10 rounded-2xl blur-xl" />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative bg-[#050010] border border-white/10 rounded-xl p-6 shadow-xl"
            >
              <div className="flex items-start gap-4 mb-4">
                <img src={character1} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-[#00d4ff] object-cover" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-white uppercase">The Fixer</span>
                    <span className="text-xs text-gray-500">2h ago</span>
                  </div>
                  <p className="text-gray-300 mt-1">Cracked pocket Aces with 7-2 offsuit. Read him like a book. #SickCall #HighStakes</p>
                </div>
              </div>
              
              <div className="bg-[#110524] rounded-lg p-4 border border-[#bf5fff]/20">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-display text-xs text-[#00d4ff] tracking-widest uppercase">Hand Replay</span>
                  <span className="font-display font-bold text-white">Won 2.4M Pot</span>
                </div>
                <div className="flex justify-center gap-2 mb-4">
                  <div className="w-10 h-14 bg-white rounded flex items-center justify-center text-black font-bold border border-gray-300">7♠</div>
                  <div className="w-10 h-14 bg-white rounded flex items-center justify-center text-red-600 font-bold border border-gray-300">2♥</div>
                  <div className="w-4" />
                  <div className="w-10 h-14 bg-white rounded flex items-center justify-center text-red-600 font-bold border border-gray-300">A♦</div>
                  <div className="w-10 h-14 bg-white rounded flex items-center justify-center text-black font-bold border border-gray-300">7♣</div>
                  <div className="w-10 h-14 bg-white rounded flex items-center justify-center text-red-600 font-bold border border-gray-300">7♦</div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10 text-gray-400">
                <button className="flex items-center gap-2 hover:text-[#ff0090] transition-colors"><Flame className="w-4 h-4" /> 124</button>
                <button className="flex items-center gap-2 hover:text-[#00d4ff] transition-colors"><MessageSquare className="w-4 h-4" /> 12</button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Characters / Roster */}
      <section id="roster" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
              <span className="text-[#bf5fff] text-glow-purple">Choose Your </span>
              <span className="text-white">Persona</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Unlock over 80 distinct characters as you build your reputation. Your avatar is your intimidation tactic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CharacterCard img={character1} name="The Fixer" tier="Legendary" color="#00d4ff" />
            <CharacterCard img={character2} name="Neon Queen" tier="Epic" color="#ff0090" />
            
            <div className="group relative rounded-xl overflow-hidden border border-[#bf5fff]/30 aspect-[3/4] bg-[#1a0a2e] flex flex-col items-center justify-center cursor-not-allowed">
              <Flame className="w-12 h-12 text-[#bf5fff]/40 mb-4" />
              <div className="font-display text-[#bf5fff]/60 font-bold uppercase tracking-wider">Locked</div>
              <div className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Reach Lvl 25</div>
            </div>
            
            <div className="group relative rounded-xl overflow-hidden border border-[#00d4ff]/30 aspect-[3/4] bg-[#0a152e] flex flex-col items-center justify-center cursor-not-allowed">
              <Flame className="w-12 h-12 text-[#00d4ff]/40 mb-4" />
              <div className="font-display text-[#00d4ff]/60 font-bold uppercase tracking-wider">Locked</div>
              <div className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Win 10 Tourneys</div>
            </div>
          </div>
        </div>
      </section>

      {/* Economy / Chip Store */}
      <section className="py-24 relative overflow-hidden bg-[#110524] border-t border-[#bf5fff]/20">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#ff0090]/30 box-glow-pink shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050010] via-transparent to-transparent z-10 opacity-60" />
                <img src={chipsImg} alt="Neon Chips" className="w-full h-auto aspect-square object-cover" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block px-4 py-1.5 mb-6 border border-[#ff0090]/40 bg-[#ff0090]/10 text-[#ff0090] font-display text-sm tracking-[0.2em] uppercase rounded-sm">
                Virtual Economy
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase mb-6 leading-tight">
                <span className="text-white">Stack</span><br/>
                <span className="text-[#ff0090] text-glow-pink">To The Ceiling</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Chip Society operates on a pure virtual economy. Earn chips through gameplay, complete daily missions, or hit the daily spin wheel to keep your bankroll healthy.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-white/10 rounded-lg bg-black/40">
                  <div className="font-display font-bold text-2xl text-[#00d4ff] mb-1">FREE</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">Daily Refills</div>
                </div>
                <div className="p-4 border border-white/10 rounded-lg bg-black/40">
                  <div className="font-display font-bold text-2xl text-[#bf5fff] mb-1">XP</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">Rewards</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA / Download */}
      <section className="py-32 relative bg-gradient-to-b from-[#050010] to-[#1a0033]">
        <div className="absolute inset-0 bg-[#ff0090]/5 mix-blend-overlay pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block p-4 mb-8 bg-[#050010] border border-[#ff0090] rounded-2xl box-glow-pink">
              <img src={`${import.meta.env.BASE_URL}icon.png`} alt="Chip Society Icon" className="w-24 h-24 rounded-xl object-contain drop-shadow-2xl" />
            </div>
            
            <h2 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
              Take Your <span className="text-[#00d4ff] text-glow-blue">Seat</span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              The cards are dealt. The blinds are up. Download Chip Society free today and join the most stylish poker room on mobile.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <a href="#" className="flex items-center justify-center gap-4 px-10 py-5 bg-[#050010] border-2 border-[#00d4ff] text-white rounded-xl box-glow-blue hover:bg-[#00d4ff] hover:text-[#050010] transition-all group scale-100 hover:scale-105 active:scale-95">
                <FaApple className="text-3xl" />
                <div className="text-left leading-tight">
                  <div className="text-xs tracking-wider uppercase opacity-80 font-medium">Download on the</div>
                  <div className="font-display font-bold text-xl">App Store</div>
                </div>
              </a>
              <a href="#" className="flex items-center justify-center gap-4 px-10 py-5 bg-[#050010] border-2 border-[#ff0090] text-white rounded-xl box-glow-pink hover:bg-[#ff0090] hover:text-white transition-all group scale-100 hover:scale-105 active:scale-95">
                <FaGooglePlay className="text-3xl" />
                <div className="text-left leading-tight">
                  <div className="text-xs tracking-wider uppercase opacity-80 font-medium">Get it on</div>
                  <div className="font-display font-bold text-xl">Google Play</div>
                </div>
              </a>
            </div>
            
            <div className="mt-8 text-sm text-gray-500 uppercase tracking-widest font-display">
              Free to play • Virtual chips only
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-[#020008]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div className="flex items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}icon.png`} alt="Icon" className="w-8 h-8 opacity-50 grayscale" />
              <span className="font-display font-bold text-lg tracking-widest text-gray-500 uppercase">CHIP SOCIETY</span>
            </div>
            
            <div className="flex gap-6 text-gray-400">
              <a href="#" className="hover:text-[#ff0090] transition-colors"><FaTwitter className="w-6 h-6" /></a>
              <a href="#" className="hover:text-[#bf5fff] transition-colors"><FaDiscord className="w-6 h-6" /></a>
              <a href="#" className="hover:text-[#00d4ff] transition-colors"><FaInstagram className="w-6 h-6" /></a>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Community Guidelines</a>
              <a href="mailto:support@chipsociety.app" className="hover:text-[#00d4ff] transition-colors">Support</a>
            </div>
            <div>&copy; 2026 Chip Society. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
  return (
    <motion.div 
      variants={fadeIn}
      className="p-8 rounded-xl bg-[#110524]/50 border border-white/5 hover:border-white/20 transition-all group hover:-translate-y-2 backdrop-blur-sm"
      style={{ '--hover-color': color } as React.CSSProperties}
    >
      <div className="mb-6 p-4 rounded-lg inline-block bg-[#050010] shadow-[0_0_15px_var(--hover-color)_inset] group-hover:shadow-[0_0_25px_var(--hover-color)_inset] transition-shadow">
        {icon}
      </div>
      <h3 className="font-display text-xl font-bold mb-3 uppercase tracking-wide text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function CharacterCard({ img, name, tier, color }: { img: string, name: string, tier: string, color: string }) {
  return (
    <motion.div 
      variants={fadeIn}
      className="group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer aspect-[3/4]"
      style={{ borderColor: `${color}40` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#050010] via-transparent to-transparent z-10" />
      <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform">
        <div className="text-[10px] uppercase tracking-[0.3em] mb-1 font-bold" style={{ color }}>{tier} Tier</div>
        <div className="font-display text-2xl font-black uppercase tracking-wider text-white" style={{ textShadow: `0 0 10px ${color}` }}>{name}</div>
      </div>
      
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none" style={{ boxShadow: `inset 0 0 30px ${color}80` }} />
    </motion.div>
  );
}

function ListItem({ icon, text, color }: { icon: React.ReactNode, text: string, color: string }) {
  return (
    <li className="flex items-start gap-4">
      <div className="mt-1 flex-shrink-0" style={{ color: color, filter: `drop-shadow(0 0 5px ${color})` }}>
        {icon}
      </div>
      <span className="text-gray-300">{text}</span>
    </li>
  );
}