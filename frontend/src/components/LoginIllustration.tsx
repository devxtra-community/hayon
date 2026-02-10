"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Bot, Monitor, Send, Smartphone, Database, Cpu } from "lucide-react";

const LoginIllustration = () => {
  return (
    <div className="relative w-full max-w-[640px] aspect-square flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-zinc-100 dark:border-zinc-800">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.05)_0%,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(20,184,166,0.05)_0%,transparent_50%)]" />
      </div>

      <div className="relative w-full h-full p-12 flex flex-col items-center justify-center">
        {/* Workspace Area */}
        <div className="relative z-10 w-full aspect-video bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/30 shadow-inner flex items-center justify-center overflow-hidden">
          {/* Main Monitor */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-3/4 aspect-[16/10] bg-white dark:bg-zinc-950 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-3 relative"
          >
            {/* Screen Content */}
            <div className="w-full h-full bg-zinc-50 dark:bg-zinc-900 rounded-lg overflow-hidden relative">
              {/* Top Bar */}
              <div className="h-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-2 gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              {/* Interface Mockup */}
              <div className="p-3 space-y-3">
                <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-white dark:bg-zinc-800 rounded-md border border-zinc-100 dark:border-zinc-700 flex items-center justify-center"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-500/50" />
                    </div>
                  ))}
                </div>
                <div className="h-10 w-full bg-emerald-50 content-[''] dark:bg-emerald-900/20 rounded-md border border-emerald-100 dark:border-emerald-800/30" />
              </div>

              {/* AI Assistant Bubble */}
              <motion.div
                animate={{ x: [0, 5, 0], y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-4 right-4 bg-emerald-600 text-white p-2 rounded-xl rounded-br-none shadow-lg flex items-center gap-2"
              >
                <Bot className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">AI Active</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Floating Icons */}
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-10 p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-700"
          >
            <Send className="w-6 h-6 text-emerald-600" />
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-10 left-10 p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-700"
          >
            <Smartphone className="w-6 h-6 text-teal-600" />
          </motion.div>
        </div>

        {/* Floating Server/Data Elements */}
        <div className="mt-12 flex gap-6 w-full max-w-sm">
          {[
            { icon: Database, label: "Analytics", color: "text-blue-500" },
            { icon: Cpu, label: "AI Engine", color: "text-emerald-500" },
            { icon: Monitor, label: "Multi-Platform", color: "text-purple-500" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/30 text-center space-y-2"
            >
              <item.icon className={`w-6 h-6 mx-auto ${item.color}`} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Branding/Footer */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-center w-full">
          <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-1">
            Empowering Humanity through AI
          </h3>
          <p className="text-sm font-medium text-emerald-600 uppercase tracking-[0.2em]">
            Social Automation Suite
          </p>
        </div>
      </div>

      {/* Background Shapes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] border border-emerald-500/10 rounded-full pointer-events-none"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] border border-teal-500/10 rounded-full pointer-events-none"
      />
    </div>
  );
};

export default LoginIllustration;
