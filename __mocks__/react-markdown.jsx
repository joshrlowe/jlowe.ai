/**
 * Mock for react-markdown
 * 
 * Provides a simple mock that renders markdown as plain text/HTML
 * for testing purposes without the full markdown parsing.
 */

import React from "react";

// Simple mock that renders children as plain text
export default function ReactMarkdown({ children, remarkPlugins, rehypePlugins, components, ...props }) {
  // Parse simple markdown elements for testing
  let content = children || "";
  
  // Convert headers
  content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Convert bold
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic (but not after being processed as bold)
  content = content.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert strikethrough
  content = content.replace(/~~(.*?)~~/g, '<del>$1</del>');
  
  // Convert inline code (not in code blocks)
  content = content.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  
  // Convert links
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Convert code blocks first (before list processing)
  content = content.replace(/```[\w]*\n([\s\S]*?)```/g, (match, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });
  
  // Convert tables (simplified)
  if (content.includes('|') && content.includes('---')) {
    const lines = content.split('\n');
    let result = [];
    let tableHtml = '<table>';
    let inTable = false;
    let isHeader = true;
    
    for (const line of lines) {
      if (line.trim().startsWith('|') && !line.includes('---')) {
        if (!inTable) {
          inTable = true;
        }
        const cells = line.split('|').filter(c => c.trim());
        const tag = isHeader ? 'th' : 'td';
        tableHtml += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
        isHeader = false;
      } else if (line.includes('---') && line.includes('|')) {
        // Skip separator line
      } else {
        if (inTable) {
          tableHtml += '</table>';
          result.push(tableHtml);
          tableHtml = '<table>';
          inTable = false;
          isHeader = true;
        }
        result.push(line);
      }
    }
    if (inTable) {
      tableHtml += '</table>';
      result.push(tableHtml);
    }
    content = result.join('\n');
  }
  
  // Convert task lists
  content = content.replace(/^- \[x\] (.*)$/gm, '<li class="task-item checked">$1</li>');
  content = content.replace(/^- \[ \] (.*)$/gm, '<li class="task-item">$1</li>');
  
  // Convert unordered lists
  content = content.replace(/^- (.*)$/gm, '<li>$1</li>');
  
  // Convert ordered lists
  content = content.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');
  
  // Wrap consecutive <li> elements in <ul>
  content = content.replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, (match) => {
    return '<ul>' + match + '</ul>';
  });
  
  // Wrap paragraphs (lines that aren't already wrapped)
  const lines = content.split('\n');
  content = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || 
        trimmed.startsWith('<ol') || trimmed.startsWith('<pre') || 
        trimmed.startsWith('<table') || trimmed.startsWith('<li') ||
        trimmed.startsWith('<p') || trimmed.startsWith('</')) {
      return line;
    }
    return `<p>${line}</p>`;
  }).join('\n');
  
  return (
    <div 
      data-testid="react-markdown"
      dangerouslySetInnerHTML={{ __html: content }}
      {...props}
    />
  );
}
