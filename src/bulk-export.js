const SDK = require("azure-devops-extension-sdk");
const { getClient } = require("azure-devops-extension-api");
const { WorkItemTrackingRestClient } = require("azure-devops-extension-api/WorkItemTracking");
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

SDK.init();

SDK.ready().then(async () => {
    console.log("Bulk export initialized");
    
    // Setup event listeners
    setupEventListeners();
    
    SDK.notifyLoadSucceeded();
});

function setupEventListeners() {
    // Radio button changes
    document.querySelectorAll('input[name="exportMethod"]').forEach(radio => {
        radio.addEventListener('change', handleMethodChange);
    });
    
    // Button clicks
    document.getElementById('startExportBtn').addEventListener('click', handleStartExport);
    document.getElementById('previewBtn').addEventListener('click', handlePreview);
}

function handleMethodChange(e) {
    const method = e.target.value;
    
    // Hide all sections
    document.getElementById('querySection').style.display = 'none';
    document.getElementById('idsSection').style.display = 'none';
    document.getElementById('iterationSection').style.display = 'none';
    
    // Show selected section
    if (method === 'query') {
        document.getElementById('querySection').style.display = 'block';
    } else if (method === 'ids') {
        document.getElementById('idsSection').style.display = 'block';
    } else if (method === 'iteration') {
        document.getElementById('iterationSection').style.display = 'block';
    }
}

async function handlePreview() {
    try {
        showStatus('loading', '🔍 Loading work items...');
        
        const workItems = await getWorkItems();
        
        if (workItems.length === 0) {
            showStatus('error', 'No work items found');
            return;
        }
        
        // Show preview
        document.getElementById('workItemPreview').style.display = 'block';
        document.getElementById('previewInfo').innerHTML = `
            <p><strong>Found ${workItems.length} work item(s)</strong></p>
            <p>These work items will be exported:</p>
        `;
        
        const listHtml = workItems.map(wi => 
            `<div class="work-item-row">
                <span class="work-item-id">#${wi.id}</span> - 
                ${wi.fields["System.WorkItemType"]}: ${wi.fields["System.Title"]}
            </div>`
        ).join('');
        
        document.getElementById('workItemList').innerHTML = listHtml;
        
        hideStatus();
        
    } catch (error) {
        console.error("Error previewing:", error);
        showStatus('error', '✗ Failed to load work items: ' + error.message);
    }
}

async function handleStartExport() {
    try {
        const startBtn = document.getElementById('startExportBtn');
        startBtn.disabled = true;
        
        showStatus('loading', '📦 Loading work items...');
        
        const workItems = await getWorkItems();
        
        if (workItems.length === 0) {
            showStatus('error', 'No work items found');
            startBtn.disabled = false;
            return;
        }
        
        const outputType = document.querySelector('input[name="outputType"]:checked').value;
        
        if (outputType === 'single') {
            await exportSinglePDF(workItems);
        } else {
            await exportSeparatePDFs(workItems);
        }
        
        startBtn.disabled = false;
        
    } catch (error) {
        console.error("Error exporting:", error);
        showStatus('error', '✗ Export failed: ' + error.message);
        document.getElementById('startExportBtn').disabled = false;
    }
}

async function getWorkItems() {
    const method = document.querySelector('input[name="exportMethod"]:checked').value;
    const client = getClient(WorkItemTrackingRestClient);
    const context = SDK.getWebContext();
    const projectId = context.project.id;
    const teamId = context.team?.id;
    
    if (method === 'query') {
        // Get work items from query
        const queryName = document.getElementById('queryName').value.trim();
        
        if (!queryName) {
            // Use a simple WIQL query to get all work items in current project
            const wiql = {
                query: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project ORDER BY [System.Id] DESC`
            };
            
            const result = await client.queryByWiql(wiql, projectId);
            
            if (!result.workItems || result.workItems.length === 0) {
                return [];
            }
            
            // Limit to first 50 for performance
            const ids = result.workItems.slice(0, 50).map(wi => wi.id);
            const workItems = await client.getWorkItems(ids, undefined, undefined, undefined, "All");
            
            return workItems;
        } else {
            // Search for query by name
            const queries = await client.getQueries(projectId, undefined, 2); // depth 2 to get folders
            
            // Find query recursively
            const query = findQueryByName(queries, queryName);
            
            if (!query) {
                throw new Error(`Query '${queryName}' not found. Please check the name and try again.`);
            }
            
            // Execute query
            const result = await client.queryById(query.id, projectId);
            
            if (!result.workItems || result.workItems.length === 0) {
                return [];
            }
            
            const ids = result.workItems.map(wi => wi.id);
            const workItems = await client.getWorkItems(ids, undefined, undefined, undefined, "All");
            
            return workItems;
        }
        
    } else if (method === 'ids') {
        // Get work items by IDs
        const idsInput = document.getElementById('workItemIds').value;
        const ids = idsInput.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        
        if (ids.length === 0) {
            throw new Error("Please enter valid work item IDs");
        }
        
        const workItems = [];
        for (const id of ids) {
            try {
                const wi = await client.getWorkItem(id, undefined, undefined, undefined, "All");
                workItems.push(wi);
            } catch (err) {
                console.warn(`Could not load work item ${id}:`, err);
            }
        }
        
        return workItems;
        
    } else if (method === 'iteration') {
        // Get work items by iteration
        const iterationPath = document.getElementById('iterationPath').value.trim();
        
        if (!iterationPath) {
            throw new Error("Please enter an iteration path");
        }
        
        const wiql = {
            query: `SELECT [System.Id] FROM WorkItems WHERE [System.IterationPath] = '${iterationPath}' ORDER BY [System.Id]`
        };
        
        const result = await client.queryByWiql(wiql, projectId);
        
        if (!result.workItems || result.workItems.length === 0) {
            return [];
        }
        
        const ids = result.workItems.map(wi => wi.id);
        const workItems = await client.getWorkItems(ids, undefined, undefined, undefined, "All");
        
        return workItems;
    }
}

// Recursive function to find query by name
function findQueryByName(queries, queryName) {
    for (const query of queries) {
        if (query.name && query.name.toLowerCase() === queryName.toLowerCase()) {
            return query;
        }
        if (query.children && query.children.length > 0) {
            const found = findQueryByName(query.children, queryName);
            if (found) return found;
        }
    }
    return null;
}

async function exportSinglePDF(workItems) {
    showStatus('progress', `Exporting ${workItems.length} work items...`);
    
    const client = getClient(WorkItemTrackingRestClient);
    const doc = new jsPDF();
    let isFirstWorkItem = true;
    
    for (let i = 0; i < workItems.length; i++) {
        const workItem = workItems[i];
        
        // Update progress
        const progress = Math.round(((i + 1) / workItems.length) * 100);
        updateProgress(progress, `Processing ${i + 1} of ${workItems.length}`);
        
        // Load comments and updates
        let comments = null;
        let updates = null;
        
        try {
            comments = await client.getComments(workItem.id);
        } catch (err) {
            console.warn(`Could not load comments for ${workItem.id}:`, err);
        }
        
        try {
            updates = await client.getUpdates(workItem.id);
        } catch (err) {
            console.warn(`Could not load updates for ${workItem.id}:`, err);
        }
        
        // Add page break except for first item
        if (!isFirstWorkItem) {
            doc.addPage();
        }
        isFirstWorkItem = false;
        
        // Add complete work item to PDF using full generator logic
        await addCompleteWorkItemToPDF(doc, workItem, { comments, updates });
        
        // Small delay to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Save combined PDF
    const fileName = `BulkExport_${workItems.length}Items_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    showStatus('success', `✓ Exported ${workItems.length} work items to ${fileName}`);
}

async function exportSeparatePDFs(workItems) {
    showStatus('progress', `Exporting ${workItems.length} work items as separate files...`);
    
    const client = getClient(WorkItemTrackingRestClient);
    
    // Import the PDF generator from your existing file
    const { generateWorkItemPDF } = require("./exporters/pdf-generator");
    
    for (let i = 0; i < workItems.length; i++) {
        const workItem = workItems[i];
        
        // Update progress
        const progress = Math.round(((i + 1) / workItems.length) * 100);
        updateProgress(progress, `Exporting ${i + 1} of ${workItems.length}`);
        
        // Load comments and updates
        let comments = null;
        let updates = null;
        
        try {
            comments = await client.getComments(workItem.id);
        } catch (err) {
            console.warn(`Could not load comments for ${workItem.id}:`, err);
        }
        
        try {
            updates = await client.getUpdates(workItem.id);
        } catch (err) {
            console.warn(`Could not load updates for ${workItem.id}:`, err);
        }
        
        const options = {
            includeDescription: true,
            includeComments: true,
            includeHistory: true,
            includeAttachments: true,
            includeLinks: true,
            comments,
            updates,
            fileName: `WorkItem_${workItem.id}_${workItem.fields["System.WorkItemType"]}.pdf`
        };
        
        await generateWorkItemPDF(workItem, options);
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    showStatus('success', `✓ Exported ${workItems.length} separate PDFs`);
}

// COMPLETE work item PDF generation (matches your Phase 1 pdf-generator.js)
async function addCompleteWorkItemToPDF(doc, workItem, options) {
    const fields = workItem.fields;
    
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(`${fields["System.WorkItemType"]} #${workItem.id}`, margin, yPos);
    yPos += 10;
    
    // Work item title
    doc.setFontSize(16);
    doc.setFont(undefined, 'normal');
    const titleLines = doc.splitTextToSize(fields["System.Title"] || 'Untitled', contentWidth);
    doc.text(titleLines, margin, yPos);
    yPos += (titleLines.length * 7) + 10;
    
    // === DYNAMIC FIELDS TABLE ===
    const allFieldsData = [];
    const longTextFields = [];
    
    const fieldNames = Object.keys(fields).sort();
    
    for (const fieldName of fieldNames) {
        const value = fields[fieldName];
        
        if (value === null || value === undefined) {
            continue;
        }
        
        const friendlyName = getFriendlyFieldName(fieldName);
        const stringValue = convertValueToString(value);
        
        if (isLongTextField(fieldName, stringValue)) {
            longTextFields.push({ name: friendlyName, value: stringValue });
        } else {
            allFieldsData.push([friendlyName, stringValue]);
        }
    }
    
    // Create table with ALL short fields
    if (allFieldsData.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Work Item Fields", margin, yPos);
        yPos += 8;
        
        doc.autoTable({
            startY: yPos,
            head: [['Field', 'Value']],
            body: allFieldsData,
            theme: 'grid',
            headStyles: { fillColor: [0, 120, 212] },
            margin: { left: margin, right: margin },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 'auto' }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
    }
    
    // === LONG TEXT FIELDS ===
    for (const field of longTextFields) {
        yPos = checkPageBreak(doc, yPos, 30);
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(field.name, margin, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const cleanedText = stripHtml(field.value);
        if (cleanedText && cleanedText.trim()) {
            const textLines = doc.splitTextToSize(cleanedText, contentWidth);
            
            for (let i = 0; i < textLines.length; i++) {
                yPos = checkPageBreak(doc, yPos, 7);
                doc.text(textLines[i], margin, yPos);
                yPos += 7;
            }
            yPos += 10;
        }
    }
    
    // === COMMENTS ===
    if (options.comments?.comments?.length > 0) {
        yPos = checkPageBreak(doc, yPos, 30);
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Comments", margin, yPos);
        yPos += 8;
        
        for (const comment of options.comments.comments) {
            yPos = checkPageBreak(doc, yPos, 25);
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            
            const author = comment.revisedBy?.displayName || 
                          comment.revisedBy?.name || 
                          comment.createdBy?.displayName || 
                          'Unknown';
            const dateStr = comment.revisedDate || comment.createdDate || 'N/A';
            
            doc.text(`${author} - ${dateStr}`, margin, yPos);
            yPos += 6;
            
            doc.setFont(undefined, 'normal');
            const commentText = stripHtml(comment.text || comment.content || '');
            if (commentText && commentText.trim()) {
                const commentLines = doc.splitTextToSize(commentText, contentWidth);
                
                for (let j = 0; j < commentLines.length; j++) {
                    yPos = checkPageBreak(doc, yPos, 7);
                    doc.text(commentLines[j], margin, yPos);
                    yPos += 7;
                }
            }
            
            yPos += 5;
        }
        
        yPos += 5;
    }
    
    // === CHANGE HISTORY ===
    if (options.updates?.length > 0) {
        yPos = checkPageBreak(doc, yPos, 30);
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Latest Changes", margin, yPos);
        yPos += 8;
        
        const currentFieldNames = new Set(Object.keys(fields));
        
        const validUpdates = options.updates.filter(update => {
            if (!update.revisedDate) return false;
            try {
                const date = new Date(update.revisedDate);
                const year = date.getFullYear();
                return year >= 2000 && year <= 3000;
            } catch (e) {
                return false;
            }
        });
        
        const sortedUpdates = validUpdates.sort((a, b) => {
            try {
                return new Date(b.revisedDate) - new Date(a.revisedDate);
            } catch (e) {
                return 0;
            }
        });
        
        const latestUpdate = sortedUpdates[0];
        
        if (latestUpdate && latestUpdate.fields) {
            const changedBy = latestUpdate.revisedBy?.displayName || 'Unknown';
            const changedDate = latestUpdate.revisedDate || 'N/A';
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Changed by ${changedBy} on ${changedDate}`, margin, yPos);
            yPos += 10;
            
            const historyData = [];
            
            for (const fieldName of Object.keys(latestUpdate.fields)) {
                if (currentFieldNames.has(fieldName)) {
                    const fieldChange = latestUpdate.fields[fieldName];
                    const friendlyName = getFriendlyFieldName(fieldName);
                    const oldValue = convertValueToString(fieldChange.oldValue) || '(empty)';
                    const newValue = convertValueToString(fieldChange.newValue) || '(empty)';
                    
                    if (oldValue === newValue) continue;
                    if (containsInvalidDate(oldValue) || containsInvalidDate(newValue)) continue;
                    
                    historyData.push([friendlyName, oldValue, newValue]);
                }
            }
            
            if (historyData.length > 0) {
                doc.autoTable({
                    startY: yPos,
                    head: [['Field', 'Old Value', 'New Value']],
                    body: historyData,
                    theme: 'grid',
                    headStyles: { fillColor: [0, 120, 212] },
                    margin: { left: margin, right: margin },
                    styles: { fontSize: 8, cellPadding: 2 },
                    columnStyles: {
                        0: { cellWidth: 50, fontStyle: 'bold' },
                        1: { cellWidth: 65 },
                        2: { cellWidth: 65 }
                    }
                });
                
                yPos = doc.lastAutoTable.finalY + 10;
            }
        }
    }
    
    // === RELATED WORK ITEMS ===
    if (workItem.relations?.length > 0) {
        const relatedItems = workItem.relations
            .filter(rel => rel.rel && !rel.rel.includes("AttachedFile"))
            .map(rel => {
                const id = rel.url ? rel.url.split('/').pop() : 'N/A';
                const relType = rel.rel || 'Unknown';
                const comment = rel.attributes?.comment || rel.attributes?.name || '';
                return [relType, `#${id}`, comment];
            });
        
        if (relatedItems.length > 0) {
            yPos = checkPageBreak(doc, yPos, 30);
            
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text("Related Work Items", margin, yPos);
            yPos += 8;
            
            doc.autoTable({
                startY: yPos,
                head: [['Relation Type', 'ID', 'Details']],
                body: relatedItems,
                theme: 'grid',
                headStyles: { fillColor: [0, 120, 212] },
                margin: { left: margin, right: margin },
                styles: { fontSize: 9 }
            });
        }
    }
}

// Helper functions
function getFriendlyFieldName(fieldName) {
    let friendly = fieldName
        .replace('System.', '')
        .replace('Microsoft.VSTS.Common.', '')
        .replace('Microsoft.VSTS.Scheduling.', '')
        .replace('Microsoft.VSTS.TCM.', '')
        .replace('Microsoft.VSTS.', '');
    
    return friendly.replace(/([A-Z])/g, ' $1').trim();
}

function isLongTextField(fieldName, value) {
    const longTextFieldNames = [
        'System.Description',
        'Microsoft.VSTS.TCM.ReproSteps',
        'Microsoft.VSTS.Common.AcceptanceCriteria',
        'Microsoft.VSTS.TCM.SystemInfo',
        'System.History',
        'System.Details'
    ];
    
    if (longTextFieldNames.includes(fieldName)) return true;
    if (typeof value === 'string' && value.length > 200) return true;
    if (typeof value === 'string' && (value.includes('<div') || value.includes('<p>'))) return true;
    
    return false;
}

function convertValueToString(value) {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'object') {
        if (value.displayName) return value.displayName;
        if (value.name) return value.name;
        if (value.uniqueName) return value.uniqueName;
        try {
            return JSON.stringify(value);
        } catch (e) {
            return String(value);
        }
    }
    
    if (Array.isArray(value)) return value.join(', ');
    
    return String(value);
}

function containsInvalidDate(str) {
    if (!str) return false;
    return str.includes('9999') || str.includes('Invalid Date');
}

function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .replace(/\n\s+/g, '\n')
        .trim();
}

function checkPageBreak(doc, yPos, requiredSpace) {
    const pageHeight = doc.internal.pageSize.height;
    if (yPos + requiredSpace > pageHeight - 30) {
        doc.addPage();
        return 20;
    }
    return yPos;
}

function showStatus(type, message) {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `status-${type}`;
    statusDiv.style.display = 'block';
    
    if (type === 'progress') {
        statusDiv.innerHTML = `
            ${message}
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 0%">0%</div>
            </div>
        `;
    } else {
        statusDiv.innerHTML = message;
    }
}

function updateProgress(percent, message) {
    const statusDiv = document.getElementById('status');
    const progressFill = document.getElementById('progressFill');
    
    if (progressFill) {
        progressFill.style.width = percent + '%';
        progressFill.textContent = percent + '%';
    }
    
    statusDiv.className = 'status-progress';
    const messageText = statusDiv.childNodes[0];
    if (messageText) {
        messageText.textContent = message;
    }
}

function hideStatus() {
    document.getElementById('status').style.display = 'none';
}