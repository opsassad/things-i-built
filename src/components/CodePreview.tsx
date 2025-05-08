import React, { useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Highlight, themes } from 'prism-react-renderer';

interface CodePreviewProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodePreview({ code, language = "typescript", title }: CodePreviewProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This ensures the container is properly initialized
    if (previewContainerRef.current) {
      console.log("Preview container found:", previewContainerRef.current);
    }
  }, []);

  return (
    <Card className="w-full overflow-hidden bg-zinc-950 text-zinc-50" id="preview-container" ref={previewContainerRef}>
      {title && (
        <div className="border-b border-zinc-800 px-4 py-2 text-sm font-medium">
          {title}
        </div>
      )}
      <Highlight
        theme={themes.nightOwl}
        code={code}
        language={language}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className="overflow-x-auto p-4" style={style}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </Card>
  );
}

// Usage example:
export default function CodePreviewExample() {
  const exampleCode = `function greetUser(name: string) {
  return \`Hello \${name}!\`;
}

const message = greetUser("World");
console.log(message);`;

  return (
    <div className="p-4">
      <CodePreview
        code={exampleCode}
        language="typescript"
        title="Example TypeScript Code"
      />
    </div>
  );
} 