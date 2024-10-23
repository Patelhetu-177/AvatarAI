"use client";

import React from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { useForm, ValidationError } from "@formspree/react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function ContactUs() {
  const [state, handleSubmit] = useForm("mldedjrp");

  const router = useRouter();

  if (state.succeeded) {
    return (
      <p
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          color: "#ff5733", // A vibrant orange-red color
          textAlign: "center",
        }}
      >
        Thanks for reaching out! I’ll get back to you soon.
      </p>
    );
  }

  return (
    <div className="min-h-screen background-secondary py-12 pt-36 relative">
      <BackgroundBeams className="absolute top-0 left-0 w-full h-full z-0" />
      <div className="max-w-2xl mx-auto p-4 relative z-10">
        <h1 className="text-lg md:text-7xl text-center font-sans font-bold mb-8 text-white">
          <Button onClick={() => router.back()} size="icon" variant="ghost">
            <ChevronLeft className="h-12 w-12" />
          </Button>
          Contact Us
        </h1>
        <p className="text-neutral-500 max-w-lg mx-auto my-2 text-sm text-center">
          I&apos;d love to hear from you! Whether you have questions, feedback,
          or need support, feel free to reach out using the form below.I am here
          to assist you and will get back to you as soon as possible.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Your email address"
            className="rounded-lg border text-white border-neutral-800 focus:ring-2 focus:ring-teal-500 w-full p-4 bg-neutral-950 placeholder:text-neutral-700"
            required
          />
          <ValidationError prefix="Email" field="email" errors={state.errors} />
          <textarea
            id="message"
            name="message"
            placeholder="your message"
            className="rounded-lg border text-white border-neutral-800 focus:ring-2 focus:ring-teal-500 w-full p-4 bg-neutral-950 placeholder:text-neutral-700"
            rows={5}
            required
          />
          <ValidationError
            prefix="Message"
            field="message"
            errors={state.errors}
          />
          <button
            type="submit"
            disabled={state.submitting}
            className="px-6 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default ContactUs;
