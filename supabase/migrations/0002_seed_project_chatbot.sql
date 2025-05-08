-- Seed sample project data for blog_posts table

INSERT INTO public.blog_posts (
    id, title, excerpt, content, category, tags, date, read_time,
    author_name, author_role, technologies, features, detailed_description,
    image_url, featured_image, author_image, link, is_draft, slug, status,
    created_at, updated_at, view_count, like_count, seo_score
) VALUES (
    -- ID format: project/<slug>
    'project/ai-powered-customer-support-chatbot-ecommerce', 
    'AI-Powered Customer Support Chatbot for E-commerce', -- title
    'Revolutionizing online retail customer service with an intelligent, context-aware chatbot built using NLP and machine learning.', -- excerpt
    -- IMPORTANT: Escaped single quotes ('') inside the content string for SQL compatibility
    '<p>This project showcases the development of an advanced chatbot designed to handle customer inquiries for an e-commerce platform. Unlike traditional chatbots, this solution leverages Natural Language Processing (NLP) and machine learning to understand user intent, maintain context across conversations, and provide personalized responses.</p><h3>Problem Statement</h3><p>E-commerce businesses often struggle with high volumes of customer support requests, leading to slow response times and customer dissatisfaction. Existing chatbot solutions are often rule-based and fail to handle complex queries or understand nuanced language.</p><h3>Solution Overview</h3><p>We developed a chatbot integrated directly into the e-commerce platform. Key features include:</p><ul><li><strong>Natural Language Understanding:</strong> Using models like BERT for intent recognition and entity extraction.</li><li><strong>Context Management:</strong> Remembering previous interactions within a session.</li><li><strong>Integration with Backend Systems:</strong> Accessing order history, product information, and shipping status in real-time.</li><li><strong>Sentiment Analysis:</strong> Detecting customer frustration and escalating to human agents when necessary.</li><li><strong>Multilingual Support:</strong> Capable of communicating in multiple languages.</li></ul><p>The backend is built with Python (Flask/FastAPI), utilizing libraries like spaCy, Transformers, and SQLAlchemy. The frontend integration uses React and WebSockets for real-time communication.</p><h4>Example: Intent Recognition (Python)</h4><pre><code class="language-python"># Simplified example using a hypothetical library
from nlp_processor import NlpModel

model = NlpModel("ecommerce-intent-model")

def get_intent(user_message):
    analysis = model.predict(user_message)
    intent = analysis.get_top_intent()
    entities = analysis.extract_entities([''order_id'', ''product_name'']) -- Escaped quotes
    return intent, entities

message = "What''''s the status of my order #12345?" -- Escaped quote in string
intent, entities = get_intent(message)
# intent might be ''TRACK_ORDER'' -- Escaped quotes
# entities might be {''order_id'': ''12345''} -- Escaped quotes
</code></pre><h4>Example: Real-time API Call (Pseudo-code)</h4><pre><code class="language-pseudocode">FUNCTION handle_track_order(entities):
  order_id = entities.get(''order_id'') -- Escaped quotes
  IF order_id IS NOT NULL:
    status = CALL_ORDER_API(''/status'', order_id)
    RETURN format_response("Your order status is: " + status)
  ELSE:
    RETURN "Please provide your order ID."
  END IF
END FUNCTION</code></pre><h3>Results</h3><p>Initial deployments showed a 40% reduction in human agent workload for tier-1 support queries and a 15% increase in customer satisfaction scores related to support interactions.</p><p><img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Chatbot Development Interface"></p>', -- content (HTML formatted)
    'Project', -- category
    '["AI", "Machine Learning", "NLP", "Chatbot", "E-commerce", "Customer Support", "Python", "React"]', -- tags (JSONB array)
    '2024-05-15T10:00:00Z', -- date (ISO 8601 format)
    '8 min read', -- read_time
    'Alex Johnson', -- author_name
    'Lead AI Engineer', -- author_role
    '["Python", "Flask", "spaCy", "Hugging Face Transformers", "React", "PostgreSQL", "Docker", "AWS SageMaker"]', -- technologies (JSONB array)
    '["Intent Recognition", "Entity Extraction", "Contextual Conversation", "Real-time Data Integration", "Sentiment Analysis", "Automated Escalation", "Multilingual Capabilities"]', -- features (JSONB array)
    '<p>The core challenge was building a system that not only understands text but also the underlying intent and context specific to e-commerce scenarios (e.g., returns, order tracking, product queries). We employed transfer learning on pre-trained language models, fine-tuning them with domain-specific data. The database integration allows the bot to provide specific, actionable information rather than generic responses. Deployment on AWS ensures scalability and reliability.</p>', -- detailed_description
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', -- image_url (can be same as featured)
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', -- featured_image
    'https://images.unsplash.com/photo-1557862921-37829c790f19?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80', -- author_image
    'https://github.com', -- link (placeholder - replace with actual link)
    false, -- is_draft
    -- Slug format: <slug>
    'ai-powered-customer-support-chatbot-ecommerce', 
    'published', -- status
    now(), -- created_at
    now(), -- updated_at
    1250, -- view_count (example)
    85, -- like_count (example)
    92 -- seo_score (example)
); 