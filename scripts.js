const initialJsonData = { "cmd_stack": { "modifications": [{ "control_name": "fccm_generated_commands", "operation": "insert_front", "value": [] }] } };
let jsonData = JSON.parse(JSON.stringify(initialJsonData));

const dataContainer = document.getElementById('dataContainer');
const addCategoryForm = document.getElementById('addCategoryForm');
const addCommandForm = document.getElementById('addCommandForm');
const addCommandModal = document.getElementById('addCommandModal');

function getCategories() { return jsonData.cmd_stack.modifications[0].value; }

function renderData() {
    dataContainer.innerHTML = '';
    getCategories().forEach((catObj) => {
        const catKey = Object.keys(catObj)[0];
        const catData = catObj[catKey];
        const isExpanded = catData['$is_category_expanded'];

        const catDiv = document.createElement('div');
        catDiv.className = "flex flex-col border-b border-zinc-800";
        catDiv.innerHTML = `
                    <div class="category-header px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-zinc-700 transition" onclick="toggleCategoryCollapse('${catKey}')">
                        <span class="text-xs font-bold uppercase tracking-wider text-gray-200">${catData['$category']}</span>
                        <div class="flex items-center space-x-3">
                            <button onclick="event.stopPropagation(); showAddCommandModal('${catKey}')" class="text-blue-400 text-xs hover:text-white"><i class="fas fa-plus"></i></button>
                            <button onclick="event.stopPropagation(); deleteCategory('${catKey}')" class="text-red-500 text-xs hover:text-white"><i class="fas fa-trash"></i></button>
                            <i class="fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[10px] text-zinc-500"></i>
                        </div>
                    </div>
                    <div id="commands-${catKey}" class="p-2 space-y-1 bg-zinc-900 ${isExpanded ? '' : 'hidden'}">
                        ${(catData['$content'] || []).map((cmd, idx) => {
            const cmdKey = Object.keys(cmd)[0];
            const cmdData = cmd[cmdKey];
            return `
                            <div class="group relative flex items-center">
                                <button class="mc-button w-full text-left px-3 py-2 text-[11px] text-zinc-300 font-mono overflow-hidden whitespace-nowrap truncate">
                                    ${cmdData['$command']}
                                </button>
                                <button onclick="deleteCommand('${catKey}',${idx})" class="absolute right-2 opacity-0 group-hover:opacity-100 text-red-500 bg-zinc-800 p-1 rounded transition">
                                    <i class="fas fa-times text-[10px]"></i>
                                </button>
                            </div>`;
        }).join('')}
                        ${catData['$content'].length === 0 ? '<p class="text-[10px] text-zinc-600 text-center py-2 italic">No commands yet</p>' : ''}
                    </div>
                `;
        dataContainer.appendChild(catDiv);
    });
}

// Logic Functions (Same as your original, just UI updated)
function toggleCategoryCollapse(catKey) {
    const cat = getCategories().find(c => c[catKey])[catKey];
    cat['$is_category_expanded'] = !cat['$is_category_expanded'];
    renderData();
}

function deleteCategory(catKey) {
    jsonData.cmd_stack.modifications[0].value = jsonData.cmd_stack.modifications[0].value.filter(c => !c[catKey]);
    renderData();
}

function deleteCommand(catKey, idx) {
    const cat = getCategories().find(c => c[catKey])[catKey];
    cat['$content'].splice(idx, 1);
    renderData();
}

function showAddCommandModal(catKey) {
    document.getElementById('currentCategoryId').value = catKey;
    addCommandModal.classList.remove('hidden');
}

function closeModal() {
    addCommandModal.classList.add('hidden');
    addCommandForm.reset();
}

addCategoryForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('newCategoryName').value;
    const desc = document.getElementById('newCategoryDescription').value;
    const newId = `cat-${Date.now()}@T1M0THYYt-fastcmd:core.category`;
    getCategories().push({ [newId]: { "$category": name, "$custom_category_description": desc, "$is_category_expanded": true, "$is_custom_category": true, "$content": [] } })
    renderData(); addCategoryForm.reset();
});

addCommandForm.addEventListener('submit', e => {
    e.preventDefault();
    const catKey = document.getElementById('currentCategoryId').value;
    const cmd = document.getElementById('commandInput').value;
    const tip = document.getElementById('tooltipInput').value;
    const label = document.getElementById('ButtonLabelInput').value;
    const isChat = document.getElementById('isChatInput').checked;
    const newId = `cmd-${Date.now()}@T1M0THYYt-fastcmd:core.command`;
    const newCmd = { [newId]: { "$command": cmd } };
    if (isChat) newCmd[newId]['$is_chat_not_command'] = true;
    if (label) newCmd[newId]['$additional_text_only_label_not_included_as_command_or_chat'] = label;
    if (tip) { newCmd[newId]['$command_tooltip_enabled'] = true; newCmd[newId]['$command_tooltip'] = tip; }
    getCategories().find(c => c[catKey])[catKey]['$content'].push(newCmd);
    renderData(); closeModal();
});

// Export logic remains the same...
function generateUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); }

document.getElementById('exportForm').addEventListener('submit', async e => {
    e.preventDefault();
    const uidef = { "ui_defs": ["ui/t1m0thy/common.json"] };
    const name = document.getElementById('packName').value + " §7§k|§r§f §bFast Commands Extension";
    const description = "§oGenerated with Fast Commands Command Manager §l(FCCM)§r§f | §bFCCM Created by @T1M0THYYt\n§o§7" + document.getElementById('packDescription').value;
    const manifest = { "format_version": 2, "header": { "name": name, "description": description, "uuid": generateUUID(), "version": [1, 0, 0], "min_engine_version": [1, 21, 70] }, "modules": [{ "type": "resources", "uuid": generateUUID(), "version": [1, 0, 0] }] };
    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("ui/t1m0thy/common.json", JSON.stringify(jsonData, null, 2));
    zip.file("ui/_ui_defs.json", JSON.stringify(uidef, null, 2));
    const content = await zip.generateAsync({ type: "base64" });
    const a = document.createElement("a");
    a.href = `data:application/zip;base64,${content}`;
    a.download = name.replace(/\s+/g, "_") + "_pack.mcpack";
    a.click();
});

renderData();