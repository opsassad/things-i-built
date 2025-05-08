export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  link: string;
  imageUrl?: string;
  detailedDescription?: string;
  features?: string[];
  technologies?: string[];
}

export interface BlogPostType {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  link: string;
  content?: string;
  tags?: string[];
  featuredImage?: string;
  authorImage?: string;
  authorName?: string;
  authorRole?: string;
  metaTitle?: string;
  metaDescription?: string;
  socialTitle?: string;
  socialDescription?: string;
}

export const projects: Project[] = [
  {
    id: "ai-document-analyzer",
    title: "AI Document Analyzer",
    description: "An intelligent document analysis tool that extracts key information from documents using natural language processing.",
    tags: ["AI", "NLP", "React"],
    link: "/projects/ai-document-analyzer",
    imageUrl: "https://images.unsplash.com/photo-1633412802994-5c058f151b66?q=80&w=2070&auto=format&fit=crop",
    detailedDescription: 
      "The AI Document Analyzer is a sophisticated tool designed to streamline document processing workflows by automatically extracting, categorizing, and analyzing key information from various document types. Leveraging advanced natural language processing techniques, this solution significantly reduces manual data entry and improves accuracy in document management systems.",
    features: [
      "Automated information extraction from PDFs, images, and scanned documents",
      "Entity recognition for names, dates, amounts, and custom fields",
      "Document classification and categorization",
      "Searchable document database with AI-powered recommendations",
      "Integration capabilities with existing document management systems",
      "Customizable extraction templates for specific document types"
    ],
    technologies: ["Natural Language Processing", "Computer Vision", "ReactJS", "Node.js", "TensorFlow", "Google Cloud Vision API"]
  },
  {
    id: "workspace-automation",
    title: "Workspace Automation Suite",
    description: "A suite of Google Workspace automation tools to streamline business operations and improve team productivity.",
    tags: ["Google Workspace", "Automation", "API"],
    link: "/projects/workspace-automation",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop",
    detailedDescription: 
      "The Workspace Automation Suite is a comprehensive collection of automation tools designed specifically for Google Workspace. This solution helps businesses optimize their workflows, reduce manual tasks, and improve collaboration across teams. By automating repetitive processes, organizations can focus on higher-value activities and strategic initiatives.",
    features: [
      "Automated document generation and management",
      "Intelligent email routing and response suggestions",
      "Calendar management and meeting scheduling optimization",
      "Cross-application data synchronization",
      "Custom workflow automation with triggers and actions",
      "Comprehensive analytics dashboard for productivity insights"
    ],
    technologies: ["Google Workspace API", "JavaScript", "Python", "React", "Node.js", "Google App Script"]
  },
  {
    id: "smart-email-manager",
    title: "Smart Email Manager",
    description: "An intelligent email management system that categorizes and prioritizes emails based on content and urgency.",
    tags: ["AI", "Email", "Classification"],
    link: "/projects/smart-email-manager",
    imageUrl: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=2070&auto=format&fit=crop",
    detailedDescription: 
      "The Smart Email Manager is an AI-powered solution that transforms how organizations handle email communications. By automatically analyzing, categorizing, and prioritizing incoming emails, it helps users focus on the most important messages first. The system learns from user behavior to continuously improve its accuracy and relevance over time.",
    features: [
      "AI-powered email categorization and prioritization",
      "Smart inbox organization based on content and urgency",
      "Automated response suggestions for common inquiries",
      "Follow-up reminders and task creation from emails",
      "Integration with popular email providers and CRM systems",
      "Customizable rules and filters for specific organizational needs"
    ],
    technologies: ["Machine Learning", "Natural Language Processing", "ReactJS", "TypeScript", "Node.js", "Gmail API"]
  }
];

export const blogPosts: BlogPostType[] = [
  {
    id: "leveraging-ai-document-workflows",
    title: "Leveraging AI to Streamline Document Workflows",
    excerpt: "How modern AI techniques can transform the way organizations handle document processing tasks.",
    date: "Apr 22, 2025",
    category: "Artificial Intelligence",
    readTime: "6 min read",
    link: "/blog/leveraging-ai-document-workflows",
    featuredImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    authorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    authorName: "Alex Morgan",
    authorRole: "AI & Automation Expert",
    content: `
      # Leveraging AI to Streamline Document Workflows

      In today's digital workplace, organizations are constantly searching for ways to enhance efficiency and reduce manual workload. One area where this is particularly important is document processing. Traditional document workflows often involve significant manual effort, are prone to errors, and can create bottlenecks that slow down business operations.

      ## The Document Processing Challenge

      Many businesses still rely on manual processes for extracting information from documents like invoices, contracts, and forms. This approach has several drawbacks:

      - Time-intensive manual data entry
      - High error rates requiring extensive quality control
      - Delays in processing that impact decision-making
      - Inconsistent information extraction across different processors
      - Scaling difficulties as document volumes increase

      ## How AI is Transforming Document Processing

      Artificial Intelligence, particularly Natural Language Processing (NLP) and Computer Vision, is revolutionizing how organizations handle document processing tasks. These technologies can automatically extract, categorize, and analyze information from various document types with remarkable accuracy.

      ### Key AI Capabilities in Document Processing:

      1. **Automated Information Extraction**: AI can identify and extract specific data points from unstructured documents, converting them into structured, usable information.

      2. **Document Classification**: AI systems can automatically categorize documents based on their content and structure, routing them to appropriate workflows.

      3. **Entity Recognition**: Modern AI can identify entities such as names, dates, addresses, and custom fields specific to your business needs.

      4. **Contextual Understanding**: Unlike simple rule-based systems, AI can understand context and relationships between different pieces of information within a document.

      5. **Learning and Improvement**: AI systems improve over time as they process more documents, adapting to new formats and variations.

      ## Real-World Applications

      Organizations across industries are implementing AI-powered document processing solutions with impressive results:

      - **Financial Services**: Automating invoice processing and financial document analysis
      - **Healthcare**: Extracting information from medical records and insurance claims
      - **Legal**: Analyzing contracts and legal documents for key clauses and obligations
      - **HR**: Processing applications and employee documentation

      ## Implementation Strategies

      When implementing AI for document workflows, consider the following approaches:

      1. **Start with Defined Use Cases**: Identify specific document types and processes that would benefit most from automation.

      2. **Hybrid Approach**: Begin with a combination of AI and human review, gradually increasing automation as confidence in the system grows.

      3. **Integration Focus**: Ensure the AI solution integrates seamlessly with existing document management systems and workflows.

      4. **Customization**: Adapt the AI model to understand industry-specific terminology and document formats.

      5. **Continuous Improvement**: Implement feedback loops where human corrections train the system to improve over time.

      ## Measuring Success

      The impact of AI on document workflows can be measured through several key metrics:

      - Reduction in processing time
      - Decrease in error rates
      - Cost savings from reduced manual processing
      - Improved data accuracy and consistency
      - Faster decision-making enabled by timely information access

      ## Conclusion

      AI technologies offer transformative potential for organizations struggling with document-intensive processes. By implementing intelligent document processing solutions, businesses can not only reduce costs and errors but also free up valuable human resources for more strategic work.

      As these technologies continue to evolve, we can expect even more sophisticated capabilities that further streamline how organizations handle document workflows, ultimately leading to more efficient and effective operations across all business functions.
    `,
    tags: ["AI", "Document Processing", "Workflow Automation", "Efficiency"]
  },
  {
    id: "google-workspace-automation",
    title: "Advanced Google Workspace Automation Techniques",
    excerpt: "Explore automation strategies that can save your team hours of repetitive work each week.",
    date: "Apr 15, 2025",
    category: "Automation",
    readTime: "8 min read",
    link: "/blog/google-workspace-automation",
    featuredImage: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    authorName: "Sarah Johnson",
    authorRole: "Workspace Automation Specialist",
    content: `
      # Advanced Google Workspace Automation Techniques

      In today's fast-paced business environment, efficiency is not just desirable—it's essential for maintaining competitive advantage. Google Workspace has become a cornerstone of productivity for many organizations, but its true potential is often untapped. Through strategic automation, teams can eliminate repetitive tasks, reduce errors, and focus on higher-value activities.

      ## The Automation Opportunity

      The average knowledge worker spends approximately 2.5 hours per day on repetitive tasks that could be automated. Within Google Workspace, numerous opportunities exist for automation:

      - Document creation and formatting
      - Data entry and transfer between applications
      - Email management and response
      - Calendar management and meeting coordination
      - Reporting and analytics generation

      ## Key Automation Tools for Google Workspace

      ### 1. Google Apps Script

      Apps Script is Google's JavaScript-based automation platform that allows you to extend and connect Google Workspace applications. Some powerful applications include:

      - Creating documents from templates with dynamic data insertion
      - Building custom functions in Google Sheets
      - Automating email responses and follow-ups
      - Creating custom sidebar tools and add-ons

      ### 2. Workflow Automation Platforms

      Services like Zapier, Make (formerly Integromat), and Google's own AppSheet can connect Google Workspace with hundreds of other applications:

      - Triggering workflows based on form submissions
      - Synchronizing data across multiple platforms
      - Creating automated approval processes
      - Building no-code applications on top of Google Workspace

      ### 3. Advanced Features Within Google Workspace

      Many built-in features can be leveraged for automation:

      - Gmail filters and rules for email organization
      - Google Forms for data collection and triggering workflows
      - Google Sheets for conditional formatting and data validation
      - Google Drive for document organization and permissions management

      ## Implementation Strategy

      ### Step 1: Workflow Analysis

      Begin by identifying repetitive tasks in your organization. Look for processes that:
      - Are performed frequently
      - Follow consistent patterns
      - Involve transferring information between tools
      - Require minimal critical thinking

      ### Step 2: Prioritization

      Evaluate potential automation opportunities based on:
      - Time saved per week
      - Error reduction potential
      - Implementation complexity
      - User adoption requirements

      ### Step 3: Pilot Implementation

      Start small with a pilot project that:
      - Addresses a significant pain point
      - Affects a limited user group initially
      - Can demonstrate clear ROI
      - Has a champion who understands the process

      ### Step 4: Expansion and Refinement

      After successful pilot implementation:
      - Gather user feedback
      - Refine the automation
      - Document the process
      - Expand to additional teams or processes

      ## Real-World Examples

      ### Example 1: Automated Document Generation

      A consulting firm implemented a system where completing a Google Form automatically:
      - Creates a new client project folder with appropriate permissions
      - Generates necessary contract documents with pre-filled client information
      - Creates a project timeline in Google Sheets
      - Adds key milestones to team calendars
      
      This reduced their project setup time from 3 hours to 15 minutes.

      ### Example 2: Meeting Efficiency System

      An executive team developed an automation that:
      - Creates meeting agenda documents before each recurring meeting
      - Emails participants requesting agenda items
      - Compiles responses into the agenda document
      - Sends pre-meeting reminders with the finalized agenda
      - Creates a follow-up task list after the meeting

      This improved meeting productivity by 40% and ensured consistent follow-through.

      ## Best Practices for Sustainable Automation

      1. **Document Everything**: Create clear documentation of all automated processes
      
      2. **Build for Maintainability**: Design automations that can be maintained by someone other than the original creator
      
      3. **Implement Error Handling**: Include notifications when automations fail or encounter unexpected data
      
      4. **Consider Security**: Ensure automations follow security best practices, especially when handling sensitive data
      
      5. **Plan for Evolution**: Design systems that can adapt as your organization's needs change

      ## Conclusion

      Google Workspace automation represents an enormous opportunity to reclaim time and focus on work that truly matters. By strategically implementing automation for repetitive tasks, organizations can significantly improve productivity, reduce errors, and enhance employee satisfaction.

      The most successful automation initiatives start with clear identification of pain points, thoughtful solution design, and ongoing refinement based on user feedback. When implemented effectively, these techniques can transform how your team works, creating competitive advantage through operational excellence.
    `,
    tags: ["Google Workspace", "Automation", "Productivity", "Workflow"]
  }
];

export const skills = [
  "AI Application Development",
  "Google Workspace Automation",
  "React & Next.js",
  "TypeScript",
  "Node.js",
  "API Development",
  "Data Analysis",
  "UI/UX Design",
];

const defaultSiteSettings = {
  siteTitle: "Repeat",
  siteDescription: "Professional portfolio of ASSAD, a fullstack developer specializing in AI-powered applications and Google Workspace automation.",
  githubUrl: "https://github.com",
  linkedinUrl: "https://linkedin.com",
  twitterUrl: "https://twitter.com",
  enableComments: true,
  enableAnalytics: true
};
