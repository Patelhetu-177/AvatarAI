import { useToast as useRadixToast } from "@/hooks/use-toast"
;
export function useToast() {
  const { toast: radixToast } = useRadixToast()

  const toast = ({
    title,
    description,
    variant = "default",
  }: {
    title: string
    description?: string
    variant?: "default" | "destructive"
  }) => {
    radixToast({
      title,
      description,
      variant,
    })
  }

  return { toast }
}
