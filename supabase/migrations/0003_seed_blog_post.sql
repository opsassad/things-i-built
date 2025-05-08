-- Seed sample blog post data for blog_posts table

INSERT INTO public.blog_posts (
    id, title, excerpt, content, category, tags, date, read_time,
    author_name, author_role, technologies, features, detailed_description,
    image_url, featured_image, author_image, link, is_draft, slug, status,
    created_at, updated_at, view_count, like_count, seo_score
) VALUES (
    -- ID format: blog/<slug>
    'blog/mastering-asynchronous-javascript',
    'Mastering Asynchronous JavaScript: Callbacks, Promises, and Async/Await', -- title
    'A deep dive into handling asynchronous operations in JavaScript, comparing callbacks, Promises, and the modern async/await syntax.', -- excerpt
    -- IMPORTANT: Escaped single quotes ('') inside the content string for SQL compatibility
    '<p>Asynchronous programming is fundamental to JavaScript, especially for tasks like fetching data, handling user events, or interacting with timers. Without understanding how to manage async operations, you can easily run into confusing bugs like callback hell or unhandled promise rejections. This post explores the evolution of async handling in JS.</p><h3>The Old Way: Callbacks</h3><p>Initially, JavaScript relied heavily on callback functions. You pass a function (the callback) as an argument to another function, and it gets executed once the asynchronous operation completes.</p><pre><code class="language-javascript">function fetchData(url, callback) {
  console.log(`Fetching from ${url}...`);
  setTimeout(() => { // Simulate network request
    const data = { message: ''Data received!'' }; // Escaped quote
    callback(null, data); // First arg is error (null if none), second is result
  }, 1000);
}

fetchData(''/api/data'', (error, data) => { // Escaped quote
  if (error) {
    console.error(''Error fetching data:'', error); // Escaped quotes
  } else {
    console.log(''Success:'', data.message); // Escaped quotes
  }
});</code></pre><p>While functional, nesting multiple callbacks (e.g., fetch data, then process it, then update UI) leads to deeply indented, hard-to-read code known as "Callback Hell".</p><h3>The Better Way: Promises</h3><p>Promises provide a cleaner way to handle asynchronous results. A Promise object represents the eventual completion (or failure) of an asynchronous operation and its resulting value.</p><pre><code class="language-javascript">function fetchDataPromise(url) {
  return new Promise((resolve, reject) => {
    console.log(`Fetching from ${url}...`);
    setTimeout(() => {
      const success = Math.random() > 0.2; // Simulate potential failure
      if (success) {
        const data = { message: ''Data via Promise!'' }; // Escaped quote
        resolve(data);
      } else {
        reject(new Error(''Failed to fetch data'')); // Escaped quote
      }
    }, 1000);
  });
}

fetchDataPromise(''/api/data'') // Escaped quote
  .then(data => {
    console.log(''Success:'', data.message); // Escaped quotes
    // Chain further operations here
    return processData(data);
  })
  .then(processedResult => {
    console.log(''Processed:'', processedResult); // Escaped quotes
  })
  .catch(error => {
    console.error(''Promise Error:'', error.message); // Escaped quotes
  });</code></pre><p>Promises allow chaining (`.then()`) and centralized error handling (`.catch()`), making the code flatter and more manageable.</p><h3>The Modern Way: Async/Await</h3><p>Built on top of Promises, `async/await` provides syntactic sugar that makes asynchronous code look and behave more like synchronous code, further improving readability.</p><pre><code class="language-javascript">// Assumes fetchDataPromise from previous example exists

async function getData() {
  console.log(''Starting async function...''); // Escaped quote
  try {
    console.log(''Fetching data...''); // Escaped quote
    const data = await fetchDataPromise(''/api/data''); // Pauses here until promise settles - Escaped quote
    console.log(''Success:'', data.message); // Escaped quotes

    console.log(''Processing data...''); // Escaped quote
    const processedResult = await processData(data); // Assumes processData returns a Promise
    console.log(''Processed:'', processedResult); // Escaped quotes

    return processedResult;
  } catch (error) {
    console.error(''Async/Await Error:'', error.message); // Escaped quotes
    // Handle error appropriately
  }
}

getData();
console.log(''Async function called, but execution continues here...''); // Escaped quote</code></pre><p>Key points about `async/await`:</p><ul><li>`async` keyword is needed to define a function that uses `await`.</li><li>`await` pauses the execution of the `async` function until the Promise settles.</li><li>It only works with Promises (or promise-like objects).</li><li>Use `try...catch` blocks for error handling around `await` calls.</li></ul><p>Understanding these patterns is crucial for writing effective, maintainable JavaScript code in modern web development.</p><p><img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Code on a screen"></p>', -- content (HTML formatted)
    'Blog', -- category
    '["JavaScript", "Asynchronous", "Promises", "Async/Await", "Callbacks", "Web Development", "Frontend"]', -- tags (JSONB array)
    '2024-06-01T09:30:00Z', -- date (ISO 8601 format)
    '6 min read', -- read_time
    'Jane Doe', -- author_name
    'Senior Frontend Developer', -- author_role
    '["JavaScript (ES6+)"]', -- technologies (JSONB array)
    null, -- features (null for blog post)
    null, -- detailed_description (null for blog post)
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', -- image_url (can be same as featured)
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', -- featured_image
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', -- author_image
    null, -- link (null for blog post, or link to source/demo)
    false, -- is_draft
    -- Slug format: <slug>
    'mastering-asynchronous-javascript',
    'published', -- status
    now(), -- created_at
    now(), -- updated_at
    980, -- view_count (example)
    65, -- like_count (example)
    88 -- seo_score (example)
); 