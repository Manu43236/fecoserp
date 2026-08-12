// Standard form pattern for FECOS — React Hook Form + Zod
// Usage in every feature form:
//
// const schema = z.object({ field: z.string().min(1, 'Required') })
// type FormData = z.infer<typeof schema>
//
// const { register, handleSubmit, formState: { errors } } = useFecoForm(schema)
//
// <Input label="Field" {...register('field')} error={errors.field?.message} />

import { useForm, type UseFormProps, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// ponytail: eslint-disable-next-line @typescript-eslint/no-explicit-any — zod v4 / RHF resolver type mismatch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFecoForm<T extends FieldValues>(schema: any, options?: Omit<UseFormProps<T>, 'resolver'>) {
  return useForm<T>({ resolver: zodResolver(schema), ...options })
}
