import { Controller, Control, FieldValues, Path, ControllerRenderProps, ControllerFieldState, UseFormStateReturn } from "react-hook-form";
import { ReactElement } from "react";

import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// The corrected type for the render prop, matching the Controller's signature
type CustomRenderProps<T extends FieldValues> = {
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn<T>;
};

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number";
  render?: (props: CustomRenderProps<T>) => ReactElement; // Now correctly returns a ReactElement
  min?: number;
  max?: number;
}

const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  render,
  min,
  max,
}: FormFieldProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={(props) => {
        // Render the custom prop if it's provided, otherwise render the default Input.
        if (render) {
          return render(props);
        }

        return (
          <FormItem>
            <FormLabel className="label">{label}</FormLabel>
            <FormControl>
              <Input
                className="input"
                type={type}
                placeholder={placeholder}
                {...props.field}
                min={min}
                max={max}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default FormField;
