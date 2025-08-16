"use client";

import React from "react";
import { HeroSection } from "@/components/HeroSection";
import { CardsSection } from "@/components/CardsSection";
import Footer from "@/components/Footer";

export default function RootPage() {
  return (
    <div className="h-full p-1  space-y-2">
      <HeroSection />
      <CardsSection />
      <Footer/>
    </div>
  );
}
