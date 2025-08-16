"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormField from "./FormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  userName: string;
  userId?: string;
  email?: string;
}

const interviewSchema = z.object({
  role: z.string().min(1, "Role is required"),
  level: z.enum(["Junior", "Mid", "Senior"]),
  techstack: z.string().min(1, "Tech stack is required"),
  type: z.enum(["Technical", "Behavioral", "Mixed"]),
  amount: z.coerce.number().min(1).max(20),
});

export default function InterviewForm({ userName, userId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof interviewSchema>>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      role: "",
      level: "Junior",
      techstack: "React,TypeScript",
      type: "Mixed",
      amount: 5,
    },
  });

  const onSubmit = async (values: z.infer<typeof interviewSchema>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/interviews/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create interview");

      router.push(`/skillwise/interview/${data.id}`);
    } catch (err: unknown) {
      console.error(err);

      let errorMessage = "An unknown error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        errorMessage = String((err as { message: unknown }).message);
      }

      form.setError("role", { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-gradient p-0.5 m-5 rounded-2xl w-fit lg:min-w-[566px] mx-auto">
      <div className="flex flex-col gap-6 card py-10 px-8">
        <h2 className="text-xl font-bold text-center animate-fadeIn transition-opacity duration-500">
          Create Interview
        </h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-4"
          >
            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              label="Role"
              placeholder="Frontend Developer"
              type="text"
            />

            {/* Level */}
            <FormField
              control={form.control}
              name="level"
              label="Level"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value as string}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Mid">Mid</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {/* Tech stack */}
            <FormField
              control={form.control}
              name="techstack"
              label="Tech stack (comma separated)"
              placeholder="React, TypeScript"
              type="text"
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              label="Interview Type"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value as string}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              label="Number of questions"
              type="number"
              placeholder="5"
              min={1}
              max={20}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : `Create interview for ${userName}`}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
