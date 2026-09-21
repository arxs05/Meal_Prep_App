const fs = require('fs');
const file = 'E:\\CODING\\Meal Prep Coord\\temp_next\\app\\plan\\[id]\\workspace\\page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the onChange handler
const oldHandler = 'onChange={(e) => setFormData({ ...formData, name: e.target.value })}';
const newHandler = `onChange={(e) => {
                     setFormData({ ...formData, name: e.target.value });
                     fetchSavedDishTemplates(e.target.value, session.user.id);
                   }}`;
content = content.replace(oldHandler, newHandler);

// Now find the input section and add suggestions UI
const inputSection = `                   className="w-full px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,27,45,0.6)] text-[#f0f4f8] placeholder:text-[#64748b] focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]"
                   placeholder="e.g., Oats Omelette"
                 />
               </div>`;

const suggestionsUI = `                   className="w-full px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,27,45,0.6)] text-[#f0f4f8] placeholder:text-[#64748b] focus:outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]"
                   placeholder="e.g., Oats Omelette"
                 />
                 {/* Template Suggestions */}
                 {isSearchingTemplates && (
                   <div className="mt-2 text-sm text-gray-600">
                     searching templates...
                   </div>
                 )}
                 {!isSearchingTemplates && savedDishTemplates.length > 0 && (
                   <div className="mt-2 space-y-1">
                     <p className="text-xs font-medium text-gray-500">Use saved template:</p>
                     {savedDishTemplates.map((template) => (
                       <button
                         key={template.id}
                         type="button"
                         onClick={() => loadSavedDishTemplate(template.id, session.user.id)}
                         className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                       >
                         {template.name}
                       </button>
                     ))}
                   </div>
                 )}
               </div>`;

content = content.replace(inputSection, suggestionsUI);

fs.writeFileSync(file, content, 'utf8');
console.log('Done');