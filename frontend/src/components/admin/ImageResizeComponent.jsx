import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, Move, X, Check, Settings } from 'lucide-react';

export default function ImageResizeComponent(props) {
  const { node, updateAttributes, editor } = props;
  const { src, alt, title, width, height, align, className } = node.attrs;
  
  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [tempWidth, setTempWidth] = useState(width);
  const [tempHeight, setTempHeight] = useState(height);
  const [tempAlign, setTempAlign] = useState(align);
  const imageRef = useRef(null);

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setShowControls(true);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    updateAttributes({
      width: tempWidth,
      height: tempHeight,
      align: tempAlign,
    });
  };

  const handleWidthChange = (e) => {
    const value = e.target.value;
    setTempWidth(value);
    if (!isResizing) {
      updateAttributes({ width: value });
    }
  };

  const handleHeightChange = (e) => {
    const value = e.target.value;
    setTempHeight(value);
    if (!isResizing) {
      updateAttributes({ height: value });
    }
  };

  const handleAlignChange = (newAlign) => {
    setTempAlign(newAlign);
    if (!isResizing) {
      updateAttributes({ align: newAlign });
    }
  };

  const handleReset = () => {
    setTempWidth('100%');
    setTempHeight('auto');
    setTempAlign('center');
    updateAttributes({
      width: '100%',
      height: 'auto',
      align: 'center',
    });
  };

  const handleRemove = () => {
    editor.commands.deleteSelection();
  };

  const alignmentOptions = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
  ];

  const sizePresets = [
    { width: '100%', height: 'auto', label: 'Full Width' },
    { width: '800px', height: 'auto', label: 'Large' },
    { width: '600px', height: '400px', label: 'Medium' },
    { width: '300px', height: '200px', label: 'Small' },
    { width: '150px', height: '150px', label: 'Thumbnail' },
  ];

  const applyPreset = (preset) => {
    setTempWidth(preset.width);
    setTempHeight(preset.height);
    updateAttributes({
      width: preset.width,
      height: preset.height,
    });
  };

  return (
    <NodeViewWrapper className="image-resize-wrapper relative group">
      <div 
        className={`relative inline-block ${tempAlign === 'center' ? 'image-center' : ''} ${tempAlign === 'right' ? 'image-float-right' : ''} ${tempAlign === 'left' ? 'image-float-left' : ''}`}
        style={{ 
          width: tempWidth === '100%' ? '100%' : tempWidth,
          height: tempHeight === 'auto' ? 'auto' : tempHeight,
          maxWidth: '100%',
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isResizing && setShowControls(false)}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          title={title || ''}
          className={`rounded-lg ${className} ${isResizing ? 'opacity-80' : ''}`}
          style={{
            width: '100%',
            height: tempHeight === 'auto' ? 'auto' : '100%',
            objectFit: 'cover',
          }}
        />

        {/* Resize controls */}
        {showControls && (
          <div className="absolute inset-0 border-2 border-saffron-400 border-dashed rounded-lg pointer-events-none" />
        )}

        {/* Control toolbar */}
        {showControls && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white border border-ink-200 rounded-lg shadow-lg p-1.5 flex items-center gap-1 z-50">
            <button
              type="button"
              onClick={handleResizeStart}
              className="p-1.5 rounded hover:bg-ink-100 text-ink-600 hover:text-ink-900"
              title="Resize image"
            >
              <Maximize2 size={14} />
            </button>
            
            <button
              type="button"
              onClick={() => setShowControls(false)}
              className="p-1.5 rounded hover:bg-ink-100 text-ink-600 hover:text-ink-900"
              title="Hide controls"
            >
              <Minimize2 size={14} />
            </button>
            
            <div className="w-px h-4 bg-ink-200 mx-0.5" />
            
            {alignmentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAlignChange(option.value)}
                className={`p-1.5 rounded text-xs font-medium ${tempAlign === option.value ? 'bg-saffron-100 text-saffron-700' : 'hover:bg-ink-100 text-ink-600 hover:text-ink-900'}`}
                title={`Align ${option.label}`}
              >
                {option.label.charAt(0)}
              </button>
            ))}
            
            <div className="w-px h-4 bg-ink-200 mx-0.5" />
            
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Resize modal */}
        {isResizing && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={handleResizeEnd}
            />
            <div 
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-ink-100">
                <h3 className="font-display text-base font-bold text-ink-900 flex items-center gap-2">
                  <Settings size={16} />
                  Adjust Image Size
                </h3>
              </div>
              
              <div className="p-5 space-y-4">
                {/* Size presets */}
                <div>
                  <p className="font-ui text-xs font-medium text-ink-500 mb-2 uppercase tracking-wide">
                    Quick Presets
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {sizePresets.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="px-3 py-2 text-xs border border-ink-200 rounded-lg hover:border-saffron-300 hover:bg-saffron-50 text-ink-700 hover:text-ink-900"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom size controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                      Width
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempWidth}
                        onChange={handleWidthChange}
                        placeholder="e.g., 800px or 100%"
                        className="input text-sm flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                      Height
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempHeight}
                        onChange={handleHeightChange}
                        placeholder="e.g., 400px or auto"
                        className="input text-sm flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <p className="font-ui text-xs font-medium text-ink-500 mb-2 uppercase tracking-wide">
                    Alignment
                  </p>
                  <div className="flex gap-2">
                    {alignmentOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleAlignChange(option.value)}
                        className={`px-4 py-2 text-sm border rounded-lg flex-1 ${tempAlign === option.value ? 'border-saffron-300 bg-saffron-50 text-saffron-700' : 'border-ink-200 hover:border-ink-300 text-ink-600 hover:text-ink-900'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live preview */}
                <div className="pt-4 border-t border-ink-100">
                  <p className="font-ui text-xs font-medium text-ink-500 mb-2 uppercase tracking-wide">
                    Preview
                  </p>
                  <div className="bg-ink-50 rounded-lg p-4">
                    <div 
                      className={`${tempAlign === 'center' ? 'image-center' : ''}`}
                      style={{ 
                        width: tempWidth === '100%' ? '100%' : tempWidth,
                        maxWidth: '100%',
                      }}
                    >
                      <img
                        src={src}
                        alt="Preview"
                        className="rounded-lg mx-auto"
                        style={{
                          width: '100%',
                          height: tempHeight === 'auto' ? 'auto' : tempHeight,
                          maxHeight: '200px',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center px-5 py-4 border-t border-ink-100 bg-ink-50">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-ghost text-sm"
                >
                  Reset to Default
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsResizing(false)}
                    className="btn-ghost text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResizeEnd}
                    className="btn-primary text-sm"
                  >
                    <Check size={14} />
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}