import { consoleError } from '../util/console'

// Mixins
import Colorable from './colorable'

export default {
  name: 'validatable',

  mixins: [
    Colorable
  ],

  data: vm => ({
    errorBucket: [],
    hasColor: false,
    hasFocused: false,
    hasInput: false,
    shouldValidate: false,
    valid: false
  }),

  props: {
    error: Boolean,
    errorCount: {
      type: [Number, String],
      default: 1
    },
    errorMessages: {
      type: [String, Array],
      default: () => []
    },
    messages: {
      type: [String, Array],
      default: () => []
    },
    persistentHint: Boolean,
    rules: {
      type: Array,
      default: () => []
    },
    success: Boolean,
    successMessages: {
      type: [String, Array],
      default: () => []
    },
    validateOnBlur: Boolean
  },

  computed: {
    hasError () {
      return this.errorMessages.length > 0 ||
        this.errorBucket.length > 0 ||
        this.error
    },
    // TODO: Add logic that allows the user to enable based
    // upon a good validation
    hasSuccess () {
      return this.successMessages.length > 0 ||
        this.success
    },
    hasMessages () {
      return this.validations.length > 0
    },
    validations () {
      const target = this.errorMessages.length > 0
        ? this.errorMessages
        : this.successMessages.length > 0
          ? this.successMessages
          : this.messages

      // String
      if (!Array.isArray(target)) {
        return [target]
      // Array with items
      } else if (target.length > 0) {
        return target
      // Currently has validation
      } else if (this.shouldValidate) {
        return this.errorBucket
      } else {
        return []
      }
    },
    validationState () {
      if (this.hasError) return 'error'
      if (this.hasSuccess) return 'success'
      if (this.hasColor) return this.color
      return null
    }
  },

  watch: {
    rules: {
      handler (newVal, oldVal) {
        // TODO: This handler seems to trigger when input changes, even though
        // rules array stays the same? Solved it like this for now
        if (newVal.length === oldVal.length) return

        this.validate()
      },
      deep: true
    },
    inputValue (val) {
      // If it's the first time we're setting input,
      // mark it with hasInput
      if (!!val && !this.hasInput) this.hasInput = true

      if (this.hasInput && !this.validateOnBlur) this.shouldValidate = true
    },
    isFocused (val) {
      // If we're not focused, and it's the first time
      // we're defocusing, set shouldValidate to true
      if (!val && !this.hasFocused) {
        this.hasFocused = true
        this.shouldValidate = true

        this.$emit('update:error', this.errorBucket.length > 0)
      }
    },
    hasError (val) {
      if (this.shouldValidate) {
        this.$emit('update:error', val)
      }
    },
    error (val) {
      this.shouldValidate = !!val
    }
  },

  beforeMount () {
    this.shouldValidate = !!this.error
    this.validate()
  },

  methods: {
    reset () {
      // TODO: Do this another way!
      // This is so that we can reset all types of inputs
      this.$emit('input', this.isMultiple ? [] : null)
      this.$emit('change', null)

      this.$nextTick(() => {
        this.shouldValidate = false
        this.hasFocused = false
        this.validate()
      })
    },
    validate (force = false, value = this.inputValue) {
      if (force) this.shouldValidate = true

      this.errorBucket = []

      for (let index = 0; index < this.rules.length; index++) {
        const rule = this.rules[index]
        const valid = typeof rule === 'function' ? rule(value) : rule

        if (valid === false || typeof valid === 'string') {
          this.errorBucket.push(valid)
        } else if (valid !== true) {
          consoleError(`Rules should return a string or boolean, received '${typeof valid}' instead`, this)
        }
      }

      this.valid = this.errorBucket.length === 0

      return this.valid
    }
  }
}
