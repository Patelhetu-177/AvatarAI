// Common/Components/Dropdown.tsx

import React, {
  useState,
  createContext,
  useContext,
  ReactNode,
  ElementType,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Link from "next/link";
import { Transition } from "@headlessui/react";

interface DropdownContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOpen: () => void;
}

const DropDownContext = createContext<DropdownContextType | undefined>(
  undefined
);

interface DropdownProps {
  children?: ReactNode;
  as?: ElementType;
  className?: string;
}

const Dropdown = ({
  as: Component = "div",
  children,
  className,
}: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const toggleOpen = useCallback(() => {
    setOpen((previousState) => !previousState);
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (open && toggleOpen) {
          toggleOpen();
        }
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [open, toggleOpen]);

  return (
    <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
      <Component ref={dropdownRef} className={`dropdown ${className}`}>
        {children}
      </Component>
    </DropDownContext.Provider>
  );
};

interface TriggerProps {
  children: ReactNode;
  type?: "button" | "a";
  className?: string;
  id?: string;
  href?: string;
}

export const Trigger: React.FC<TriggerProps> = ({
  type,
  children,
  className,
  id,
  href,
}) => {
  const { open, toggleOpen } = useContext(DropDownContext)!;

  const getClassNameButton = className
    ? className
    : "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded";
  const getClassNameLink = className
    ? className
    : "transition-all duration-200 ease-linear bg-white border-dashed dropdown-toggle text-custom-500 btn border-custom-500 hover:text-custom-500 hover:bg-custom-50 hover:border-custom-600 focus:text-custom-600 focus:bg-custom-50 focus:border-custom-600 active:text-custom-600 active:bg-custom-50 active:border-custom-600 dark:focus:ring-custom-400/20 dark:bg-custom-400/20 ";

  return (
    <>
      {type === "a" ? (
        <Link
          id={id}
          href={href || "/#"}
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            toggleOpen();
          }}
          className={getClassNameLink + (open ? " show" : "")}
        >
          {children}
        </Link>
      ) : (
        <button id={id} onClick={toggleOpen} className={getClassNameButton}>
          {children}
        </button>
      )}
    </>
  );
};

interface ContentProps {
  as?: ElementType;
  align?: "left" | "right";
  className?: string;
  width?: string;
  contentClasses?: string;
  children: ReactNode;
  placement?:
    | "right-end"
    | "start-end"
    | "top-end"
    | "bottom-start"
    | "bottom-end"
    | "top-start";
}

const Content: React.FC<ContentProps> = ({
  as: Component = "div",
  className,
  children,
  placement,
}) => {
  const { open} = useContext(DropDownContext)!;

  const getClassName =
    className ||
    "absolute z-50 py-2 mt-1 text-left list-none bg-white rounded-md shadow-md dropdown-menu min-w-max dark:bg-zink-400";

  const [placementState, setPlacement] = useState(
    "right-end" as
      | "right-end"
      | "start-end"
      | "top-end"
      | "bottom-start"
      | "bottom-end"
      | "top-start"
  );

  useEffect(() => {
    if (placement) setPlacement(placement);
  }, [placement]);

  const dropdownElementRef = useRef<HTMLDivElement>(null);

  const isRtl =
    typeof document !== "undefined" &&
    document.getElementsByTagName("html")[0].getAttribute("dir");

  const getDropdownStyle = useCallback(() => {
    if (!dropdownElementRef.current || !open) return;

    const dropdownElement = dropdownElementRef.current;
    dropdownElement.style.position = "absolute";
    dropdownElement.style.margin = "0px";

    switch (placementState) {
      case "right-end":
        isRtl === "rtl"
          ? (dropdownElement.style.inset = "0px auto auto 0px")
          : (dropdownElement.style.inset = "0px 0px auto auto");
        dropdownElement.style.transform = "translate(0px, 54px)";
        break;
      case "start-end":
        dropdownElement.style.inset = "0px auto auto 0px";
        dropdownElement.style.transform = "translate(0px, 20px)";
        break;
      case "top-end":
        dropdownElement.style.inset = "auto 0px 0px auto";
        dropdownElement.style.transform = "translate(-58px, -30px)";
        break;
      case "bottom-start":
        dropdownElement.style.inset = "0px 0px auto auto";
        dropdownElement.style.transform = "translate(0px, 54px)";
        break;
      case "bottom-end":
        dropdownElement.style.inset = "0px 0px auto auto";
        dropdownElement.style.transform = "translate(0px, 39px)";
        break;
      case "top-start":
        dropdownElement.style.inset = "auto auto 0px 0px";
        dropdownElement.style.transform = "translate(0px, -95px)";
        break;
      default:
        break;
    }
  }, [open, placementState, isRtl]);

  useEffect(() => {
    getDropdownStyle();
  }, [getDropdownStyle]);

  return (
    <Transition
      as={React.Fragment}
      show={open}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      {() => (
        <Component
          ref={dropdownElementRef}
          className={`${getClassName} ${open ? " show" : ""}`}
        >
          {children}
        </Component>
      )}
    </Transition>
  );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;

export { Dropdown };
