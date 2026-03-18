import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'
import { SlideView } from './app/components/SlideView'

const docsComponents = getDocsMDXComponents()

export function useMDXComponents(components?: Record<string, unknown>) {
  return {
    ...docsComponents,
    SlideView,
    ...components,
  }
}
