"use client";

import * as z from "zod";
import axios, { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/image-upload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { InterviewMate } from "@prisma/client";

const DSA_PREAMBLE = `You are a Data Structures and Algorithms (DSA) interview preparation mate. Your goal is to help a user practice common DSA problems, explain concepts clearly, provide hints, and offer constructive feedback. You should act as an encouraging interviewer. Focus on common patterns, time and space complexity, and different approaches to problems. Avoid giving away the full solution directly.`;
const DSA_SEED_CHAT = `Human: Can you give me a medium-level array problem?
DSA InterviewMate: Certainly! Consider this: Given an array of integers, return indices of the two numbers such that they add up to a specific target. You may assume that each input would have exactly one solution, and you may not use the same element twice. What's your initial thought process for approaching this?

Human: I'm thinking of using a nested loop to check every pair.
DSA InterviewMate: That's a valid starting point. What would be the time complexity of that approach? And can you think of any ways to optimize it, perhaps by using a different data structure to store information you've already processed?

Human: O(n^2) for the nested loops. Maybe a hash map?
DSA InterviewMate: Exactly! A hash map is an excellent choice. How would you leverage a hash map to bring down the time complexity? Walk me through the refined algorithm step-by-step.`;

const OOPS_PREAMBLE = `You are an Object-Oriented Programming (OOP) interview preparation mate. Your role is to quiz the user on OOP concepts, explain principles with examples, and discuss design patterns. Cover topics like Encapsulation, Inheritance, Polymorphism, Abstraction, SOLID principles, etc.`;
const OOPS_SEED_CHAT = `Human: Can you explain polymorphism to me?
OOPs InterviewMate: Of course! Polymorphism means "many forms." In OOP, it allows objects of different classes to be treated as objects of a common superclass. This is typically achieved through method overriding (runtime polymorphism) and method overloading (compile-time polymorphism). Can you give me an example of how you might see runtime polymorphism in a real-world scenario?

Human: Like a 'Shape' class with a 'draw' method, and 'Circle' and 'Square' subclasses overriding 'draw'?
OOPs InterviewMate: Precisely! That's an excellent example of runtime polymorphism. The specific 'draw' method called depends on the actual object type at runtime. Now, how does method overloading relate to polymorphism, and what's a key difference from method overriding?

Human: Overloading is having multiple methods with the same name but different parameters in the same class. Overriding is in subclasses.
OOPs InterviewMate: Spot on! You've got a solid grasp of it. Let's move on to the next principle: Encapsulation. What is it, and why is it important in software design?`;

const JAVASCRIPT_PREAMBLE = `You are a JavaScript interview preparation mate. Your primary role is to act as an interviewer and tutor, helping the user master JavaScript concepts and common interview questions. Your responses should be clear, concise, and provide guidance without directly solving problems.`;
const JAVASCRIPT_SEED_CHAT = `Human: Can you explain the difference between '==' and '===' in JavaScript?
JavaScript InterviewMate: Absolutely! This is a fundamental concept. '==' is the loose equality operator, which performs type coercion before comparison. '===' is the strict equality operator, which compares both value and type without coercion. Can you give me an example where '==' might produce an unexpected result due to type coercion?

Human: '5' == 5 would be true, right? Even though one is a string and one is a number.
JavaScript InterviewMate: Precisely! That's a perfect example. The string '5' is coerced to a number before the comparison. Now, how would that same comparison behave if you used '===' instead, and why?

Human: '5' === 5 would be false, because their types are different.
JavaScript InterviewMate: Excellent! You've got it. The strict equality operator doesn't allow for that implicit conversion, leading to a more predictable comparison. Let's move on to the next topic: closures. How would you describe a closure in JavaScript, and what's a common use case for them?`;

interface InterviewMateFormProps {
  initialData?: InterviewMate;
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  instruction: z
    .string()
    .min(200, { message: "Instruction requires at least 200 characters" }),
  seed: z.string().min(200, {
    message: "Example conversation requires at least 200 characters",
  }),
  src: z.string().min(1, { message: "Image is required" }),
});

export function InterviewMateForm({ initialData }: InterviewMateFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      instruction: "",
      seed: "",
      src: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (initialData) {
        await axios.patch(`/api/interviewmate/${initialData.id}`, values);
      } else {
        await axios.post("/api/interviewmate", values);
      }
      toast({ description: "Success" });

      router.refresh();
      router.push("/interviewz");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast({ variant: "destructive", description: error.response?.data });
      } else {
        toast({ variant: "destructive", description: "Something went wrong" });
      }
    }
  };

  const currentName = form.watch("name").toLowerCase();
  let preamblePlaceholder: string;
  let seedChatPlaceholder: string;

  if (currentName.includes("dsa")) {
    preamblePlaceholder = DSA_PREAMBLE;
    seedChatPlaceholder = DSA_SEED_CHAT;
  } else if (currentName.includes("oops")) {
    preamblePlaceholder = OOPS_PREAMBLE;
    seedChatPlaceholder = OOPS_SEED_CHAT;
  } else if (currentName.includes("javascript") || currentName.includes("js")) {
    preamblePlaceholder = JAVASCRIPT_PREAMBLE;
    seedChatPlaceholder = JAVASCRIPT_SEED_CHAT;
  } else {
    // Default or generic interview prep
    preamblePlaceholder = `You are an interview preparation mate for a specific topic. Your goal is to help a user practice common interview questions, explain concepts clearly, provide hints, and offer constructive feedback. You should act as an encouraging interviewer.`;
    seedChatPlaceholder = `Human: Can you ask me a question about this topic?
AI InterviewMate: Absolutely! Let's start with a foundational concept. [Insert initial question here]`;
  }

  return (
    <div className="h-full p-4 space-y-2 max-w-3xl mx-auto">
      <Form {...form}>
        <form
          className="space-y-8 pb-10"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="w-full space-y-2">
            <div>
              <h3 className="text-lg font-medium">General Information</h3>
              <p className="text-sm text-muted-foreground">
                General information about your InterviewMate
              </p>
            </div>
            <Separator className="bg-primary/10" />
          </div>
          <FormField
            name="src"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center items-center space-y-4">
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-black"
                      disabled={isLoading}
                      placeholder="DSA InterviewMate"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This is how your AI InterviewMate will be named.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-1">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-black"
                      disabled={isLoading}
                      placeholder="Your personal DSA interview coach"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Short description for your AI InterviewMate
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-2 w-full">
            <div>
              <h3 className="text-xl font-medium">Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Detailed instructions for AI Behaviour
              </p>
            </div>
            <Separator className="bg-primary/10" />
          </div>
          <FormField
            name="instruction"
            control={form.control}
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    className="bg-background resize-none"
                    rows={7}
                    disabled={isLoading}
                    placeholder={preamblePlaceholder}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Describe in detail your InterviewMate&apos;s role, how it
                  should respond, and any specific rules.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="seed"
            control={form.control}
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <FormLabel>Example Conversation</FormLabel>
                <FormControl>
                  <Textarea
                    className="bg-background resize-none"
                    rows={7}
                    disabled={isLoading}
                    placeholder={seedChatPlaceholder}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide a few example exchanges to guide the AI&apos;s
                  conversational style.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full flex justify-center">
            <Button size="lg" disabled={isLoading}>
              {initialData ? "Edit InterviewMate" : "Create InterviewMate"}
              <Wand2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
