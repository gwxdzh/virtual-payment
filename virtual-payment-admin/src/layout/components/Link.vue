<template>
  <component :is="type" v-bind="linkProps">
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { isExternal } from '@/utils/validate'

const props = defineProps({
  to: {
    type: String,
    required: true
  }
})

// 根据是否是外部链接，渲染 a 标签或 router-link
const type = computed(() => {
  return isExternal(props.to) ? 'a' : 'router-link'
})

// 链接属性
const linkProps = computed(() => {
  if (isExternal(props.to)) {
    return {
      href: props.to,
      target: '_blank',
      rel: 'noopener'
    }
  }
  return {
    to: props.to
  }
})
</script>
