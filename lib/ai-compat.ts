import { APICallError } from "@ai-sdk/provider";

if (!(APICallError as any).isAPICallError) {
  try {
    if ((APICallError as any).isInstance) {
      (APICallError as any).isAPICallError = (APICallError as any).isInstance.bind(APICallError);
    } else {
      (APICallError as any).isAPICallError = (err: unknown) => false;
    }
  } catch {
    (APICallError as any).isAPICallError = (err: unknown) => false;
  }
}

export {};
