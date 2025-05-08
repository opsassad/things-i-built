import ReactMarkdown, { Components } from 'react-markdown';
import { Highlight, themes } from 'prism-react-renderer';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { DetailedHTMLProps, HTMLAttributes } from 'react';
import { Card } from '@/components/ui/card';

interface MarkdownPreviewProps {
  content: string;
}

type CodeProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const components: Components = {
    code: ({ inline, className, children, ...props }: CodeProps) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      
      if (inline) {
        return <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100" {...props}>{children}</code>;
      }

      const codeContent = String(children).replace(/\n$/, '');

      return (
        <div className="not-prose my-4">
          <Card className="w-full overflow-hidden bg-zinc-950 text-zinc-50 rounded-lg">
            {language && (
              <div className="border-b border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400">
                {language}
              </div>
            )}
            <Highlight
              theme={themes.nightOwl}
              code={codeContent}
              language={language as any}
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre 
                  className="overflow-x-auto p-4" 
                  style={style}
                >
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })} style={{ display: 'flex' }}>
                      <span style={{ color: 'rgb(128, 147, 174)', userSelect: 'none', marginRight: '1rem', textAlign: 'right', minWidth: '2rem' }}>
                        {i + 1}
                      </span>
                      <span>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </span>
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </Card>
        </div>
      );
    }
  };

  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 