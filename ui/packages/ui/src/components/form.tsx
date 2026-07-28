"use client"

import * as React from "react"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"

const Form = FormProvider

type FormFieldContextValue = { name: string }
const FormFieldContext = React.createContext<FormFieldContextValue>({
  name: "",
})

function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  const contextValue = React.useMemo(() => ({ name: props.name }), [props.name])
  return (
    <FormFieldContext.Provider value={contextValue}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const FormItemContext = React.createContext<{ id: string }>({ id: "" })

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()
  const contextValue = React.useMemo(() => ({ id }), [id])
  return (
    <FormItemContext.Provider value={contextValue}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()
  const fieldState = getFieldState(fieldContext.name, formState)
  return {
    ...fieldState,
    formItemId: `${itemContext.id}-form-item`,
    formMessageId: `${itemContext.id}-form-message`,
  }
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()
  return (
    <Label
      data-slot="form-label"
      data-error={Boolean(error)}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({
  children,
}: {
  children: React.ReactElement<React.ComponentProps<"input">>
}) {
  const { error, formItemId, formMessageId } = useFormField()
  return React.cloneElement(children, {
    id: formItemId,
    "aria-describedby": error ? formMessageId : undefined,
    "aria-invalid": Boolean(error),
  })
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error.message ?? "Invalid value") : props.children
  if (!body) return null
  return (
    <p
      id={formMessageId}
      data-slot="form-message"
      className={cn("text-xs font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export { Form, FormControl, FormField, FormItem, FormLabel, FormMessage }
