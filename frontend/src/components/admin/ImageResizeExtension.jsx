import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageResizeComponent from './ImageResizeComponent';

export const ImageResize = Node.create({
  name: 'imageResize',
  group: 'block',
  content: 'inline*',
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: '',
      },
      title: {
        default: '',
      },
      width: {
        default: '100%',
      },
      height: {
        default: 'auto',
      },
      align: {
        default: 'center',
      },
      className: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: dom => {
          // Get style attribute to check for width/height
          const style = dom.getAttribute('style') || '';
          let width = dom.getAttribute('width');
          let height = dom.getAttribute('height');
          
          // Extract width/height from style if not directly set
          if (!width && style.includes('width')) {
            const widthMatch = style.match(/width:\s*([^;]+)/);
            if (widthMatch) width = widthMatch[1].trim();
          }
          if (!height && style.includes('height')) {
            const heightMatch = style.match(/height:\s*([^;]+)/);
            if (heightMatch) height = heightMatch[1].trim();
          }
          
          // Check alignment from style or class
          let align = 'center';
          const classAttr = dom.getAttribute('class') || '';
          if (classAttr.includes('image-float-left') || classAttr.includes('float-left') || style.includes('float: left')) {
            align = 'left';
          } else if (classAttr.includes('image-float-right') || classAttr.includes('float-right') || style.includes('float: right')) {
            align = 'right';
          } else if (classAttr.includes('image-center') || style.includes('margin-left: auto') || style.includes('margin-right: auto')) {
            align = 'center';
          }
          
          return {
            src: dom.getAttribute('src'),
            alt: dom.getAttribute('alt') || '',
            title: dom.getAttribute('title') || '',
            width: width || '100%',
            height: height || 'auto',
            align: align,
            className: classAttr,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { align, className, ...rest } = HTMLAttributes;
    const attrs = { ...rest };
    
    // Add alignment classes
    let finalClassName = className || '';
    if (align === 'left') {
      finalClassName += ' image-float-left';
    } else if (align === 'right') {
      finalClassName += ' image-float-right';
    } else if (align === 'center') {
      finalClassName += ' image-center';
    }
    
    if (finalClassName.trim()) {
      attrs.class = finalClassName.trim();
    }
    
    return ['img', mergeAttributes(attrs)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeComponent);
  },
});