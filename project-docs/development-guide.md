# JavaScript Style Guide

> All code in any codebase should look like a single person typed it, no matter how many people contributed.

## 1. Whitespace & Formatting

**Indentation:** Use tabs (equal to 4 spaces). Never mix tabs and spaces.

**Spacing:** Single space around operators, after commas, and after control flow keywords.

**Braces:** Always use braces for blocks. Opening brace on same line, content on new line.

```javascript
// Good
if (condition) {
    // statements
}

function getData() {
    return data
}

// Bad
if(condition) doSomething()
```

## 2. Semicolons

**Never use semicolons.** This is non-negotiable.

```javascript
// Good
const users = await fetchUsers()
const data = users.json()

// Bad
const users = await fetchUsers();
const data = users.json();
```

**ASI Safety:** Prefix lines starting with `[`, `(`, `` ` ``, `+`, `-`, `/` with a semicolon.

```javascript
// Required leading semicolon
;[1, 2, 3].forEach(console.log)
;(function() { /* IIFE */ })()
```

## 3. Quotes

**Use double quotes for all strings and JSX props.**

```javascript
// Good
const message = "Welcome to our application"
const element = <div className="container">Content</div>

// Use template literals for interpolation
const greeting = `Hello ${name}, you have ${count} messages`
```

## 4. Naming Conventions

- **PascalCase:** Components, classes, types, interfaces, enums
- **camelCase:** Variables, functions, methods, file names (except components)
- **Descriptive names:** Self-documenting, avoid abbreviations

```javascript
// Good
const studentData = fetchStudentData()
class UserProfile extends Component {}
interface CourseData {}

// Bad  
const d = f(s)
const usr = new u()
```

## 5. Variable Declarations

**Use `const` by default, `let` when reassignment needed. Never use `var`.**

```javascript
// Good
const users = []
const isLoading = false
let currentPage = 1

// Bad
var users = []
```

## 6. Functions

**Prefer arrow functions for callbacks and simple operations:**

```javascript
// Good
const processUsers = users
    .filter(user => user.active)
    .map(user => ({ ...user, processed: true }))

// Use function declarations for complex logic
function calculateComplexMetrics(dataset) {
    if (!dataset.length) return null
    // complex logic
    return result
}
```

## 7. Objects and Arrays

**Use destructuring and spread operations:**

```javascript
// Destructuring
const { name, email, ...otherProps } = user
const [first, second, ...rest] = items

// Spread operations
const updatedUser = { ...user, lastModified: Date.now() }
const allItems = [...existingItems, ...newItems]
```

## 8. Modern JavaScript Features

**Optional chaining and nullish coalescing:**

```javascript
// Safe property access
const street = user?.profile?.address?.street
const timeout = config.timeout ?? 5000

// Safe method calls
const result = api?.getData?.()
```

**Array methods over manual loops:**

```javascript
// Good
const activeUsers = users.filter(user => user.active)
const userNames = users.map(user => user.name)
const hasAdmin = users.some(user => user.role === "admin")

// Avoid manual for loops when array methods work
```

## 9. Classes

**Use ES6 class syntax with private fields:**

```javascript
class PaymentProcessor {
    #apiKey
    
    constructor(apiKey) {
        this.#apiKey = apiKey
    }
    
    async processPayment(amount) {
        // implementation
    }
    
    static validateAmount(amount) {
        return typeof amount === "number" && amount > 0
    }
}
```

## 10. Modules

**Use ES6 modules exclusively:**

```javascript
// Export
export const API_URL = "https://api.example.com"
export default class UserService {}

// Import
import UserService, { API_URL } from "./UserService.js"
import { debounce } from "lodash-es"
```

## 11. TypeScript Rules

**Strictly typed - explicit types for all declarations:**

```typescript
interface User {
    id: number
    name: string
    email: string
}

function fetchUser(id: number): Promise<User> {
    return fetch(`/api/users/${id}`).then(res => res.json())
}
```

**The `any` type is forbidden.** Work together to define proper types.

## 12. Comments

**Explain why, not what. Place comments above the code they describe.**

```javascript
// Good
// Cache course data locally to reduce API calls during navigation
const cachedCourses = await storeCourseData(courses)

// Bad
const cachedCourses = await storeCourseData(courses) // caching courses
```

**No end-of-line comments.**

## 13. Conditional Evaluation

**Use truthiness checks appropriately:**

```javascript
// Good
if (array.length) { /* has items */ }
if (!string) { /* is empty */ }
if (value ?? false) { /* null-safe check */ }

// Be explicit when needed
if (value === false) { /* specifically false */ }
```

## 14. Tool Configuration

**ESLint config (eslint.config.js):**

```javascript
export default [{
    rules: {
        "indent": ["error", "tab"],
        "semi": ["error", "never"],
        "quotes": ["error", "double"],
        "no-var": "error",
        "prefer-const": "error"
    }
}]
```

**Prettier config (.prettierrc):**

```json
{
    "useTabs": true,
    "tabWidth": 4,
    "semi": false,
    "singleQuote": false
}
```

---

**These rules ensure consistency and maintainability. Non-negotiable items: no semicolons, no `any` type, tabs for indentation, double quotes.**