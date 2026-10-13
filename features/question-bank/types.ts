export type ActionState = {
  error: string;
  success: string;
};

export type MutationConfig<T> = {
  operation: string;
  success: string;
  failure: string;
  parse: (formData: FormData) => T;
  mutate: (data: T) => Promise<void>;
};
