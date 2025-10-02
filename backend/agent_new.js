const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const Chat = require('./models/Chat');
const { Tools } = require('./tools');

class NewAIAgent {
  constructor(projectRoot = null, ws = null) {
    this.projectRoot = projectRoot || process.env.PROJECT_ROOT || '/Users/ahmed/Desktop/APPS/Kairo';
    this.tools = new Tools(this.projectRoot);
    this.openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1'
    });
    this.ws = ws; // WebSocket connection for real-time updates
  }

  // Helper method to emit WebSocket messages
  async emitWebSocketMessage(type, data) {
    console.log(`🔌 Emitting WebSocket message: ${type}`, data);
    await new Promise(resolve => setImmediate(resolve)); // Allow logs to flush
    
    if (this.ws && this.ws.readyState === 1) { // WebSocket.OPEN
      const message = JSON.stringify({ type, ...data });
      console.log(`📤 Sending WebSocket message:`, message);
      await new Promise(resolve => setImmediate(resolve)); // Allow logs to flush
      
      try {
        this.ws.send(message);
        console.log(`✅ WebSocket message sent successfully: ${type}`);
        await new Promise(resolve => setImmediate(resolve)); // Allow logs to flush
      } catch (error) {
        console.error(`❌ Failed to send WebSocket message: ${type}`, error);
        await new Promise(resolve => setImmediate(resolve)); // Allow logs to flush
      }
    } else {
      console.log(`❌ WebSocket not ready. State: ${this.ws ? this.ws.readyState : 'null'}`);
      await new Promise(resolve => setImmediate(resolve)); // Allow logs to flush
    }
  }

  /**
   * Step 1: Generate Project Summary
   * This function analyzes the project structure and generates a comprehensive summary
   * including directories, files, framework, dependencies, and overall architecture
   */
  async generateProjectSummary(userInput) {
    try {
      console.log('🔍 Step 1: Generating project summary...');
      
      // Get project structure
      const projectStructure = await this.getProjectStructure();
      
      // Get key configuration files
      const configFiles = await this.getConfigFiles();
      
      // Create prompt for project analysis
      const analysisPrompt = `You are an expert software architect. Analyze the following project structure and generate a comprehensive JSON summary.

PROJECT STRUCTURE:
${JSON.stringify(projectStructure, null, 2)}

CONFIGURATION FILES:
${JSON.stringify(configFiles, null, 2)}

USER REQUEST:
${userInput}

Please generate a JSON response with the following structure:
{
  "projectOverview": {
    "name": "project name",
    "type": "web app, mobile app, library, etc.",
    "framework": "Next.js, React, Vue, etc.",
    "language": "TypeScript, JavaScript, Python, etc.",
    "architecture": "brief description of overall architecture"
  },
  "directoryStructure": {
    "mainDirectories": ["list of main directories"],
    "keyFiles": ["list of important files"],
    "entryPoints": ["main entry points like app/page.tsx, index.js, etc."]
  },
  "dependencies": {
    "framework": "main framework and version",
    "keyLibraries": ["list of important dependencies"],
    "buildTools": ["webpack, vite, next, etc."],
    "packageManager": "npm, yarn, pnpm"
  },
  "projectContext": {
    "purpose": "what this project does",
    "currentState": "development, production, etc.",
    "complexity": "simple, medium, complex",
    "size": "small, medium, large"
  },
  "userRequestAnalysis": {
    "requestType": "feature, bug fix, refactor, etc.",
    "affectedAreas": ["which parts of the project will be affected"],
    "complexity": "simple, medium, complex",
    "estimatedEffort": "low, medium, high"
  }
}

Respond ONLY with valid JSON, no additional text.`;

      // Call LLM to generate project summary
      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert software architect. Generate comprehensive project analysis in JSON format.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const summaryText = response.choices[0].message.content.trim();
      console.log('📋 Generated project summary:', summaryText);

      // Clean the response (remove markdown code blocks if present)
      let cleanedText = summaryText;
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Parse and validate JSON
      let projectSummary;
      try {
        projectSummary = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('❌ Failed to parse project summary JSON:', parseError);
        console.error('❌ Cleaned text:', cleanedText);
        throw new Error('Invalid JSON response from LLM');
      }

      // Save project summary to file for reference
      await this.saveProjectSummary(projectSummary);

      console.log('✅ Step 1 completed: Project summary generated');
      return projectSummary;

    } catch (error) {
      console.error('❌ Error in generateProjectSummary:', error);
      throw error;
    }
  }

  /**
   * Get project structure by scanning directories and files
   */
  async getProjectStructure() {
    try {
      const structure = await this.scanDirectory(this.projectRoot, 0, 3); // Max depth 3
      return structure;
    } catch (error) {
      console.error('Error getting project structure:', error);
      return { error: 'Failed to scan project structure' };
    }
  }

  /**
   * Recursively scan directory structure
   */
  async scanDirectory(dirPath, currentDepth, maxDepth) {
    if (currentDepth >= maxDepth) {
      return { name: path.basename(dirPath), type: 'directory', truncated: true };
    }

    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      const structure = {
        name: path.basename(dirPath),
        type: 'directory',
        children: []
      };

      for (const item of items) {
        // Skip node_modules, .git, and other common ignore directories
        if (['node_modules', '.git', '.next', 'dist', 'build'].includes(item.name)) {
          continue;
        }

        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          const subDir = await this.scanDirectory(itemPath, currentDepth + 1, maxDepth);
          structure.children.push(subDir);
        } else {
          structure.children.push({
            name: item.name,
            type: 'file',
            extension: path.extname(item.name)
          });
        }
      }

      return structure;
    } catch (error) {
      return { name: path.basename(dirPath), type: 'directory', error: error.message };
    }
  }

  /**
   * Get key configuration files
   */
  async getConfigFiles() {
    const configFiles = {};
    const configFileNames = [
      'package.json',
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.js',
      'README.md',
      'app/layout.tsx',
      'app/page.tsx'
    ];

    for (const fileName of configFileNames) {
      try {
        const filePath = path.join(this.projectRoot, fileName);
        const content = await fs.readFile(filePath, 'utf8');
        configFiles[fileName] = content;
      } catch (error) {
        // File doesn't exist or can't be read
        configFiles[fileName] = null;
      }
    }

    return configFiles;
  }

  /**
   * Save project summary to file for reference
   */
  async saveProjectSummary(summary) {
    try {
      const summaryPath = path.join(this.projectRoot, 'project-summary.json');
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      console.log('💾 Project summary saved to:', summaryPath);
    } catch (error) {
      console.error('Error saving project summary:', error);
    }
  }

  /**
   * Step 2: Generate Overview Todo Tasks
   * This function creates high-level overview tasks based on user request and project summary
   */
  async generateOverviewTasks(userInput, projectSummary, chatId = null) {
    try {
      console.log('🔍 Step 2: Generating overview todo tasks...');
      
      // Create prompt for task generation
      const taskPrompt = `You are an expert project manager. Based on the user request and project analysis, generate high-level overview tasks.

USER REQUEST:
${userInput}

PROJECT SUMMARY:
${JSON.stringify(projectSummary, null, 2)}

Generate 2-3 high-level overview tasks that need to be completed to fulfill the user's request. Each task should be:
- Direct and focused on the main deliverable
- Write code directly in the target file (no separate components unless absolutely necessary)
- Clear and specific about what file to create/update
- Appropriate for the project type and framework

PRIORITY: Generate tasks that write complete, functional code directly in the target files.

Respond with a JSON array of task objects in this exact format:
[
  {
    "text": "Brief description of the task",
    "tool": "appropriate_tool_name"
  },
  {
    "text": "Another task description", 
    "tool": "another_tool_name"
  }
]

Available tools: list_files, read_file, write_file, create_file, search_code, find_symbol, get_outline, refactor_symbol, extract_method, ast_edit, update_imports, organize_imports

Respond ONLY with valid JSON array, no additional text.`;

      // Call LLM to generate overview tasks
      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert project manager. Generate high-level overview tasks in JSON format.' },
          { role: 'user', content: taskPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const tasksText = response.choices[0].message.content.trim();
      console.log('📋 Generated overview tasks:', tasksText);

      // Clean the response (remove markdown code blocks if present)
      let cleanedText = tasksText;
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Parse and validate JSON
      let overviewTasks;
      try {
        overviewTasks = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('❌ Failed to parse overview tasks JSON:', parseError);
        console.error('❌ Cleaned text:', cleanedText);
        throw new Error('Invalid JSON response from LLM');
      }

      // Validate that it's an array
      if (!Array.isArray(overviewTasks)) {
        throw new Error('LLM response is not an array');
      }

      // Save todoList message to MongoDB if chatId is provided
      let todoListMessage = null;
      if (chatId) {
        todoListMessage = await this.saveTodoListMessage(chatId, overviewTasks);
        console.log('💾 Saved todoList message to MongoDB:', todoListMessage?._id);
      }

      console.log('✅ Step 2 completed: Overview tasks generated');
      return {
        tasks: overviewTasks,
        message: todoListMessage
      };

    } catch (error) {
      console.error('❌ Error in generateOverviewTasks:', error);
      throw error;
    }
  }

  /**
   * Step 3: Generate Subtasks for a Single Overview Task
   * This function takes an overview task and generates detailed subtasks with specific tools and parameters
   */
  async generateSubtasks(userInput, projectSummary, overviewTask, chatId = null, messageId = null, taskIndex = null) {
    try {
      console.log(`🔍 Step 3: Generating subtasks for: "${overviewTask.text}"`);
      
      // Create comprehensive tool descriptions
      const toolDescriptions = `
Available Tools and Parameters:

File Operations:
- list_files(path?) → List files/folders under path. Parameters: { "path": "optional directory path" }
- read_file(path) → Return full file contents. Parameters: { "path": "file path to read" }
- stream_read_file(path, start?, end?) → Stream large files/ranges. Parameters: { "path": "file path", "start": "line number", "end": "line number" }
- write_file(path, content) → Overwrite file. Parameters: { "path": "file path", "content": "file content" }
- create_file(path, content) → Create new file. Parameters: { "path": "file path", "content": "file content" }
- append_file(path, content) → Append to file. Parameters: { "path": "file path", "content": "content to append" }
- delete_file(path) → Delete file. Parameters: { "path": "file path to delete" }
- rename_file(oldPath, newPath) → Move/rename file. Parameters: { "oldPath": "current path", "newPath": "new path" }
- copy_file(src, dest) → Duplicate a file. Parameters: { "src": "source path", "dest": "destination path" }
- stat_file(path) → File metadata. Parameters: { "path": "file path" }

Search & Navigation:
- search_code(query, options?) → Text/code search across repo. Parameters: { "query": "search term", "options": { "includePattern": "*.tsx", "excludePattern": "node_modules/**" } }
- find_symbol(name) → Locate function/class/variable definition. Parameters: { "name": "symbol name" }
- get_outline(path) → Get file structure. Parameters: { "path": "file path" }
- find_references(symbol) → Find all usages of a symbol. Parameters: { "symbol": "symbol name" }

AST Refactoring:
- parse_ast(filePath) → Parse file into AST. Parameters: { "filePath": "file path" }
- ast_edit(filePath, edits) → Perform AST-safe code edits. Parameters: { "filePath": "file path", "edits": [{ "type": "insert", "position": 10, "text": "code" }] }
- refactor_symbol(oldName, newName, options?) → Safely rename symbols. Parameters: { "oldName": "old name", "newName": "new name", "options": { "dryRun": true } }
- extract_method(filePath, range, name, options?) → Extract code block into function. Parameters: { "filePath": "file path", "range": [10, 25], "name": "function name" }
- update_imports(filePath?, options?) → Optimize import statements. Parameters: { "filePath": "file path", "options": {} }
- organize_imports(options?) → Sort and deduplicate imports. Parameters: { "options": {} }`;

      // Create prompt for subtask generation
      const subtaskPrompt = `You are an expert software developer. Break down the following overview task into specific, actionable subtasks.

USER REQUEST:
${userInput}

PROJECT SUMMARY:
${JSON.stringify(projectSummary, null, 2)}

OVERVIEW TASK TO IMPLEMENT:
${JSON.stringify(overviewTask, null, 2)}

${toolDescriptions}

Generate EXACTLY 2-3 specific subtasks that will implement this overview task. Be DIRECT and focused. NO MORE THAN 3 SUBTASKS.

PRIORITY: Write the complete code directly in the target file. No unnecessary components or files.

For UI tasks, follow this pattern:
1. Write the complete code directly in the target file
2. Optional: Verify the file was created/updated

CRITICAL: 
- Write ALL code directly in the target file, don't create separate components
- For testimonials page, write the complete page with testimonials data embedded directly
- For layout updates, preserve existing code and only add what's needed
- DO NOT create unnecessary files like separate component files or data files
- Provide COMPLETE, FUNCTIONAL CODE, not placeholder text
- If user asks for "testimonials page", write everything in app/testimonials/page.tsx

Examples of CORRECT write_file parameters:
- {"path": "app/testimonials/page.tsx", "content": "import React from 'react';\n\nexport default function TestimonialsPage() {\n  const testimonials = [\n    { name: \"Sarah Johnson\", quote: \"Antalia Properties helped us find our dream home with exceptional service.\", rating: 5 },\n    { name: \"Michael Chen\", quote: \"Professional, knowledgeable, and made the entire process seamless.\", rating: 5 },\n    { name: \"Emily Davis\", quote: \"Their attention to detail and client care is unmatched in the industry.\", rating: 5 }\n  ];\n\n  return (\n    <div className=\"min-h-screen bg-gray-50 py-16\">\n      <div className=\"max-w-7xl mx-auto px-4\">\n        <h1 className=\"text-4xl font-bold text-center mb-12\">What Our Clients Say</h1>\n        <div className=\"grid md:grid-cols-2 lg:grid-cols-3 gap-8\">\n          {testimonials.map((testimonial, index) => (\n            <div key={index} className=\"bg-white rounded-lg shadow-md p-6\">\n              <p className=\"text-gray-700 mb-4\">\"{testimonial.quote}\"</p>\n              <div className=\"flex items-center justify-between\">\n                <span className=\"font-semibold\">{testimonial.name}</span>\n                <div className=\"flex text-yellow-400\">\n                  {[...Array(testimonial.rating)].map((_, i) => (\n                    <span key={i}>★</span>\n                  ))}\n                </div>\n              </div>\n            </div>\n          ))}\n        </div>\n      </div>\n    </div>\n  );\n}"}

Examples of INCORRECT write_file parameters:
- {"path": "app/testimonials/page.tsx", "content": "Updated content with modern UI design"} ❌
- {"path": "app/testimonials/page.tsx", "content": "New modern testimonials page"} ❌

Respond with a JSON array of subtask objects in this exact format:
[
  {
    "tool": "tool_name",
    "parameters": {
      "param1": "value1",
      "param2": "value2"
    },
    "explanation": "Brief description of what this subtask does"
  },
  {
    "tool": "another_tool",
    "parameters": {
      "param1": "value1"
    },
    "explanation": "Another subtask description"
  }
]

Respond ONLY with valid JSON array, no additional text.`;

      // Call LLM to generate subtasks
      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-5',
        messages: [
          { role: 'system', content: 'You are a Principal Front‑End Engineer and Motion Designer. Build production‑grade, accessible, high‑performance UI in [Next.js 14 App Router + React 19 + TypeScript], styled with [Tailwind + shadcn/ui + Radix], do not use [Framer Motion], forms with [React Hook Form + Zod], data with [tRPC/REST placeholder], state with [Zustand/Server Actions], and content with [MDX/Headless CMS placeholder]. Deliver code that can paste into a fresh project and run without errors.\n\nAccessibility: Keyboard focus order, ARIA only when necessary, visible focus rings, color contrast ≥ 4.5:1, motion‑reduced variants via prefers‑reduced‑motion.\n\nPerformance: 60fps animations; GPU‑accelerated transforms; lazy load heavy sections; Next/Image with proper sizes; avoid layout shift; tree‑shake imports; no blocking scripts.\n\nAnimations: Use Framer Motion with variants, AnimatePresence for route/conditional UI, micro‑interactions for hover, press, and focus states; subtle parallax/scroll‑linked effects; provide reduced‑motion fallbacks.\n\nUX flows: Provide information architecture (sitemap + primary flows), navbar with active states, onboarding CTA section, pricing or features grid, testimonial pattern, FAQ accordion, contact form with schema validation and error UI.\n\nDesign system: Use semantic tokens and Tailwind CSS variables; support light/dark with class strategy; follow an 8pt spacing scale and typographic ramp; include reusable Button, Input, Card, Sheet/Drawer, Dialog, Tabs.\n\nLayout: Responsive from 320–1536px, mobile‑first, fluid type, container queries where helpful; include meta tags, favicons, and Open Graph examples.\n\nGenerate specific, actionable subtasks in JSON format. MAXIMUM 3 subtasks - no more analyzing, just write code.' },
          { role: 'user', content: subtaskPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const subtasksText = response.choices[0].message.content.trim();
      console.log('📋 Generated subtasks (RAW LLM OUTPUT):');
      console.log('=' .repeat(80));
      console.log(subtasksText);
      console.log('=' .repeat(80));
      
      // Check if response is empty
      if (!subtasksText || subtasksText.length < 10) {
        console.error('❌ LLM returned empty or very short response');
        throw new Error('LLM returned empty response - try again with a simpler request');
      }

      // Clean the response (remove markdown code blocks if present)
      let cleanedText = subtasksText;
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Parse and validate JSON
      let subtasks;
      try {
        subtasks = JSON.parse(cleanedText);
        console.log('📋 Parsed subtasks (JSON):');
        console.log('=' .repeat(80));
        console.log(JSON.stringify(subtasks, null, 2));
        console.log('=' .repeat(80));
      } catch (parseError) {
        console.error('❌ Failed to parse subtasks JSON:', parseError);
        console.error('❌ Cleaned text:', cleanedText);
        throw new Error('Invalid JSON response from LLM');
      }

      // Validate that it's an array
      if (!Array.isArray(subtasks)) {
        throw new Error('LLM response is not an array');
      }

      // Enforce maximum 3 subtasks
      if (subtasks.length > 3) {
        console.log(`⚠️ Too many subtasks (${subtasks.length}), limiting to 3`);
        subtasks.splice(3);
      }

      // Validate subtask parameters
      for (let i = 0; i < subtasks.length; i++) {
        const subtask = subtasks[i];
        if (!subtask.tool || !subtask.parameters || !subtask.explanation) {
          throw new Error(`Subtask ${i + 1} is missing required fields: tool, parameters, or explanation`);
        }
        
        // Check for placeholder content in write_file operations
        if (subtask.tool === 'write_file' && subtask.parameters.content) {
          const content = subtask.parameters.content;
          const placeholderPatterns = [
            /updated content/i,
            /new.*design/i,
            /modern.*ui/i,
            /enhanced.*content/i,
            /improved.*code/i
          ];
          
          if (placeholderPatterns.some(pattern => pattern.test(content)) && content.length < 100) {
            console.warn(`⚠️ Warning: Subtask ${i + 1} appears to have placeholder content: "${content}"`);
          }
        }
      }

      // Update the overview task status to "active" in MongoDB
      if (chatId && messageId && taskIndex !== null) {
        await this.updateTodoListMessage(chatId, messageId, taskIndex, 'active');
        console.log(`📝 Updated overview task ${taskIndex + 1} status to "active"`);
      }

      console.log('✅ Step 3 completed: Subtasks generated');
      return {
        subtasks: subtasks,
        overviewTask: overviewTask
      };

    } catch (error) {
      console.error('❌ Error in generateSubtasks:', error);
      
      // Fallback: Generate a simple write_file task if subtask generation fails
      console.log('🔄 Attempting fallback: generating simple write_file task');
      const fallbackSubtasks = [{
        tool: 'write_file',
        parameters: {
          path: overviewTask.text.includes('testimonials') ? 'app/testimonials/page.tsx' : 'app/page.tsx',
          content: `import React from 'react';\n\nexport default function Page() {\n  return (\n    <div className="min-h-screen bg-gray-50 py-16">\n      <div className="max-w-7xl mx-auto px-4">\n        <h1 className="text-4xl font-bold text-center">Page Content</h1>\n        <p className="text-center mt-4">This is a placeholder page.</p>\n      </div>\n    </div>\n  );\n}`
        },
        explanation: 'Create a basic page with modern styling'
      }];
      
      console.log('📋 Using fallback subtasks:', JSON.stringify(fallbackSubtasks, null, 2));
      
      // Update the overview task status to "active" even for fallback
      if (chatId && messageId && taskIndex !== null) {
        await this.updateTodoListMessage(chatId, messageId, taskIndex, 'active');
        console.log(`📝 Updated overview task ${taskIndex + 1} status to "active" (fallback)`);
      }
      
      return {
        subtasks: fallbackSubtasks,
        overviewTask: overviewTask
      };
    }
  }

  /**
   * Step 4: Execute Subtasks
   * This function executes all subtasks in a loop and marks the parent task as done when complete
   */
  async executeSubtasks(subtasks, overviewTask, chatId = null, messageId = null, taskIndex = null) {
    try {
      // Handle both array and object formats
      const subtasksArray = Array.isArray(subtasks) ? subtasks : subtasks.subtasks;
      const taskInfo = Array.isArray(subtasks) ? overviewTask : subtasks.overviewTask;
      
      console.log(`🔍 Step 4: Executing ${subtasksArray.length} subtasks for: "${taskInfo.text}"`);
      
      const results = [];
      
      for (let i = 0; i < subtasksArray.length; i++) {
        const subtask = subtasksArray[i];
        console.log(`\n📋 Executing subtask ${i + 1}/${subtasksArray.length}: ${subtask.explanation}`);
        console.log(`🔧 Tool: ${subtask.tool}`);
        console.log(`⚙️ Parameters:`, JSON.stringify(subtask.parameters, null, 2));
        console.log('🔍 Full subtask object:', JSON.stringify(subtask, null, 2));
        
        try {
          // Execute the tool with the provided parameters
          const result = await this.executeTool(subtask.tool, subtask.parameters);
          
          console.log(`✅ Subtask ${i + 1} completed successfully`);
          console.log(`📄 Result:`, result);
          
          results.push({
            subtaskIndex: i,
            subtask: subtask,
            success: true,
            result: result
          });
          
        } catch (error) {
          console.error(`❌ Subtask ${i + 1} failed:`, error.message);
          
          results.push({
            subtaskIndex: i,
            subtask: subtask,
            success: false,
            error: error.message
          });
          
          // Continue with next subtask even if one fails
          console.log(`⏭️ Continuing with next subtask...`);
        }
        
        // Add a small delay between subtasks to allow logs to flush
        await new Promise(resolve => setImmediate(resolve));
      }
      
      // Mark the parent overview task as "done" in MongoDB
      if (chatId && messageId && taskIndex !== null) {
        await this.updateTodoListMessage(chatId, messageId, taskIndex, 'done');
        console.log(`📝 Updated overview task ${taskIndex + 1} status to "done"`);
      }
      
      console.log(`✅ Step 4 completed: All subtasks executed for "${taskInfo.text}"`);
      return {
        overviewTask: taskInfo,
        results: results,
        success: results.every(r => r.success)
      };
      
    } catch (error) {
      console.error('❌ Error in executeSubtasks:', error);
      throw error;
    }
  }

  /**
   * Complete Workflow: Process All Overview Tasks
   * This function processes all overview tasks sequentially:
   * 1. Generate subtasks for each overview task
   * 2. Execute the subtasks
   * 3. Mark the overview task as done
   * 4. Move to the next overview task
   */
  async processAllOverviewTasks(userInput, projectSummary, overviewTasks, chatId = null, messageId = null) {
    try {
      console.log(`🔍 Complete Workflow: Processing ${overviewTasks.length} overview tasks...`);
      
      const workflowResults = [];
      
      for (let i = 0; i < overviewTasks.length; i++) {
        const overviewTask = overviewTasks[i];
        console.log(`\n📋 Processing Overview Task ${i + 1}/${overviewTasks.length}: "${overviewTask.text}"`);
        console.log('=' .repeat(80));
        
        try {
          // Step 1: Generate subtasks for this overview task
          console.log(`🔍 Step 1: Generating subtasks for task ${i + 1}...`);
          const subtaskResult = await this.generateSubtasks(
            userInput,
            projectSummary,
            overviewTask,
            chatId,
            messageId,
            i // taskIndex
          );
          
          console.log(`✅ Generated ${subtaskResult.subtasks.length} subtasks for task ${i + 1}`);
          
          // Step 2: Execute the subtasks
          console.log(`🔍 Step 2: Executing subtasks for task ${i + 1}...`);
          const executionResult = await this.executeSubtasks(
            subtaskResult.subtasks,
            overviewTask,
            chatId,
            messageId,
            i // taskIndex
          );
          
          console.log(`✅ Completed task ${i + 1}: ${executionResult.success ? 'Success' : 'Partial Success'}`);
          
          // Store the results
          workflowResults.push({
            taskIndex: i,
            overviewTask: overviewTask,
            subtasks: subtaskResult.subtasks,
            executionResult: executionResult,
            success: executionResult.success
          });
          
          // Add a delay between tasks to allow logs to flush
          await new Promise(resolve => setImmediate(resolve));
          
        } catch (error) {
          console.error(`❌ Failed to process overview task ${i + 1}:`, error.message);
          
          // Mark the task as failed in MongoDB
          if (chatId && messageId) {
            await this.updateTodoListMessage(chatId, messageId, i, 'failed');
            console.log(`📝 Marked overview task ${i + 1} as "failed"`);
          }
          
          // Store the failed result
          workflowResults.push({
            taskIndex: i,
            overviewTask: overviewTask,
            subtasks: [],
            executionResult: null,
            success: false,
            error: error.message
          });
          
          // Continue with the next task even if one fails
          console.log(`⏭️ Continuing with next overview task...`);
        }
      }
      
      // Calculate overall success
      const successfulTasks = workflowResults.filter(r => r.success).length;
      const totalTasks = workflowResults.length;
      const overallSuccess = successfulTasks === totalTasks;
      
      console.log(`\n🎯 Complete Workflow Summary:`);
      console.log(`📊 Total Overview Tasks: ${totalTasks}`);
      console.log(`✅ Successful: ${successfulTasks}`);
      console.log(`❌ Failed: ${totalTasks - successfulTasks}`);
      console.log(`🎉 Overall Success: ${overallSuccess ? 'Yes' : 'Partial'}`);
      
      return {
        success: overallSuccess,
        totalTasks: totalTasks,
        successfulTasks: successfulTasks,
        failedTasks: totalTasks - successfulTasks,
        results: workflowResults,
        message: overallSuccess 
          ? 'All overview tasks completed successfully' 
          : `${successfulTasks}/${totalTasks} overview tasks completed successfully`
      };
      
    } catch (error) {
      console.error('❌ Error in processAllOverviewTasks:', error);
      throw error;
    }
  }

  /**
   * Execute a single tool with parameters
   */
  async executeTool(toolName, parameters) {
    try {
      console.log(`🔧 Executing tool: ${toolName}`);
      
      // Map tool names to actual tool methods
      switch (toolName) {
        // File Operations
        case 'list_files':
          return await this.tools.list_files(parameters.path);
        case 'read_file':
          return await this.tools.read_file(parameters.path);
        case 'stream_read_file':
          return await this.tools.stream_read_file(parameters.path, parameters.start, parameters.end);
        case 'write_file':
          return await this.tools.write_file(parameters.path, parameters.content);
        case 'create_file':
          return await this.tools.create_file(parameters.path, parameters.content);
        case 'append_file':
          return await this.tools.append_file(parameters.path, parameters.content);
        case 'delete_file':
          return await this.tools.delete_file(parameters.path);
        case 'rename_file':
          return await this.tools.rename_file(parameters.oldPath, parameters.newPath);
        case 'copy_file':
          return await this.tools.copy_file(parameters.src, parameters.dest);
        case 'stat_file':
          return await this.tools.stat_file(parameters.path);
        
        // Search & Navigation
        case 'search_code':
          return await this.tools.search_code(parameters.query, parameters.options);
        case 'find_symbol':
          return await this.tools.find_symbol(parameters.name);
        case 'get_outline':
          return await this.tools.get_outline(parameters.path);
        case 'find_references':
          return await this.tools.find_references(parameters.symbol);
        
        // AST Refactoring
        case 'parse_ast':
          return await this.tools.astRefactoring.parse_ast(parameters.filePath);
        case 'ast_edit':
          return await this.tools.astRefactoring.ast_edit(parameters.filePath, parameters.edits);
        case 'refactor_symbol':
          return await this.tools.astRefactoring.refactor_symbol(parameters.oldName, parameters.newName, parameters.options);
        case 'extract_method':
          return await this.tools.astRefactoring.extract_method(parameters.filePath, parameters.range, parameters.name, parameters.options);
        case 'update_imports':
          return await this.tools.astRefactoring.update_imports(parameters.filePath, parameters.options);
        case 'organize_imports':
          return await this.tools.astRefactoring.organize_imports(parameters.options);
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`❌ Error executing tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Update todoList message in MongoDB (copied from original agent.js)
   */
  async updateTodoListMessage(chatId, messageId, taskIndex, status) {
    try {
      if (!chatId || !messageId) return null;
      
      const updateData = {
        [`todoListTasks.${taskIndex}.status`]: status
      };
      
      const message = await Message.findByIdAndUpdate(
        messageId,
        updateData,
        { new: true }
      );
      
      // Emit WebSocket message to notify frontend of todoList update
      await this.emitWebSocketMessage('todoList_updated', {
        messageId: messageId,
        taskIndex: taskIndex,
        status: status
      });
      
      return message;
    } catch (error) {
      console.error('Error updating todoList message:', error);
      return null;
    }
  }

  /**
   * Save a message to MongoDB
   */
  async saveMessage(chatId, content, role, messageType = 'text', stepData = null, metadata = {}) {
    try {
      if (!chatId) return null;
      
      const message = new Message({
        chatId,
        content,
        role,
        messageType,
        stepData,
        metadata: {
          timestamp: new Date(),
          projectContext: metadata.projectContext || null,
          agentProcessing: metadata.agentProcessing || false,
          ...metadata
        }
      });
      
      await message.save();
      console.log(`📝 Saved ${role} message to MongoDB:`, message._id);
      
      // Emit WebSocket message to notify frontend of new message
      await this.emitWebSocketMessage('message_created', {
        messageId: message._id,
        chatId: chatId,
        messageType: messageType,
        role: role
      });
      
      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }

  /**
   * Save todoList message to MongoDB
   */
  async saveTodoListMessage(chatId, tasks) {
    try {
      if (!chatId) return null;
      
      const message = new Message({
        chatId,
        content: '',
        role: 'assistant',
        messageType: 'todoList',
        todoListTasks: tasks.map((task, index) => ({
          taskId: index + 1,
          text: task.text,
          status: 'pending',
        })),
        metadata: {
          timestamp: new Date(),
          projectContext: this.projectRoot,
          agentProcessing: true
        }
      });
      
      await message.save();
      
      // Update chat's last message time and message count
      await Chat.findByIdAndUpdate(chatId, {
        lastMessageAt: new Date(),
        $inc: { messageCount: 1 }
      });
      
      console.log('📝 Saved todoList message to MongoDB:', message._id);
      
      // Emit WebSocket message to notify frontend of new todoList message
      await this.emitWebSocketMessage('message_created', {
        messageId: message._id,
        chatId: chatId,
        messageType: 'todoList',
        role: 'assistant'
      });
      
      return message;
      
    } catch (error) {
      console.error('Error saving todoList message:', error);
      return null;
    }
  }

  /**
   * Main workflow entry point
   */
  async processRequest(userInput, chatId = null) {
    try {
      console.log('🚀 Starting new agent workflow...');
      console.log('📝 User request:', userInput);

      // Save user message to MongoDB if chatId is provided
      let userMessage = null;
      if (chatId) {
        userMessage = await this.saveMessage(chatId, userInput, 'user', 'text', null, {
          projectContext: this.projectRoot,
          agentProcessing: false
        });
        console.log('💾 Saved user message to MongoDB:', userMessage?._id);
      }

      // Step 1: Generate project summary
      const projectSummary = await this.generateProjectSummary(userInput);
      
      // Step 2: Generate overview todo tasks
      const todoResult = await this.generateOverviewTasks(userInput, projectSummary, chatId);
      
      // Step 3: Process all overview tasks (generate subtasks and execute them)
      const workflowResult = await this.processAllOverviewTasks(
        userInput,
        projectSummary,
        todoResult.tasks,
        chatId,
        todoResult.message?._id
      );
      
      console.log('✅ Complete workflow finished');
      return {
        success: workflowResult.success,
        userMessage,
        projectSummary,
        overviewTasks: todoResult.tasks,
        todoListMessage: todoResult.message,
        workflowResult: workflowResult,
        message: workflowResult.message
      };

    } catch (error) {
      console.error('❌ Workflow failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = NewAIAgent;
