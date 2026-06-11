import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node } from '@tiptap/pm/model'

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g
const pluginKey = new PluginKey('wikiLinkDecorator')

export const WikiLinkDecorator = Extension.create({
  name: 'wikiLinkDecorator',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init(_, { doc }) { return build(doc) },
          apply(tr, deco) { return tr.docChanged ? build(tr.doc) : deco },
        },
        props: {
          decorations(state) { return pluginKey.getState(state) },
          handleClick(_view, _pos, event) {
            const el = event.target as HTMLElement
            if (el.classList.contains('wiki-link')) {
              const title = el.dataset.title
              if (title) {
                window.dispatchEvent(new CustomEvent('wiki-link-click', { detail: { title } }))
                return true
              }
            }
            return false
          },
        },
      }),
    ]
  },
})

function build(doc: Node): DecorationSet {
  const decos: Decoration[] = []
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    WIKI_LINK_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = WIKI_LINK_RE.exec(node.text)) !== null) {
      decos.push(
        Decoration.inline(pos + m.index, pos + m.index + m[0].length, {
          class: 'wiki-link',
          'data-title': m[1],
          style: 'cursor:pointer',
        })
      )
    }
  })
  return DecorationSet.create(doc, decos)
}
