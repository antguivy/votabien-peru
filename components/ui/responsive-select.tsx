"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Check, ChevronDown } from "lucide-react";

interface ResponsiveSelectContextValue {
  isMobile: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  title?: string;
  getLabel: (val?: string) => React.ReactNode;
  registerItem: (value: string, node: React.ReactNode) => void;
}

const ResponsiveSelectContext =
  React.createContext<ResponsiveSelectContextValue | null>(null);

function useResponsiveSelect() {
  const ctx = React.useContext(ResponsiveSelectContext);
  if (!ctx) {
    throw new Error(
      "ResponsiveSelect subcomponents must be rendered within ResponsiveSelect",
    );
  }
  return ctx;
}

function extractItemsFromChildren(
  children: React.ReactNode,
  itemsMap: Map<string, React.ReactNode>,
) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const props = child.props as Record<string, unknown> | undefined;
    if (props && props.value !== undefined && props.value !== null) {
      itemsMap.set(String(props.value), props.children as React.ReactNode);
    }

    if (props && props.children) {
      extractItemsFromChildren(props.children as React.ReactNode, itemsMap);
    }
  });
}

export interface ResponsiveSelectProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  title?: string;
  name?: string;
}

export function ResponsiveSelect({
  children,
  value: controlledValue,
  defaultValue,
  onValueChange,
  open: controlledOpen,
  onOpenChange,
  disabled,
  title,
  name,
}: ResponsiveSelectProps) {
  const isMobile = useIsMobile();
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(
    defaultValue || "",
  );
  const [uncontrolledOpen, setUncontrolledOpen] =
    React.useState<boolean>(false);
  const [dynamicLabels, setDynamicLabels] = React.useState<
    Map<string, React.ReactNode>
  >(() => new Map());

  const isValueControlled = controlledValue !== undefined;
  const value = isValueControlled ? controlledValue : uncontrolledValue;

  const isOpenControlled = controlledOpen !== undefined;
  const open = isOpenControlled ? controlledOpen : uncontrolledOpen;

  // Extrae de forma sincrónica todas las opciones declaradas en el árbol JSX
  const staticLabels = React.useMemo(() => {
    const map = new Map<string, React.ReactNode>();
    extractItemsFromChildren(children, map);
    return map;
  }, [children]);

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isValueControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isValueControlled, onValueChange],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isOpenControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isOpenControlled, onOpenChange],
  );

  const registerItem = React.useCallback(
    (itemVal: string, node: React.ReactNode) => {
      setDynamicLabels((prev) => {
        if (prev.get(itemVal) === node) return prev;
        const next = new Map(prev);
        next.set(itemVal, node);
        return next;
      });
    },
    [],
  );

  const getLabel = React.useCallback(
    (val?: string) => {
      if (!val) return null;
      return dynamicLabels.get(val) || staticLabels.get(val) || null;
    },
    [dynamicLabels, staticLabels],
  );

  const contextValue = React.useMemo<ResponsiveSelectContextValue>(
    () => ({
      isMobile,
      open,
      setOpen: handleOpenChange,
      value,
      onValueChange: handleValueChange,
      title,
      getLabel,
      registerItem,
    }),
    [
      isMobile,
      open,
      handleOpenChange,
      value,
      handleValueChange,
      title,
      getLabel,
      registerItem,
    ],
  );

  if (isMobile) {
    return (
      <ResponsiveSelectContext.Provider value={contextValue}>
        <Drawer open={open} onOpenChange={handleOpenChange}>
          {children}
        </Drawer>
      </ResponsiveSelectContext.Provider>
    );
  }

  return (
    <ResponsiveSelectContext.Provider value={contextValue}>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        open={open}
        onOpenChange={handleOpenChange}
        disabled={disabled}
        name={name}
      >
        {children}
      </Select>
    </ResponsiveSelectContext.Provider>
  );
}

export interface ResponsiveSelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "default";
}

export function ResponsiveSelectTrigger({
  className,
  size = "default",
  children,
  disabled,
  ...props
}: ResponsiveSelectTriggerProps) {
  const { isMobile, setOpen } = useResponsiveSelect();

  if (!isMobile) {
    return (
      <SelectTrigger
        className={className}
        size={size}
        disabled={disabled}
        {...props}
      >
        {children}
      </SelectTrigger>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      disabled={disabled}
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9 data-[size=sm]:h-8",
        className,
      )}
      {...props}
    >
      <div className="flex-1 text-left truncate flex items-center gap-2 min-w-0">
        {children}
      </div>
      <ChevronDown className="size-4 opacity-50 shrink-0" />
    </button>
  );
}

export function ResponsiveSelectValue({
  placeholder,
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectValue>) {
  const { isMobile, value, getLabel } = useResponsiveSelect();

  if (!isMobile) {
    return (
      <SelectValue placeholder={placeholder} className={className} {...props}>
        {children}
      </SelectValue>
    );
  }

  const selectedContent = value ? getLabel(value) : null;

  if (selectedContent) {
    return (
      <span className={cn("truncate flex items-center gap-1.5", className)}>
        {selectedContent}
      </span>
    );
  }

  return (
    <span className={cn("text-muted-foreground truncate", className)}>
      {placeholder || children || ""}
    </span>
  );
}

export interface ResponsiveSelectContentProps {
  className?: string;
  children: React.ReactNode;
  title?: string;
}

export function ResponsiveSelectContent({
  className,
  children,
  title: customTitle,
  ...props
}: ResponsiveSelectContentProps) {
  const { isMobile, title: contextTitle } = useResponsiveSelect();
  const displayTitle = customTitle || contextTitle || "Seleccionar opción";

  if (!isMobile) {
    return (
      <SelectContent className={className} {...props}>
        {children}
      </SelectContent>
    );
  }

  return (
    <DrawerContent
      noScroll
      className="max-h-[85vh] flex flex-col p-0 rounded-t-2xl"
    >
      <DrawerHeader className="px-4 py-3 border-b bg-muted/20 shrink-0 text-left">
        <DrawerTitle className="text-sm sm:text-base font-bold text-foreground">
          {displayTitle}
        </DrawerTitle>
      </DrawerHeader>
      <div className="overflow-y-auto p-2 space-y-1 max-h-[65vh] flex-1 min-h-0 divide-y divide-border/20">
        {children}
      </div>
    </DrawerContent>
  );
}

export interface ResponsiveSelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ResponsiveSelectItem({
  value,
  children,
  className,
  disabled,
  ...props
}: ResponsiveSelectItemProps) {
  const {
    isMobile,
    value: currentValue,
    onValueChange,
    setOpen,
    registerItem,
  } = useResponsiveSelect();

  React.useEffect(() => {
    registerItem(value, children);
  }, [value, children, registerItem]);

  if (!isMobile) {
    return (
      <SelectItem
        value={value}
        className={className}
        disabled={disabled}
        {...props}
      >
        {children}
      </SelectItem>
    );
  }

  const isSelected = currentValue === value;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onValueChange?.(value);
          setOpen(false);
        }
      }}
      className={cn(
        "relative flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-medium transition-colors text-left min-h-[44px]",
        isSelected
          ? "bg-primary/10 text-primary font-bold shadow-2xs"
          : "hover:bg-muted/60 text-foreground active:bg-muted",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">{children}</div>
      {isSelected && <Check className="size-4 text-primary shrink-0 ml-2" />}
    </button>
  );
}

export function ResponsiveSelectGroup({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isMobile } = useResponsiveSelect();

  if (!isMobile) {
    return (
      <SelectGroup className={className} {...props}>
        {children}
      </SelectGroup>
    );
  }

  return <div className={cn("space-y-1 py-1", className)}>{children}</div>;
}

export function ResponsiveSelectLabel({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isMobile } = useResponsiveSelect();

  if (!isMobile) {
    return (
      <SelectLabel className={className} {...props}>
        {children}
      </SelectLabel>
    );
  }

  return (
    <div
      className={cn(
        "text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ResponsiveSelectSeparator({
  className,
  ...props
}: {
  className?: string;
}) {
  const { isMobile } = useResponsiveSelect();

  if (!isMobile) {
    return <SelectSeparator className={className} {...props} />;
  }

  return <div className={cn("h-px bg-border my-1", className)} />;
}
