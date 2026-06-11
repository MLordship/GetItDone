import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SuggestionOptions = any

export const WikiLinkPluginKey = new PluginKey('wikiLinkSuggestion')

export const WikiLinkSuggestion = Extension.create<{
  suggestion: Omit<SuggestionOptions, 'editor'>
}>({
  name: 'wikiLinkSuggestion',

  addOptions() {
    return {
      suggestion: {
        char: '[[',
        pluginKey: WikiLinkPluginKey,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        command: ({ editor, range, props }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(`[[${(props as { title: string }).title}]] `)
            .run()
        },
        items: () => [],
        render: () => ({
          onStart: () => {},
          onUpdate: () => {},
          onKeyDown: () => false,
          onExit: () => {},
        }),
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
