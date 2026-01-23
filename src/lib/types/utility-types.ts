/**
 * Utility Types
 * OpenInfo Platform
 *
 * Advanced TypeScript utility types for better developer experience.
 */

// ============================================
// BASIC UTILITIES
// ============================================

/**
 * Make all properties in T optional recursively
 * @example
 * type DeepPartialUser = DeepPartial<User>
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

/**
 * Make all properties in T required recursively
 * @example
 * type RequiredUser = DeepRequired<PartialUser>
 */
export type DeepRequired<T> = T extends object
  ? { [P in keyof T]-?: DeepRequired<T[P]> }
  : T

/**
 * Make all properties in T readonly recursively
 * @example
 * type ImmutableUser = DeepReadonly<User>
 */
export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T

/**
 * Make specific properties of T optional
 * @example
 * type UserWithOptionalEmail = PartialBy<User, 'email'>
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specific properties of T required
 * @example
 * type UserWithRequiredId = RequiredBy<PartialUser, 'id'>
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Make specific properties of T nullable
 * @example
 * type UserWithNullableAvatar = Nullable<User, 'avatarUrl'>
 */
export type Nullable<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null
}

// ============================================
// OBJECT UTILITIES
// ============================================

/**
 * Get keys of T that are of a specific type
 * @example
 * type StringKeys = KeysOfType<User, string> // 'name' | 'email'
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never
}[keyof T]

/**
 * Pick properties from T that are of a specific type
 * @example
 * type StringProps = PickByType<User, string>
 */
export type PickByType<T, V> = Pick<T, KeysOfType<T, V>>

/**
 * Omit properties from T that are of a specific type
 * @example
 * type NonStringProps = OmitByType<User, string>
 */
export type OmitByType<T, V> = Omit<T, KeysOfType<T, V>>

/**
 * Get all possible paths of an object type
 * @example
 * type UserPaths = ObjectPaths<User> // 'name' | 'address.street' | 'address.city'
 */
export type ObjectPaths<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? ObjectPaths<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
        : `${Prefix}${K}`
    }[keyof T & string]
  : never

/**
 * Get the type at a specific path
 * @example
 * type CityType = PathValue<User, 'address.city'> // string
 */
export type PathValue<
  T,
  P extends string,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never

// ============================================
// FUNCTION UTILITIES
// ============================================

/**
 * Get the parameters of a function as a tuple
 */
export type Parameters<T extends (...args: unknown[]) => unknown> = T extends (
  ...args: infer P
) => unknown
  ? P
  : never

/**
 * Get the return type of a function
 */
export type ReturnType<T extends (...args: unknown[]) => unknown> = T extends (
  ...args: unknown[]
) => infer R
  ? R
  : never

/**
 * Get the return type of an async function
 * @example
 * type UserData = AsyncReturnType<typeof fetchUser> // User
 */
export type AsyncReturnType<T extends (...args: unknown[]) => Promise<unknown>> =
  T extends (...args: unknown[]) => Promise<infer R> ? R : never

/**
 * Make a function's return type a Promise
 */
export type Promisify<T extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<T>
) => Promise<ReturnType<T>>

// ============================================
// ARRAY UTILITIES
// ============================================

/**
 * Get the element type of an array
 * @example
 * type User = ArrayElement<User[]> // User
 */
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never

/**
 * Convert a tuple type to a union type
 * @example
 * type Status = TupleToUnion<['active', 'inactive']> // 'active' | 'inactive'
 */
export type TupleToUnion<T extends readonly unknown[]> = T[number]

/**
 * Create a tuple type from a length and element type
 * @example
 * type Triple = Tuple<number, 3> // [number, number, number]
 */
export type Tuple<T, N extends number, R extends T[] = []> = R['length'] extends N
  ? R
  : Tuple<T, N, [T, ...R]>

/**
 * Get the first element type of an array/tuple
 */
export type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never

/**
 * Get all but the first element of an array/tuple
 */
export type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never

/**
 * Get the last element type of an array/tuple
 */
export type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Uppercase the first character of a string literal
 * @example
 * type Capitalized = Capitalize<'hello'> // 'Hello'
 */
export type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S

/**
 * Lowercase the first character of a string literal
 * @example
 * type Uncapitalized = Uncapitalize<'Hello'> // 'hello'
 */
export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Lowercase<F>}${R}`
  : S

/**
 * Convert a string literal to camelCase
 * @example
 * type Camel = CamelCase<'hello_world'> // 'helloWorld'
 */
export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}`
  ? `${Lowercase<P1>}${Capitalize<CamelCase<P2>>}`
  : S extends `${infer P1}-${infer P2}`
  ? `${Lowercase<P1>}${Capitalize<CamelCase<P2>>}`
  : Lowercase<S>

/**
 * Convert a string literal to snake_case
 * @example
 * type Snake = SnakeCase<'helloWorld'> // 'hello_world'
 */
export type SnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${SnakeCase<U>}`
  : S

// ============================================
// CONDITIONAL UTILITIES
// ============================================

/**
 * Check if two types are exactly equal
 */
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false

/**
 * If condition, then A, else B
 */
export type If<C extends boolean, A, B> = C extends true ? A : B

/**
 * Check if a type is never
 */
export type IsNever<T> = [T] extends [never] ? true : false

/**
 * Check if a type is any
 */
export type IsAny<T> = 0 extends 1 & T ? true : false

/**
 * Check if a type is unknown
 */
export type IsUnknown<T> = unknown extends T
  ? IsAny<T> extends true
    ? false
    : true
  : false

// ============================================
// UNION UTILITIES
// ============================================

/**
 * Convert a union type to an intersection type
 * @example
 * type Intersected = UnionToIntersection<{a: 1} | {b: 2}> // {a: 1} & {b: 2}
 */
export type UnionToIntersection<U> = (
  U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never

/**
 * Get the last member of a union type
 */
export type LastInUnion<U> = UnionToIntersection<
  U extends unknown ? (x: U) => void : never
> extends (x: infer L) => void
  ? L
  : never

/**
 * Exclude null and undefined from a type
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * Extract common properties from union members
 */
export type CommonProperties<T> = Pick<T, keyof T>

// ============================================
// API/DATA UTILITIES
// ============================================

/**
 * Type for API response with data
 */
export type ApiResponse<T> = {
  data: T
  error: null
  status: 'success'
} | {
  data: null
  error: string
  status: 'error'
}

/**
 * Type for paginated API response
 */
export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * Type for entity with timestamps
 */
export type WithTimestamps<T> = T & {
  createdAt: string
  updatedAt: string
}

/**
 * Type for entity with soft delete
 */
export type WithSoftDelete<T> = T & {
  deletedAt: string | null
}

/**
 * Type for creating a new entity (without id and timestamps)
 */
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Type for updating an entity (all fields optional except id)
 */
export type UpdateInput<T extends { id: string }> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> & { id: string }

// ============================================
// REACT UTILITIES
// ============================================

/**
 * Props with children
 */
export type PropsWithChildren<P = object> = P & { children?: React.ReactNode }

/**
 * Props with className
 */
export type PropsWithClassName<P = object> = P & { className?: string }

/**
 * Extract props type from a React component
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never

/**
 * Ref type for a React element
 */
export type ElementRef<T extends React.ElementType> = React.ComponentRef<T>

// ============================================
// BRAND TYPES
// ============================================

/**
 * Create a branded/nominal type for type safety
 * @example
 * type UserId = Brand<string, 'UserId'>
 * type PostId = Brand<string, 'PostId'>
 * // UserId and PostId are not assignable to each other
 */
export type Brand<T, B> = T & { __brand: B }

/**
 * UUID branded type
 */
export type UUID = Brand<string, 'UUID'>

/**
 * Email branded type
 */
export type Email = Brand<string, 'Email'>

/**
 * Positive number branded type
 */
export type PositiveNumber = Brand<number, 'PositiveNumber'>
