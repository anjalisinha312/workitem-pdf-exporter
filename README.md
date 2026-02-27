# Work Item Exporter - PDF & Bulk Export

Export Azure DevOps work items to professional PDF documents with complete field capture, comments, change history, and related items.

## 🚀 Features

### 📄 Single Work Item Export
- Right-click any work item → **Export to PDF**
- Includes ALL fields (system + custom)
- Comments with author and dates
- Latest change history with old vs new values
- Related work items
- Attachments list
- Professional formatting

### 📦 Bulk Export
Navigate to **Boards > Bulk Export** to export multiple work items at once:

**Export Methods:**
- **By IDs**: Enter comma-separated IDs (e.g., 1, 2, 3, 4)
- **By Iteration**: Export all items in a sprint
- **By Query**: Export saved query results

**Output Options:**
- **Single Combined PDF**: All items in one file with page breaks
- **Separate PDFs**: Individual file per work item

## 📥 Installation

1. Install from the Visual Studio Marketplace
2. Navigate to any work item in Azure Boards
3. Click the "..." menu → **Export to PDF**

Or use **Boards > Bulk Export** for multiple items.

## 💡 Usage

### Single Export

1. Open any work item
2. Click "..." (more actions menu)
3. Select **Export to PDF**
4. PDF downloads automatically with complete work item details

### Bulk Export

1. Go to **Boards > Bulk Export** (new tab in Boards navigation)
2. Choose your export method:
   - **Export by IDs**: Enter `1, 2, 3, 4, 5`
   - **Export by Iteration**: Enter `MyProject\Sprint 1`
   - **Export by Query**: Enter query name or leave empty for recent items
3. Click **👁️ Preview** to see what will be exported
4. Choose output format:
   - **Single Combined PDF** - All items in one document
   - **Separate PDFs** - Individual files (downloads multiple)
5. Click **📥 Start Export**
6. Watch the progress bar
7. Your PDF(s) download automatically!

## 📋 What Gets Exported

Every PDF includes:

✅ **Work Item Header**
- ID and Type
- Title
- State

✅ **All Fields Table**
- System fields (Assigned To, Created By, Dates, etc.)
- Custom fields (automatically detected)
- Priority, Severity, Story Points
- Area Path, Iteration
- Tags

✅ **Long Text Sections**
- Description / Repro Steps
- Acceptance Criteria
- System Info

✅ **Comments**
- Author name and timestamp
- Full comment text
- Chronological order

✅ **Latest Change History**
- Field name
- Old value
- New value
- Changed by and date

✅ **Related Work Items**
- Relation type
- Work item ID
- Link details

✅ **Attachments List**
- File names
- URLs

## 🎯 Use Cases

- **Documentation**: Export work items for project documentation
- **Reporting**: Share work item details with stakeholders
- **Auditing**: Keep records of requirements and changes
- **Archiving**: Backup work items before deletion
- **Sprint Reviews**: Export completed items for review meetings
- **Compliance**: Maintain audit trails with change history

## 🔒 Privacy & Security

This extension:
- ✅ Runs entirely in your browser (client-side)
- ✅ No data sent to external servers
- ✅ Only accesses work items you have permission to view
- ✅ Uses official Azure DevOps REST APIs
- ✅ Respects your organization's security policies

## ⚡ Performance

- Single export: Instant (< 1 second)
- Bulk export (10 items): ~5-10 seconds
- Bulk export (50 items): ~30-60 seconds
- Progress indicator shows real-time status

## 🆘 Support

Having issues? Need help?

- 📧 [Report Issues](https://github.com/yourusername/workitem-exporter/issues)
- 📖 [Documentation](https://github.com/yourusername/workitem-exporter)
- 💬 [Ask Questions](https://github.com/yourusername/workitem-exporter/discussions)

## 📝 Changelog

### Version 1.0.0 (Initial Release)
- ✨ Single work item PDF export
- ✨ Bulk export by IDs, Iteration, or Query
- ✨ Dynamic field capture (all fields including custom)
- ✨ Comments with proper dates
- ✨ Latest change history
- ✨ Related work items
- ✨ Professional PDF formatting
- ✨ Progress indicators for bulk operations

## 🎓 Tips & Tricks

**Bulk Export Performance:**
- For large exports (100+ items), use "Separate PDFs" option
- Export in smaller batches if experiencing timeouts
- Preview before exporting to verify item count

**Custom Fields:**
- All custom fields are automatically detected and exported
- No configuration needed

**PDF Quality:**
- PDFs are generated at high resolution
- Tables are formatted for readability
- Long text fields use proper word wrapping

## 🛠️ Technical Details

**Built With:**
- Azure DevOps Extension SDK
- jsPDF for PDF generation
- Pure JavaScript (no external dependencies for data processing)

**Browser Support:**
- Chrome/Edge (recommended)
- Firefox
- Safari

**Permissions Required:**
- `vso.work` - Read work items
- `vso.work_write` - Read comments and history

## 📜 License

MIT License - See LICENSE.txt for details

---

**Made with ❤️ for Azure DevOps users**

If you find this extension helpful, please leave a ⭐ rating!