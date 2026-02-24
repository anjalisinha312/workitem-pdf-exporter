const { jsPDF } = require('jspdf');
require('jspdf-autotable');

function generateWorkItemPDF(workItem, options) {
    const doc = new jsPDF();
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
    
    // Get all field names sorted alphabetically
    const fieldNames = Object.keys(fields).sort();
    
    console.log("Total fields found:", fieldNames.length);
    
    for (const fieldName of fieldNames) {
        const value = fields[fieldName];
        
        // Skip null/undefined values
        if (value === null || value === undefined) {
            continue;
        }
        
        // Get friendly field name
        const friendlyName = getFriendlyFieldName(fieldName);
        
        // Convert value to string
        const stringValue = convertValueToString(value);
        
        // Determine if this is a long text field
        if (isLongTextField(fieldName, stringValue)) {
            longTextFields.push({ name: friendlyName, value: stringValue, originalName: fieldName });
        } else {
            // Add to table
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
        } else {
            doc.setTextColor(150);
            doc.text(`No ${field.name.toLowerCase()}`, margin, yPos);
            doc.setTextColor(0);
            yPos += 15;
        }
    }
    
    // === COMMENTS ===
    if (options.includeComments && options.comments?.comments?.length > 0) {
        yPos = checkPageBreak(doc, yPos, 30);
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Comments", margin, yPos);
        yPos += 8;
        
        for (let i = 0; i < options.comments.comments.length; i++) {
            const comment = options.comments.comments[i];
            yPos = checkPageBreak(doc, yPos, 25);
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            
            // Get author from revisedBy
            let author = 'Unknown';
            if (comment.revisedBy) {
                author = comment.revisedBy.displayName || 
                        comment.revisedBy.name || 
                        comment.revisedBy.uniqueName || 
                        'Unknown';
            } else if (comment.createdBy) {
                author = comment.createdBy.displayName || 
                        comment.createdBy.name || 
                        comment.createdBy.uniqueName || 
                        'Unknown';
            }
            
            // Get date from revisedDate
            let dateStr = 'N/A';
            if (comment.revisedDate) {
                dateStr = comment.revisedDate;
            } else if (comment.createdDate) {
                dateStr = comment.createdDate;
            } else if (comment.modifiedDate) {
                dateStr = comment.modifiedDate;
            }
            
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
    
    // === CHANGE HISTORY - ONLY VALID LATEST CHANGES ===
    if (options.includeHistory && options.updates?.length > 0) {
        yPos = checkPageBreak(doc, yPos, 30);
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Latest Changes", margin, yPos);
        yPos += 8;
        
        // Get current field names for filtering
        const currentFieldNames = new Set(Object.keys(fields));
        
        // Filter out updates with invalid dates (year > 3000)
        const validUpdates = options.updates.filter(update => {
            if (!update.revisedDate) return false;
            try {
                const date = new Date(update.revisedDate);
                const year = date.getFullYear();
                return year >= 2000 && year <= 3000; // Valid years only
            } catch (e) {
                return false;
            }
        });
        
        // Sort by date descending to get the latest valid one
        const sortedUpdates = validUpdates.sort((a, b) => {
            try {
                const dateA = new Date(a.revisedDate);
                const dateB = new Date(b.revisedDate);
                return dateB - dateA; // Descending order (newest first)
            } catch (e) {
                return 0;
            }
        });
        
        // Get only the latest valid update
        const latestUpdate = sortedUpdates[0];
        
        if (latestUpdate && latestUpdate.fields) {
            const changedBy = extractValue(latestUpdate.revisedBy) || 'Unknown';
            const changedDate = latestUpdate.revisedDate || 'N/A';
            
            // Show when the change happened
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Changed by ${changedBy} on ${changedDate}`, margin, yPos);
            yPos += 10;
            
            const historyData = [];
            
            // Filter to only include fields that exist in current work item
            for (const fieldName of Object.keys(latestUpdate.fields)) {
                if (currentFieldNames.has(fieldName)) {
                    const fieldChange = latestUpdate.fields[fieldName];
                    const friendlyName = getFriendlyFieldName(fieldName);
                    
                    // Get old and new values
                    const oldValue = fieldChange.oldValue !== undefined ? convertValueToString(fieldChange.oldValue) : '(empty)';
                    const newValue = fieldChange.newValue !== undefined ? convertValueToString(fieldChange.newValue) : '(empty)';
                    
                    // Skip if both are the same or if either contains invalid date
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
            } else {
                doc.setTextColor(150);
                doc.text("No significant field changes in latest update", margin, yPos);
                doc.setTextColor(0);
                yPos += 15;
            }
        } else {
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(150);
            doc.text("No valid change history available", margin, yPos);
            doc.setTextColor(0);
            yPos += 15;
        }
    }
    
    // === RELATED WORK ITEMS ===
    if (options.includeLinks && workItem.relations?.length > 0) {
        yPos = checkPageBreak(doc, yPos, 30);
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Related Work Items", margin, yPos);
        yPos += 8;
        
        const relatedItems = workItem.relations
            .filter(rel => rel.rel && !rel.rel.includes("AttachedFile"))
            .map(rel => {
                const id = rel.url ? rel.url.split('/').pop() : 'N/A';
                const relType = rel.rel || 'Unknown';
                const comment = rel.attributes?.comment || rel.attributes?.name || '';
                return [relType, `#${id}`, comment];
            });
        
        if (relatedItems.length > 0) {
            doc.autoTable({
                startY: yPos,
                head: [['Relation Type', 'ID', 'Details']],
                body: relatedItems,
                theme: 'grid',
                headStyles: { fillColor: [0, 120, 212] },
                margin: { left: margin, right: margin },
                styles: { fontSize: 9 }
            });
            
            yPos = doc.lastAutoTable.finalY + 10;
        }
    }
    
    // === ATTACHMENTS LIST ===
    if (options.includeAttachments && workItem.relations?.length > 0) {
        const attachments = workItem.relations.filter(rel => 
            rel.rel === "AttachedFile" || (rel.attributes && rel.attributes.name)
        );
        
        if (attachments.length > 0) {
            yPos = checkPageBreak(doc, yPos, 30);
            
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text("Attachments", margin, yPos);
            yPos += 8;
            
            const attachmentData = attachments.map(att => {
                const name = att.attributes?.name || 'Unknown';
                const url = att.url || 'N/A';
                return [name, url];
            });
            
            doc.autoTable({
                startY: yPos,
                head: [['File Name', 'URL']],
                body: attachmentData,
                theme: 'grid',
                headStyles: { fillColor: [0, 120, 212] },
                margin: { left: margin, right: margin },
                styles: { fontSize: 8 }
            });
        }
    }
    
    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            `Generated: ${new Date().toISOString()}`,
            margin,
            doc.internal.pageSize.height - 10
        );
    }
    
    // Save the PDF
    console.log("Saving PDF:", options.fileName);
    doc.save(options.fileName);
}

// Helper to check if a string contains invalid date (year 9999)
function containsInvalidDate(str) {
    if (!str) return false;
    return str.includes('9999') || str.includes('Invalid Date');
}

// Helper function to get friendly field name
function getFriendlyFieldName(fieldName) {
    let friendly = fieldName
        .replace('System.', '')
        .replace('Microsoft.VSTS.Common.', '')
        .replace('Microsoft.VSTS.Scheduling.', '')
        .replace('Microsoft.VSTS.TCM.', '')
        .replace('Microsoft.VSTS.', '');
    
    friendly = friendly.replace(/([A-Z])/g, ' $1').trim();
    
    return friendly;
}

// Helper function to determine if a field contains long text
function isLongTextField(fieldName, value) {
    const longTextFieldNames = [
        'System.Description',
        'Microsoft.VSTS.TCM.ReproSteps',
        'Microsoft.VSTS.Common.AcceptanceCriteria',
        'Microsoft.VSTS.TCM.SystemInfo',
        'System.History',
        'System.Details'
    ];
    
    if (longTextFieldNames.includes(fieldName)) {
        return true;
    }
    
    if (typeof value === 'string' && value.length > 200) {
        return true;
    }
    
    if (typeof value === 'string' && (value.includes('<div') || value.includes('<p>') || value.includes('<br'))) {
        return true;
    }
    
    return false;
}

// Helper function to convert any value to string
function convertValueToString(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
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
    
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    
    return String(value);
}

// Helper function to extract value from object or return as-is
function extractValue(obj) {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (obj.displayName) return obj.displayName;
    if (obj.name) return obj.name;
    if (obj.uniqueName) return obj.uniqueName;
    
    try {
        return JSON.stringify(obj);
    } catch (e) {
        return String(obj);
    }
}

function checkPageBreak(doc, yPos, requiredSpace) {
    const pageHeight = doc.internal.pageSize.height;
    if (yPos + requiredSpace > pageHeight - 30) {
        doc.addPage();
        return 20;
    }
    return yPos;
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

module.exports = { generateWorkItemPDF };