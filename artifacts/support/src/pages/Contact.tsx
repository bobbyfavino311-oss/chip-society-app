import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle2, Mail, MessageSquare } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(1, "Please select a subject."),
  message: z.string().min(10, "Message must be at least 10 characters.")
});

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: ""
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Simulate network request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  }

  return (
    <div className="flex-1 w-full bg-background pt-12 pb-24 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(255,0,144,0.1),_transparent_50%)] pointer-events-none" />
      
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          
          {/* Info Side */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-display font-bold text-white mb-4 text-shadow-neon-pink">
              SUBMIT A TICKET
            </h1>
            <p className="text-muted-foreground mb-8">
              Experiencing an issue at the tables? Fill out the form and our support team will get back to you as soon as possible.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center shrink-0 box-shadow-neon-blue">
                  <Mail className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Email Us Directly</h3>
                  <a href="mailto:support@chipsociety.app" className="text-secondary hover:text-shadow-neon-blue transition-all">
                    support@chipsociety.app
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center shrink-0 box-shadow-neon-pink">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Response Time</h3>
                  <p className="text-muted-foreground text-sm">
                    We aim to respond to all inquiries within 24-48 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-3">
            <div className="bg-card/50 backdrop-blur-sm border border-white/10 p-8 rounded-xl relative">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle2 className="w-20 h-20 text-secondary mx-auto mb-6 drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]" />
                  <h2 className="text-2xl font-display text-white mb-3">TICKET SUBMITTED</h2>
                  <p className="text-muted-foreground mb-8">
                    Your request has been received. Our team will review your message and reach out via email shortly.
                  </p>
                  <Button 
                    onClick={() => {
                      setIsSuccess(false);
                      form.reset();
                    }}
                    className="bg-transparent border border-secondary text-secondary hover:bg-secondary hover:text-black box-shadow-neon-blue font-bold tracking-widest"
                  >
                    SUBMIT ANOTHER
                  </Button>
                </motion.div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">Username / Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your name" className="bg-background border-white/20 focus-visible:ring-primary text-white placeholder:text-white/30" {...field} />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="your@email.com" className="bg-background border-white/20 focus-visible:ring-primary text-white placeholder:text-white/30" {...field} />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Subject</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-white/20 focus:ring-primary text-white">
                                <SelectValue placeholder="Select an issue type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-white/20 text-white">
                              <SelectItem value="Billing">Billing & Purchases</SelectItem>
                              <SelectItem value="Bug Report">Bug Report</SelectItem>
                              <SelectItem value="Account Issue">Account Issue</SelectItem>
                              <SelectItem value="Gameplay Question">Gameplay Question</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please describe your issue in detail..." 
                              className="min-h-[150px] bg-background border-white/20 focus-visible:ring-primary text-white placeholder:text-white/30" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-white text-white hover:text-primary font-bold tracking-widest box-shadow-neon-pink transition-all h-12"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          TRANSMITTING...
                        </>
                      ) : (
                        "SEND MESSAGE"
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
