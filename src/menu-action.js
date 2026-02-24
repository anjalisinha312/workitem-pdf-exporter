const SDK = require("azure-devops-extension-sdk");
const { getClient } = require("azure-devops-extension-api");
const { WorkItemTrackingRestClient } = require("azure-devops-extension-api/WorkItemTracking");
const { generateWorkItemPDF } = require("./exporters/pdf-generator");

let workItemId = null;
let workItemData = null;

SDK.init();

SDK.ready().then(async () => {
    console.log("Menu action initialized");
    
    // Register the menu action handler
    SDK.register("export-workitem-menu", {
        execute: async (context) => {
            console.log("Export menu clicked", context);
            
            try {
                workItemId = context.workItemId;
                console.log("Work Item ID:", workItemId);
                
                // Load work item data
                await loadWorkItemData();
                
                // Export directly with all options enabled (no user prompt)
                await exportPDF();
                
            } catch (error) {
                console.error("Error:", error);
                alert("Failed to export: " + error.message);
            }
        }
    });
    
    SDK.notifyLoadSucceeded();
});

async function loadWorkItemData() {
    try {
        const client = getClient(WorkItemTrackingRestClient);
        
        workItemData = await client.getWorkItem(
            parseInt(workItemId, 10),
            undefined,
            undefined,
            undefined,
            "All"
        );
        
        console.log("Work item loaded:", workItemData);
        
    } catch (error) {
        console.error("Error loading work item:", error);
        throw error;
    }
}

async function exportPDF() {
    try {
        console.log("Starting PDF export...");
        
        const client = getClient(WorkItemTrackingRestClient);
        const id = parseInt(workItemId, 10);
        
        // Always include everything
        const options = {
            includeDescription: true,
            includeComments: true,
            includeHistory: true,
            includeAttachments: true,
            includeLinks: true
        };
        
        // Load comments
        try {
            options.comments = await client.getComments(id);
            console.log("Comments loaded:", options.comments?.comments?.length || 0);
        } catch (err) {
            console.warn("Could not load comments:", err);
        }
        
        // Load change history
        try {
            options.updates = await client.getUpdates(id);
            console.log("Updates loaded:", options.updates?.length || 0);
        } catch (err) {
            console.warn("Could not load history:", err);
        }
        
        const workItemType = workItemData.fields["System.WorkItemType"];
        options.fileName = `WorkItem_${workItemId}_${workItemType}.pdf`;
        
        console.log("Generating PDF...");
        await generateWorkItemPDF(workItemData, options);
        
        console.log("PDF generated successfully!");
        alert("✓ PDF downloaded successfully!");
        
    } catch (error) {
        console.error("Error exporting:", error);
        alert("✗ Export failed: " + error.message);
        throw error;
    }
}