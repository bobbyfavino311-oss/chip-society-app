import { ShieldAlert, Users, MessageSquareOff, Ban } from "lucide-react";

export default function CommunityGuidelines() {
  return (
    <div className="flex-1 w-full bg-background pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 text-shadow-neon-blue">
            COMMUNITY GUIDELINES
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Chip Society is a place for competitive, high-stakes fun. We expect all players to treat the tables with respect.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-card border border-white/10 p-8 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MessageSquareOff className="w-24 h-24 text-white" />
            </div>
            <h2 className="text-2xl font-display text-white mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-primary box-shadow-neon-pink inline-block" />
              Zero Tolerance for Hate
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Hate speech, discrimination, racism, sexism, and targeted harassment have absolutely no place in Chip Society. Any player found using the chat or usernames to spread hate will face immediate and permanent bans without warning.
            </p>
          </div>

          <div className="bg-card border border-white/10 p-8 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Ban className="w-24 h-24 text-white" />
            </div>
            <h2 className="text-2xl font-display text-white mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-secondary box-shadow-neon-blue inline-block" />
              No Cheating or Collusion
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Chip dumping, table collusion, botting, or exploiting bugs ruins the game for everyone. Our systems actively monitor for suspicious betting patterns. Cheaters will have their accounts wiped and permanently banned.
            </p>
          </div>

          <div className="bg-card border border-white/10 p-8 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-24 h-24 text-white" />
            </div>
            <h2 className="text-2xl font-display text-white mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_rgba(191,95,255,0.6)] inline-block" />
              Sportsmanship
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Poker is a game of skill and variance. Keep the table talk civil. Trash talk is part of the game, but excessive hostility, spamming the chat, or berating dealers/players crosses the line into harassment.
            </p>
          </div>

          <div className="bg-card border border-white/10 p-8 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldAlert className="w-24 h-24 text-white" />
            </div>
            <h2 className="text-2xl font-display text-white mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)] inline-block" />
              Reporting Abuse
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you encounter players violating these guidelines, use the in-game Report button located on their player profile. We review all reports and take necessary action to keep the tables clean.
            </p>
          </div>
        </div>

        <div className="bg-black/40 border border-destructive/30 p-8 rounded-xl text-center">
          <h3 className="text-xl font-bold text-destructive mb-3">Enforcement</h3>
          <p className="text-muted-foreground">
            Violations of these guidelines may result in chat mutes, temporary suspensions, or permanent account bans at the sole discretion of the Chip Society moderation team. Virtual chips are forfeit upon a permanent ban.
          </p>
        </div>
      </div>
    </div>
  );
}
