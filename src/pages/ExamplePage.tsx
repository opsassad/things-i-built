import { CodePreview } from "@/components/CodePreview";

export default function ExamplePage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Code Examples</h1>
      
      {/* TypeScript Example */}
      <div className="space-y-2">
        <h2 className="text-xl">TypeScript Example</h2>
        <CodePreview
          title="Greeting Function"
          language="typescript"
          code={`interface User {
  name: string;
  age: number;
}

function greet(user: User) {
  return \`Hello \${user.name}, you are \${user.age} years old!\`;
}`}
        />
      </div>

      {/* React Component Example */}
      <div className="space-y-2">
        <h2 className="text-xl">React Component Example</h2>
        <CodePreview
          title="Button Component"
          language="tsx"
          code={`interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      className="bg-blue-500 text-white px-4 py-2 rounded"
      onClick={onClick}
    >
      {children}
    </button>
  );
}`}
        />
      </div>

      {/* CSS Example */}
      <div className="space-y-2">
        <h2 className="text-xl">CSS Example</h2>
        <CodePreview
          title="Button Styles"
          language="css"
          code={`.button {
  background: linear-gradient(to right, #4F46E5, #7C3AED);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}`}
        />
      </div>
    </div>
  );
} 