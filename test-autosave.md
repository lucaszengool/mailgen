# Auto-Save Testing Guide

## Test Steps:

1. **Open the Email Editor**
   - Go to http://localhost:3000/setup
   - Navigate to the email editor

2. **Make Edits**
   - Edit some text in the email
   - Add a component (drag and drop from toolbar)
   - Note what changes you made

3. **Check Console for Auto-Save**
   - Open Developer Tools (F12)
   - Look for: `💾 Auto-saved email data with key:`
   - Should see saved data preview

4. **Navigate Away**
   - Click to go to another page
   - Or refresh the page

5. **Return to Email Editor**
   - Come back to the email editor page

6. **Check for Restoration**
   Look for these console messages:
   - `🔍 CHECKING FOR AUTO-SAVE ON MOUNT`
   - `🚀 INITIAL AUTO-SAVE FOUND!`
   - `🛡️🛡️🛡️ AUTO-SAVE PROTECTION ACTIVE`
   - A success toast notification

## What to Verify:
- ✅ Your edits are preserved
- ✅ Components you added are still there
- ✅ Text changes are maintained
- ✅ "Draft Restored" badge appears
- ✅ Toast shows "Restored your previous edits"

## Console Logs to Watch:
- `🚀` = Auto-save loaded on mount
- `💾` = Auto-saving your changes
- `🛡️` = Protection from overwrites
- `✅` = Successful operations

## If It Doesn't Work:
Check for:
- `❌ No auto-save data found` - means save didn't work
- `⏰ Auto-save too old` - data expired
- `📧 Switching to email 0` - overwriting happening