import React from 'react';
import { CodePreview } from "./CodePreview";

export default function Command() {
  const codeExample = `function greetUser(name: string) {
  return \`Hello \${name}!\`;
}

const message = greetUser("World");
console.log(message);`;

  return (
    <div className="w-full p-4">
      <CodePreview code={codeExample} language="typescript" title="Code Preview" />
    </div>
  );
} 