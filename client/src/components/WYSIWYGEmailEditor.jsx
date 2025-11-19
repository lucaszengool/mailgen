import React, { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, Link, Image, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Code, Trash2, Upload, Type, Palette, Move
} from 'lucide-react';

/**
 * WYSIWYG Email Editor Component
 * Similar to Gmail's email composer - user writes exactly what gets sent
 * No AI involvement - sends the same content to all prospects
 */
const WYSIWYGEmailEditor = ({
  initialContent = '',
  onContentChange,
  onSave,
  businessInfo = {}
}) => {
  const [editorContent, setEditorContent] = useState(initialContent);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // 🔥 FIX: Set initial content on mount only, then let contentEditable handle updates
  useEffect(() => {
    if (editorRef.current && initialContent && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  // Format commands for rich text editing
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    const content = editorRef.current?.innerHTML || '';
    setEditorContent(content);
    onContentChange?.(content);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = `<img src="${event.target.result}" style="max-width: 100%; height: auto; margin: 10px 0;" class="email-image" draggable="true" />`;
      document.execCommand('insertHTML', false, img);
      updateContent();
      setShowImageUpload(false);
    };
    reader.readAsDataURL(file);
  };

  // Insert link
  const insertLink = () => {
    if (!linkUrl) return;
    const text = linkText || linkUrl;
    const link = `<a href="${linkUrl}" style="color: #10b981; text-decoration: underline;">${text}</a>`;
    document.execCommand('insertHTML', false, link);
    setLinkUrl('');
    setLinkText('');
    setShowLinkDialog(false);
    updateContent();
  };

  // Insert button
  const insertButton = () => {
    const button = `
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://example.com"
           style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Click Here
        </a>
      </div>
    `;
    document.execCommand('insertHTML', false, button);
    updateContent();
  };

  // Insert divider
  const insertDivider = () => {
    const divider = '<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;" />';
    document.execCommand('insertHTML', false, divider);
    updateContent();
  };

  return (
    <div className="wysiwyg-email-editor bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="toolbar bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => execCommand('bold')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Bold"
            type="button"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => execCommand('italic')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Italic"
            type="button"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => execCommand('underline')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Underline"
            type="button"
          >
            <Underline size={16} />
          </button>
        </div>

        {/* Font Size */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <select
            onChange={(e) => execCommand('fontSize', e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
            defaultValue="3"
          >
            <option value="1">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
            <option value="7">Huge</option>
          </select>

          <select
            onChange={(e) => execCommand('foreColor', e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded w-20"
            title="Text Color"
          >
            <option value="#000000">Black</option>
            <option value="#10b981">Green</option>
            <option value="#3b82f6">Blue</option>
            <option value="#ef4444">Red</option>
            <option value="#8b5cf6">Purple</option>
            <option value="#f59e0b">Orange</option>
          </select>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => execCommand('justifyLeft')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Align Left"
            type="button"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => execCommand('justifyCenter')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Align Center"
            type="button"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => execCommand('justifyRight')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Align Right"
            type="button"
          >
            <AlignRight size={16} />
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => execCommand('insertUnorderedList')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Bullet List"
            type="button"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => execCommand('insertOrderedList')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Numbered List"
            type="button"
          >
            <ListOrdered size={16} />
          </button>
        </div>

        {/* Insert Elements */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-200 rounded"
            title="Insert Image"
            type="button"
          >
            <Image size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            onClick={() => setShowLinkDialog(true)}
            className="p-2 hover:bg-gray-200 rounded"
            title="Insert Link"
            type="button"
          >
            <Link size={16} />
          </button>
        </div>

        {/* Components */}
        <div className="flex gap-1">
          <button
            onClick={insertButton}
            className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 rounded font-medium"
            title="Insert Button"
            type="button"
          >
            + Button
          </button>
          <button
            onClick={insertDivider}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded font-medium"
            title="Insert Divider"
            type="button"
          >
            + Divider
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={updateContent}
        onPaste={handlePaste}
        className="editor-content min-h-[400px] p-6 focus:outline-none prose max-w-none"
        style={{
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#000000'
        }}
        suppressContentEditableWarning={true}
      >
        {/* Content is managed by contentEditable and ref, not React state */}
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={insertLink}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Insert
              </button>
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="bg-blue-50 border-t border-blue-200 p-3 text-xs text-blue-800">
        <p className="font-medium mb-1">💡 Manual Email Mode</p>
        <p>Write exactly what you want to send. This email will be sent as-is to all prospects - no AI modifications.</p>
        <p className="mt-1">You can still use placeholders like {'{name}'}, {'{company}'}, {'{position}'} which will be replaced for each prospect.</p>
      </div>
    </div>
  );
};

export default WYSIWYGEmailEditor;
