import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  hasError?: boolean
}

export function RichTextEditor({ value, onChange, placeholder, hasError }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'rte__body',
      },
    },
    onUpdate({ editor }) {
      const html = editor.isEmpty ? '' : editor.getHTML()
      onChange(html)
    },
  })

  // Sync external value resets (e.g. edit page loads data after mount)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() === value) return
    editor.commands.setContent(value || '')
  }, [value, editor])

  if (!editor) return null

  return (
    <div className={`rte${hasError ? ' rte--error' : ''}`}>
      <div className="rte__toolbar">
        <button
          type="button"
          className={`rte__btn${editor.isActive('bold') ? ' rte__btn--active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          title="Bold"
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={`rte__btn${editor.isActive('italic') ? ' rte__btn--active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
          title="Italic"
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className={`rte__btn${editor.isActive('heading', { level: 2 }) ? ' rte__btn--active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
          title="Heading"
        >
          H2
        </button>
        <div className="rte__divider" />
        <button
          type="button"
          className={`rte__btn${editor.isActive('bulletList') ? ' rte__btn--active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
          title="Bullet list"
        >
          ≡
        </button>
        <button
          type="button"
          className={`rte__btn${editor.isActive('orderedList') ? ' rte__btn--active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
          title="Numbered list"
        >
          1.
        </button>
        <div className="rte__divider" />
        <button
          type="button"
          className={`rte__btn${editor.isActive('blockquote') ? ' rte__btn--active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run() }}
          title="Blockquote"
        >
          "
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="rte__content"
        data-placeholder={editor.isEmpty ? (placeholder ?? 'Tell attendees what to expect…') : undefined}
      />
    </div>
  )
}
