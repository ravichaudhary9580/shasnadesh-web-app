import React from 'react';
import RichEditor from './RichEditor';

export default function ImageResizeDemo() {
  const [content, setContent] = React.useState('<p>Test image resize functionality:</p>');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Image Resize Demo</h1>
      <p className="mb-6 text-gray-600">
        This demo shows the image resize functionality in the admin panel content editor.
        You can insert images and adjust their width, height, and alignment.
      </p>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-bold text-blue-800 mb-2">How to use:</h2>
        <ol className="list-decimal pl-5 space-y-2 text-blue-700">
          <li>Click the image icon in the toolbar to insert an image</li>
          <li>Enter an image URL or upload a file</li>
          <li>Adjust width, height, and alignment in the modal</li>
          <li>Click on an inserted image to show resize controls</li>
          <li>Use the resize handles or modal to adjust size</li>
          <li>Drag alignment buttons to change image position</li>
        </ol>
      </div>

      <RichEditor content={content} onChange={setContent} />
      
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h2 className="font-bold text-gray-800 mb-2">Current HTML Content:</h2>
        <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto max-h-60">
          {content}
        </pre>
      </div>
    </div>
  );
}