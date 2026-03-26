"use client";

import { PricingTable } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Zap, Shield, Globe, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Fast & Powerful",
    description: "Lightning-fast AI tools designed for real productivity.",
  },
  {
    icon: Shield,
    title: "Secure",
    description: "Your data is encrypted and protected at every step.",
  },
  {
    icon: Globe,
    title: "Scalable",
    description: "Built for individuals, teams, and enterprises.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-24 pb-16 px-4">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-lg md:text-7xl text-center font-sans font-bold mb-8 text-black dark:text-white">
          <Button onClick={() => router.back()} size="icon" variant="ghost">
            <ChevronLeft className="h-12 w-12" />
          </Button>
          Pricing
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-6 text-gray-700 dark:text-gray-300 text-lg md:text-xl max-w-xl mx-auto"
        >
          Start free. Upgrade when you&apos;re ready. No hidden costs.
        </motion.p>
      </div>

      {/* Pricing Table */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="max-w-5xl mx-auto relative"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 dark:opacity-30 group-hover:opacity-40 transition duration-1000"></div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative bg-white dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-10 shadow-xl dark:shadow-2xl"
        >
          <PricingTable />
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="max-w-4xl mx-auto mt-20 grid md:grid-cols-3 gap-6"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 + index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-6 rounded-xl bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl dark:hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer group"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <feature.icon className="w-8 h-8 mx-auto mb-4 text-purple-500 dark:text-purple-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="text-center text-gray-500 dark:text-gray-400 text-sm mt-16"
      >
        No credit card required · Cancel anytime
      </motion.p>
    </div>
  );
}
