import { Link } from "wouter";
import { ReactNode } from "react";
import { ShieldAlert, Book, HelpCircle, Mail } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src={`${import.meta.env.BASE_URL}icon.png`}
              alt="Chip Society Logo" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(0,212,255,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(255,0,144,0.6)] transition-all duration-300"
            />
            <span className="font-display font-bold text-xl tracking-wider text-white text-shadow-neon-blue">
              CHIP SOCIETY
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-white/80 hover:text-white hover:text-shadow-neon-pink transition-all">
              Help Center
            </Link>
            <Link href="/faq" className="text-sm font-medium text-white/80 hover:text-white hover:text-shadow-neon-blue transition-all">
              FAQ
            </Link>
            <Link href="/contact" className="text-sm font-medium text-white/80 hover:text-white hover:text-shadow-neon-pink transition-all">
              Contact
            </Link>
          </nav>
          
          <div className="md:hidden">
            <Link href="/contact" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded box-shadow-neon-pink">
              Support
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-white/10 bg-black/40 pt-12 pb-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <img src={`${import.meta.env.BASE_URL}icon.png`} alt="Chip Society Logo" className="w-8 h-8 opacity-80" />
                <span className="font-display font-bold text-lg tracking-wider text-white/90">
                  CHIP SOCIETY
                </span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                The neon underground of Texas Hold'em. Premium poker experience with no real-money gambling.
              </p>
              <a href="mailto:realbobbyf@chipsocietyapp.com" className="inline-flex items-center gap-2 text-primary hover:text-shadow-neon-pink transition-all text-sm font-medium">
                <Mail className="w-4 h-4" />
                realbobbyf@chipsocietyapp.com
              </a>
            </div>
            
            <div>
              <h3 className="font-display text-white mb-4 tracking-wider text-sm">Support</h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Help Center</Link></li>
                <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-secondary transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-secondary transition-colors">Submit a Ticket</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-display text-white mb-4 tracking-wider text-sm">Legal & Safety</h3>
              <ul className="space-y-3">
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-accent transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-accent transition-colors">Privacy Policy</Link></li>
                <li><Link href="/community-guidelines" className="text-sm text-muted-foreground hover:text-accent transition-colors">Community Guidelines</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; 2026 Chip Society LLC. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="w-3 h-3 text-secondary" />
              <span>18+ (or 13+ with parental consent). Virtual chips only.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
