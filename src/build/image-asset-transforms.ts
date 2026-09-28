import type { Nuxt } from '@nuxt/schema'
import MagicString from 'magic-string'
import { NodeTypes, createSimpleExpression } from '@vue/compiler-core'
import type { NodeTransform, RootNode, TemplateChildNode } from '@vue/compiler-core'
import { compileScript, parse as parseSFC } from '@vue/compiler-sfc'

function rewriteImageSources(code: string, id: string) {
  const filename = id.split('?')[0] ?? id
  const { descriptor, errors } = parseSFC(code, { filename })
  if (errors.length || !descriptor.scriptSetup || !descriptor.template?.ast) return

  const bindings = new Set<string>()
  const template = descriptor.template.ast
  const collectBindings = (node: RootNode | TemplateChildNode) => {
    if (node.type === NodeTypes.ELEMENT && node.tag === 'img') {
      for (const prop of node.props) {
        if (prop.type !== NodeTypes.DIRECTIVE || prop.name !== 'bind') continue
        if (prop.arg?.type !== NodeTypes.SIMPLE_EXPRESSION || prop.arg.content !== 'src') continue
        if (prop.exp?.type !== NodeTypes.SIMPLE_EXPRESSION) continue

        const binding = prop.exp.content.trim()
        if (/^[_$a-z][\w$]*$/i.test(binding)) bindings.add(binding)
      }
    }

    if (node.type === NodeTypes.ROOT || node.type === NodeTypes.ELEMENT) {
      node.children.forEach(collectBindings)
    }
  }
  collectBindings(template)
  if (!bindings.size) return

  const script = compileScript(descriptor, { id: filename })
  const scriptBlock = descriptor.scriptSetup
  const replacements: { start: number, end: number, value: string }[] = []

  for (const statement of script.scriptSetupAst ?? []) {
    if (statement.type !== 'VariableDeclaration') continue

    for (const declaration of statement.declarations) {
      if (declaration.id.type !== 'Identifier' || !bindings.has(declaration.id.name) || !declaration.init) continue

      const initializer = declaration.init
      let literal
      if (initializer.type === 'StringLiteral') {
        literal = initializer
      }
      else if (
        initializer.type === 'CallExpression'
        && initializer.callee.type === 'Identifier'
        && (initializer.callee.name === 'ref' || initializer.callee.name === 'shallowRef')
      ) {
        const argument = initializer.arguments[0]
        if (argument?.type === 'StringLiteral') literal = argument
      }

      if (!literal || typeof literal.start !== 'number' || typeof literal.end !== 'number') continue
      if (!literal.value.startsWith('/') || literal.value.startsWith('//')) continue

      replacements.push({
        start: scriptBlock.loc.start.offset + literal.start,
        end: scriptBlock.loc.start.offset + literal.end,
        value: JSON.stringify(`.${literal.value}`),
      })
    }
  }

  if (!replacements.length) return

  const transformed = new MagicString(code)
  for (const replacement of replacements) {
    transformed.overwrite(replacement.start, replacement.end, replacement.value)
  }

  return {
    code: transformed.toString(),
    map: transformed.generateMap({ source: filename, includeContent: true, hires: true }),
  }
}

const transformImageSrc: NodeTransform = (node) => {
  if (!('tag' in node) || node.tag !== 'img') return

  for (const prop of node.props) {
    if (!('arg' in prop) || prop.name !== 'bind' || !prop.arg || !('content' in prop.arg) || prop.arg.content !== 'src') continue
    if (!prop.exp || !('isStatic' in prop.exp)) continue

    const expression = prop.exp
    const expressionAst = expression.ast
    if (!expressionAst || expressionAst.type !== 'StringLiteral') continue

    const source = expressionAst.value
    if (!source.startsWith('/') || source.startsWith('//')) continue

    prop.exp = createSimpleExpression(JSON.stringify(`.${source}`), false, expression.loc)
  }
}

function createImagePlugin() {
  return {
    name: 'nuxt-twitch-ext:relative-image-src-initializers',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.endsWith('.vue') || id.includes('?')) return
      return rewriteImageSources(code, id)
    },
  }
}

export function addImageAssetTransforms(nuxt: Nuxt) {
  nuxt.options.vite ||= {}
  nuxt.options.vite.plugins ||= []
  nuxt.options.vite.plugins.push(createImagePlugin())

  nuxt.options.vue.compilerOptions.nodeTransforms ||= []
  nuxt.options.vue.compilerOptions.nodeTransforms.push(transformImageSrc)
}
