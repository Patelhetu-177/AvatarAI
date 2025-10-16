import { APICallError } from "@ai-sdk/provider";

// Provide a narrow compatibility shim without using `any`.
// Some SDK versions expose `isInstance` while others expose `isAPICallError`.
type APICallErrorLike = {
  isAPICallError?: (v: unknown) => boolean;
  isInstance?: (v: unknown) => boolean;
};

const maybeAPICallError = APICallError as unknown as APICallErrorLike;

if (typeof maybeAPICallError.isAPICallError !== "function") {
  try {
    if (typeof maybeAPICallError.isInstance === "function") {
      maybeAPICallError.isAPICallError = maybeAPICallError.isInstance.bind(APICallError);
    } else {
      maybeAPICallError.isAPICallError = () => false;
    }
  } catch {
    maybeAPICallError.isAPICallError = () => false;
  }
}

export {};
