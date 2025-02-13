import { ref, computed } from 'vue'

interface ValidationRule {
    validate: (value: any) => boolean
    message: string
}

interface ValidationRules {
    [key: string]: ValidationRule[]
}

interface ValidationErrors {
    [key: string]: string[]
}

export const useValidation = () => {
    const errors = ref<ValidationErrors>({})

    // Common validation rules
    const rules = {
        required: (message = 'This field is required'): ValidationRule => ({
            validate: (value: any) => {
                if (Array.isArray(value)) return value.length > 0
                if (typeof value === 'string') return value.trim().length > 0
                return value !== null && value !== undefined
            },
            message
        }),

        email: (message = 'Please enter a valid email address'): ValidationRule => ({
            validate: (value: string) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                return emailRegex.test(value)
            },
            message
        }),

        minLength: (length: number, message = `Must be at least ${length} characters`): ValidationRule => ({
            validate: (value: string) => value.length >= length,
            message
        }),

        maxLength: (length: number, message = `Must not exceed ${length} characters`): ValidationRule => ({
            validate: (value: string) => value.length <= length,
            message
        }),

        password: (message = 'Password must contain at least 8 characters with numbers and letters'): ValidationRule => ({
            validate: (value: string) => {
                const minLength = 8
                const hasLetters = /[a-zA-Z]/.test(value)
                const hasNumbers = /\d/.test(value)
                return value.length >= minLength && hasLetters && hasNumbers
            },
            message
        }),

        match: (matchValue: any, message = 'Values must match'): ValidationRule => ({
            validate: (value: any) => value === matchValue,
            message
        })
    }

    const validateField = (value: any, fieldRules: ValidationRule[]): string[] => {
        const fieldErrors: string[] = []
        for (const rule of fieldRules) {
            if (!rule.validate(value)) {
                fieldErrors.push(rule.message)
            }
        }
        return fieldErrors
    }

    const validate = (data: { [key: string]: any }, validationRules: ValidationRules): boolean => {
        const newErrors: ValidationErrors = {}
        let isValid = true

        for (const [field, rules] of Object.entries(validationRules)) {
            const fieldErrors = validateField(data[field], rules)
            if (fieldErrors.length > 0) {
                newErrors[field] = fieldErrors
                isValid = false
            }
        }

        errors.value = newErrors
        return isValid
    }

    const clearErrors = () => {
        errors.value = {}
    }

    return {
        errors: computed(() => errors.value),
        rules,
        validate,
        clearErrors
    }
}