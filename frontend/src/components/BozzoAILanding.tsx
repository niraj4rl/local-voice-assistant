import React from "react";
import { SparklesCore } from "./ui/sparkles";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface BozzoAILandingProps {
  onGetStarted?: () => void;
}

export function BozzoAILanding({ onGetStarted }: BozzoAILandingProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="w-full bg-[#050505] overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Sparkles Background - All Over Page */}
        <div className="absolute inset-0 w-full h-full">
          <SparklesCore
            id="tsparticles-bg"
            background="transparent"
            minSize={0.5}
            maxSize={1.2}
            particleDensity={600}
            className="w-full h-full"
            particleColor="#3B82F6"
            speed={0.4}
          />
        </div>

        {/* Main Content */}
        <motion.div
          className="relative z-20 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Title - Centered */}
          <motion.h1
            variants={itemVariants}
            className="text-7xl md:text-8xl lg:text-9xl font-black text-white leading-tight"
          >
            BozzoAI
          </motion.h1>

          {/* Get Started Button - Below Title */}
          <motion.div
            variants={itemVariants}
            className="mt-6"
          >
            <button 
              onClick={onGetStarted}
              className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold uppercase tracking-wider rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-1 group text-sm mx-auto"
            >
              Get Started
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </motion.div>
        </motion.div>

        {/* Subtle Overlay */}
        <div className="absolute inset-0 bg-black opacity-20" />
      </div>
    </div>
  );
}
